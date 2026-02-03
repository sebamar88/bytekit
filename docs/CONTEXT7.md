# Context7 Enhanced Documentation

## Frequently Asked Questions

### Q: How do I convert a string to PascalCase using StringUtils?

```typescript
import { StringUtils } from "bytekit";

// PascalCase conversion
StringUtils.pascalCase("hello world"); // "HelloWorld"
StringUtils.pascalCase("hello-world"); // "HelloWorld"
StringUtils.pascalCase("hello_world"); // "HelloWorld"
StringUtils.pascalCase("helloWorld"); // "HelloWorld"
StringUtils.pascalCase("HELLO_WORLD"); // "HelloWorld"
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
