# Research: 005-websocket-advanced

**Feature**: WebSocket con Reconexión Inteligente y Schema Validation  
**Branch**: `005-websocket-advanced`  
**Phase**: 0 — Research

---

## Decision 1: Upgrade Strategy — Extend vs In-Place

**Decision**: Upgrade `WebSocketHelper` **in-place**. Add new optional fields to `WebSocketOptions` with defaults that exactly reproduce current behaviour.

**Rationale**:
- The existing class uses all-`private` fields (`ws`, `reconnectAttempts`, `heartbeatTimer`, etc.). A subclass cannot touch them without either duplicating logic or converting everything to `protected` — which is an internal API break.
- Industry precedent: `reconnecting-websocket` is a standalone drop-in class; `socket.io-client`'s `Socket` is upgraded in-place across every minor version. Neither uses a subclass pattern.
- Zero-dep single-class libraries ship one canonical class. A second `AdvancedWebSocketHelper` export creates a "which one do I use?" problem with no guidance. It doubles the surface area for no gain.
- Every new option is optional with backward-compatible defaults, so every existing `new WebSocketHelper(url, { reconnectDelayMs: 3000 })` call continues to work unchanged.

**Alternatives considered**:
- **`AdvancedWebSocketHelper extends WebSocketHelper`**: Rejected. Private fields can't be accessed or overridden cleanly. Would require a refactor to `protected` before subclassing is meaningful, which is itself a larger internal change than just adding options. Also adds a second export with no practical justification.

---

## Decision 2: Exponential Backoff Formula

**Decision**: Add `backoffStrategy?: "linear" | "exponential" | ((attempt: number) => number)` defaulting to `"linear"` (preserves current behaviour). Add `maxReconnectDelayMs?: number` (default: `30000`) as the cap. Add `jitter?: boolean` (default: `false`).

**Exponential formula** (when `"exponential"` is selected):
```typescript
const cap = Math.min(
  options.maxReconnectDelayMs,
  options.reconnectDelayMs * Math.pow(2, attempt - 1)
);
const delay = options.jitter ? Math.random() * cap : cap;
```

This is the AWS Full Jitter variant from the canonical "Exponential Backoff And Jitter" paper — the most widely cited formula in the industry.

**Reference defaults from popular libraries**:

| Library              | Base      | Max        | Factor            |
|----------------------|-----------|------------|-------------------|
| reconnecting-websocket | 1 000 ms | 10 000 ms | 1.5×             |
| socket.io-client     | 1 000 ms  | 5 000 ms   | 1.5× + 0.5 random |
| bytekit (proposed)   | 3 000 ms *(existing, kept)* | 30 000 ms | 2× (pure base-2) |

`Math.min` for the cap is non-negotiable — without it, `3000 × 2¹⁵ ≈ 27 hours`.

**Alternatives considered**:
- **Decorrelated jitter** (`random(base, prev_delay * 3)`): Rejected — stateful (requires tracking previous delay across reconnect attempts), harder to implement correctly, and the empirical gain over full jitter is negligible for WebSocket reconnect scenarios.
- **Removing `"linear"` as a strategy**: Rejected — the existing behaviour is linear. Making `"linear"` the default keeps every existing consumer unchanged without needing `backoffStrategy` in their options.
- **Only supporting a fixed formula**: Rejected — the `((attempt) => number)` escape hatch lets users implement Fibonacci, custom curves, or server-driven backoff without library changes. It's a trivial addition that future-proofs the API.

---

## Decision 3: Heartbeat / Pong Detection

**Decision**: After sending `ping`, start a `heartbeatTimeoutMs` timer (default: `5000` ms). If a `pong` message is received (via the existing message routing), cancel the timer. If the timer fires, call `ws?.close()` — this triggers the existing `onclose` → `attemptReconnect()` pipeline. Default `heartbeatTimeoutMs`: **`5000` ms**, independent of `heartbeatIntervalMs`.

**Implementation sketch**:
```typescript
// in startHeartbeat():
this.heartbeatTimer = setInterval(() => {
  if (!this.isConnected()) return;
  try {
    this.send("ping", {});
    this.heartbeatTimeoutTimer = setTimeout(() => {
      // pong never arrived — force close triggers reconnect
      this.ws?.close();
    }, this.options.heartbeatTimeoutMs);
  } catch { /* already disconnected */ }
}, this.options.heartbeatIntervalMs);

// in handleMessage() — on any message, cancel outstanding pong timeout:
clearTimeout(this.heartbeatTimeoutTimer);
this.heartbeatTimeoutTimer = undefined;
```

**Rationale**:
- Browser WebSocket does not expose native protocol-level ping/pong frames to JS — those are handled transparently by the browser's implementation. The existing `ping` message is an **application-level** ping. Pong detection must therefore also be application-level.
- This is the exact pattern used by socket.io (`pingInterval: 25000, pingTimeout: 20000`): send a ping, set a timeout, expect a pong. Silence on the timeout = dead connection.
- The 5 s default for `heartbeatTimeoutMs` is consistent with `messageTimeout` already in `WebSocketOptions` — it signals "server must respond within 5 s".

**Alternatives considered**:
- **Track `lastMessageAt` timestamp**: Rejected as the primary mechanism — any server message resets the timer, which is lenient but doesn't verify the server is specifically responding to the client. Layering it on top adds complexity without addressing the core dead-connection scenario.
- **Re-using `onError` for timeout notification**: Rejected — the timeout should silently force a close, which then flows through the existing `attemptReconnect()` path. No extra error notification is needed unless reconnect also fails.

---

## Decision 4: Schema Validation API

**Decision**:
- `schemas?: Record<string, SchemaAdapter>` in `WebSocketOptions` — keyed by message `type` string.
- Validation errors surface through a **dedicated `onValidationError` handler** (not thrown).
- Invalid messages are **silently dropped** (registered `on()` handlers are NOT called) after `onValidationError` fires.
- Validate **incoming messages only**.

```typescript
// Options shape:
schemas?: Record<string, SchemaAdapter>;

// In handleMessage():
const schema = this.options.schemas?.[message.type];
if (schema) {
  try {
    message.data = schema.parse(message.data);
  } catch (error) {
    this.notifyValidationError(error, message); // does NOT call type handlers
    return; // drop the message
  }
}
// ... proceed to dispatch to type handlers
```

**Rationale**:
- `Record<string, SchemaAdapter>` exactly mirrors how `schemas` works in `ApiClient` — consistent mental model.
- WebSocket is a **long-lived, stateful session**. One malformed message must not crash the whole session. This is the fundamental difference from `ApiClient.request()`, which can throw because each HTTP request has an isolated promise boundary. A WebSocket `onmessage` callback that throws has undefined browser behaviour and kills message routing for all subsequent messages.
- "Silently drop + call handler" is what socket.io's server-side middleware does with validation errors — it does not disconnect the socket, it calls the error callback and discards the packet.
- Outgoing validation rejected: the developer controls outgoing message shapes. Validating outgoing adds overhead, complicates `send()`'s return type (does it throw? return `false`?), and no production library does it by default.

**Alternatives considered**:
- **Throw from `handleMessage()`**: Rejected — crashes the `onmessage` event handler. In a browser, this propagates as an uncaught error at the event loop level and silently breaks all future message dispatch for the lifetime of the WebSocket.
- **Surface via `onError` instead of `onValidationError`**: Rejected — users typically want different responses for "network error" vs "received bad data from server". Merging them forces message-string inspection to distinguish, which is exactly what a typed `onValidationError` prevents.

---

## Decision 5: New Event Handlers API

**Decision**: Three new handlers, all returning `() => void` unsubscribe functions matching the existing `on()` / `onError()` pattern:

```typescript
onReconnect(handler: (attempt: number, delay: number) => void): () => void;
onMaxRetriesReached(handler: () => void): () => void;
onValidationError(handler: (error: Error, message: WebSocketMessage) => void): () => void;
```

**Rationale**:
- `onReconnect` — exposes both `attempt` number and the computed `delay` (essential when using exponential backoff, since the actual delay is no longer obvious from config alone). Used for "Reconnecting in 8s... (attempt 3/5)" UI patterns.
- `onMaxRetriesReached()` — currently the code calls `this.notifyError(new Error("Max reconnection attempts reached"))`, forcing users to do string-matching on error messages to detect terminal exhaustion. A dedicated handler avoids that fragility.
- `onValidationError` — receives the schema `parse` error and the **raw, unvalidated** `WebSocketMessage` for logging/debugging.
- `() => void` return type on all three — identical to `onError()`. Consistency beats minor convenience of chaining. The existing test suite pattern confirms this is the established bytekit idiom.

**Alternatives considered**:
- **Callback fields in `WebSocketOptions`** (`onReconnect?: (attempt) => void` in constructor opts): Rejected — options-object callbacks cannot be added/removed after construction, cannot have multiple subscribers, and are harder to test with the existing mock pattern.
- **`onMaxRetriesReached` via `onError`**: Rejected — string-matching error messages is fragile and forces type-narrowing that TypeScript cannot help with.
- **`return this` (builder chaining)**: Rejected — `onError` already returns `() => void`. Mixing return types on similar methods violates the Principle of Least Astonishment and breaks the established bytekit convention.
