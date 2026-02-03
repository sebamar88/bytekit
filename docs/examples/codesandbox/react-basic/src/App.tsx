import React, { useState, useEffect } from "react";
import { ApiClient, ApiError } from "@sebamar88/bytekit";

// Type definitions
interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
}

// Create API client instance
const api = new ApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
    timeoutMs: 10000,
    locale: "en",
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 100,
    },
});

function App() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch users with type safety
            const data = await api.get<User[]>("/users", {
                cache: true,
                cacheTTL: 60000, // Cache for 1 minute
            });

            setUsers(data);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`API Error: ${err.message} (${err.status})`);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadUsers();
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <h2>Loading users...</h2>
                    <p>Fetching data from JSONPlaceholder API</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1>🚀 bytekit React Example</h1>
                <p>Demonstrating ApiClient with React hooks</p>
            </div>

            {error && (
                <div className="error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="card">
                <div className="stats">
                    <div className="stat">
                        <div className="stat-label">Total Users</div>
                        <div className="stat-value">{users.length}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-label">Status</div>
                        <div className="stat-value">✓ Loaded</div>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                    <button onClick={handleRefresh} disabled={loading}>
                        Refresh Data
                    </button>
                </div>
            </div>

            <div className="user-list">
                {users.map((user) => (
                    <div key={user.id} className="user-card">
                        <h3>{user.name}</h3>
                        <p>
                            <strong>Email:</strong> {user.email}
                        </p>
                        <p>
                            <strong>Phone:</strong> {user.phone}
                        </p>
                        <p>
                            <strong>Website:</strong>{" "}
                            <a
                                href={`https://${user.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {user.website}
                            </a>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
