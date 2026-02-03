# bytekit Svelte Example

Interactive example demonstrating bytekit's ApiClient with Svelte.

## 🚀 Quick Start

Click the button below to open this example in CodeSandbox:

[![Open in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/sebamar88/bytekit/tree/main/docs/examples/codesandbox/svelte-basic)

## 📦 What's Included

This example demonstrates:

- ✅ **ApiClient** - Type-safe HTTP requests
- ✅ **Reactive State** - Svelte's reactivity system
- ✅ **Error Handling** - Proper error boundaries
- ✅ **Caching** - Request caching with TTL
- ✅ **TypeScript** - Full type safety
- ✅ **Vite** - Fast development server

## 🎯 Features Demonstrated

### 1. Reactive Variables

```typescript
let users: User[] = [];
let loading = true;

// Automatically triggers re-render
users = await api.get("/users");
```

### 2. Template Syntax

```svelte
{#if loading}
  <p>Loading...</p>
{:else}
  {#each users as user (user.id)}
    <div>{user.name}</div>
  {/each}
{/if}
```

### 3. Event Handlers

```svelte
<button on:click={loadUsers}>
  Refresh
</button>
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

- **[Svelte Documentation](https://svelte.dev/)**
- **[bytekit Documentation](https://github.com/sebamar88/bytekit)**
- **[Getting Started Guide](../../../guides/GETTING_STARTED.md)**

## 💡 Tips

- Svelte's reactivity is automatic - just assign values
- Component styles are scoped by default
- Vite provides instant HMR
- TypeScript support out of the box

## 🔗 Related Examples

- **[React](../react-basic)** - React hooks integration
- **[Vue](../vue-basic)** - Vue Composition API
