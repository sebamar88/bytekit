<script lang="ts">
  import { onMount } from 'svelte';
  import { createApiClient } from 'bytekit';

  interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
  }

  const client = createApiClient({
    baseUrl: 'https://jsonplaceholder.typicode.com',
    timeoutMs: 5000,
    retryPolicy: { maxRetries: 3 }
  });

  let data: User | null = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      data = await client.get('/users/1') as User;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  });
</script>

<div class="container">
  <h1>🚀 Bytekit + Svelte</h1>
  
  <div class="example">
    <h2>API Client Example</h2>
    
    {#if loading}
      <p>Loading...</p>
    {:else if error}
      <p class="error">Error: {error}</p>
    {:else if data}
      <pre class="result">{JSON.stringify(data, null, 2)}</pre>
    {/if}
  </div>

  <div class="features">
    <p>✅ Svelte reactive stores</p>
    <p>✅ Simple and clean API</p>
    <p>✅ TypeScript ready</p>
  </div>
</div>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui;
  }

  .example {
    margin-top: 2rem;
  }

  .error {
    color: red;
  }

  .result {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
    overflow: auto;
  }

  .features {
    margin-top: 2rem;
    font-size: 0.9rem;
    color: #666;
  }
</style>
