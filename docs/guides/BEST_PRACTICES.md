# Best Practices

This guide outlines recommended patterns and practices for using bytekit effectively in production applications.

## 🏗️ Architecture Patterns

### 1. Service Layer Pattern

Organize your API calls into service modules:

```typescript
// services/api.ts
import { ApiClient } from "bytekit";

export const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL || "https://api.example.com",
    defaultHeaders: {
        "X-App-Version": "1.0.0",
    },
    locale: navigator.language.startsWith("es") ? "es" : "en",
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

// services/users.service.ts
import { api } from "./api";

export class UsersService {
    async getAll(filters?: UserFilters) {
        return api.getList<User[]>("/users", {
            filters,
            cache: true,
            cacheTTL: 60000,
        });
    }

    async getById(id: string) {
        return api.get<User>(`/users/${id}`, {
            cache: true,
            cacheTTL: 300000, // Cache user data for 5 minutes
        });
    }

    async create(data: CreateUserDto) {
        return api.post<User>("/users", data);
    }

    async update(id: string, data: UpdateUserDto) {
        return api.put<User>(`/users/${id}`, data);
    }
}

export const usersService = new UsersService();
```

### 2. Typed API Responses

Always define TypeScript interfaces for your API responses:

```typescript
// types/api.ts
export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "guest";
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
}

// Usage
const users = await api.getList<User[]>("/users");
users.data.forEach((user) => {
    console.log(user.name); // Fully typed!
});
```

### 3. Environment Configuration

Use environment variables for configuration:

```typescript
// config/api.config.ts
import { EnvManager } from "bytekit";

const env = new EnvManager();

export const apiConfig = {
    baseUrl: env.get("VITE_API_URL", "https://api.example.com"),
    timeout: env.getNumber("VITE_API_TIMEOUT", 10000),
    enableLogs: env.getBoolean("VITE_ENABLE_API_LOGS", false),
    locale: env.get("VITE_LOCALE", "en"),
};

// Validate required variables
env.validate({
    VITE_API_URL: { required: true },
    VITE_API_KEY: { required: true, secret: true },
});
```

## 🔐 Security Best Practices

### 1. Secure Token Management

```typescript
import { CryptoUtils, StorageUtils } from "bytekit";

class TokenManager {
    private readonly TOKEN_KEY = "auth_token";

    async saveToken(token: string) {
        // Hash token before storing
        const hashed = await CryptoUtils.hash(token);
        StorageUtils.setSecure(this.TOKEN_KEY, hashed);
    }

    async getToken(): Promise<string | null> {
        return StorageUtils.getSecure(this.TOKEN_KEY);
    }

    clearToken() {
        StorageUtils.remove(this.TOKEN_KEY);
    }

    isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }
}

export const tokenManager = new TokenManager();
```

### 2. Sensitive Data Handling

```typescript
import { StringUtils, CryptoUtils } from "bytekit";

// Mask sensitive data in logs
const logger = createLogger({
    namespace: "app",
    transform: (data) => {
        if (data.creditCard) {
            data.creditCard = StringUtils.mask(data.creditCard, {
                visibleEnd: 4,
            });
        }
        if (data.email) {
            data.email = StringUtils.mask(data.email, {
                visibleStart: 2,
                visibleEnd: 15,
            });
        }
        return data;
    },
});

// Generate secure tokens
const apiKey = CryptoUtils.generateToken(32);
const sessionId = CryptoUtils.generateUUID();

// Constant-time comparison for tokens
const isValid = CryptoUtils.constantTimeCompare(providedToken, storedToken);
```

### 3. Input Validation

```typescript
import { Validator } from "bytekit";

function validateUserInput(data: any) {
    const errors: string[] = [];

    if (!Validator.isEmail(data.email)) {
        errors.push("Invalid email address");
    }

    if (
        !Validator.isStrongPassword(data.password, {
            minLength: 12,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: true,
        })
    ) {
        errors.push("Password does not meet requirements");
    }

    if (!Validator.isPhone(data.phone)) {
        errors.push("Invalid phone number");
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join(", "));
    }
}
```

## 🎯 Performance Optimization

### 1. Request Caching Strategy

```typescript
import { ApiClient, CacheManager } from "bytekit";

// Create a shared cache instance
const cache = new CacheManager({
    maxMemorySize: 100,
    enableLocalStorage: true,
    defaultTTL: 300000, // 5 minutes
});

const api = new ApiClient({
    baseUrl: "https://api.example.com",
});

// Cache frequently accessed data
async function getUserProfile(userId: string) {
    return cache.getOrCompute(
        `user:${userId}`,
        () => api.get(`/users/${userId}`),
        600000 // Cache for 10 minutes
    );
}

// Invalidate cache when data changes
async function updateUserProfile(userId: string, data: any) {
    const result = await api.put(`/users/${userId}`, data);
    cache.delete(`user:${userId}`);
    return result;
}
```

### 2. Request Batching

```typescript
import { BatchRequest } from "bytekit";

const batcher = new BatchRequest({
    maxBatchSize: 50,
    batchWindowMs: 100,
});

// These will be batched together
async function loadMultipleUsers(userIds: string[]) {
    const requests = userIds.map((id) =>
        batcher.add(() => api.get(`/users/${id}`))
    );

    return Promise.all(requests);
}
```

### 3. Lazy Loading

```typescript
import { signal, computed } from "bytekit";

// Only load data when needed
class LazyDataLoader {
    private data = signal<User[] | null>(null);
    private loading = signal(false);

    get users() {
        if (!this.data.value && !this.loading.value) {
            this.load();
        }
        return this.data.value;
    }

    private async load() {
        this.loading.value = true;
        try {
            const users = await api.get<User[]>("/users");
            this.data.value = users;
        } finally {
            this.loading.value = false;
        }
    }
}
```

## 🚨 Error Handling

### 1. Centralized Error Handler

```typescript
import { ErrorBoundary, ApiError, createLogger } from "bytekit";

const logger = createLogger({ namespace: "errors" });

export const errorHandler = new ErrorBoundary({
    logger,
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error, context) => {
        // Log to error tracking service
        if (window.Sentry) {
            window.Sentry.captureException(error, { extra: context });
        }

        // Show user-friendly message
        if (error instanceof ApiError) {
            showNotification({
                type: "error",
                message: error.message,
            });
        } else {
            showNotification({
                type: "error",
                message: "An unexpected error occurred",
            });
        }
    },
});

// Wrap API calls
export async function safeApiCall<T>(
    fn: () => Promise<T>,
    context?: Record<string, any>
): Promise<T> {
    return errorHandler.execute(fn, context);
}
```

### 2. Graceful Degradation

```typescript
import { ApiClient } from "bytekit";

async function loadUserData(userId: string) {
    try {
        // Try to load from API
        return await api.get(`/users/${userId}`);
    } catch (error) {
        logger.warn("Failed to load user from API, using cache", { userId });

        // Fallback to cache
        const cached = cache.get(`user:${userId}`);
        if (cached) return cached;

        // Final fallback to default
        return createDefaultUser(userId);
    }
}
```

### 3. Retry with Exponential Backoff

```typescript
import { TimeUtils } from "bytekit";

async function fetchWithRetry<T>(
    fn: () => Promise<T>,
    options = {
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 10000,
    }
): Promise<T> {
    return TimeUtils.retryAsync(fn, options);
}

// Usage
const data = await fetchWithRetry(() => api.get("/data"));
```

## 📊 Monitoring & Logging

### 1. Structured Logging

```typescript
import { createLogger } from "bytekit";

const logger = createLogger({
    namespace: "app",
    level: import.meta.env.PROD ? "info" : "debug",
});

// Log with context
logger.info("User logged in", {
    userId: user.id,
    method: "oauth",
    provider: "google",
    timestamp: new Date().toISOString(),
});

// Log errors with stack traces
try {
    await riskyOperation();
} catch (error) {
    logger.error(
        "Operation failed",
        {
            operation: "riskyOperation",
            userId: currentUser.id,
        },
        error
    );
}
```

### 2. Performance Monitoring

```typescript
import { Profiler, withTiming } from "bytekit";

const profiler = new Profiler({ namespace: "api-calls" });

// Profile API calls
async function fetchUsers() {
    profiler.start("fetchUsers");
    try {
        const users = await api.get("/users");
        return users;
    } finally {
        profiler.end("fetchUsers");
    }
}

// Or use decorator
const result = await withTiming("processData", async () => {
    return await processLargeDataset();
});

// Get metrics
const metrics = profiler.getMetrics();
Object.entries(metrics).forEach(([name, stats]) => {
    console.log(`${name}: avg ${stats.avg}ms, max ${stats.max}ms`);
});
```

### 3. Request Tracing

```typescript
import { ApiClient, createLogger } from "bytekit";

const logger = createLogger({ namespace: "api" });

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    interceptors: {
        request: async (url, init) => {
            const traceId = CryptoUtils.generateUUID();
            const headers = new Headers(init.headers);
            headers.set("X-Trace-Id", traceId);

            logger.debug("Request started", {
                traceId,
                url,
                method: init.method,
            });

            return [url, { ...init, headers }];
        },
        response: async (response) => {
            const traceId = response.headers.get("X-Trace-Id");

            logger.debug("Response received", {
                traceId,
                status: response.status,
                duration: performance.now(),
            });

            return response;
        },
    },
});
```

## 🧪 Testing

### 1. Mock API Responses

```typescript
import { ApiClient } from "bytekit";

// Create mock fetch for testing
function createMockFetch(responses: Record<string, any>) {
    return async (url: string) => {
        const path = new URL(url).pathname;
        const data = responses[path];

        if (!data) {
            return new Response(null, { status: 404 });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    };
}

// In tests
const mockApi = new ApiClient({
    baseUrl: "https://api.test.com",
    fetchImpl: createMockFetch({
        "/users": [{ id: 1, name: "Test User" }],
        "/users/1": { id: 1, name: "Test User" },
    }),
});

const users = await mockApi.get("/users");
expect(users).toHaveLength(1);
```

### 2. Integration Tests

```typescript
import { ApiClient, TimeUtils } from "bytekit";

describe("Users API", () => {
    let api: ApiClient;

    beforeEach(() => {
        api = new ApiClient({
            baseUrl: "http://localhost:3000",
            timeoutMs: 5000,
        });
    });

    it("should create a user", async () => {
        const newUser = {
            name: "John Doe",
            email: "john@example.com",
        };

        const user = await api.post("/users", newUser);

        expect(user.id).toBeDefined();
        expect(user.name).toBe(newUser.name);
    });

    it("should handle rate limiting", async () => {
        // Make many requests
        const requests = Array.from({ length: 100 }, (_, i) =>
            api.get(`/users/${i}`)
        );

        await expect(Promise.all(requests)).rejects.toThrow(/rate limit/i);
    });
});
```

## 🔄 State Management

### 1. Signal-based Store

```typescript
import { signal, computed, effect } from "bytekit";

class UserStore {
    private _users = signal<User[]>([]);
    private _loading = signal(false);
    private _error = signal<string | null>(null);

    get users() {
        return this._users.value;
    }

    get loading() {
        return this._loading.value;
    }

    get error() {
        return this._error.value;
    }

    activeUsers = computed(() =>
        this._users.value.filter((u) => u.status === "active")
    );

    async loadUsers() {
        this._loading.value = true;
        this._error.value = null;

        try {
            const users = await api.get<User[]>("/users");
            this._users.value = users;
        } catch (error) {
            this._error.value = error.message;
        } finally {
            this._loading.value = false;
        }
    }
}

export const userStore = new UserStore();

// React to changes
effect(() => {
    console.log("Active users:", userStore.activeUsers.length);
});
```

## 📱 Framework Integration

### React Custom Hooks

```typescript
import { useState, useEffect } from 'react';
import { ApiClient } from 'bytekit';

function useApi<T>(endpoint: string, options = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.get<T>(endpoint, options);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return { data, loading, error };
}

// Usage
function UserList() {
  const { data: users, loading, error } = useApi<User[]>('/users');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## 💡 Tips & Tricks

### 1. Use Modular Imports

```typescript
// ❌ Don't import everything
import { ApiClient, DateUtils, StringUtils } from "bytekit";

// ✅ Import specific modules
import { ApiClient } from "bytekit/api-client";
import { DateUtils } from "bytekit/date-utils";
import { StringUtils } from "bytekit/string-utils";
```

### 2. Configure Global Defaults

```typescript
// config/defaults.ts
export const defaultApiConfig = {
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 100,
    },
    circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 60000,
    },
    timeoutMs: 10000,
};

// Create clients with defaults
const api = new ApiClient({
    baseUrl: "https://api.example.com",
    ...defaultApiConfig,
});
```

### 3. Use TypeScript Generics

```typescript
async function fetchEntity<T>(endpoint: string): Promise<T> {
    return api.get<T>(endpoint);
}

const user = await fetchEntity<User>("/users/1");
const post = await fetchEntity<Post>("/posts/1");
```

## 📚 Additional Resources

- **[API Reference](https://github.com/sebamar88/bytekit/wiki)** - Complete documentation
- **[Examples](https://github.com/sebamar88/bytekit/tree/main/examples)** - Working code samples
- **[Contributing](../CONTRIBUTING.md)** - Contribution guidelines

## 🎯 Checklist

Use this checklist for production-ready applications:

- [ ] TypeScript interfaces for all API responses
- [ ] Error boundaries with proper error handling
- [ ] Structured logging with appropriate levels
- [ ] Request caching for frequently accessed data
- [ ] Rate limiting for external API calls
- [ ] Retry policies with exponential backoff
- [ ] Request/response interceptors for auth
- [ ] Environment-based configuration
- [ ] Input validation for user data
- [ ] Performance monitoring with Profiler
- [ ] Unit and integration tests
- [ ] Proper token/secret management
- [ ] Graceful degradation strategies
- [ ] Request tracing for debugging
