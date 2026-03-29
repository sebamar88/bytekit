# Data Model: 005-websocket-advanced

**Feature**: WebSocket con Reconexión Inteligente y Schema Validation  
**Branch**: `005-websocket-advanced`

---

## Entities

### 1. `BackoffStrategy` (new type)

Controls how the reconnect delay is computed between successive attempts.

| Field | Type | Notes |
|-------|------|-------|
| — | `"linear"` | Delay = `reconnectDelayMs × attempt`. Current behaviour (default). |
| — | `"exponential"` | Delay = `min(maxReconnectDelayMs, reconnectDelayMs × 2^(attempt-1))`. If `jitter=true`, delay is randomised within [0, cap] (AWS Full Jitter). |
| — | `(attempt: number) => number` | User-supplied function; receives 1-based attempt count, returns ms. |

```typescript
export type BackoffStrategy =
  | "linear"
  | "exponential"
  | ((attempt: number) => number);
```

---

### 2. `WebSocketOptions` (updated — new fields only)

All existing fields (`reconnect`, `maxReconnectAttempts`, `reconnectDelayMs`, `heartbeatIntervalMs`, `messageTimeout`) are **unchanged**. New fields are appended:

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `backoffStrategy` | `BackoffStrategy` | `"linear"` | Preserves current linear behaviour by default. |
| `maxReconnectDelayMs` | `number` | `30000` | Upper cap on computed reconnect delay (ms). Prevents unbounded exponential growth. |
| `jitter` | `boolean` | `false` | If `true` and `backoffStrategy === "exponential"`, applies Full Jitter: `Math.random() × cap`. |
| `heartbeatTimeoutMs` | `number` | `5000` | How long (ms) to wait for a `pong` after sending `ping` before triggering forced reconnect. |
| `schemas` | `Record<string, SchemaAdapter>` | `undefined` | Per-message-type incoming validation schemas. Messages with no matching schema are passed through unvalidated. |

**Validation rules**:
- `maxReconnectDelayMs` must be ≥ `reconnectDelayMs` (otherwise capping is a no-op).
- `heartbeatTimeoutMs` should be < `heartbeatIntervalMs` (otherwise the timeout fires on every cycle). Library does not enforce this — developer responsibility.
- `schemas` values must satisfy `isSchemaAdapter(v)` (existing type guard in `SchemaAdapter.ts`).

---

### 3. `WebSocketMessage<T>` (unchanged)

No changes to this interface. Validation via `schemas` mutates `message.data` in-place (replaces raw parsed value with schema-validated/transformed value before dispatching to handlers).

```typescript
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
}
```

---

### 4. New Event Handler Types

Three new types, consistent with existing `WebSocketEventHandler` / `WebSocketErrorHandler` naming convention:

```typescript
// Fires just before each reconnect attempt
export type WebSocketReconnectHandler = (attempt: number, delay: number) => void;

// Fires when maxReconnectAttempts is exhausted
export type WebSocketMaxRetriesHandler = () => void;

// Fires when a message fails schema validation
export type WebSocketValidationErrorHandler = (
  error: Error,
  message: WebSocketMessage
) => void;
```

---

## State Machine

### Connection State Transitions

```
DISCONNECTED
    │
    ▼  connect()
CONNECTING ──── onerror ──────────────────────────► DISCONNECTED
    │                                                      ▲
    ▼  onopen                                              │
CONNECTED ──── onclose (intentional) ──────────────► DISCONNECTED
    │                                                      │
    └─── onclose (unintentional) ───► RECONNECTING ────────┤
                                           │               │
                              maxAttempts reached          │
                                           │               │
                                           ▼               │
                                    FAILED_TERMINAL ───────┘
                                   (onMaxRetriesReached fired)
```

### Heartbeat Sub-State

```
[CONNECTED, heartbeat enabled]
    │
    ├─ every heartbeatIntervalMs:
    │      send("ping")
    │      start pong timer (heartbeatTimeoutMs)
    │
    ├─ any message received:
    │      clearTimeout(pong timer)
    │
    └─ pong timer fires (no message in heartbeatTimeoutMs):
           ws.close()  →  [RECONNECTING]
```

---

## Validation Flow

```
onmessage (raw JSON)
    │
    ▼  JSON.parse
 WebSocketMessage
    │
    ▼  schemas?.[message.type]
   defined?
    ├── YES → schema.parse(message.data)
    │              │
    │          ┌───┴───────────────────┐
    │          │ success               │ throw
    │          ▼                       ▼
    │    (message.data updated)  notifyValidationError()
    │          │                  return (message dropped)
    │          ▼
    └── NO ─► dispatch to on() handlers
```

---

## Backward Compatibility

All existing `WebSocketOptions` fields retain their defaults. An existing consumer:

```typescript
new WebSocketHelper("wss://example.com", {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelayMs: 3000,
  heartbeatIntervalMs: 30000,
  messageTimeout: 5000,
});
```

…behaves **identically** to the current version:
- `backoffStrategy` defaults to `"linear"` → delay = `3000 × attempt` (same as current `reconnectDelayMs * reconnectAttempts`)
- No schemas → no validation
- Pong timeout fires only if the server fails to send any message within `5000` ms of a ping

---

## Error Model

| Error scenario | Handler fired | Message dropped? | Reconnect triggered? |
|----------------|--------------|-------------------|----------------------|
| WS `onerror` | `onError` | N/A | No (browser handles) |
| WS `onclose` (unexpected) | — | N/A | Yes (if `reconnect=true`) |
| Max retries exhausted | `onMaxRetriesReached` | N/A | No |
| JSON parse failure | `onError` | — | No |
| Schema validation failure | `onValidationError` | Yes | No |
| Pong timeout | — (silent `ws.close()`) | N/A | Yes |
| Handler callback throws | `onError` | No | No |
