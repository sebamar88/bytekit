# Using Bytekit with React

Bytekit works seamlessly with React. Here are the recommended patterns and best practices.

## 🚀 Quick Start

**[Try it live on CodeSandbox →](https://codesandbox.io/p/devbox/bytekit-react-example-gr2k2j)**

## Installation

```bash
npm install bytekit
```

## Basic Setup

### Creating an API Client

```jsx
import { createApiClient } from "bytekit";
import { useState } from "react";

function App() {
    const [client] = useState(() =>
        createApiClient({
            baseUrl: "https://api.example.com",
            timeout: 5000,
            retry: { maxRetries: 3 },
        })
    );

    // Use client for requests
}
```

## Custom Hooks

### useApiClient Hook

Create a reusable hook for API client instances:

```jsx
// hooks/useApiClient.js
import { useState } from "react";
import { createApiClient } from "bytekit";

export function useApiClient(config) {
    const [client] = useState(() => createApiClient(config));
    return client;
}
```

Usage:

```jsx
function App() {
    const client = useApiClient({
        baseUrl: "https://api.example.com",
    });

    const handleFetch = async () => {
        const data = await client.get("/users");
        console.log(data);
    };

    return <button onClick={handleFetch}>Fetch Users</button>;
}
```

### useApiQuery Hook

Create a data fetching hook with loading and error states:

```jsx
// hooks/useApiQuery.js
import { useState, useEffect } from "react";

export function useApiQuery(client, url, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                setLoading(true);
                const response = await client.get(url, options);
                if (!cancelled) {
                    setData(response);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
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
    }, [client, url]);

    return { data, loading, error };
}
```

Usage:

```jsx
function UserProfile({ userId }) {
    const client = useApiClient({ baseUrl: "https://api.example.com" });
    const { data, loading, error } = useApiQuery(client, `/users/${userId}`);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return <div>{data.name}</div>;
}
```

## Integration with React Query

Bytekit works great with TanStack Query (React Query):

```jsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { createApiClient } from "bytekit";

const client = createApiClient({
    baseUrl: "https://api.example.com",
});

function Users() {
    // Fetch users
    const { data, isLoading, error } = useQuery({
        queryKey: ["users"],
        queryFn: () => client.get("/users"),
    });

    // Create user mutation
    const createUser = useMutation({
        mutationFn: (newUser) => client.post("/users", newUser),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            {data.map((user) => (
                <div key={user.id}>{user.name}</div>
            ))}
        </div>
    );
}
```

## Context Pattern

Share a single API client across your app:

```jsx
// contexts/ApiContext.jsx
import { createContext, useContext } from "react";
import { createApiClient } from "bytekit";

const ApiContext = createContext(null);

export function ApiProvider({ children, config }) {
    const client = createApiClient(config);

    return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi() {
    const client = useContext(ApiContext);
    if (!client) {
        throw new Error("useApi must be used within ApiProvider");
    }
    return client;
}
```

Usage:

```jsx
// App.jsx
function App() {
    return (
        <ApiProvider config={{ baseUrl: "https://api.example.com" }}>
            <UserList />
        </ApiProvider>
    );
}

// UserList.jsx
function UserList() {
    const client = useApi();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        client.get("/users").then(setUsers);
    }, [client]);

    return <div>{/* render users */}</div>;
}
```

## Error Handling

```jsx
function UserProfile({ userId }) {
    const client = useApiClient({ baseUrl: "https://api.example.com" });
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        client
            .get(`/users/${userId}`)
            .then(setUser)
            .catch((err) => {
                if (err.status === 404) {
                    setError("User not found");
                } else if (err.status === 401) {
                    setError("Unauthorized");
                } else {
                    setError("Something went wrong");
                }
            });
    }, [client, userId]);

    if (error) return <div className="error">{error}</div>;
    if (!user) return <div>Loading...</div>;

    return <div>{user.name}</div>;
}
```

## TypeScript Support

```tsx
import { createApiClient } from "bytekit";
import { useState, useEffect } from "react";

interface User {
    id: number;
    name: string;
    email: string;
}

function useApiClient(config: ApiClientConfig) {
    const [client] = useState(() => createApiClient(config));
    return client;
}

function UserList() {
    const client = useApiClient({ baseUrl: "https://api.example.com" });
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        client.get<User[]>("/users").then(setUsers);
    }, [client]);

    return (
        <div>
            {users.map((user) => (
                <div key={user.id}>{user.name}</div>
            ))}
        </div>
    );
}
```

## Working Example

Check out the [complete React example](../../examples/react-app) for a working implementation.

## Learn More

-   [Bytekit API Reference](../api-reference.md)
-   [React Query Integration](https://tanstack.com/query/latest)
-   [React Documentation](https://react.dev)
