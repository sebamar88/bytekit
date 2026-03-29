# Contract: WebSocketHelper (v2)

**Feature**: 005-websocket-advanced  
**Module**: `@bytekit/utils/helpers` → `WebSocketHelper`  
**Stability**: Stable  

This contract describes the **full public surface** of `WebSocketHelper` after the 005-websocket-advanced upgrade. Bold items are **new** in this release.

---

## Types

```typescript
import type { SchemaAdapter } from "@bytekit/utils/core";

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
}

// ── Existing types (unchanged) ───────────────────────────────────────────────

export type WebSocketEventHandler<T = unknown> = (data: T) => void;
export type WebSocketErrorHandler = (error: Error) => void;

// ── New types ────────────────────────────────────────────────────────────────

/** Controls reconnect delay computation between attempts. */
export type BackoffStrategy =
  | "linear"         // delay = reconnectDelayMs × attempt  (current behaviour, default)
  | "exponential"    // delay = min(maxReconnectDelayMs, reconnectDelayMs × 2^(attempt-1))
  | ((attempt: number) => number); // custom function; receives 1-based attempt, returns ms

/** Fires just before each reconnect attempt. */
export type WebSocketReconnectHandler = (attempt: number, delay: number) => void;

/** Fires when maxReconnectAttempts is exhausted with no successful reconnect. */
export type WebSocketMaxRetriesHandler = () => void;

/** Fires when an incoming message fails schema validation. Message is dropped. */
export type WebSocketValidationErrorHandler = (
  error: Error,
  message: WebSocketMessage
) => void;
```

---

## `WebSocketOptions`

```typescript
export interface WebSocketOptions {
  // ── Existing options (unchanged defaults) ─────────────────────────────────

  /** Enable automatic reconnection on unexpected close. Default: `true` */
  reconnect?: boolean;

  /** Maximum number of reconnection attempts before giving up. Default: `5` */
  maxReconnectAttempts?: number;

  /**
   * Base reconnect delay in milliseconds.
   * - Linear: delay = reconnectDelayMs × attempt
   * - Exponential: used as base for 2× growth per attempt
   * Default: `3000`
   */
  reconnectDelayMs?: number;

  /** Interval between heartbeat pings in milliseconds. Default: `30000` */
  heartbeatIntervalMs?: number;

  /** Timeout for `request()` calls in milliseconds. Default: `5000` */
  messageTimeout?: number;

  // ── New options ────────────────────────────────────────────────────────────

  /**
   * How reconnect delay is computed between attempts.
   * - `"linear"`: delay = reconnectDelayMs × attempt (current behaviour)
   * - `"exponential"`: delay = min(maxReconnectDelayMs, reconnectDelayMs × 2^(attempt-1))
   * - Function: `(attempt: number) => number` — custom delay in ms
   * Default: `"linear"` (preserves existing behaviour)
   */
  backoffStrategy?: BackoffStrategy;

  /**
   * Upper cap on computed reconnect delay in milliseconds.
   * Prevents unbounded growth with exponential backoff.
   * Default: `30000`
   */
  maxReconnectDelayMs?: number;

  /**
   * If `true` and `backoffStrategy === "exponential"`, applies AWS Full Jitter:
   * `delay = Math.random() × cap` — distributes reconnects across time.
   * Default: `false`
   */
  jitter?: boolean;

  /**
   * How long to wait for a `pong` message after sending `ping`.
   * If no message is received within this window, the connection is treated
   * as silently dead and `ws.close()` is called (triggering reconnect).
   * Default: `5000`
   */
  heartbeatTimeoutMs?: number;

  /**
   * Per-message-type incoming validation schemas (uses `SchemaAdapter` interface).
   * Messages with no matching key are passed through without validation.
   * Invalid messages fire `onValidationError` handlers and are dropped.
   * Default: `undefined` (no validation)
   */
  schemas?: Record<string, SchemaAdapter>;
}
```

---

## `WebSocketHelper` Class

```typescript
export declare class WebSocketHelper {
  // ── Constructor ─────────────────────────────────────────────────────────────

  constructor(url: string, options?: WebSocketOptions);

  // ── Existing public methods (unchanged signatures) ───────────────────────────

  /** Open the WebSocket connection. Resolves when connection is established. */
  connect(): Promise<void>;

  /**
   * Send a message. Throws `Error("WebSocket is not connected")` if not open.
   * Auto-reconnect does NOT apply here — call `connect()` first.
   */
  send<T = unknown>(type: string, data: T): void;

  /**
   * Subscribe to a message type. Returns an unsubscribe function.
   * Multiple handlers for the same type are supported.
   */
  on<T = unknown>(type: string, handler: WebSocketEventHandler<T>): () => void;

  /** Subscribe to connection/protocol errors. Returns unsubscribe function. */
  onError(handler: WebSocketErrorHandler): () => void;

  /**
   * Send a message and wait for a response of `responseType`
   * (defaults to `"${type}:response"`). Rejects after `messageTimeout` ms.
   */
  request<TRequest, TResponse>(
    type: string,
    data: TRequest,
    responseType?: string
  ): Promise<TResponse>;

  /** Intentionally close the connection. Prevents automatic reconnect. */
  close(): void;

  /** Returns `true` if the WebSocket is currently in OPEN state. */
  isConnected(): boolean;

  /** Returns the raw `WebSocket.readyState` value. */
  getState(): number;

  // ── New public methods ───────────────────────────────────────────────────────

  /**
   * Subscribe to reconnect attempts.
   * Fires just before each reconnect delay begins.
   * @param handler Receives `attempt` (1-based) and `delay` (computed ms).
   * @returns Unsubscribe function.
   */
  onReconnect(handler: WebSocketReconnectHandler): () => void;

  /**
   * Subscribe to the terminal failure event when all reconnect attempts
   * are exhausted. After this fires, no further reconnect is attempted.
   * @returns Unsubscribe function.
   */
  onMaxRetriesReached(handler: WebSocketMaxRetriesHandler): () => void;

  /**
   * Subscribe to incoming message validation errors.
   * The offending message is dropped (on() handlers are NOT called).
   * @param handler Receives the schema `parse` error and raw `WebSocketMessage`.
   * @returns Unsubscribe function.
   */
  onValidationError(handler: WebSocketValidationErrorHandler): () => void;
}
```

---

## Behaviour Contracts

### Reconnect Backoff

| `backoffStrategy` | `jitter` | Delay formula for attempt `n` |
|-------------------|----------|-------------------------------|
| `"linear"` (default) | any | `reconnectDelayMs × n` |
| `"exponential"` | `false` | `min(maxReconnectDelayMs, reconnectDelayMs × 2^(n-1))` |
| `"exponential"` | `true` | `Math.random() × min(maxReconnectDelayMs, reconnectDelayMs × 2^(n-1))` |
| function | — | `fn(n)` — uncapped |

### Pong Detection

1. Every `heartbeatIntervalMs` ms, if connected: send `{ type: "ping", data: {} }`.
2. Start a `heartbeatTimeoutMs` ms timer.
3. On **any** incoming message: cancel the timer.
4. If the timer fires (no message received): call `ws.close()` → triggers `onclose` → triggers `attemptReconnect()` (if `reconnect: true`).

### Schema Validation

1. On incoming message: look up `schemas?.[message.type]`.
2. If no schema found: pass message to `on()` handlers unchanged.
3. If schema found: call `schema.parse(message.data)`.
   - **Success**: replace `message.data` with the parsed/validated value, dispatch to `on()` handlers.
   - **Failure**: call all `onValidationError` handlers with `(error, rawMessage)`, drop the message (no `on()` handlers called).

### Event Handler Semantics

All handler registration methods (`on`, `onError`, `onReconnect`, `onMaxRetriesReached`, `onValidationError`) return an `() => void` unsubscribe function. Calling it removes only that specific handler. Multiple handlers for the same event are all invoked.

---

## Defaults Summary

| Option | Default |
|--------|---------|
| `reconnect` | `true` |
| `maxReconnectAttempts` | `5` |
| `reconnectDelayMs` | `3000` |
| `heartbeatIntervalMs` | `30000` |
| `messageTimeout` | `5000` |
| `backoffStrategy` | `"linear"` |
| `maxReconnectDelayMs` | `30000` |
| `jitter` | `false` |
| `heartbeatTimeoutMs` | `5000` |
| `schemas` | `undefined` |
