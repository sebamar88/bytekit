# bytekit React Example

Interactive example demonstrating bytekit's ApiClient with React.

## 🚀 Quick Start

Click the button below to open this example in CodeSandbox:

[![Open in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/sebamar88/bytekit/tree/main/docs/examples/codesandbox/react-basic)

## 📦 What's Included

This example demonstrates:

- ✅ **ApiClient** - Type-safe HTTP requests
- ✅ **Error Handling** - Proper error boundaries
- ✅ **Caching** - Request caching with TTL
- ✅ **Retry Policy** - Automatic retries on failure
- ✅ **TypeScript** - Full type safety
- ✅ **React Hooks** - useState, useEffect integration

## 🎯 Features Demonstrated

### 1. ApiClient Setup

```typescript
const api = new ApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
    timeoutMs: 10000,
    locale: "en",
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 100,
    },
});
```

### 2. Type-Safe Requests

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

const users = await api.get<User[]>("/users");
```

### 3. Request Caching

```typescript
const data = await api.get("/users", {
    cache: true,
    cacheTTL: 60000, // 1 minute
});
```

### 4. Error Handling

```typescript
try {
    const data = await api.get("/users");
} catch (err) {
    if (err instanceof ApiError) {
        console.log(err.message, err.status);
    }
}
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build
```

## 📚 Learn More

- **[bytekit Documentation](https://github.com/sebamar88/bytekit)**
- **[Getting Started Guide](../../../guides/GETTING_STARTED.md)**
- **[API Reference](https://github.com/sebamar88/bytekit/wiki)**

## 💡 Tips

- Click "Refresh Data" to see caching in action
- Open DevTools to see network requests
- Modify the code to experiment with different features
- Try adding POST/PUT/DELETE operations

## 🔗 Related Examples

- **[Form Management](../react-forms)** - FormUtils with validation
- **[WebSocket](../react-websocket)** - Real-time updates
- **[Advanced Patterns](../react-advanced)** - Complex use cases
