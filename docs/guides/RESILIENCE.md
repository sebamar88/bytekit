# 📊 Resilience and Performance

bytekit provides a robust suite of tools to ensure your API requests are reliable and efficient. This guide demonstrates how to combine these features for production-grade resilience.

## 🛡️ Combining Resilience Patterns

You can combine **Retries**, **Circuit Breaking**, and **Rate Limiting** in a single `ApiClient` instance to handle different failure modes.

### 1. Retries (Handling Transient Failures)
Automatically retry failed requests due to network issues or 5xx server errors with exponential backoff.

### 2. Circuit Breaker (Preventing Cascading Failures)
Stop sending requests to a failing service to give it time to recover, preventing your own application from hanging.

### 3. Rate Limiter (Respecting API Limits)
Ensure you don't exceed the server's request limits by throttling outgoing requests.

### Full Example: The "Bulletproof" Client

```typescript
import { ApiClient, RateLimiter } from "bytekit";

// 1. Configure the Rate Limiter (e.g., 50 requests per minute per hostname)
const rateLimiter = new RateLimiter({
    maxRequests: 50,
    windowMs: 60 * 1000,
});

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    
    // 2. Configure Retry Policy
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 200,
        backoffMultiplier: 2,
        jitter: true, // Add randomness to prevent "thundering herd"
    },

    // 3. Configure Circuit Breaker
    circuitBreaker: {
        failureThreshold: 5,     // Open circuit after 5 failures
        resetTimeoutMs: 30000,   // Wait 30s before trying again
    }
});

// 4. Use Interceptors to apply Rate Limiting globally
api.addInterceptor({
    request: async (url, init) => {
        // Wait until rate limiter allows the request
        await rateLimiter.waitForAllowance(url);
        return [url, init];
    }
});
```

---

## ⚡ Caching and Deduplication

Maximize performance by avoiding unnecessary network calls.

### Request Deduplication
If multiple parts of your UI request the same data simultaneously, `ApiClient` can consolidate them into a single HTTP call.

```typescript
const users = await api.get("/users", {
    dedupe: true // Default is true in modern versions
});
```

### Response Caching
Store successful responses locally to provide instant data on subsequent calls.

```typescript
// Memory cache for 5 minutes
const data = await api.get("/config", {
    cache: true,
    cacheTTL: 5 * 60 * 1000,
    staleWhileRevalidate: 60 * 1000 // Return stale data while fetching fresh in background
});
```

### Advanced Cache Management
For complex state, use `RequestCache` directly:

```typescript
import { RequestCache } from "bytekit";

const myCache = new RequestCache({
    ttl: 10 * 60 * 1000,
    staleWhileRevalidate: 2 * 60 * 1000
});

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

async function getStats() {
    const cached = myCache.get("/stats");
    if (cached) return cached;

    const fresh = await api.get("/stats");
    myCache.set("/stats", fresh);
    return fresh;
}
```

---

## 🔍 Structured Logging for Retries

Integrating a `Logger` with your `ApiClient` provides deep visibility into the retry lifecycle.

```typescript
import { createLogger, ApiClient } from "bytekit";

const logger = createLogger({ namespace: "API" });

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    logger: logger, // Attach the logger
    retryPolicy: {
        maxAttempts: 3,
    }
});

// The logger will automatically output structured info:
// [DEBUG] [API] Requesting GET https://api.example.com/data
// [WARN] [API] Request failed, retrying (1/3)... Error: Socket timeout
// [WARN] [API] Request failed, retrying (2/3)... Error: Socket timeout
// [INFO] [API] Request succeeded after 2 retries
```

You can also use interceptors for custom retry logging logic:

```typescript
api.addInterceptor({
    request: (url, init) => {
        logger.info(`Starting request: ${init.method} ${url}`);
        return [url, init];
    },
    response: (response) => {
        if (!response.ok) {
            logger.warn(`Request failed with status ${response.status}`);
        }
        return response;
    }
});
```
