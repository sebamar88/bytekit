# Context7 Enhanced Documentation

## Library Overview

ByteKit is a zero-dependency TypeScript toolkit for isomorphic networking and async coordination. The bundle keeps your runtime lean while combining:

- **Communication & resiliency**: `ApiClient`, `RetryPolicy`, `CircuitBreaker`, `RequestCache`, `RequestDeduplicator`, `RateLimiter`, `StreamingHelper`, `FileUploadHelper` and `WebSocketHelper`.
- **Observability & debugging**: `Logger`, `createLogger`, `Profiler`, `withTiming`, `measureAsync` and `createStopwatch` make it easy to measure latency without pulling in heavy agents.
- **Async toolkit**: `parallel`, `race`, `retry`, `sleep`, `debounce`, `throttle`, `timeout` and `allSettled` coordinate concurrent jobs safely.
- **Validation & storage helpers**: `ResponseValidator`, `SchemaAdapter`, `StorageManager`, `CacheManager`, `EnvManager`, `QueryStringHelper`, `UrlSlugHelper`, `DiffUtils`, `CompressionUtils`, `CryptoUtils` tackle schema validation, caching, and derived data.

## Frequently Asked Questions

### Q1: Describe a scenario where `withTiming` is preferred over `Profiler` for performance monitoring, and provide an example of its use for an asynchronous operation.

Use `withTiming` when you only need a single async block measured and optionally logged. It wraps a promise, logs the duration, and lets the rest of your code stay linear. Use `Profiler` when you need to mark many steps inside one workflow.

```ts
import { ApiClient, withTiming, createLogger } from "bytekit";

const logger = createLogger({ namespace: "user-fetch", level: "info" });

const api = new ApiClient({ baseUrl: "https://api.service.local" });

const profile = await withTiming("fetch-profile", async () => {
    return await api.get("/profiles/123");
}, { logger });

logger.info("Profile fetched", { duration: profile });
```

### Q2: Explain how to dynamically adjust the `ApiClient` base URL based on whether the code runs in Node.js or the browser.

Instantiate `EnvManager` once and prefer a browser-relative path when `window` exists; fall back to an env-var driven host on the server.

```ts
import { ApiClient, EnvManager } from "bytekit";

const env = new EnvManager();
const baseUrl =
    typeof window === "undefined"
        ? env.get("API_URL") ?? `http://localhost:${env.get("API_PORT") ?? 4000}`
        : "/api";

const client = new ApiClient({ baseUrl });
```

### Q3: Implement a validation check for a URL string using ByteKit's built-in `ResponseValidator`.

```ts
import { ResponseValidator } from "bytekit";

const schema = {
    type: "string",
    pattern: /^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-.,@?^=%&:/~+#]*[\\w\\-@?^=%&/~+#])?$/
};

const input = "https://bytekit.dev/docs";
const errors = ResponseValidator.validate(input, schema);
if (errors.length) {
    throw new Error("URL validation failed: " + errors.map((err) => err.message).join(", "));
}
```

### Q4: Demonstrate how to store and retrieve a complex JavaScript object using `StorageManager`.

`StorageManager` serializes JSON for you, tracks TTL, and cleans up expired entries.

```ts
import { StorageManager } from "bytekit";

const storage = new StorageManager();
storage.set(
    "session",
    { userId: "u1", tokens: { access: "xxxx", refresh: "yyyy" } },
    5 * 60 * 1000
);

const session = storage.get<{ userId: string }>("session");
console.log(session?.userId);
```

### Q5: Show how to coordinate multiple HTTP calls and wait for every result with ByteKit's async helpers.

```ts
import { parallel } from "bytekit/async";
import { ApiClient } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.service.local" });

const [users, settings] = await parallel(
    [
        () => api.get("/users", { validateResponse: { type: "array" } }),
        () => api.get("/settings"),
    ],
    { concurrency: 2 }
);

console.log(users.length, settings);
```

### Q6: Provide a code snippet illustrating how to measure the execution time of a function using `Profiler`.

```ts
import { Profiler } from "bytekit";

const profiler = new Profiler("import-job");
profiler.start("download");
await downloadAssets();
profiler.end("download");

profiler.start("hydrate");
await hydrateDatabase();
profiler.end("hydrate");

console.log(profiler.summary());
```

### Q7: Implement a structured logger using `createLogger` that outputs messages with a custom namespace.

```ts
import { createLogger } from "bytekit";

const logger = createLogger({ namespace: "orders", level: "info" });
logger.info("Order created", { orderId: "ORD-123" });
```

### Q8: Show how to make an `ApiClient` request and handle a localized error message on failure.

```ts
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.service.local",
    locale: "es"
});

try {
    await api.post("/orders", { body: JSON.stringify({ product: "coffee" }) });
} catch (error) {
    if (error instanceof ApiError) {
        console.error("✖", error.message, "status", error.status);
    } else {
        throw error;
    }
}
```

### Q9: Demonstrate how to configure the `ApiClient` to automatically retry failed requests a specified number of times.

```ts
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.service.local",
    retryPolicy: {
        maxAttempts: 5,
        initialDelayMs: 200,
        backoffMultiplier: 2,
    }
});

await api.get("/unstable-endpoint");
```

### Q10: Explain how to keep request results cached with `CacheManager` and inspect hit/miss statistics.

```ts
import { CacheManager } from "bytekit";

const cache = new CacheManager({ defaultTTL: 60_000, enableLocalStorage: true });
cache.set("profile", { name: "Luisa" });

if (cache.has("profile")) {
    console.log("cached", cache.get("profile"));
}

console.log("stats", cache.getStats());
```
