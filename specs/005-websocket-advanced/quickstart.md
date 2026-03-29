# Quickstart: 005-websocket-advanced

**Feature**: WebSocket con Reconexión Inteligente y Schema Validation  
**Branch**: `005-websocket-advanced`

---

## US1 — Auto-reconnect with Exponential Backoff

```typescript
import { WebSocketHelper } from "@bytekit/utils/helpers";

const ws = new WebSocketHelper("wss://api.example.com/stream", {
  reconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelayMs: 1000,      // base delay: 1 s
  backoffStrategy: "exponential",
  maxReconnectDelayMs: 30000,  // cap at 30 s
  jitter: true,                // spread reconnects (AWS Full Jitter)
});

// Subscribe before connecting
const unsubReconnect = ws.onReconnect((attempt, delay) => {
  console.log(`Reconnecting... attempt ${attempt}, waiting ${delay}ms`);
});

const unsubMaxRetries = ws.onMaxRetriesReached(() => {
  console.error("All reconnect attempts exhausted. Giving up.");
});

await ws.connect();

// Clean up subscriptions when done
ws.close();
unsubReconnect();
unsubMaxRetries();
```

**Delay schedule** (`reconnectDelayMs=1000`, `maxReconnectDelayMs=30000`, `jitter=false`):

| Attempt | Delay |
|---------|-------|
| 1       | 1 s   |
| 2       | 2 s   |
| 3       | 4 s   |
| 4       | 8 s   |
| 5       | 16 s  |
| 6+      | 30 s (capped) |

---

## US1 — Custom Backoff Function

```typescript
import { WebSocketHelper } from "@bytekit/utils/helpers";

const ws = new WebSocketHelper("wss://api.example.com/stream", {
  backoffStrategy: (attempt) => {
    // Fibonacci-style: 1s, 1s, 2s, 3s, 5s, 8s, ...
    const fib = [1000, 1000, 2000, 3000, 5000, 8000, 13000];
    return fib[Math.min(attempt - 1, fib.length - 1)];
  },
  maxReconnectAttempts: 7,
});

await ws.connect();
```

---

## US2 — Schema Validation (with Zod)

```typescript
import { WebSocketHelper } from "@bytekit/utils/helpers";
import { zodAdapter } from "@bytekit/utils/core"; // SchemaAdapter wrapper
import { z } from "zod";

const TradeSchema = z.object({
  symbol: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

const ws = new WebSocketHelper("wss://exchange.example.com/ws", {
  schemas: {
    trade: zodAdapter(TradeSchema),
    // Messages without a matching key pass through unvalidated
  },
});

// Schema validation errors come here; the message is dropped (NOT dispatched to on())
const unsubValidation = ws.onValidationError((error, rawMessage) => {
  console.error(`Validation failed for type "${rawMessage.type}":`, error.message);
  console.debug("Raw data:", rawMessage.data);
});

// Handlers only receive fully-validated data
ws.on<z.infer<typeof TradeSchema>>("trade", (trade) => {
  console.log(`${trade.symbol} @ ${trade.price} × ${trade.quantity}`);
});

await ws.connect();
```

---

## US2 — Schema Validation (with Valibot)

```typescript
import { WebSocketHelper } from "@bytekit/utils/helpers";
import { valibotAdapter } from "@bytekit/utils/core";
import * as v from "valibot";

const ChatMessageSchema = v.object({
  userId: v.string(),
  text: v.pipe(v.string(), v.maxLength(500)),
});

const ws = new WebSocketHelper("wss://chat.example.com/ws", {
  schemas: {
    chat: valibotAdapter(ChatMessageSchema),
  },
});

ws.on<v.InferOutput<typeof ChatMessageSchema>>("chat", (msg) => {
  console.log(`[${msg.userId}] ${msg.text}`);
});

await ws.connect();
```

---

## US3 — Heartbeat with Pong Detection

```typescript
import { WebSocketHelper } from "@bytekit/utils/helpers";

const ws = new WebSocketHelper("wss://api.example.com/stream", {
  heartbeatIntervalMs: 15000, // ping every 15 s
  heartbeatTimeoutMs: 5000,   // reconnect if no pong within 5 s
  reconnect: true,
  backoffStrategy: "exponential",
  maxReconnectAttempts: 5,
});

ws.onReconnect((attempt, delay) => {
  console.log(`Heartbeat timeout — reconnecting (attempt ${attempt}, delay ${delay}ms)`);
});

await ws.connect();

// Server must respond with { "type": "pong", "data": {} } within 5 s of each ping,
// or the connection is treated as dead and reconnect is triggered automatically.
```

---

## All Features Combined

```typescript
import { WebSocketHelper } from "@bytekit/utils/helpers";
import { zodAdapter } from "@bytekit/utils/core";
import { z } from "zod";

const PriceUpdateSchema = z.object({
  pair: z.string(),
  bid: z.number(),
  ask: z.number(),
  ts: z.number(),
});

const ws = new WebSocketHelper("wss://api.example.com/ws", {
  // Reconnect
  reconnect: true,
  maxReconnectAttempts: 8,
  reconnectDelayMs: 1000,
  backoffStrategy: "exponential",
  maxReconnectDelayMs: 30000,
  jitter: true,

  // Heartbeat
  heartbeatIntervalMs: 20000,
  heartbeatTimeoutMs: 5000,

  // Schema validation
  schemas: {
    price: zodAdapter(PriceUpdateSchema),
  },
});

ws.onReconnect((attempt, delay) => {
  console.log(`[WS] Reconnecting in ${delay}ms (attempt ${attempt})`);
});

ws.onMaxRetriesReached(() => {
  console.error("[WS] Connection permanently lost. Please reload.");
});

ws.onValidationError((err, msg) => {
  console.warn(`[WS] Bad "${msg.type}" message:`, err.message);
});

ws.on<z.infer<typeof PriceUpdateSchema>>("price", (update) => {
  console.log(`${update.pair}: ${update.bid}/${update.ask}`);
});

ws.onError((err) => {
  console.error("[WS] Network error:", err);
});

await ws.connect();
```

---

## JavaScript (no types)

```js
import { WebSocketHelper } from "@bytekit/utils/helpers";

const ws = new WebSocketHelper("wss://api.example.com/stream", {
  reconnect: true,
  maxReconnectAttempts: 5,
  backoffStrategy: "exponential",
  maxReconnectDelayMs: 30000,
  jitter: true,
  heartbeatIntervalMs: 30000,
  heartbeatTimeoutMs: 5000,
});

ws.onReconnect((attempt, delay) => {
  console.log(`Reconnecting (attempt ${attempt}, delay ${delay}ms)`);
});

ws.on("message", (data) => {
  console.log("Received:", data);
});

await ws.connect();
ws.send("subscribe", { channel: "prices" });
```
