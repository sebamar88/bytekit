# Using Bytekit with Vue 3

Bytekit integrates seamlessly with Vue 3's Composition API. Here are the recommended patterns.

## 🚀 Quick Start

**[Try it live on CodeSandbox →](https://codesandbox.io/p/devbox/df26fs)**

## Installation

```bash
npm install bytekit
```

## Basic Setup

### Creating an API Client

```vue
<script setup>
import { createApiClient } from "bytekit";

const client = createApiClient({
    baseUrl: "https://api.example.com",
    timeout: 5000,
    retry: { maxRetries: 3 },
});

// Use client for requests
</script>
```

## Composables

### useApiClient Composable

Create a reusable composable for API client instances:

```js
// composables/useApi.js
import { createApiClient } from "bytekit";

export function useApiClient(config) {
    const client = createApiClient(config);
    return client;
}
```

Usage:

```vue
<script setup>
import { useApiClient } from "@/composables/useApi";

const client = useApiClient({
    baseUrl: "https://api.example.com",
});

async function fetchUsers() {
    const users = await client.get("/users");
    console.log(users);
}
</script>
```

### useApiQuery Composable

Create a data fetching composable with reactive state:

```js
// composables/useApi.js
import { ref, onMounted, onUnmounted } from "vue";

export function useApiQuery(client, url, options = {}) {
    const data = ref(null);
    const loading = ref(true);
    const error = ref(null);
    let cancelled = false;

    async function fetchData() {
        try {
            loading.value = true;
            const response = await client.get(url, options);
            if (!cancelled) {
                data.value = response;
                error.value = null;
            }
        } catch (err) {
            if (!cancelled) {
                error.value = err.message;
            }
        } finally {
            if (!cancelled) {
                loading.value = false;
            }
        }
    }

    onMounted(() => {
        fetchData();
    });

    onUnmounted(() => {
        cancelled = true;
    });

    return { data, loading, error, refetch: fetchData };
}
```

Usage:

```vue
<template>
    <div>
        <div v-if="loading">Loading...</div>
        <div v-else-if="error">Error: {{ error }}</div>
        <div v-else>{{ data.name }}</div>
    </div>
</template>

<script setup>
import { useApiClient, useApiQuery } from "@/composables/useApi";

const props = defineProps(["userId"]);

const client = useApiClient({ baseUrl: "https://api.example.com" });
const { data, loading, error } = useApiQuery(client, `/users/${props.userId}`);
</script>
```

## Integration with VueQuery

Bytekit works great with TanStack Query (VueQuery):

```vue
<template>
    <div>
        <div v-if="isLoading">Loading...</div>
        <div v-else-if="error">Error: {{ error.message }}</div>
        <div v-else>
            <div v-for="user in data" :key="user.id">
                {{ user.name }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { useQuery, useMutation } from "@tanstack/vue-query";
import { createApiClient } from "bytekit";

const client = createApiClient({
    baseUrl: "https://api.example.com",
});

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
</script>
```

## Provide/Inject Pattern

Share a single API client across your app:

```js
// main.js
import { createApp } from "vue";
import { createApiClient } from "bytekit";
import App from "./App.vue";

const app = createApp(App);

const apiClient = createApiClient({
    baseUrl: "https://api.example.com",
});

app.provide("apiClient", apiClient);
app.mount("#app");
```

Usage in components:

```vue
<script setup>
import { inject } from "vue";

const client = inject("apiClient");

async function fetchUsers() {
    const users = await client.get("/users");
    console.log(users);
}
</script>
```

Or create a composable:

```js
// composables/useApi.js
import { inject } from "vue";

export function useApi() {
    const client = inject("apiClient");
    if (!client) {
        throw new Error("API client not provided");
    }
    return client;
}
```

## Error Handling

```vue
<template>
    <div>
        <div v-if="error" class="error">{{ errorMessage }}</div>
        <div v-else-if="user">{{ user.name }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useApiClient } from "@/composables/useApi";

const props = defineProps(["userId"]);

const client = useApiClient({ baseUrl: "https://api.example.com" });
const user = ref(null);
const error = ref(null);
const errorMessage = ref("");

onMounted(async () => {
    try {
        user.value = await client.get(`/users/${props.userId}`);
    } catch (err) {
        error.value = err;
        if (err.status === 404) {
            errorMessage.value = "User not found";
        } else if (err.status === 401) {
            errorMessage.value = "Unauthorized";
        } else {
            errorMessage.value = "Something went wrong";
        }
    }
});
</script>
```

## TypeScript Support

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { createApiClient } from "bytekit";

interface User {
    id: number;
    name: string;
    email: string;
}

const client = createApiClient({
    baseUrl: "https://api.example.com",
});

const users = ref<User[]>([]);

onMounted(async () => {
    users.value = await client.get<User[]>("/users");
});
</script>

<template>
    <div v-for="user in users" :key="user.id">
        {{ user.name }}
    </div>
</template>
```

## Pinia Integration

Use with Pinia stores:

```js
// stores/users.js
import { defineStore } from "pinia";
import { createApiClient } from "bytekit";

const client = createApiClient({
    baseUrl: "https://api.example.com",
});

export const useUsersStore = defineStore("users", {
    state: () => ({
        users: [],
        loading: false,
        error: null,
    }),

    actions: {
        async fetchUsers() {
            this.loading = true;
            try {
                this.users = await client.get("/users");
                this.error = null;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },

        async createUser(userData) {
            return await client.post("/users", userData);
        },
    },
});
```

## Working Example

Check out the [complete Vue example](../../examples/vue-app) for a working implementation.

## Learn More

-   [Bytekit API Reference](../api-reference.md)
-   [VueQuery Integration](https://tanstack.com/query/latest/docs/vue/overview)
-   [Vue 3 Documentation](https://vuejs.org)
