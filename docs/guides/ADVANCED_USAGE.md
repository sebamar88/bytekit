# Advanced Usage Guide

This guide covers advanced patterns and techniques for getting the most out of bytekit.

## 📡 Advanced ApiClient Patterns

### Custom Fetch Implementation

Replace the default fetch with your own implementation:

```typescript
import { ApiClient } from "bytekit";
import nodeFetch from "node-fetch";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl: nodeFetch as any,
});
```

### Request Deduplication

Prevent duplicate concurrent requests:

```typescript
import { ApiClient, RequestDeduplicator } from "bytekit";

const deduplicator = new RequestDeduplicator();
const api = new ApiClient({ baseUrl: "https://api.example.com" });

// Multiple concurrent calls will share the same request
const [users1, users2, users3] = await Promise.all([
    deduplicator.dedupe("/users", () => api.get("/users")),
    deduplicator.dedupe("/users", () => api.get("/users")),
    deduplicator.dedupe("/users", () => api.get("/users")),
]);
// Only 1 actual HTTP request is made
```

### Response Validation

Validate API responses against schemas:

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

const user = await api.get("/users/1", {
    validateResponse: {
        type: "object",
        properties: {
            id: { type: "number", required: true },
            name: { type: "string", required: true },
            email: { type: "string", pattern: /.+@.+\..+/ },
        },
    },
});
// Throws if response doesn't match schema
```

### Pagination Helper

Handle paginated APIs easily:

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

// Offset-based pagination
const page1 = await api.getList("/users", {
    pagination: { page: 1, limit: 10 },
    sort: { field: "name", order: "asc" },
    filters: { status: "active" },
});

console.log(page1.data); // Array of users
console.log(page1.pagination.totalPages);
console.log(page1.pagination.hasNextPage);
```

### Custom Error Messages per Request

Override global error messages for specific requests:

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    locale: "en",
});

try {
    await api.get("/sensitive-resource", {
        errorLocale: "es", // Use Spanish for this request only
    });
} catch (error) {
    console.error(error.message); // Spanish message
}
```

## 🔐 Security Patterns

### Sensitive Data Masking

```typescript
import { StringUtils } from "bytekit";

// Mask credit cards
const maskedCard = StringUtils.mask("4532-1234-5678-9010", {
    maskChar: "*",
    visibleStart: 4,
    visibleEnd: 4,
});
// => '4532-****-****-9010'

// Mask emails
const maskedEmail = StringUtils.mask("john.doe@example.com", {
    maskChar: "*",
    visibleStart: 2,
    visibleEnd: 12,
});
// => 'jo*********@example.com'
```

### Crypto Operations

```typescript
import { CryptoUtils } from "bytekit";

// Generate secure tokens
const token = CryptoUtils.generateToken(32);
const uuid = CryptoUtils.generateUUID();

// Hash data
const hash = await CryptoUtils.hash("sensitive-data", "SHA-256");

// Create HMAC signatures
const signature = await CryptoUtils.hmac("message", "secret-key", "SHA-256");

// Verify hash
const isValid = await CryptoUtils.verifyHash("data", hash);

// Constant-time comparison (prevents timing attacks)
const match = CryptoUtils.constantTimeCompare(signature1, signature2);
```

## 📊 Performance Optimization

### Caching Strategies

```typescript
import { CacheManager } from "bytekit";

// Create a multi-tier cache (memory + localStorage)
const cache = new CacheManager({
    maxMemorySize: 100,
    enableLocalStorage: true,
    defaultTTL: 60000, // 1 minute
});

// Cache computed values
const expensiveResult = await cache.getOrCompute(
    "user-stats",
    async () => {
        // This only runs if not in cache
        return await computeExpensiveStats();
    },
    300000 // Cache for 5 minutes
);

// Get cache statistics
const stats = cache.getStats();
console.log("Hit rate:", stats.hitRate);
console.log("Cache size:", stats.size);
```

### Request Batching

```typescript
import { BatchRequest } from "bytekit";
import { ApiClient } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.example.com" });
const batcher = new BatchRequest({
    maxBatchSize: 10,
    batchWindowMs: 50,
});

// These requests will be batched
const results = await Promise.all([
    batcher.add(() => api.get("/users/1")),
    batcher.add(() => api.get("/users/2")),
    batcher.add(() => api.get("/users/3")),
]);
```

### Compression

```typescript
import { CompressionUtils } from "bytekit";

// Compress large payloads
const data = { large: "payload", with: "lots", of: "data" };
const compressed = CompressionUtils.serializeCompressed(data);

// Calculate compression ratio
const ratio = CompressionUtils.getCompressionRatio(
    JSON.stringify(data),
    compressed
);
console.log("Saved:", ratio, "%");

// Decompress
const decompressed = CompressionUtils.deserializeCompressed(compressed);
```

## 🎯 Rate Limiting

### Token Bucket Rate Limiter

```typescript
import { RateLimiter } from "bytekit";

const limiter = new RateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
});

async function makeRequest(url: string) {
    // Wait until allowed
    await limiter.waitForAllowance(url);

    // Make request
    const response = await fetch(url);
    return response;
}

// Check stats
const stats = limiter.getStats("https://api.example.com");
console.log("Remaining requests:", stats.remaining);
console.log("Resets at:", new Date(stats.resetAt));
```

### Sliding Window Rate Limiter

```typescript
import { SlidingWindowRateLimiter } from "bytekit";

const limiter = new SlidingWindowRateLimiter({
    maxRequests: 50,
    windowMs: 60000, // More accurate than token bucket
});

if (limiter.isAllowed("https://api.example.com")) {
    await makeApiCall();
} else {
    const stats = limiter.getStats("https://api.example.com");
    console.log("Retry after:", stats.retryAfter, "seconds");
}
```

## 🔄 Real-time Features

### WebSocket Helper

```typescript
import { WebSocketHelper } from "bytekit";

const ws = new WebSocketHelper("wss://api.example.com/ws", {
    reconnect: true,
    maxReconnectAttempts: 5,
    heartbeatIntervalMs: 30000,
});

await ws.connect();

// Subscribe to messages
const unsubscribe = ws.on("notification", (data) => {
    console.log("New notification:", data);
});

// Send messages
ws.send("subscribe", { channels: ["updates", "alerts"] });

// Request-response pattern
const response = await ws.request("get_user", { id: 123 });
console.log("User:", response);

// Cleanup
unsubscribe();
ws.close();
```

### Server-Sent Events (SSE)

```typescript
import { StreamingHelper } from "bytekit";

const stream = StreamingHelper.streamSSE("https://api.example.com/events", {
    onError: (error) => console.error("Stream error:", error),
    onComplete: () => console.log("Stream closed"),
});

// Subscribe to events
const unsubscribe = stream.subscribe((data) => {
    console.log("Event received:", data);
});

// Close stream
stream.close();
```

### JSON Lines Streaming

```typescript
import { StreamingHelper } from "bytekit";

const result = await StreamingHelper.streamJsonLines(
    "https://api.example.com/stream",
    {
        timeout: 60000,
        onChunk: (chunk) => {
            console.log("Chunk received:", chunk);
        },
        onComplete: () => {
            console.log("Stream complete");
        },
    }
);

console.log("All data:", result.data);
```

## 🎨 Form Management

```typescript
import { FormUtils, Validators } from "bytekit";

const form = new FormUtils({
    initialValues: {
        email: "",
        password: "",
        confirmPassword: "",
    },
    rules: {
        email: {
            required: true,
            email: true,
        },
        password: {
            required: true,
            minLength: 8,
            custom: (value) => {
                return /[A-Z]/.test(value) || "Must contain uppercase letter";
            },
        },
        confirmPassword: {
            required: true,
            custom: (value) => {
                return (
                    value === form.getValue("password") ||
                    "Passwords must match"
                );
            },
        },
    },
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
        await registerUser(values);
    },
    onError: (errors) => {
        console.error("Validation errors:", errors);
    },
});

// Update values
form.setValue("email", "user@example.com");

// Validate
const errors = await form.validate();

// Submit
const success = await form.submit();

// Get form state
const state = form.getState();
console.log("Is valid:", state.isValid);
console.log("Errors:", state.errors);
```

## 📡 Polling

```typescript
import { PollingHelper } from "bytekit";

const poller = new PollingHelper({
    interval: 5000, // Poll every 5 seconds
    maxRetries: 10,
    onError: (error) => console.error("Poll error:", error),
});

poller.start(async () => {
    const status = await checkJobStatus(jobId);

    if (status === "completed") {
        poller.stop();
        console.log("Job completed!");
    }

    return status;
});

// Stop polling manually
setTimeout(() => poller.stop(), 60000);
```

## 🧪 Testing Utilities

### Mocking ApiClient

```typescript
import { ApiClient } from "bytekit";

// Create a mock fetch implementation for testing
const mockFetch = async (url: string, init?: RequestInit) => {
    return new Response(JSON.stringify({ id: 1, name: "Test User" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

const api = new ApiClient({
    baseUrl: "https://api.test.com",
    fetchImpl: mockFetch,
});

const user = await api.get("/users/1");
// Uses mock instead of real HTTP
```

## 🎯 Error Boundaries

```typescript
import { ErrorBoundary, AppError } from "bytekit";

const errorBoundary = new ErrorBoundary({
    logger: console,
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error, context) => {
        // Send to error tracking service
        trackError(error, context);
    },
});

// Execute with automatic retry
const result = await errorBoundary.execute(
    async () => {
        return await riskyOperation();
    },
    { context: { operation: "data-sync" } }
);

// Wrap functions
const safeFunction = errorBoundary.wrap(
    async (userId: string) => {
        return await fetchUserData(userId);
    },
    { component: "UserProfile" }
);

// Get error history
const history = errorBoundary.getErrorHistory(10);
console.log("Recent errors:", history);
```

## 🔍 Debugging Utilities

```typescript
import { createDebug, measureAsync, withTiming } from "bytekit";

// Create namespaced debugger
const debug = createDebug("app:api");

debug("Making request to %s", "/users");
debug.enabled = true; // Enable/disable dynamically

// Measure execution time
const { result, durationMs } = await measureAsync(async () => {
    return await expensiveOperation();
});
console.log("Took", durationMs, "ms");

// Create stopwatch
const stopwatch = createStopwatch();
await doSomething();
const elapsed = stopwatch.stop();
console.log("Elapsed:", elapsed, "ms");
```

## 📊 Signal-based State Management

```typescript
import { signal, computed, effect, batch } from "bytekit";

// Create reactive signals
const count = signal(0);
const name = signal("John");

// Computed values
const doubled = computed(() => count.value * 2);
const greeting = computed(() => `Hello, ${name.value}!`);

// Side effects
effect(() => {
    console.log("Count changed:", count.value);
    console.log("Doubled:", doubled.value);
});

// Batch updates (only 1 effect trigger)
batch(() => {
    count.value = 5;
    count.value = 10;
    count.value = 15;
});

// Untracked reads (don't create dependencies)
effect(() => {
    console.log("Count:", count.value);
    console.log(
        "Name (untracked):",
        untracked(() => name.value)
    );
});
```

## 🔗 Advanced Patterns

### Middleware Pattern

```typescript
import { ApiClient } from "bytekit";

const authMiddleware = {
    request: async (url: string, init: RequestInit) => {
        const token = await getAuthToken();
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${token}`);

        return [url, { ...init, headers }];
    },
    response: async (response: Response) => {
        if (response.status === 401) {
            await refreshAuthToken();
            // Retry request with new token
        }
        return response;
    },
};

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    interceptors: authMiddleware,
});
```

### Repository Pattern

```typescript
import { ApiClient } from "bytekit";

class UserRepository {
    constructor(private api: ApiClient) {}

    async findAll(filters?: object) {
        return this.api.getList("/users", { filters });
    }

    async findById(id: string) {
        return this.api.get(`/users/${id}`);
    }

    async create(data: CreateUserDto) {
        return this.api.post("/users", data);
    }

    async update(id: string, data: UpdateUserDto) {
        return this.api.put(`/users/${id}`, data);
    }

    async delete(id: string) {
        return this.api.delete(`/users/${id}`);
    }
}

const api = new ApiClient({ baseUrl: "https://api.example.com" });
const users = new UserRepository(api);

const allUsers = await users.findAll({ status: "active" });
```

## 💡 Best Practices

1. **Use TypeScript** - Define interfaces for API responses
2. **Configure retries** - Set appropriate retry policies for your APIs
3. **Enable caching** - Cache responses that don't change frequently
4. **Add logging** - Use structured logging for better debugging
5. **Validate responses** - Ensure API responses match expected schemas
6. **Handle errors** - Use try-catch with ApiError for proper error handling
7. **Rate limit** - Respect API rate limits with built-in limiters
8. **Monitor performance** - Use Profiler to identify bottlenecks

## 🔗 Next Steps

- **[API Reference](https://github.com/sebamar88/bytekit/wiki)** - Complete API documentation
- **[Migration Guide](./MIGRATION.md)** - Upgrading from previous versions
- **[Contributing](../CONTRIBUTING.md)** - Help improve bytekit

## 🆘 Need Help?

- **[GitHub Issues](https://github.com/sebamar88/bytekit/issues)** - Report bugs
- **[Discussions](https://github.com/sebamar88/bytekit/discussions)** - Ask questions
