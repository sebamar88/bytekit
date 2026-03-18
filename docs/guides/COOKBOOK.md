# 👨‍🍳 ByteKit Cookbook

This guide provides direct recipes for common implementation tasks, using the ByteKit toolkit.

## 1. How do I process large JSON datasets or real-time events using streams?

ByteKit provides the `StreamingHelper` for handling both Server-Sent Events (SSE) and NDJSON (JSON Lines).

### Processing Real-time Events (SSE)
```typescript
import { StreamingHelper } from "bytekit";

const stream = StreamingHelper.streamSSE("https://api.example.com/events", {
    onComplete: () => console.log("Stream finished"),
    onError: (err) => console.error("Stream error", err)
});

// Subscribe to receive real-time JSON objects
const unsubscribe = stream.subscribe((data) => {
    console.log("New event received:", data);
});

// When done:
// unsubscribe();
// stream.close();
```

### Processing Large JSON Datasets (NDJSON)
Use `streamJsonLines` to process objects one by one without loading the entire dataset into memory.
```typescript
import { StreamingHelper } from "bytekit";

await StreamingHelper.streamJsonLines("https://api.example.com/large-dataset", {
    onChunk: (item) => {
        console.log("Processed one item from the large dataset:", item);
    },
    onComplete: () => console.log("All items processed")
});
```

---

## 2. How can I dynamically choose the ApiClient base URL for Node vs the browser?

You can use a simple environment check or the built-in `EnvManager` to switch configurations.

```typescript
import { ApiClient, EnvManager } from "bytekit";

const env = new EnvManager();
const isBrowser = typeof window !== "undefined";

const api = new ApiClient({
    // Method A: Manual check
    baseUrl: isBrowser 
        ? (import.meta.env.VITE_API_URL || "/api") 
        : (process.env.API_URL || "http://localhost:3000"),
    
    // Method B: Using EnvManager (handles process.env vs import.meta.env automatically)
    // baseUrl: env.get("API_URL") || "http://localhost:3000"
});
```

---

## 3. How does ByteKit handle error localization and custom error messages?

ByteKit's `ApiClient` has a built-in localization engine. You can define messages for specific HTTP status codes in multiple languages.

```typescript
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    locale: "es", // Set current language
    errorMessages: {
        en: {
            404: "Custom not found message",
            403: "You shall not pass!"
        },
        es: {
            404: "El recurso no existe",
            403: "No tienes permiso para entrar aquí"
        }
    }
});

try {
    await api.get("/protected-resource");
} catch (error) {
    if (error instanceof ApiError) {
        // error.message will automatically be "No tienes permiso para entrar aquí"
        console.log(error.message); 
    }
}
```

---

## 4. How do I prevent duplicate requests and cache responses?

`ApiClient` includes a built-in `RequestCache` and `RequestDeduplicator`.

```typescript
const api = new ApiClient({ baseUrl: "https://api.example.com" });

// 1. Caching: Subsequent calls within the TTL will return the cached value
const data = await api.get("/users", {
    cache: true,
    cacheTTL: 60000, // 1 minute in ms
    staleWhileRevalidate: 30000 // Return stale data while fetching fresh in background
});

// 2. Deduplication: Concurrent identical requests are merged into one
const [res1, res2] = await Promise.all([
    api.get("/users", { dedupe: true }),
    api.get("/users", { dedupe: true })
]);
// Only 1 network request was actually made.
```

---

## 5. How can I add structured logging around HTTP retries?

Attach a `Logger` instance to the `ApiClient` configuration. It will automatically log retry attempts with structured context.

```typescript
import { createLogger, ApiClient } from "bytekit";

const logger = createLogger({ namespace: "API" });

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    logger: logger, // Structured logging integration
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 500
    }
});

// Logs will output:
// [DEBUG] [API] Requesting GET https://api.example.com/data
// [WARN] [API] Request failed, retrying (1/3)...
// [INFO] [API] Request succeeded after 1 retry
```

---

## 6. What is the best way to handle paginated results and filtering?

Use the `getList` method which is designed for standard collection endpoints.

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.example.com" });

const response = await api.getList("/products", {
    // 1. Pagination
    pagination: { page: 1, limit: 10 },
    
    // 2. Filtering (becomes ?category=electronics&status=available)
    filters: {
        category: "electronics",
        status: "available"
    },

    // 3. Sorting (becomes ?sort=price&order=desc)
    sort: {
        field: "price",
        order: "desc"
    }
});

console.log(response.data); // Array of items
console.log(response.pagination.total); // Total count
```

---

## 7. Show how to make an API request using the `ApiClient` and handle a localized error message upon failure.

```typescript
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    locale: "en"
});

async function run() {
    try {
        const user = await api.get("/users/123");
        return user;
    } catch (error) {
        if (error instanceof ApiError) {
            // error.message is localized based on the 'locale' config
            // Default English 404 is "Resource not found."
            alert(error.message); 
            
            // You can also access raw details
            console.error(`Status: ${error.status}, Body:`, error.body);
        }
    }
}
```
