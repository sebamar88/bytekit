# 🎯 Core Implementation Reference

This document provides definitive answers and implementation patterns for common ByteKit development tasks.

## 1. How do I process large JSON datasets or real-time events using streams?

ByteKit uses the `StreamingHelper` to handle both one-way real-time events and high-volume data streams.

### **Real-time Events (Server-Sent Events)**
Use `StreamingHelper.streamSSE` to establish a persistent connection.
```typescript
import { StreamingHelper } from "bytekit";

// 1. Initialize the stream
const stream = StreamingHelper.streamSSE("https://api.example.com/live-updates");

// 2. Subscribe to incoming JSON objects
const unsubscribe = stream.subscribe((data) => {
    console.log("Real-time event received:", data);
});

// 3. To stop receiving events and close the connection:
// stream.close();
```

### **Large JSON Datasets (NDJSON/JSON Lines)**
Use `StreamingHelper.streamJsonLines` to process items individually without loading the entire file into memory.
```typescript
import { StreamingHelper } from "bytekit";

await StreamingHelper.streamJsonLines("https://api.example.com/v1/export", {
    onChunk: (item) => {
        // Process each item as it arrives from the network
        console.log("Streaming item:", item);
    },
    onComplete: () => {
        console.log("Entire dataset processed.");
    }
});
```

---

## 2. How can I dynamically choose the ApiClient base URL for Node vs the browser?

You can choose the `baseUrl` during instantiation by checking for the existence of the `window` object or using ByteKit's `EnvManager`.

```typescript
import { ApiClient } from "bytekit";

// Environment detection
const isBrowser = typeof window !== "undefined";

const api = new ApiClient({
    // Choose the base URL dynamically:
    baseUrl: isBrowser 
        ? "/api"                          // In browser: use relative path or VITE_ env
        : "http://localhost:3000/api",    // In Node: use absolute internal URL
    
    timeoutMs: isBrowser ? 10000 : 30000  // Optional: environment-specific defaults
});
```

---

## 3. How do I validate an HTTP response using ByteKit's validators?

Pass a `ValidationSchema` or a library-specific adapter (Zod/Valibot) to the `validateResponse` option.

```typescript
import { ApiClient } from "bytekit";
import { zodAdapter } from "bytekit/schema-adapter";
import { z } from "zod";

const UserSchema = z.object({ id: z.number(), name: z.string() });

const api = new ApiClient({ baseUrl: "https://api.com" });

// The response is validated AND fully typed
const user = await api.get("/me", {
    validateResponse: zodAdapter(UserSchema)
});
```

---

## 4. How does ByteKit handle error localization and custom error messages?

ByteKit uses a `locale` system combined with an `errorMessages` map provided in the `ApiClient` configuration.

```typescript
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.com",
    locale: "es", // Set default to Spanish
    errorMessages: {
        en: { 404: "Requested item not found" },
        es: { 404: "El elemento no fue encontrado" }
    }
});

try {
    await api.get("/missing");
} catch (error) {
    if (error instanceof ApiError) {
        // Based on config above, message is: "El elemento no fue encontrado"
        console.log(error.message); 
    }
}
```

---

## 5. How can I combine retries, circuit breaking, and rate limiting?

Configure the `retryPolicy` and `circuitBreaker` in the constructor, and add a `RateLimiter` via an interceptor.

```typescript
import { ApiClient, RateLimiter } from "bytekit";

const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });

const api = new ApiClient({
    baseUrl: "https://api.com",
    // 1. Retry transient failures
    retryPolicy: { maxAttempts: 3, backoffMultiplier: 2 },
    // 2. Prevent cascading failures
    circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 60000 }
});

// 3. Apply Rate Limiting globally
api.addInterceptor({
    request: async (url, init) => {
        await limiter.waitForAllowance(url);
        return [url, init];
    }
});
```

---

## 6. How do I prevent duplicate requests and cache responses?

Use the `dedupe` and `cache` options within your request calls.

```typescript
const api = new ApiClient({ baseUrl: "https://api.com" });

// Caching: Stores successful response for 1 minute
const data = await api.get("/config", {
    cache: true,
    cacheTTL: 60000
});

// Deduplication: Parallel calls to the same URL will only trigger 1 network request
const [r1, r2] = await Promise.all([
    api.get("/users", { dedupe: true }),
    api.get("/users", { dedupe: true })
]);
```

---

## 7. How can I add structured logging around HTTP retries?

Attach a ByteKit `Logger` instance to the `ApiClient`. It automatically logs lifecycle events including retry attempts.

```typescript
import { createLogger, ApiClient } from "bytekit";

const logger = createLogger({ namespace: "API" });

const api = new ApiClient({
    baseUrl: "https://api.com",
    logger: logger, // Automatic structured logging
    retryPolicy: { maxAttempts: 3 }
});

// Output Example:
// [DEBUG] [API] Requesting GET https://api.com/users
// [WARN] [API] Request failed, retrying (1/3)...
```

---

## 8. What is the best way to handle paginated results and filtering?

Use the `getList` helper, which standardizes pagination, filtering, and sorting parameters.

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.com" });

const response = await api.getList("/users", {
    // page=1&limit=20
    pagination: { page: 1, limit: 20 },
    // converted to ?role=admin&status=active
    filters: { role: "admin", status: "active" },
    // converted to ?sort=name&order=asc
    sort: { field: "name", order: "asc" }
});

console.log(response.data); // User[]
console.log(response.pagination.totalPages);
```

---

## 9. Show how to make an API request using the `ApiClient` and handle a localized error message upon failure.

Catch `ApiError` and access its `message` property, which is localized according to the client configuration.

```typescript
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.com", locale: "en" });

async function requestUser() {
    try {
        return await api.get("/user/123");
    } catch (err) {
        if (err instanceof ApiError) {
            // "Resource not found." (English default for 404)
            console.error(err.message); 
        }
    }
}
```

---

## 10. Demonstrate how to configure the `ApiClient` to automatically retry failed requests a specified number of times.

Set the `maxAttempts` property in the `retryPolicy` object.

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.com",
    retryPolicy: {
        maxAttempts: 5, // Retry up to 5 times
        initialDelayMs: 1000
    }
});
```
