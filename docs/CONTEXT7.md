# Context7 Enhanced Documentation

## Library Overview

ByteKit is a lean, zero-dependency TypeScript toolkit built around **isomorphic HTTP control**. Today the package surface revolves around:

- **ApiClient & resilience**: a typed fetch wrapper with `retryPolicy`, `CircuitBreaker`, `RequestCache`, `RequestDeduplicator`, `RateLimiter`, localized `ApiError`s and automatic schema validation.
- **Observability**: `Logger`, `createLogger`, `Profiler`, `withTiming`, `measureAsync` and `createStopwatch` for capturing latency without extra agents.
- **Async tooling**: low-level helpers (`parallel`, `race`, `retry`, `sleep`, `debounce`, `throttle`, `timeout`, `allSettled`) that coordinate promises so your HTTP flows behave reliably.
- **Schema enforcement**: `ResponseValidator` and `SchemaAdapter` let you validate payloads at the edge of every request/response pair.

## Frequently Asked Questions

### Q1: When should I prefer `withTiming` over `Profiler` for measuring HTTP work?

`withTiming` is ideal when you only need to time a single async step (e.g., a single API call) and optionally log the duration. `Profiler` is for multi-step workflows where you need labeled intervals. For a fetch, wrap the promise via `withTiming` and let it log automatically.

```ts
import { ApiClient, withTiming, createLogger } from "bytekit";

const logger = createLogger({ namespace: "user", level: "info" });
const client = new ApiClient({ baseUrl: "https://api.service.local" });

const response = await withTiming("fetch-user", () => client.get("/users/123"), {
    logger,
});
logger.info("Fetch-user complete", { durationMs: response });
```

### Q2: How can I dynamically choose the ApiClient base URL for Node vs the browser?

Use `typeof window` to detect the runtime and let `EnvManager` drive the server address while defaulting to a relative path in the browser.

```ts
import { ApiClient, EnvManager } from "bytekit";

const env = new EnvManager();
const baseUrl =
    typeof window === "undefined"
        ? env.get("API_URL") ?? `http://localhost:${env.get("API_PORT") ?? 4000}`
        : "/api";

const client = new ApiClient({ baseUrl });
```

### Q3: How do I validate an HTTP response using ByteKit’s validators?

Supply a `ResponseValidator` schema or a `SchemaAdapter` to the request options. If validation fails, `ApiClient` throws detailed errors you can log, metric, or surface to the user.

```ts
import { ApiClient, ResponseValidator } from "bytekit";

const client = new ApiClient({ baseUrl: "https://api.service.local" });
await client.get("/products", {
    validateResponse: {
        type: "object",
        properties: {
            id: { type: "string", required: true },
            price: { type: "number", required: true },
        },
    },
});
```

### Q4: How do I catch and log localized API errors?

`ApiClient` normalizes errors into `ApiError` instances that expose status, message, body, and a localized message depending on the configured `locale`. Wrap your call in a `try/catch` and inspect the error properties.

```ts
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.service.local",
    locale: "es",
});

try {
    await api.post("/orders", { body: JSON.stringify({ product: "coffee" }) });
} catch (error) {
    if (error instanceof ApiError) {
        console.error("ApiError", error.status, error.message, error.body);
    } else {
        throw error;
    }
}
```

### Q5: How can I combine retries, circuit breaking, and rate limiting?

Pass `retryPolicy`, `circuitBreaker`, and `rateLimiter` configuration into the `ApiClient`. Retries handle transient failures, the circuit breaker pauses calls after repeated errors, and the rate limiter keeps you under throughput caps.

```ts
const client = new ApiClient({
    baseUrl: "https://api.service.local",
    retryPolicy: { maxAttempts: 4, initialDelayMs: 200, backoffMultiplier: 2 },
    circuitBreaker: { failureThreshold: 5, timeoutMs: 30_000 },
    rateLimiter: { requestsPerInterval: 10, intervalMs: 1_000 },
});
await client.get("/inventory");
```

### Q6: How do I prevent duplicate requests and cache responses?

Enable `RequestDeduplicator` and `RequestCache` through `ApiClient` options. Deduplication shares a pending promise when the same request is in flight, while the cache short-circuits identical GETs.

```ts
const client = new ApiClient({
    baseUrl: "https://api.service.local",
    requestCache: { ttlMs: 60_000 },
    requestDeduplicator: true,
});
const [first, second] = await Promise.all([
    client.get("/stats"),
    client.get("/stats"),
]);
```

### Q7: How can I add structured logging around HTTP retries?

Create a logger and pass it to `ApiClient`. The logger records each attempt; use its `child` namespaces to separate concerns.

```ts
import { createLogger } from "bytekit";

const logger = createLogger({ namespace: "api", level: "info" });
const client = new ApiClient({ baseUrl: "https://api.service.local", logger });

await client.get("/events");
logger.info("Events fetched");
```
