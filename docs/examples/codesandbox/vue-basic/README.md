# bytekit Vue Example

Interactive example demonstrating bytekit's ApiClient with Vue 3 Composition API.

## 🚀 Quick Start

Click the button below to open this example in CodeSandbox:

[![Open in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/sebamar88/bytekit/tree/main/docs/examples/codesandbox/vue-basic)

## 📦 What's Included

This example demonstrates:

- ✅ **ApiClient** - Type-safe HTTP requests
- ✅ **Composition API** - Vue 3 reactive patterns
- ✅ **Error Handling** - Proper error boundaries
- ✅ **Caching** - Request caching with TTL
- ✅ **TypeScript** - Full type safety
- ✅ **Vite** - Fast development server

## 🎯 Features Demonstrated

### 1. Composition API Integration

```typescript
const users = ref<User[]>([]);
const loading = ref(true);

onMounted(async () => {
    const data = await api.get<User[]>("/users");
    users.value = data;
});
```

### 2. Reactive State

```vue
<template>
    <div v-if="loading">Loading...</div>
    <div v-for="user in users" :key="user.id">
        {{ user.name }}
    </div>
</template>
```

### 3. Error Handling

```typescript
try {
    users.value = await api.get("/users");
} catch (err) {
    if (err instanceof ApiError) {
        error.value = err.message;
    }
}
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📚 Learn More

- **[Vue 3 Documentation](https://vuejs.org/)**
- **[bytekit Documentation](https://github.com/sebamar88/bytekit)**
- **[Getting Started Guide](../../../guides/GETTING_STARTED.md)**

## 💡 Tips

- Uses Vue 3 Composition API with `<script setup>`
- Fully typed with TypeScript
- Vite for fast hot module replacement
- Request caching enabled

## 🔗 Related Examples

- **[Svelte](../svelte-basic)** - Svelte stores integration
- **[React](../react-basic)** - React hooks integration
