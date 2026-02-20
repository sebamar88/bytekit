# Context7 Enhanced Documentation

## Library Overview

ByteKit is a zero-dependency, modern TypeScript library optimized for performance and developer experience. It is designed to be the "Swiss Army Knife" for TypeScript projects, bridging the gap between raw fetch/promises and heavy framework-specific libraries.

### Key Pillars:
1. **Communication**: `ApiClient` + `WebSocketHelper`
2. **State & Caching**: `QueryClient` + `CacheManager` + `StorageManager`
3. **Control Flow**: `Async Utilities` (Parallel, Retry, Debounce)
4. **Data Integrity**: `Validator` + `ResponseValidator`
5. **Automation**: `ByteKit CLI` (Type Generation)

## Frequently Asked Questions

### Q: How do I convert a string to PascalCase using StringUtils?

```typescript
import { StringUtils } from "bytekit";

// PascalCase conversion - Works with spaces, hyphens, and snake_case
StringUtils.pascalCase("hello world"); // "HelloWorld"
StringUtils.pascalCase("user_profile_data"); // "UserProfileData"
```

### Q: How do I format a Date object into a custom string format like 'YYYY-MM-DD'?

```typescript
import { DateUtils } from "bytekit";

const date = new Date(2024, 0, 15);
// Use tokens for custom formatting
const formatted = DateUtils.format(date, "YYYY-MM-DD"); // "2024-01-15"
const dateTime = DateUtils.format(date, "YYYY-MM-DD HH:mm:ss");
```

### Q: When should I use `withTiming` instead of `Profiler`?

Use **`withTiming`** (or `measureAsync`) when you want to wrap a **single function** call and automatically log its duration. It's a high-level decorator pattern.

Use **`Profiler`** when you need to perform **multiple manual measurements** across different parts of a complex workflow and then aggregate the results in a summary.

```typescript
// Example withTiming: Automatic wrapper
const data = await withTiming("fetch-user", () => api.get("/user"));

// Example Profiler: Manual aggregation
const prof = new Profiler("batch-job");
prof.start("step-1");
await doStep1();
prof.end("step-1");
prof.start("step-2");
await doStep2();
prof.end("step-2");
console.log(prof.summary());
```

### Q: How do I dynamically adjust ApiClient's base URL based on environment?

```typescript
import { ApiClient } from "bytekit";

// Method 1: Simple environment detection
const isNode = typeof process !== "undefined" && process.versions?.node;
const isBrowser = typeof window !== "undefined";

const api = new ApiClient({
    baseUrl: isNode
        ? "http://localhost:3000/api" // Server-side
        : "https://api.example.com", // Client-side
});

// Method 2: Using environment variables
const api = new ApiClient({
    baseUrl:
        process.env.API_URL ||
        (typeof window !== "undefined"
            ? window.location.origin + "/api"
            : "http://localhost:3000/api"),
});

// Method 3: Factory function
function createApiClient() {
    const config =
        typeof process !== "undefined"
            ? {
                  baseUrl: process.env.API_URL || "http://localhost:3000",
                  timeoutMs: 30000,
              }
            : {
                  baseUrl: "/api",
                  timeoutMs: 10000,
              };

    return new ApiClient(config);
}

const api = createApiClient();
```

## Complete StringUtils Case Conversion Examples

```typescript
import { StringUtils } from "bytekit";

// camelCase - first letter lowercase, rest capitalized
StringUtils.camelCase("hello world"); // "helloWorld"
StringUtils.camelCase("HelloWorld"); // "helloWorld"
StringUtils.camelCase("hello-world"); // "helloWorld"
StringUtils.camelCase("hello_world"); // "helloWorld"

// PascalCase - all words capitalized
StringUtils.pascalCase("hello world"); // "HelloWorld"
StringUtils.pascalCase("helloWorld"); // "HelloWorld"
StringUtils.pascalCase("hello-world"); // "HelloWorld"
StringUtils.pascalCase("hello_world"); // "HelloWorld"

// kebab-case - lowercase with hyphens
StringUtils.kebabCase("helloWorld"); // "hello-world"
StringUtils.kebabCase("HelloWorld"); // "hello-world"
StringUtils.kebabCase("hello_world"); // "hello-world"

// snake_case - lowercase with underscores
StringUtils.snakeCase("helloWorld"); // "hello_world"
StringUtils.snakeCase("HelloWorld"); // "hello_world"
StringUtils.snakeCase("hello-world"); // "hello_world"
```

## Environment Detection Patterns

### Pattern 1: Inline Detection

```typescript
const api = new ApiClient({
    baseUrl:
        typeof window !== "undefined"
            ? "https://api.example.com"
            : "http://localhost:3000",
});
```

### Pattern 2: Helper Function

```typescript
function getBaseUrl() {
    // Node.js environment
    if (typeof process !== "undefined" && process.versions?.node) {
        return process.env.API_URL || "http://localhost:3000";
    }

    // Browser environment
    if (typeof window !== "undefined") {
        return window.location.origin + "/api";
    }

    // Fallback
    return "https://api.example.com";
}

const api = new ApiClient({ baseUrl: getBaseUrl() });
```

### Pattern 3: Configuration Object

```typescript
const config = {
    node: {
        baseUrl: "http://localhost:3000/api",
        timeout: 30000,
    },
    browser: {
        baseUrl: "https://api.example.com",
        timeout: 10000,
    },
};

const isNode = typeof process !== "undefined";
const envConfig = isNode ? config.node : config.browser;

const api = new ApiClient(envConfig);
```

### Pattern 4: Environment Variables with Fallbacks

```typescript
import { EnvManager } from "bytekit/env-manager";

const env = new EnvManager();
const isServer = typeof window === "undefined";

const api = new ApiClient({
    baseUrl:
        env.get("API_URL") || (isServer ? "http://localhost:3000" : "/api"),
});
```

## Advanced Asynchronous Flow Control

### Q: How do I implement a robust retry mechanism for my API calls?

```typescript
import { retry } from "bytekit/async";

// Retry with exponential backoff
const data = await retry(async () => {
    return await api.get("/orders");
}, {
    maxAttempts: 3,
    baseDelay: 1000,
    backoff: "exponential"
});
```

### Q: How do I process a large array of tasks without overloading the server?

```typescript
import { parallel } from "bytekit/async";

const urls = ["/1", "/2", ... "/100"];
const tasks = urls.map(url => () => api.get(url));

// Process 5 URLs at a time
const results = await parallel(tasks, { concurrency: 5 });
```

### Q: How do I handle multiple search requests in a type-ahead input?

```typescript
import { debounceAsync } from "bytekit/async";

const debouncedSearch = debounceAsync(async (query) => {
    return await api.get(`/search?q=${query}`);
}, 300);

// In your search handler, previous intermediate results are automatically cancelled
const currentResults = await debouncedSearch("my query");
```

## CLI Productivity & Automation

### Q: How do I generate TypeScript interfaces from my OpenAPI docs?

```bash
# Using the bytekit global binary
bytekit swagger https://api.myservice.com/swagger.json -o src/types/api.ts
```

### Q: How do I quickly generate a type from a live API response?

```bash
# Bytekit will fetch the data and infer the TS interface
bytekit type https://jsonplaceholder.typicode.com/users/1 --name User
```

### Q: How do I scaffold a new backend-to-frontend resource?

```bash
# This creates the API client, hooks, and types for the resource
bytekit resource customer
```

