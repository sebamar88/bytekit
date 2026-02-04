import { useState, useEffect } from "react";
import { createApiClient } from "bytekit";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
}

// Custom hook pattern
function useApiClient(config: Parameters<typeof createApiClient>[0]) {
    const [client] = useState(() => createApiClient(config));
    return client;
}

function useApiQuery<T>(
    client: ReturnType<typeof createApiClient>,
    url: string
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                setLoading(true);
                const response = await client.get(url);
                if (!cancelled) {
                    setData(response as T);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Unknown error"
                    );
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

export default function App() {
    const client = useApiClient({
        baseUrl: "https://jsonplaceholder.typicode.com",
        timeoutMs: 5000,
        retryPolicy: { maxRetries: 3 },
    });

    const { data, loading, error } = useApiQuery<User>(client, "/users/1");

    return (
        <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
            <h1>🚀 Bytekit + React</h1>

            <div style={{ marginTop: "2rem" }}>
                <h2>API Client Example</h2>

                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>Error: {error}</p>}
                {data && (
                    <pre
                        style={{
                            background: "#f5f5f5",
                            padding: "1rem",
                            borderRadius: "8px",
                            overflow: "auto",
                        }}
                    >
                        {JSON.stringify(data, null, 2)}
                    </pre>
                )}
            </div>

            <div
                style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#666" }}
            >
                <p>✅ ApiClient with retry logic</p>
                <p>✅ Custom React hooks pattern</p>
                <p>✅ TypeScript ready</p>
            </div>
        </div>
    );
}
