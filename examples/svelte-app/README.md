# Bytekit + Svelte Example

Minimal Svelte app demonstrating bytekit usage patterns.

## Features

-   ✅ Svelte reactive stores
-   ✅ Custom API stores
-   ✅ Simple and clean patterns
-   ✅ TypeScript ready

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Usage Patterns

### Basic Setup

```svelte
<script>
  import { createApiClient } from 'bytekit';

  const client = createApiClient({
    baseUrl: 'https://api.example.com'
  });
</script>
```

### With Reactive Stores

```js
// stores/api.js
import { writable } from "svelte/store";
import { createApiClient } from "bytekit";

export function createApiStore(config) {
    return createApiClient(config);
}

export function createQueryStore(client, url) {
    const { subscribe, set } = writable({
        data: null,
        loading: true,
        error: null,
    });

    client
        .get(url)
        .then((data) => set({ data, loading: false, error: null }))
        .catch((err) =>
            set({ data: null, loading: false, error: err.message })
        );

    return { subscribe };
}
```

### Usage in Component

```svelte
<script>
  import { createApiStore, createQueryStore } from './stores/api';

  const client = createApiStore({ baseUrl: 'https://api.example.com' });
  const user = createQueryStore(client, '/users/1');
</script>

{#if $user.loading}
  <p>Loading...</p>
{:else if $user.error}
  <p>Error: {$user.error}</p>
{:else}
  <pre>{JSON.stringify($user.data, null, 2)}</pre>
{/if}
```

## Learn More

-   [Bytekit Documentation](https://github.com/yourusername/bytekit)
-   [Svelte Documentation](https://svelte.dev)
