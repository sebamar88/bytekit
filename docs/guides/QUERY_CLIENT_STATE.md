# State Management with QueryClient

QueryClient provides a lightweight, framework-agnostic way to manage API data, caching, and loading states.

## Basic Implementation

```typescript
import { QueryClient, ApiClient } from 'bytekit';

const api = new ApiClient({ baseUrl: 'https://api.example.com' });
const queryClient = new QueryClient(api);

async function loadUser(id: string) {
  return await queryClient.query({
    queryKey: ['user', id],
    path: `/users/${id}`,
    staleTime: 60000 // Cache for 1 minute
  });
}
```

## Advanced Features

### 1. Global Lifecycle Callbacks
Track analytics or global error handling in one place.

```typescript
const queryClient = new QueryClient(api, {
  globalCallbacks: {
    onStart: (context) => console.log(`Fetching ${context.url}...`),
    onError: (error) => notifyToast(error.message)
  }
});
```

### 2. Manual Cache Invalidation
Trigger a refetch across the app when data changes.

```typescript
async function updateUser(id: string, data: any) {
  await queryClient.mutate({
    path: `/users/${id}`,
    method: 'PUT',
    body: data,
    invalidateQueries: [['user', id], ['users-list']]
  });
}
```

### 3. State Subscription
React to state changes in your UI.

```typescript
const unsubscribe = queryClient.on('state:change', ({ state, context }) => {
  if (state.isLoading) showSpinner();
  if (state.isSuccess) render(state.data);
});
```
