# Bytekit + React Example

Minimal React app demonstrating bytekit usage patterns.

## Features

-   ✅ Custom `useApiClient` hook
-   ✅ Custom `useApiQuery` hook for data fetching
-   ✅ Retry logic and error handling
-   ✅ TypeScript ready

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Usage Patterns

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

### Custom Hook

```jsx
function useApiClient(config) {
    return useState(() => createApiClient(config))[0];
}
```

### Data Fetching Hook

```jsx
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

-   [Bytekit Documentation](https://github.com/yourusername/bytekit)
-   [React Documentation](https://react.dev)
