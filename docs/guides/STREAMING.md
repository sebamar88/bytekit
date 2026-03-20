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

Real-time updates are best handled with SSE. `StreamingHelper.streamSSE` provides a simple subscription model.

### Basic Subscription

```typescript
import { StreamingHelper } from "bytekit";

interface PriceUpdate {
    symbol: string;
    price: number;
}

const stream = StreamingHelper.streamSSE<PriceUpdate>(
    "https://api.example.com/prices",
    {
        onError: (error) => console.error("SSE error:", error),
        onComplete: () => console.log("SSE connection closed"),
    }
);

// Subscribe to events
const unsubscribe = stream.subscribe((data) => {
    console.log(`${data.symbol}: $${data.price}`);
});

// When you're done, close the connection
// unsubscribe(); // Stop receiving updates but keep connection
// stream.close(); // Close the connection entirely
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
