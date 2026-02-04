# Using Bytekit with Svelte

Bytekit works beautifully with Svelte's reactive stores. Here are the recommended patterns.

## 🚀 Quick Start

**[Try it live on CodeSandbox →](https://codesandbox.io/p/devbox/lxvghg)**

## Installation

```bash
npm install bytekit
```

## Basic Setup

### Creating an API Client

```svelte
<script>
  import { createApiClient } from 'bytekit';

  const client = createApiClient({
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retry: { maxRetries: 3 }
  });

  // Use client for requests
</script>
```

## Reactive Stores

### API Client Store

Create a reusable store for your API client:

```js
// stores/api.js
import { createApiClient } from "bytekit";

export const apiClient = createApiClient({
    baseUrl: "https://api.example.com",
});
```

Usage:

```svelte
<script>
  import { apiClient } from './stores/api';

  async function fetchUsers() {
    const users = await apiClient.get('/users');
    console.log(users);
  }
</script>
```

### Query Store

Create a reactive store for data fetching:

```js
// stores/api.js
import { writable } from "svelte/store";
import { createApiClient } from "bytekit";

export function createApiStore(config) {
    return createApiClient(config);
}

export function createQueryStore(client, url, options = {}) {
    const { subscribe, set, update } = writable({
        data: null,
        loading: true,
        error: null,
    });

    async function fetch() {
        update((state) => ({ ...state, loading: true }));

        try {
            const data = await client.get(url, options);
            set({ data, loading: false, error: null });
        } catch (err) {
            set({ data: null, loading: false, error: err.message });
        }
    }

    fetch();

    return {
        subscribe,
        refetch: fetch,
    };
}
```

Usage:

```svelte
<script>
  import { createApiStore, createQueryStore } from './stores/api';

  const client = createApiStore({ baseUrl: 'https://api.example.com' });
  const users = createQueryStore(client, '/users');
</script>

{#if $users.loading}
  <p>Loading...</p>
{:else if $users.error}
  <p>Error: {$users.error}</p>
{:else}
  {#each $users.data as user}
    <div>{user.name}</div>
  {/each}
{/if}
```

## Advanced Store Pattern

Create a more feature-rich store:

```js
// stores/users.js
import { writable, derived } from "svelte/store";
import { createApiClient } from "bytekit";

const client = createApiClient({
    baseUrl: "https://api.example.com",
});

function createUsersStore() {
    const { subscribe, set, update } = writable({
        items: [],
        loading: false,
        error: null,
    });

    return {
        subscribe,

        async fetch() {
            update((state) => ({ ...state, loading: true }));
            try {
                const items = await client.get("/users");
                set({ items, loading: false, error: null });
            } catch (err) {
                update((state) => ({
                    ...state,
                    loading: false,
                    error: err.message,
                }));
            }
        },

        async create(userData) {
            const newUser = await client.post("/users", userData);
            update((state) => ({
                ...state,
                items: [...state.items, newUser],
            }));
            return newUser;
        },

        async update(id, userData) {
            const updated = await client.put(`/users/${id}`, userData);
            update((state) => ({
                ...state,
                items: state.items.map((u) => (u.id === id ? updated : u)),
            }));
            return updated;
        },

        async delete(id) {
            await client.delete(`/users/${id}`);
            update((state) => ({
                ...state,
                items: state.items.filter((u) => u.id !== id),
            }));
        },
    };
}

export const users = createUsersStore();
```

Usage:

```svelte
<script>
  import { onMount } from 'svelte';
  import { users } from './stores/users';

  onMount(() => {
    users.fetch();
  });

  async function handleCreate() {
    await users.create({ name: 'John Doe', email: 'john@example.com' });
  }
</script>

{#if $users.loading}
  <p>Loading...</p>
{:else if $users.error}
  <p>Error: {$users.error}</p>
{:else}
  {#each $users.items as user}
    <div>{user.name}</div>
  {/each}
{/if}

<button on:click={handleCreate}>Add User</button>
```

## Derived Stores

Create computed values from API data:

```js
import { derived } from "svelte/store";
import { users } from "./stores/users";

export const activeUsers = derived(users, ($users) =>
    $users.items.filter((u) => u.active)
);

export const userCount = derived(users, ($users) => $users.items.length);
```

## Error Handling

```svelte
<script>
  import { onMount } from 'svelte';
  import { createApiClient } from 'bytekit';

  const client = createApiClient({ baseUrl: 'https://api.example.com' });

  let user = null;
  let errorMessage = '';

  onMount(async () => {
    try {
      user = await client.get('/users/1');
    } catch (err) {
      if (err.status === 404) {
        errorMessage = 'User not found';
      } else if (err.status === 401) {
        errorMessage = 'Unauthorized';
      } else {
        errorMessage = 'Something went wrong';
      }
    }
  });
</script>

{#if errorMessage}
  <div class="error">{errorMessage}</div>
{:else if user}
  <div>{user.name}</div>
{/if}
```

## TypeScript Support

```svelte
<script lang="ts">
  import { writable } from 'svelte/store';
  import { createApiClient } from 'bytekit';
  import type { Writable } from 'svelte/store';

  interface User {
    id: number;
    name: string;
    email: string;
  }

  const client = createApiClient({
    baseUrl: 'https://api.example.com'
  });

  const users: Writable<User[]> = writable([]);

  async function fetchUsers() {
    const data = await client.get<User[]>('/users');
    users.set(data);
  }
</script>
```

## Context Pattern

Share API client across components:

```svelte
<!-- App.svelte -->
<script>
  import { setContext } from 'svelte';
  import { createApiClient } from 'bytekit';
  import UserList from './UserList.svelte';

  const client = createApiClient({
    baseUrl: 'https://api.example.com'
  });

  setContext('apiClient', client);
</script>

<UserList />
```

```svelte
<!-- UserList.svelte -->
<script>
  import { getContext, onMount } from 'svelte';

  const client = getContext('apiClient');
  let users = [];

  onMount(async () => {
    users = await client.get('/users');
  });
</script>

{#each users as user}
  <div>{user.name}</div>
{/each}
```

## Working Example

Check out the [complete Svelte example](../../examples/svelte-app) for a working implementation.

## Learn More

-   [Bytekit API Reference](../api-reference.md)
-   [Svelte Stores Documentation](https://svelte.dev/docs/svelte-store)
-   [Svelte Documentation](https://svelte.dev)
