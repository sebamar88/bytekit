import { useState, useEffect } from "react";
import { createApiClient } from "bytekit";
import "./styles.css";

// Custom hook for API client
function useApiClient(config: Parameters<typeof createApiClient>[0]) {
    const [client] = useState(() => createApiClient(config));
    return client;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
}

// Custom hook for data fetching
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
        <div className="App">
            <h1>🚀 Bytekit + React + TypeScript</h1>
            <p className="subtitle">
                Framework-agnostic TypeScript utilities for modern development
            </p>

            <div className="card">
                <h2>API Client Example</h2>

                {loading && <p className="loading">Loading...</p>}
                {error && <p className="error">Error: {error}</p>}
                {data && (
                    <div className="result">
                        <h3>{data.name}</h3>
                        <p>
                            <strong>Email:</strong> {data.email}
                        </p>
                        <p>
                            <strong>Phone:</strong> {data.phone}
                        </p>
                        <p>
                            <strong>Website:</strong> {data.website}
                        </p>
                        <details>
                            <summary>View full response</summary>
                            <pre>{JSON.stringify(data, null, 2)}</pre>
                        </details>
                    </div>
                )}
            </div>

            <div className="features">
                <h3>Features</h3>
                <ul>
                    <li>✅ Custom React hooks with TypeScript</li>
                    <li>✅ Automatic retry logic with exponential backoff</li>
                    <li>✅ Full type safety out of the box</li>
                    <li>✅ Loading and error state management</li>
                    <li>✅ Works with React Query, SWR, and more</li>
                </ul>
            </div>

            <div className="links">
                <a
                    href="https://github.com/sebamar88/utils"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    📖 Documentation
                </a>
                <a
                    href="https://www.npmjs.com/package/bytekit"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    📦 npm Package
                </a>
            </div>
        </div>
    );
}
