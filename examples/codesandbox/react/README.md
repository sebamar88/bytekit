# Bytekit + React Example

This example demonstrates how to use [bytekit](https://www.npmjs.com/package/bytekit) with React.

## Features

-   ✅ Custom `useApiClient` hook for managing API client instances
-   ✅ Custom `useApiQuery` hook for data fetching with loading/error states
-   ✅ Automatic retry logic with exponential backoff
-   ✅ TypeScript support
-   ✅ Clean and reusable patterns

## Quick Start

```bash
npm install
npm start
```

## Usage

### Basic Setup

```jsx
import { createApiClient } from "bytekit";
import { useState } from "react";

function App() {
    const [client] = useState(() =>
        createApiClient({
            baseUrl: "https://api.example.com",
        })
    );

    // Use client for requests
}
```

### Custom Hooks

```jsx
// useApiClient.js
function useApiClient(config) {
    const [client] = useState(() => createApiClient(config));
    return client;
}

// useApiQuery.js
function useApiQuery(client, url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        client
            .get(url)
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [client, url]);

    return { data, loading, error };
}
```

## Integration with React Query

```jsx
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "bytekit";

const client = createApiClient({ baseUrl: "https://api.example.com" });

function useUser(id) {
    return useQuery({
        queryKey: ["user", id],
        queryFn: () => client.get(`/users/${id}`),
    });
}
```

## Learn More

-   [Bytekit Documentation](https://github.com/sebamar88/utils)
-   [npm Package](https://www.npmjs.com/package/bytekit)
-   [React Documentation](https://react.dev)

## License

MIT
