# 🌊 Streaming and Real-Time Events

bytekit provides a powerful `StreamingHelper` to handle large JSON datasets (JSON Lines/NDJSON) and real-time events (Server-Sent Events) with ease.

## 📦 JSON Lines (NDJSON) Streaming

When processing large datasets, loading everything into memory can cause performance issues or crashes. `streamJsonLines` allows you to process each JSON object as it arrives.

### Basic Usage

```typescript
import { StreamingHelper } from "bytekit";

interface LogEntry {
    id: string;
    level: "info" | "error";
    message: string;
    timestamp: string;
}

const result = await StreamingHelper.streamJsonLines<LogEntry>(
    "https://api.example.com/logs/stream",
    {
        timeout: 60000, // 1 minute timeout
        onChunk: (chunk) => {
            console.log("Chunk received:", chunk);
        },
        onComplete: () => {
            console.log("Stream processing complete");
        }
    }
);

// Final results are also available in the response
console.log(`Processed ${result.data.length} entries`);
```

### Advanced Configuration

You can pass custom headers and handle errors gracefully:

```typescript
const result = await StreamingHelper.streamJsonLines<User>(
    "/api/users/export",
    {
        headers: {
            "Authorization": "Bearer YOUR_TOKEN",
            "X-Stream-Mode": "compressed"
        },
        onError: (error) => {
            console.error("Failed to process stream:", error.message);
        }
    }
);
```

## 📡 Server-Sent Events (SSE)

Real-time updates are best handled with SSE. ByteKit provides two ways to handle them: the modern `api.stream()` for full feature support, and the legacy `streamSSE`.

### Modern Usage (`ApiClient.stream`)

This is the recommended way to handle SSE. It supports `Authorization` headers, `POST` requests with bodies, and custom interceptors.

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.example.com" });

// Supports POST, Body, and Authorization automatically
for await (const event of api.stream<PriceUpdate>("/prices", {
    method: "POST",
    body: { symbols: ["BTC", "ETH"] }
})) {
    console.log(`Event: ${event.event}`, event.data);
}
```

### Legacy Subscription (`streamSSE`)

> [!WARNING]
> `StreamingHelper.streamSSE` is deprecated. It uses the native `EventSource` API which is limited to `GET` requests and doesn't support custom headers or request bodies.

```typescript
import { StreamingHelper } from "bytekit";
// ... (rest of legacy example)
```

### Custom Event Types

By default, it listens for `message` events, but you can specify a custom event type:

```typescript
const stream = StreamingHelper.streamSSE(url, {
    eventType: "update-notification"
});
```

## 📥 Progress Tracking (Downloads)

You can also use the streaming utility to track download progress for large files:

```typescript
import { StreamingHelper } from "bytekit";

const blob = await StreamingHelper.downloadStream(
    "https://example.com/large-file.zip",
    {
        onProgress: (percent) => {
            console.log(`Download progress: ${percent}%`);
        },
        onComplete: () => console.log("Download finished!")
    }
);

// Save the blob or process it
const url = URL.createObjectURL(blob);
```

## 💡 Best Practices

1. **Memory Management**: When using `onChunk`, try to process or store data outside of the `result.data` array if you're dealing with millions of records.
2. **Timeouts**: Always set a reasonable `timeout` for long-running streams to prevent hung connections.
3. **Cleanup**: Always call `stream.close()` or the `unsubscribe` function when your component unmounts or you no longer need the real-time data.
4. **Error Handling**: Use the `onError` callback to implement reconnection logic for SSE if needed.
