# Bytekit Framework Examples

Real-world examples demonstrating how to use bytekit with popular frameworks.

## Available Examples

### [React](./react-app)

-   Custom hooks (`useApiClient`, `useApiQuery`)
-   Integration with React Query
-   TypeScript patterns

### [Vue 3](./vue-app)

-   Composition API composables
-   Integration with VueQuery
-   Reactive data fetching

### [Svelte](./svelte-app)

-   Reactive stores
-   Simple API patterns
-   Clean integration

## Quick Start

Each example is a standalone Vite app:

```bash
cd react-app    # or vue-app, svelte-app
npm install
npm run dev
```

## Common Patterns

### Creating an API Client

All frameworks use the same core API:

```js
import { createApiClient } from "bytekit";

const client = createApiClient({
    baseUrl: "https://api.example.com",
    timeout: 5000,
    retry: { maxRetries: 3 },
});
```

### Making Requests

```js
// GET request
const user = await client.get("/users/1");

// POST request
const newUser = await client.post("/users", {
    name: "John Doe",
    email: "john@example.com",
});

// With custom headers
const data = await client.get("/protected", {
    headers: { Authorization: "Bearer token" },
});
```

### Error Handling

```js
try {
    const data = await client.get("/users/1");
} catch (error) {
    if (error.status === 404) {
        console.log("User not found");
    } else {
        console.error("Request failed:", error.message);
    }
}
```

## Framework-Specific Patterns

### React Hooks

```jsx
function useApiClient(config) {
    return useState(() => createApiClient(config))[0];
}
```

### Vue Composables

```js
export function useApiClient(config) {
    return createApiClient(config);
}
```

### Svelte Stores

```js
export function createApiStore(config) {
    return createApiClient(config);
}
```

## Learn More

-   [Bytekit Documentation](https://github.com/yourusername/bytekit)
-   [API Reference](https://github.com/yourusername/bytekit#api-reference)
-   [Migration Guides](https://github.com/yourusername/bytekit#migration)
