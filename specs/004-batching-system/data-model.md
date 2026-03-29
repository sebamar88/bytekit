# Data Model: Request Queue & Batching System

**Feature**: `004-batching-system`

---

## Entities

### `QueuePriority`

```typescript
type QueuePriority = "high" | "normal" | "low";
```

The three fixed priority lanes. Tasks in `high` always dequeue before `normal`; `normal` before `low`.

---

### `QueueItem<T>`

Internal item stored in a priority lane.

| Field | Type | Description |
|-------|------|-------------|
| `task` | `(signal: AbortSignal) => Promise<T>` | Lazy task factory. Receives the AbortSignal for in-flight cancellation. |
| `priority` | `QueuePriority` | Lane this item belongs to. |
| `resolve` | `(value: T) => void` | Resolves the public promise when task completes. |
| `reject` | `(reason: unknown) => void` | Rejects the public promise on error or cancel. |
| `controller` | `AbortController` | Internal controller; `.abort()` is called on `cancel()`. |
| `id` | `string` | Unique identifier (`crypto.randomUUID()` or counter-based). |

---

### `RequestQueueOptions`

Constructor options for `RequestQueue`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `concurrency` | `number` | — | Max tasks running simultaneously. Minimum: 1. Required. |
| `onError` | `(error: Error, id: string) => void` | `undefined` | Called when a task rejects. Queue continues. |

---

### `AddOptions`

Options for `queue.add()`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `priority` | `QueuePriority` | `"normal"` | Which lane to enqueue into. |
| `signal` | `AbortSignal` | `undefined` | External AbortSignal; if fired before the task starts, cancels it immediately. |

---

### `RequestQueue`

| Member | Type | Description |
|--------|------|-------------|
| `constructor(options)` | `(RequestQueueOptions) => RequestQueue` | Creates queue with given concurrency. Validates `concurrency >= 1`. |
| `add<T>(task, options?)` | `(task, AddOptions?) => Promise<T>` | Enqueues a task. Returns a Promise that resolves/rejects with the task result. |
| `cancel(id)` | `(id: string) => boolean` | Cancels a queued task by ID. Returns `true` if found and cancelled, `false` otherwise. |
| `flush()` | `() => Promise<void>` | Resolves when all currently queued + running tasks complete. |
| `size` | `number` (getter) | Total tasks in all queues (not yet started). |
| `running` | `number` (getter) | Tasks currently executing. |
| `pending` | `number` (getter) | `size + running` — total active work. |

---

### `BatchOptions`

Constructor options for `RequestBatcher`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `windowMs` | `number` | — | Time window in ms for collecting requests. Required. |
| `maxSize` | `number` | `Infinity` | Max requests per batch. Flush early if reached. |
| `sliding` | `boolean` | `false` | If `true`, timer resets on each new request (sliding window). |
| `keyFn` | `(url: string, init: RequestInit) => string` | `defaultKeyFn` | Custom function to compute the batch deduplication key. |

---

### `BatchEntry<T>`

Internal record for a pending request in a batch window.

| Field | Type | Description |
|-------|------|-------------|
| `init` | `RequestInit` | Fetch init object (method, headers, body). |
| `resolve` | `(value: T) => void` | Resolves the caller's promise with the response. |
| `reject` | `(reason: unknown) => void` | Rejects the caller's promise on error. |

---

### `RequestBatcher`

| Member | Type | Description |
|--------|------|-------------|
| `constructor(options)` | `(BatchOptions) => RequestBatcher` | Creates batcher with given window. |
| `add<T>(url, init, fetcher)` | `(string, RequestInit, (url, init) => Promise<T>) => Promise<T>` | Adds a request to the batch window. Returns a Promise resolving to the response. |
| `flush()` | `() => Promise<void>` | Forces immediate dispatch of all pending batches. |
| `pendingCount` | `number` (getter) | Total pending requests across all batch buckets. |

---

## Error Types

| Class | Extends | Thrown When |
|-------|---------|-------------|
| `QueueAbortError` | `Error` | A queued task is cancelled via `cancel(id)` or an external `AbortSignal` fires before task start. `name = "QueueAbortError"`. |

---

## State Transitions — RequestQueue

```
Task added via add()
      │
      ▼
  [QUEUED] ──── cancel(id) called ──── [CANCELLED] → Promise rejects with QueueAbortError
      │
      │ slot available
      ▼
  [RUNNING] ──── task resolves ──────── [DONE] → Promise resolves
      │
      └─────── task rejects ──────────── [ERROR] → onError? called → Promise rejects
      │
      └─────── AbortSignal fires ───────── [ABORTED] → Promise rejects with QueueAbortError
```

## State Transitions — RequestBatcher

```
Request added via add()
      │
      ▼
  [PENDING in bucket]
      │
      │ windowMs elapsed (or maxSize reached, or flush() called)
      ▼
  [DISPATCHING] → fetcher called with merged requests
      │
      ├── all resolve → each caller's Promise resolves
      └── error → each caller's Promise rejects
```
