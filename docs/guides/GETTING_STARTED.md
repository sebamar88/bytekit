# Getting Started with bytekit

Welcome to bytekit! This guide will help you get up and running quickly with our modern TypeScript utilities.

## 📦 Installation

### Using npm/pnpm/yarn

```bash
# npm
npm install bytekit

# pnpm (recommended)
pnpm add bytekit

# yarn
yarn add bytekit
```

### Global CLI Installation

For CLI utilities like code generation:

```bash
npm install -g bytekit

# Verify installation
sutils --version
```

## 🚀 Your First Request

Let's start with a simple HTTP request using the ApiClient:

```typescript
import { ApiClient } from "bytekit";

// Create a client instance
const api = new ApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
    locale: "en", // or 'es' for Spanish
});

// Make your first request
const users = await api.get("/users");
console.log("Users:", users);
```

## 🎯 Core Concepts

### 1. ApiClient - Type-Safe HTTP Requests

The ApiClient provides a powerful, type-safe way to make HTTP requests:

```typescript
import { ApiClient } from "bytekit";

// Define your response types
interface User {
    id: number;
    name: string;
    email: string;
}

// Create a typed client
const api = new ApiClient({
    baseUrl: "https://api.example.com",
    defaultHeaders: {
        Authorization: "Bearer YOUR_TOKEN",
    },
    timeoutMs: 10000, // 10 seconds
});

// Type-safe GET request
const users = await api.get<User[]>("/users");

// POST with body
const newUser = await api.post<User>("/users", {
    name: "John Doe",
    email: "john@example.com",
});

// With query parameters
const results = await api.get<User[]>("/users", {
    searchParams: {
        page: 1,
        limit: 10,
    },
});
```

### 2. Error Handling

bytekit provides localized error messages and structured error handling:

```typescript
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    locale: "en", // or 'es'
    errorMessages: {
        en: {
            404: "The requested resource was not found",
            429: "Too many requests. Please slow down.",
        },
        es: {
            404: "El recurso solicitado no fue encontrado",
            429: "Demasiadas solicitudes. Por favor, reduce la velocidad.",
        },
    },
});

try {
    const user = await api.get("/users/999");
} catch (error) {
    if (error instanceof ApiError) {
        console.error("Status:", error.status);
        console.error("Message:", error.message); // Localized!
        console.error("Body:", error.body);
    }
}
```

### 3. Retries and Circuit Breaker

Handle network failures gracefully:

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
    },
    circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 60000,
    },
});

// This will retry up to 3 times on failure
const data = await api.get("/unstable-endpoint");
```

### 4. Request Caching

Cache responses to reduce redundant requests:

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

// First request hits the server
const users1 = await api.get("/users", {
    cache: true,
    cacheTTL: 60000, // Cache for 1 minute
});

// Second request within 1 minute uses cached response
const users2 = await api.get("/users", { cache: true });
```

### 5. Request/Response Interceptors

Modify requests and responses on the fly:

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    interceptors: {
        request: async (url, init) => {
            // Add timestamp to all requests
            const urlWithTimestamp = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
            return [urlWithTimestamp, init];
        },
        response: async (response) => {
            // Log all responses
            console.log("Response received:", response.status);
            return response;
        },
    },
});
```

## 🌍 Environment-Specific Configuration

### Dynamic Base URL Based on Environment

Configure ApiClient differently for Node.js vs browser environments:

```typescript
import { ApiClient } from "bytekit";

// Detect environment
const isNode = typeof process !== "undefined" && process.versions?.node;

const api = new ApiClient({
    baseUrl: isNode
        ? process.env.API_URL || "http://localhost:3000/api"
        : "https://api.example.com",

    defaultHeaders: {
        "User-Agent": isNode ? "MyApp-Server" : "MyApp-Browser",
    },

    timeoutMs: isNode ? 30000 : 10000, // Different timeouts
});
```

### Using Environment Variables

```typescript
import { ApiClient } from "bytekit";
import { EnvManager } from "bytekit/env-manager";

const env = new EnvManager();

const api = new ApiClient({
    baseUrl:
        env.get("API_URL") ||
        (typeof window !== "undefined"
            ? window.location.origin + "/api"
            : "http://localhost:3000"),
});
```

### Factory Function Pattern

```typescript
function createApiClient() {
    const isNode = typeof process !== "undefined";

    return new ApiClient(
        isNode
            ? {
                  baseUrl: process.env.API_URL || "http://localhost:3000",
                  timeoutMs: 30000,
              }
            : {
                  baseUrl: "/api",
                  timeoutMs: 10000,
              }
    );
}

const api = createApiClient();
```

## 🛠️ Utility Helpers

### String Utilities

```typescript
import { StringUtils } from "bytekit";

// Case conversion
StringUtils.camelCase("hello_world"); // => 'helloWorld'
StringUtils.pascalCase("hello_world"); // => 'HelloWorld'
StringUtils.kebabCase("HelloWorld"); // => 'hello-world'
StringUtils.snakeCase("HelloWorld"); // => 'hello_world'

// Capitalize
const capitalized = StringUtils.capitalize("hello world");
// => 'Hello world'

// Slugify
const slug = StringUtils.slugify("Hello World! 🌍");
// => 'hello-world'

// Mask sensitive data
const masked = StringUtils.mask("1234567890", {
    visibleStart: 0,
    visibleEnd: 4,
});
// => '••••••7890'

// Interpolate templates
const message = StringUtils.interpolate(
    "Hello {{ user.name }}, you have {{ count }} messages",
    { user: { name: "John" }, count: 5 }
);
// => 'Hello John, you have 5 messages'
```

### Date Utilities

```typescript
import { DateUtils } from "bytekit";

// Format dates
const formatted = DateUtils.format(new Date(), "es-AR");
// => '3/2/2026'

// Parse dates safely
const date = DateUtils.parse("2024-12-31");

// Add/subtract time
const tomorrow = DateUtils.add(new Date(), { days: 1 });
const lastWeek = DateUtils.subtract(new Date(), { weeks: 1 });

// Check relationships
const isSameDay = DateUtils.isSameDay(new Date(), tomorrow);
const isPast = DateUtils.isPast(new Date("2020-01-01"));
```

### Array Utilities

```typescript
import { ArrayUtils } from "bytekit";

// Chunk arrays
const chunks = ArrayUtils.chunk([1, 2, 3, 4, 5], 2);
// => [[1, 2], [3, 4], [5]]

// Unique values
const unique = ArrayUtils.unique([1, 2, 2, 3, 3, 3]);
// => [1, 2, 3]

// Shuffle
const shuffled = ArrayUtils.shuffle([1, 2, 3, 4, 5]);

// Flatten nested arrays
const flat = ArrayUtils.flatten([
    [1, 2],
    [3, [4, 5]],
]);
// => [1, 2, 3, 4, 5]
```

### Object Utilities

```typescript
import { ObjectUtils } from "bytekit";

// Pick specific keys
const picked = ObjectUtils.pick(
    { id: 1, name: "John", age: 30, email: "john@example.com" },
    ["id", "name"]
);
// => { id: 1, name: 'John' }

// Deep merge
const merged = ObjectUtils.deepMerge({ a: { b: 1 } }, { a: { c: 2 } });
// => { a: { b: 1, c: 2 } }

// Group by key
const users = [
    { id: 1, department: "IT" },
    { id: 2, department: "HR" },
    { id: 3, department: "IT" },
];
const grouped = ObjectUtils.groupBy(users, "department");
// => { IT: [{id: 1, ...}, {id: 3, ...}], HR: [{id: 2, ...}] }
```

## 📝 Structured Logging

Create structured logs with levels and namespaces:

```typescript
import { createLogger } from "bytekit";

const logger = createLogger({
    namespace: "app",
    level: "info",
});

logger.info("User logged in", { userId: 123, method: "oauth" });
logger.warn("Rate limit approaching", { current: 95, max: 100 });
logger.error("Database connection failed", {}, new Error("Connection timeout"));
```

## ⏱️ Performance Profiling

Measure and optimize performance:

```typescript
import { Profiler, withTiming } from "bytekit";

// Create a profiler
const profiler = new Profiler({ namespace: "api" });

// Start and stop manually
profiler.start("fetchUsers");
const users = await fetchUsers();
profiler.end("fetchUsers");

// Or use withTiming decorator
const result = await withTiming("processData", async () => {
    return await processLargeDataset();
});

// Get all metrics
const metrics = profiler.getMetrics();
console.log("Average fetch time:", metrics.fetchUsers.avg);
```

## 🎨 Framework Integration

### React

```typescript
import { createApiClient } from 'bytekit';
import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = createApiClient({
      baseURL: 'https://api.example.com',
    });

    api.get('/users')
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Vue 3

```typescript
import { createApiClient } from "bytekit";
import { ref, onMounted } from "vue";

export default {
    setup() {
        const users = ref([]);
        const api = createApiClient({
            baseURL: "https://api.example.com",
        });

        onMounted(async () => {
            users.value = await api.get("/users");
        });

        return { users };
    },
};
```

### Svelte

```typescript
import { createApiClient } from "bytekit";
import { onMount } from "svelte";

let users = [];

const api = createApiClient({
    baseURL: "https://api.example.com",
});

onMount(async () => {
    users = await api.get("/users");
});
```

## 🔗 Next Steps

Now that you've learned the basics, explore more:

- **[API Reference](https://github.com/sebamar88/bytekit/wiki)** - Complete documentation
- **[Advanced Examples](./ADVANCED_USAGE.md)** - Complex scenarios
- **[Best Practices](./BEST_PRACTICES.md)** - Tips and patterns
- **[Migration Guide](./MIGRATION.md)** - Upgrading from older versions

## 💡 Tips

1. **Use TypeScript** - Get full type safety and autocomplete
2. **Enable tree-shaking** - Import only what you need
3. **Configure retries** - Handle network failures gracefully
4. **Add logging** - Debug issues faster with structured logs
5. **Cache responses** - Reduce API calls and improve performance

## 🆘 Getting Help

- **[GitHub Issues](https://github.com/sebamar88/bytekit/issues)** - Report bugs or request features
- **[Discussions](https://github.com/sebamar88/bytekit/discussions)** - Ask questions and share ideas
- **[Wiki](https://github.com/sebamar88/bytekit/wiki)** - Browse complete documentation

Happy coding! 🚀
