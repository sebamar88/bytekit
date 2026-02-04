# Bytekit + Vue Example

Minimal Vue 3 app demonstrating bytekit usage patterns with Composition API.

## Features

-   ✅ Vue 3 Composition API
-   ✅ Custom `useApiClient` composable
-   ✅ Custom `useApiQuery` composable for data fetching
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

```vue
<script setup>
import { createApiClient } from "bytekit";

const client = createApiClient({
    baseUrl: "https://api.example.com",
});
</script>
```

### Custom Composable

```js
// composables/useApi.js
import { createApiClient } from "bytekit";

export function useApiClient(config) {
    return createApiClient(config);
}
```

### Data Fetching Composable

```js
import { ref, onMounted } from "vue";

export function useApiQuery(client, url) {
    const data = ref(null);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
        try {
            data.value = await client.get(url);
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    });

    return { data, loading, error };
}
```

## Integration with VueQuery

```vue
<script setup>
import { useQuery } from "@tanstack/vue-query";
import { createApiClient } from "bytekit";

const client = createApiClient({ baseUrl: "https://api.example.com" });

const { data, isLoading, error } = useQuery({
    queryKey: ["user", 1],
    queryFn: () => client.get("/users/1"),
});
</script>
```

## Learn More

-   [Bytekit Documentation](https://github.com/yourusername/bytekit)
-   [Vue 3 Documentation](https://vuejs.org)
