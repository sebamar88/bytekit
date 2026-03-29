# Interface Contract: RequestQueue & RequestBatcher

**Feature**: `004-batching-system`  
**Module**: `bytekit/async`

---

## TypeScript Interface

```typescript
// ── Types ──────────────────────────────────────────────────────────────────

export type QueuePriority = "high" | "normal" | "low";

export interface RequestQueueOptions {
  /** Max tasks running simultaneously. Minimum: 1. */
  concurrency: number;
  /**
   * Called when a task rejects. Queue continues executing remaining tasks.
   * @param error  The rejection reason (cast to Error).
   * @param id     The task's unique identifier.
   */
  onError?: (error: Error, id: string) => void;
}

export interface AddOptions {
  /** Lane priority. Defaults to "normal". */
  priority?: QueuePriority;
  /**
   * External AbortSignal. If it fires before the task starts,
   * the task is cancelled with QueueAbortError.
   */
  signal?: AbortSignal;
}

export interface BatchOptions {
  /** Time window in ms for collecting requests before dispatching. Required. */
  windowMs: number;
  /** Max requests per batch. Flushes early when reached. Default: Infinity. */
  maxSize?: number;
  /**
   * If true, the window timer resets on each new request (sliding window).
   * Default: false (fixed window — timer fires once after first request).
   */
  sliding?: boolean;
  /** Custom function to compute the batch deduplication key. */
  keyFn?: (url: string, init: RequestInit) => string;
}

// ── Error Classes ──────────────────────────────────────────────────────────

export class QueueAbortError extends Error {
  constructor(message?: string) {
    super(message ?? "Request cancelled");
    this.name = "QueueAbortError";
  }
}

// ── RequestQueue ───────────────────────────────────────────────────────────

export class RequestQueue {
  constructor(options: RequestQueueOptions);

  /**
   * Enqueues a task. The task factory receives the queue's internal AbortSignal
   * for in-flight cancellation support.
   *
   * @returns Promise<T> resolving to the task's return value.
   * @throws  QueueAbortError if cancelled before execution.
   * @throws  Whatever the task itself throws.
   */
  add<T>(task: (signal: AbortSignal) => Promise<T>, options?: AddOptions): Promise<T>;

  /**
   * Cancels a queued task by its ID (returned as metadata — see note below).
   * If the task is already running, the AbortSignal is fired.
   * @returns true if found and cancelled; false if already started/completed.
   */
  cancel(id: string): boolean;

  /** Resolves when all currently queued + running tasks have settled. */
  flush(): Promise<void>;

  /** Number of tasks waiting to start (across all priority lanes). */
  get size(): number;

  /** Number of tasks currently executing. */
  get running(): number;

  /** Total active work: size + running. */
  get pending(): number;
}

// ── RequestBatcher ─────────────────────────────────────────────────────────

export class RequestBatcher {
  constructor(options: BatchOptions);

  /**
   * Adds a request to the current batch window.
   * Requests with the same key (url + method + body) are coalesced —
   * all callers receive the same resolved value.
   *
   * @param url      The request URL.
   * @param init     The RequestInit options.
   * @param fetcher  The actual fetch function to invoke when the window fires.
   * @returns Promise<T> resolving to the fetch result.
   */
  add<T>(
    url: string,
    init: RequestInit,
    fetcher: (url: string, init: RequestInit) => Promise<T>
  ): Promise<T>;

  /** Forces immediate dispatch of all pending batches. */
  flush(): Promise<void>;

  /** Total pending requests across all batch buckets. */
  get pendingCount(): number;
}
```

---

## Behaviour Contracts

| Contract | Description |
|----------|-------------|
| **Concurrency** | At no point will more than `concurrency` tasks run simultaneously in `RequestQueue`. |
| **Priority ordering** | All `high` tasks dequeue before any `normal` task; all `normal` before any `low`. Within a lane, FIFO order is preserved. |
| **Error isolation** | A failing task calls `onError` (if configured) and rejects its own Promise. The queue continues processing. |
| **Cancel — queued** | `cancel(id)` on a not-yet-started task removes it from the lane and rejects its Promise with `QueueAbortError` synchronously. |
| **Cancel — in-flight** | `cancel(id)` on a running task fires the `AbortSignal`. The task receives the signal and may abort. The queue does not forcibly stop the task. |
| **External signal** | If `options.signal` passed to `add()` fires before the task starts, the task is dequeued and rejected with `QueueAbortError`. |
| **Batch window** | In fixed mode, the window timer starts on the first request in a bucket. In sliding mode, the timer resets on each new request. |
| **Batch coalescing** | Requests with the same batch key share one `fetcher` call. All callers receive the same resolved value (or the same rejection). |
| **Batch maxSize** | When `maxSize` is reached, the current batch flushes immediately (before `windowMs` elapses). |
| **flush()** | `RequestQueue.flush()` resolves only after all currently queued AND running tasks have settled. `RequestBatcher.flush()` dispatches all pending buckets immediately. |
| **Reusability** | Both classes are reusable across multiple `add()` / `flush()` cycles. |

---

## Constructor Guards

| Condition | Error |
|-----------|-------|
| `concurrency < 1` | `TypeError: concurrency must be at least 1` |
| `windowMs <= 0` | `TypeError: windowMs must be a positive number` |
| `maxSize < 1` | `TypeError: maxSize must be at least 1` |
