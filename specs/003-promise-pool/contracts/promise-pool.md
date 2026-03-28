# Contract: PromisePool Public API

**Module**: `bytekit/async`  
**Export**: `PromisePool`  
**Phase**: 1 — Contracts  
**Date**: 28 de marzo de 2026

## TypeScript Interface

```typescript
/**
 * Options for configuring a PromisePool instance.
 */
export interface PromisePoolOptions {
  /**
   * Maximum number of tasks that can run concurrently.
   * @minimum 1
   */
  concurrency: number;

  /**
   * Optional timeout in milliseconds for each individual task.
   * If a task exceeds this duration, it rejects with a PoolTimeoutError.
   */
  timeout?: number;

  /**
   * Optional callback invoked when a task fails.
   * Does NOT stop the pool — remaining tasks continue executing.
   * @param error   The error thrown by the failing task.
   * @param index   Zero-based index of the failing task in the original array.
   */
  onError?: (error: Error, index: number) => void;
}

/**
 * Error thrown when a task exceeds the configured timeout.
 */
export class PoolTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Task timed out after ${timeoutMs}ms`);
    this.name = "PoolTimeoutError";
  }
}

/**
 * Executes an array of async tasks with a configurable concurrency limit.
 *
 * Unlike `parallel()`, PromisePool:
 * - Is stateful and reusable across multiple `run()` calls.
 * - Does NOT fail fast: individual task errors are isolated via `onError`.
 * - Supports per-task timeouts.
 *
 * @example
 * ```typescript
 * import { PromisePool } from "bytekit/async";
 *
 * const pool = new PromisePool({ concurrency: 3, timeout: 5000 });
 *
 * const results = await pool.run([
 *   () => fetch("/api/1").then(r => r.json()),
 *   () => fetch("/api/2").then(r => r.json()),
 *   () => fetch("/api/3").then(r => r.json()),
 * ]);
 * ```
 */
export class PromisePool {
  constructor(options: PromisePoolOptions);

  /**
   * Runs an array of task factory functions with concurrency control.
   * Tasks are lazy — they are not started until the pool has a free slot.
   *
   * @param tasks   Array of functions that return Promises.
   * @returns       Promise resolving to an array of results in original order.
   *                If any task rejects and no `onError` is provided, the
   *                returned Promise rejects with that error.
   * @throws TypeError  If `tasks` is not an array.
   */
  run<T>(tasks: Array<() => Promise<T>>): Promise<T[]>;
}
```

## Behaviour Contracts

| Scenario | Expected Behaviour |
| -------- | ------------------ |
| Empty `tasks` array | Resolves immediately with `[]` |
| `concurrency = 1` | Tasks execute sequentially |
| `concurrency >= tasks.length` | Equivalent to `Promise.all` |
| Task throws/rejects | `onError` called; promise for that task rejects; pool continues |
| Task exceeds `timeout` | Rejects with `PoolTimeoutError`; pool continues |
| `concurrency < 1` in constructor | Throws `TypeError` synchronously |
| Non-array passed to `run()` | Throws `TypeError` synchronously |

## Exported from `bytekit/async`

```typescript
export { PromisePool, PoolTimeoutError } from "./promise-pool.js";
export type { PromisePoolOptions } from "./promise-pool.js";
```
