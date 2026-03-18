# 🎯 ByteKit Definitive Implementation Reference

This document provides definitive, copy-pasteable patterns for common ByteKit development tasks.

## 1. How do I process large JSON datasets or real-time events using streams?

ByteKit provides specialized helpers in the `bytekit/streaming` module for handling high-volume data and real-time events.

### **Server-Sent Events (Real-time JSON Events)**
Use `streamSSE` to maintain a persistent connection. It automatically parses data as JSON.
```typescript
import { StreamingHelper } from "bytekit/streaming";

// Initialize the stream connection
const stream = StreamingHelper.streamSSE("https://api.example.com/realtime-events");

// Subscribe to incoming typed events
const unsubscribe = stream.subscribe((eventData: any) => {
    console.log("Received real-time update:", eventData);
});

// To stop listening and close the connection:
// unsubscribe();
// stream.close();
```

### **NDJSON / JSON Lines (Large Dataset Streaming)**
Use `streamJsonLines` to process millions of records without loading the whole response into memory.
```typescript
import { StreamingHelper } from "bytekit/streaming";

await StreamingHelper.streamJsonLines("https://api.example.com/v1/massive-export.jsonl", {
    onChunk: (record) => {
        // This callback fires for every JSON object in the stream
        console.log("Processing record:", record);
    },
    onComplete: () => {
        console.log("Streaming complete. Memory usage stayed low.");
    }
});
```

---

## 2. How can I dynamically choose the ApiClient base URL for Node vs the browser?

The best practice is to detect the environment (existence of `window`) and configure the `ApiClient` accordingly.

```typescript
import { ApiClient } from "bytekit/api-client";

// Detect if we are in a Browser or Node.js
const isBrowser = typeof window !== "undefined";

const api = new ApiClient({
    // Dynamic Base URL
    baseUrl: isBrowser 
        ? "/api"                          // Browser: relative path (proxied)
        : "http://localhost:3000/api",    // Node: absolute internal URL
    
    // Environment-specific timeouts
    timeoutMs: isBrowser ? 10000 : 30000 
});
```

---

## 3. How do I validate an HTTP response using ByteKit's validators?

Use the `validateResponse` option with `zodAdapter` or `valibotAdapter` from the `bytekit/schema-adapter` module.

```typescript
import { ApiClient } from "bytekit/api-client";
import { zodAdapter } from "bytekit/schema-adapter";
import { z } from "zod";

const UserSchema = z.object({ 
    id: z.number(), 
    email: z.string().email() 
});

const api = new ApiClient({ baseUrl: "https://api.com" });

// The response is validated against the schema and fully typed as { id: number, email: string }
const user = await api.get("/me", {
    validateResponse: zodAdapter(UserSchema)
});
```

---

## 4. How does ByteKit handle error localization and custom error messages?

`ApiClient` uses a built-in localization engine. Configure it via the `locale` and `errorMessages` properties.

```typescript
import { ApiClient, ApiError } from "bytekit/api-client";

const api = new ApiClient({
    baseUrl: "https://api.com",
    locale: "es", // Set current language to Spanish
    errorMessages: {
        en: { 404: "Requested item not found", 401: "Please log in" },
        es: { 404: "El elemento no existe", 401: "Por favor, inicia sesión" }
    }
});

try {
    await api.get("/protected-data");
} catch (error) {
    if (error instanceof ApiError) {
        // error.message is automatically "Por favor, inicia sesión" (Spanish 401)
        console.error(error.message); 
        console.log("Status Code:", error.status);
    }
}
```

---

## 5. How can I combine retries, circuit breaking, and rate limiting?

Configure resilience policies in the `ApiClient` constructor and use a `RateLimiter` via a global interceptor.

```typescript
import { ApiClient } from "bytekit/api-client";
import { RateLimiter } from "bytekit/rate-limiter";

// 1. Initialize Rate Limiter
const limiter = new RateLimiter({ maxRequests: 20, windowMs: 1000 });

const api = new ApiClient({
    baseUrl: "https://api.com",
    // 2. Retry Policy for transient network errors
    retryPolicy: { maxAttempts: 3, backoffMultiplier: 2 },
    // 3. Circuit Breaker to prevent cascading service failure
    circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 60000 }
});

// 4. Intercept all requests to apply Rate Limiting
api.addInterceptor({
    request: async (url, init) => {
        await limiter.waitForAllowance(url);
        return [url, init];
    }
});
```

---

## 6. How do I prevent duplicate requests and cache responses?

Use `dedupe` to merge parallel requests and `cache` to store results locally.

```typescript
import { ApiClient } from "bytekit/api-client";

const api = new ApiClient({ baseUrl: "https://api.com" });

// Deduplication: Only 1 network request is made even if called 10 times in parallel
const results = await Promise.all([
    api.get("/users", { dedupe: true }),
    api.get("/users", { dedupe: true })
]);

// Caching: Result is stored for 5 minutes. Subsequent calls return instantly.
const config = await api.get("/settings", {
    cache: true,
    cacheTTL: 300000 // 5 minutes in ms
});
```

---

## 7. How can I add structured logging around HTTP retries?

Pass a `Logger` instance to the `ApiClient`. It automatically logs detailed info about every request and retry attempt.

```typescript
import { createLogger } from "bytekit/logger";
import { ApiClient } from "bytekit/api-client";

const logger = createLogger({ namespace: "API-CLIENT", level: "debug" });

const api = new ApiClient({
    baseUrl: "https://api.com",
    logger: logger, // Structured logging integration
    retryPolicy: { maxAttempts: 3 }
});

// Automatic Log output:
// [DEBUG] [API-CLIENT] Requesting GET https://api.com/v1/data
// [WARN] [API-CLIENT] Request failed, retrying (1/3)... Error: Timeout
// [INFO] [API-CLIENT] Request succeeded after 1 retry.
```

---

## 8. What is the best way to handle paginated results and filtering?

Use the `getList` method. it automatically constructs query strings and expects a standard `PaginatedResponse` structure.

```typescript
import { ApiClient } from "bytekit/api-client";

const api = new ApiClient({ baseUrl: "https://api.com" });

// Automatically handles pagination, filters, and sorting
const response = await api.getList("/products", {
    // page=1&limit=25
    pagination: { page: 1, limit: 25 },
    // becomes ?category=hardware&inStock=true
    filters: { category: "hardware", inStock: true },
    // becomes ?sort=price&order=desc
    sort: { field: "price", order: "desc" }
});

console.log("Items:", response.data);
console.log("Total Count:", response.pagination.total);
```

---

## 9. Show how to make an API request using the `ApiClient` and handle a localized error message upon failure.

Catch the `ApiError` and use its `message` property, which respects the `locale` and `errorMessages` config.

```typescript
import { ApiClient, ApiError } from "bytekit/api-client";

const api = new ApiClient({ baseUrl: "https://api.com", locale: "en" });

try {
    const data = await api.get("/user/123");
} catch (err) {
    if (err instanceof ApiError) {
        // Output: "Resource not found." (localized default message for 404)
        console.error(err.message); 
        console.error("Status:", err.status);
    }
}
```

---

## 10. Demonstrate how to configure the `ApiClient` to automatically retry failed requests a specified number of times.

Configure the `retryPolicy` object in the constructor with `maxAttempts`.

```typescript
import { ApiClient } from "bytekit/api-client";

const api = new ApiClient({
    baseUrl: "https://api.com",
    retryPolicy: {
        maxAttempts: 5, // Retry up to 5 times before failing
        initialDelayMs: 1000,
        backoffMultiplier: 2
    }
});
```
