# ⚡ Real-Time Communication

bytekit provides a suite of tools for building responsive, real-time applications, including WebSockets, Event Emitters, and Server-Sent Events.

## 🔌 WebSocketHelper

The `WebSocketHelper` simplifies working with WebSockets by providing automatic reconnection, heartbeats, and message type handling.

### Basic Usage

```typescript
import { WebSocketHelper } from "bytekit";

const ws = new WebSocketHelper("wss://api.example.com/events", {
    reconnect: true,
    maxReconnectAttempts: 10
});

// Connect to the server
await ws.connect();

// Subscribe to specific message types
const unsubscribe = ws.on("trade", (data) => {
    console.log("New trade received:", data);
});

// Send a message
ws.send("subscribe", { symbols: ["BTC", "ETH"] });

// Cleanup
// unsubscribe();
// ws.close();
```

### Request-Response Pattern
Handle WebSockets like traditional APIs using the `request` helper:

```typescript
const response = await ws.request("get_history", { limit: 10 });
console.log("Historical data:", response);
```

### Exponential Backoff with Reconnect Events

Observe the reconnect lifecycle without string-matching on error messages:

```typescript
const ws = new WebSocketHelper("wss://api.example.com/events", {
    reconnect: true,
    maxReconnectAttempts: 8,
    reconnectDelayMs: 1000,
    backoffStrategy: "exponential",   // 1s, 2s, 4s, 8s, 16s…
    maxReconnectDelayMs: 30_000,      // capped at 30s
    jitter: true,                     // AWS Full Jitter — distributes reconnects
});

ws.onReconnect((attempt, delay) => {
    console.log(`Reconnecting in ${delay}ms (attempt ${attempt})`);
});

ws.onMaxRetriesReached(() => {
    console.error("All reconnect attempts exhausted.");
});

await ws.connect();
```

### Schema Validation

Validate incoming messages with any `SchemaAdapter`-compatible library (Zod, Valibot, etc.). Invalid messages fire `onValidationError` and are **dropped** — the WebSocket session stays alive:

```typescript
import { zodAdapter } from "bytekit";
import { z } from "zod";

const TradeSchema = z.object({
    symbol: z.string(),
    price: z.number().positive(),
});

const ws = new WebSocketHelper("wss://exchange.example.com/ws", {
    schemas: {
        trade: zodAdapter(TradeSchema),
    },
});

ws.onValidationError((error, rawMessage) => {
    console.warn(`Invalid "${rawMessage.type}" message:`, error.message);
});

ws.on<z.infer<typeof TradeSchema>>("trade", (data) => {
    // Guaranteed valid — TradeSchema already checked
    console.log(`${data.symbol} @ ${data.price}`);
});

await ws.connect();
```

### Pong Detection

Detect silent connection drops automatically. After each `ping`, if no message arrives within `heartbeatTimeoutMs`, the connection is closed and reconnect fires:

```typescript
const ws = new WebSocketHelper("wss://api.example.com/stream", {
    heartbeatIntervalMs: 15_000, // ping every 15s
    heartbeatTimeoutMs: 5_000,   // reconnect if no response within 5s
    reconnect: true,
    backoffStrategy: "exponential",
});

ws.onReconnect((attempt, delay) => {
    console.log(`Heartbeat timeout — reconnecting (attempt ${attempt})`);
});

await ws.connect();
// Server should respond with any message (e.g. { type: "pong" })
// within heartbeatTimeoutMs of each ping.
```

---

## 📢 EventEmitter

A lightweight, framework-agnostic implementation of the Pub/Sub pattern for internal application communication.

### Basic Usage

```typescript
import { createEventEmitter } from "bytekit";

// Define typed events
interface AppEvents {
    "auth:login": { user: string; timestamp: number };
    "ui:theme": "light" | "dark";
}

const events = createEventEmitter<AppEvents>();

// Listen for events
events.on("auth:login", ({ user }) => {
    console.log(`Welcome back, ${user}!`);
});

// Emit events
events.emit("auth:login", { user: "sebamar88", timestamp: Date.now() });
```

### Advanced Features
- **Once**: Listen for an event only once.
- **Async Emit**: `events.emit()` returns a promise that resolves when all async listeners complete.
- **Error Handling**: Capture errors in listeners using `events.onError()`.

---

## 🌊 Server-Sent Events (SSE)

For one-way streaming from server to client, use `StreamingHelper.streamSSE`.

```typescript
import { StreamingHelper } from "bytekit";

const stream = StreamingHelper.streamSSE("https://api.example.com/notifications");

stream.subscribe((data) => {
    console.log("Notification:", data.message);
});
```

---

## 💡 Choosing the Right Tool

| Feature | `WebSocketHelper` | `streamSSE` | `EventEmitter` |
| :--- | :--- | :--- | :--- |
| **Direction** | Bidirectional (Full-Duplex) | Unidirectional (Server -> Client) | Internal (Client-only) |
| **Protocol** | `ws://` or `wss://` | `http://` (Text-stream) | In-memory |
| **Best For** | Chats, Trading, Games | Notifications, Live Tickers | Cross-component communication |
| **Complexity** | High (Stateful) | Low | Very Low |
