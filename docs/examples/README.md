# 📚 bytekit Examples

Interactive examples and code snippets demonstrating bytekit features.

## 🚀 Quick Links

- **[Getting Started Guide](../guides/GETTING_STARTED.md)** - Learn the basics
- **[Advanced Usage](../guides/ADVANCED_USAGE.md)** - Complex patterns
- **[Best Practices](../guides/BEST_PRACTICES.md)** - Production-ready code

## 📁 Examples Organization

### Local Examples

Located in `/examples` directory - run directly with Node.js:

```bash
cd examples
pnpm install
node query-client-basic.js
node signal-basic.js
```

### Interactive Examples

Try bytekit in your browser without installation:

#### React

- **[Basic API Integration](https://codesandbox.io/s/bytekit-react-basic)** - ApiClient with hooks
- **[Form Management](https://codesandbox.io/s/bytekit-react-forms)** - FormUtils with validation
- **[Real-time Updates](https://codesandbox.io/s/bytekit-react-websocket)** - WebSocket integration

#### Vue

- **[Composition API](https://codesandbox.io/s/bytekit-vue-composition)** - ApiClient with Vue 3
- **[State Management](https://codesandbox.io/s/bytekit-vue-signals)** - Signal-based store

#### Svelte

- **[Store Integration](https://codesandbox.io/s/bytekit-svelte-stores)** - ApiClient with Svelte stores
- **[Form Validation](https://codesandbox.io/s/bytekit-svelte-forms)** - FormUtils integration

## 📝 Code Snippets

### ApiClient - Basic Request

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
});

// GET request
const users = await api.get("/users");
console.log(users);

// POST request
const newUser = await api.post("/users", {
    name: "John Doe",
    email: "john@example.com",
});
```

### ApiClient - With Types

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

// Type-safe request
const user = await api.get<User>("/users/1");
console.log(user.name); // Fully typed!

// Type-safe list
const users = await api.getList<User[]>("/users");
users.forEach((u) => console.log(u.email));
```

### Error Handling

```typescript
import { ApiClient, ApiError } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    locale: "es", // Localized error messages
});

try {
    const data = await api.get("/protected-resource");
} catch (error) {
    if (error instanceof ApiError) {
        console.log(error.status); // 401
        console.log(error.message); // "No autorizado"
        console.log(error.code); // "UNAUTHORIZED"
    }
}
```

### Request Caching

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

// Cache for 5 minutes
const users = await api.get("/users", {
    cache: true,
    cacheTTL: 300000,
});

// Subsequent calls use cached data
const cachedUsers = await api.get("/users", { cache: true });
```

### Retries & Circuit Breaker

```typescript
const api = new ApiClient({
    baseUrl: "https://api.example.com",
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
    },
    circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 60000,
    },
});

// Automatically retries on failure
const data = await api.get("/unreliable-endpoint");
```

### Request Interceptors

```typescript
const api = new ApiClient({
    baseUrl: "https://api.example.com",
    interceptors: {
        request: async (url, init) => {
            // Add auth token
            const token = localStorage.getItem("token");
            if (token) {
                const headers = new Headers(init.headers);
                headers.set("Authorization", `Bearer ${token}`);
                init.headers = headers;
            }
            return [url, init];
        },
        response: async (response) => {
            // Log response time
            console.log(`Request took: ${Date.now()}ms`);
            return response;
        },
    },
});
```

### String Utilities

```typescript
import { StringUtils } from "bytekit";

// Format
StringUtils.capitalize("hello world"); // "Hello world"
StringUtils.camelCase("hello_world"); // "helloWorld"
StringUtils.pascalCase("hello_world"); // "HelloWorld"
StringUtils.kebabCase("HelloWorld"); // "hello-world"
StringUtils.snakeCase("HelloWorld"); // "hello_world"

// Truncate
StringUtils.truncate("Long text here", { maxLength: 10 });
// "Long te..."

// Mask sensitive data
StringUtils.mask("1234-5678-9012-3456", {
    visibleEnd: 4,
});
// "****************3456"

// Slugify
StringUtils.slugify("Hello World! 🎉");
// "hello-world"
```

### Date Utilities

```typescript
import { DateUtils } from "bytekit";

// Format
DateUtils.format(new Date(), "YYYY-MM-DD");
// "2024-01-15"

DateUtils.format(new Date(), "DD/MM/YYYY HH:mm");
// "15/01/2024 14:30"

// Relative time
DateUtils.timeAgo(new Date("2024-01-14"));
// "1 day ago"

// Add/subtract
DateUtils.addDays(new Date(), 7);
DateUtils.subtractMonths(new Date(), 2);

// Business days
DateUtils.isBusinessDay(new Date());
DateUtils.getBusinessDaysBetween(startDate, endDate);
```

### Array Utilities

```typescript
import { ArrayUtils } from "bytekit";

const users = [
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
    { id: 3, name: "Charlie", age: 30 },
];

// Group by
ArrayUtils.groupBy(users, "age");
// { 30: [...], 25: [...] }

// Unique
ArrayUtils.unique([1, 2, 2, 3, 3, 3]);
// [1, 2, 3]

// Chunk
ArrayUtils.chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

// Sort
ArrayUtils.sortBy(users, "name");
ArrayUtils.sortBy(users, "age", "desc");
```

### Logging

```typescript
import { createLogger } from "bytekit";

const logger = createLogger({
    namespace: "app",
    level: "debug",
});

logger.debug("Debug message", { userId: 123 });
logger.info("User logged in", { email: "user@example.com" });
logger.warn("Slow response", { duration: 5000 });
logger.error("Request failed", { endpoint: "/users" }, error);
```

### Profiling

```typescript
import { Profiler, withTiming } from "bytekit";

const profiler = new Profiler({ namespace: "api" });

// Manual timing
profiler.start("fetchUsers");
await api.get("/users");
profiler.end("fetchUsers");

// Automatic timing
const result = await withTiming("processData", async () => {
    return await heavyComputation();
});

// Get metrics
const metrics = profiler.getMetrics();
console.log(metrics.fetchUsers);
// { count: 5, total: 1234, avg: 246.8, min: 180, max: 340 }
```

### React Integration

```typescript
import { useState, useEffect } from 'react';
import { ApiClient } from 'bytekit';

const api = new ApiClient({
  baseUrl: 'https://api.example.com',
});

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await api.get('/users');
        setUsers(data);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
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

### Vue Composition API

```typescript
import { ref, onMounted } from "vue";
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

export default {
    setup() {
        const users = ref([]);
        const loading = ref(true);

        onMounted(async () => {
            try {
                users.value = await api.get("/users");
            } finally {
                loading.value = false;
            }
        });

        return { users, loading };
    },
};
```

### Svelte Stores

```typescript
import { writable } from "svelte/store";
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

function createUserStore() {
    const { subscribe, set, update } = writable([]);

    return {
        subscribe,
        load: async () => {
            const users = await api.get("/users");
            set(users);
        },
    };
}

export const users = createUserStore();
```

## 🎮 Interactive Playgrounds

### Try in Your Browser

#### 1. Basic API Client

```bash
# Open in CodeSandbox
https://codesandbox.io/s/new?template=typescript
```

Add this code:

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
});

// Try it!
const users = await api.get("/users");
console.log(users);
```

#### 2. String Utilities

```typescript
import { StringUtils } from "bytekit";

console.log(StringUtils.capitalize("hello world")); // "Hello world"
console.log(StringUtils.camelCase("hello_world")); // "helloWorld"
console.log(StringUtils.pascalCase("hello_world")); // "HelloWorld"
console.log(StringUtils.kebabCase("HelloWorld")); // "hello-world"
console.log(StringUtils.snakeCase("HelloWorld")); // "hello_world"
console.log(StringUtils.truncate("Long text", { maxLength: 5 }));
```

#### 3. Date Utilities

```typescript
import { DateUtils } from "bytekit";

console.log(DateUtils.format(new Date(), "YYYY-MM-DD"));
console.log(DateUtils.timeAgo(new Date("2024-01-01")));
console.log(DateUtils.addDays(new Date(), 7));
```

## 📚 More Resources

- **[API Reference](https://github.com/sebamar88/bytekit/wiki)** - Complete documentation
- **[GitHub Repository](https://github.com/sebamar88/bytekit)** - Source code
- **[npm Package](https://npmjs.com/package/@sebamar88/bytekit)** - Install

## 💬 Need Help?

- **[Open an Issue](https://github.com/sebamar88/bytekit/issues)**
- **[Discussions](https://github.com/sebamar88/bytekit/discussions)**

---

Made with ❤️ by the bytekit team
