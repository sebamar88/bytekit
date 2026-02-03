<script lang="ts">
  import { onMount } from 'svelte';
  import { ApiClient, ApiError } from '@sebamar88/bytekit';

  // Type definitions
  interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
  }

  // Create API client
  const api = new ApiClient({
    baseUrl: 'https://jsonplaceholder.typicode.com',
    timeoutMs: 10000,
    locale: 'en',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 100,
    },
  });

  // Reactive state
  let users: User[] = [];
  let loading = true;
  let error: string | null = null;

  // Load users function
  async function loadUsers() {
    loading = true;
    error = null;

    try {
      const data = await api.get<User[]>('/users', {
        cache: true,
        cacheTTL: 60000, // Cache for 1 minute
      });

      users = data;
    } catch (err) {
      if (err instanceof ApiError) {
        error = `API Error: ${err.message} (${err.status})`;
      } else {
        error = 'An unexpected error occurred';
      }
    } finally {
      loading = false;
    }
  }

  // Load on mount
  onMount(() => {
    loadUsers();
  });
</script>

<main>
  <div class="header">
    <h1>🚀 bytekit Svelte Example</h1>
    <p>Demonstrating ApiClient with Svelte stores</p>
  </div>

  {#if error}
    <div class="error">
      <strong>Error:</strong> {error}
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <h2>Loading users...</h2>
      <p>Fetching data from JSONPlaceholder API</p>
    </div>
  {:else}
    <div class="card">
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">{users.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Status</div>
          <div class="stat-value">✓</div>
        </div>
      </div>

      <div style="text-align: center">
        <button on:click={loadUsers} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
    </div>

    <div class="user-grid">
      {#each users as user (user.id)}
        <div class="user-card">
          <h3>{user.name}</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p>
            <strong>Website:</strong>
            <a href="https://{user.website}" target="_blank" rel="noopener">
              {user.website}
            </a>
          </p>
        </div>
      {/each}
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f5f5;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    font-size: 2.5rem;
    color: #ff3e00;
    margin: 0;
  }

  .header p {
    color: #666;
    margin-top: 0.5rem;
  }

  .card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .stats {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .stat {
    background: #fff5f0;
    padding: 1rem 2rem;
    border-radius: 4px;
    text-align: center;
    border: 2px solid #ff3e00;
  }

  .stat-label {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    color: #ff3e00;
    font-size: 2rem;
    font-weight: bold;
  }

  button {
    background-color: #ff3e00;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #d63200;
  }

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .user-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .user-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .user-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .user-card h3 {
    margin-top: 0;
    color: #ff3e00;
  }

  .user-card p {
    margin: 0.5rem 0;
    color: #666;
  }

  .user-card a {
    color: #ff3e00;
    text-decoration: none;
  }

  .user-card a:hover {
    text-decoration: underline;
  }

  .loading {
    text-align: center;
    padding: 3rem;
  }

  .loading h2 {
    color: #ff3e00;
  }

  .error {
    background-color: #fee;
    color: #c33;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ff3e00;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 1rem auto;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
