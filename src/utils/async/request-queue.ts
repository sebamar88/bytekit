/**
 * RequestQueue — Priority-aware, concurrency-limited task queue with AbortSignal cancellation.
 * Feature: 004-batching-system
 * Zero external dependencies: AbortController, Map (built-in).
 */

/** The three fixed priority lanes for task execution ordering. */
export type QueuePriority = "high" | "normal" | "low";

/** Constructor options for {@link RequestQueue}. */
export interface RequestQueueOptions {
    /**
     * Max tasks running simultaneously. Minimum: 1.
     */
    concurrency: number;
    /**
     * Called when a task rejects. Queue continues executing remaining tasks.
     * @param error  The rejection reason (cast to Error).
     * @param id     The task's unique identifier.
     */
    onError?: (error: Error, id: string) => void;
}

/** Per-task options for {@link RequestQueue.add}. */
export interface AddOptions {
    /**
     * Lane priority. Defaults to `"normal"`.
     * Tasks in `high` always dequeue before `normal`; `normal` before `low`.
     */
    priority?: QueuePriority;
    /**
     * External AbortSignal. If it fires before the task starts,
     * the task is cancelled immediately with {@link QueueAbortError}.
     * This is the **public consumer cancellation path**.
     */
    signal?: AbortSignal;
}

/**
 * Thrown when a queued task is cancelled — either via an external AbortSignal
 * or via the internal `cancel(id)` mechanism.
 */
export class QueueAbortError extends Error {
    constructor(message?: string) {
        super(message ?? "Request cancelled");
        this.name = "QueueAbortError";
    }
}

/** @internal - not exported publicly */
interface QueueItem {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: (signal: AbortSignal) => Promise<any>;
    priority: QueuePriority;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value: any) => void;
    reject: (reason: unknown) => void;
    controller: AbortController;
    id: string;
}

/**
 * A priority-aware, concurrency-limited task queue with AbortSignal-based cancellation.
 *
 * Tasks are organised into three lanes (`high`, `normal`, `low`). At any moment,
 * at most `concurrency` tasks execute simultaneously. When a slot opens, the
 * highest-priority queued task is dequeued and started.
 *
 * **Consumer cancellation** is done via `AddOptions.signal`.
 * The `cancel(id)` method is an internal queue-management mechanism.
 *
 * @example
 * ```typescript
 * const queue = new RequestQueue({ concurrency: 3 });
 *
 * const result = await queue.add(
 *   (signal) => fetch("/api/data", { signal }),
 *   { priority: "high" }
 * );
 * ```
 */
export class RequestQueue {
    private readonly _concurrency: number;
    private readonly _onError?: (error: Error, id: string) => void;
    private readonly _high: QueueItem[] = [];
    private readonly _normal: QueueItem[] = [];
    private readonly _low: QueueItem[] = [];
    private _running = 0;
    private readonly _active = new Map<string, QueueItem>();
    private _counter = 0;
    private _flushWaiters: Array<() => void> = [];

    /**
     * Creates a new RequestQueue.
     * @throws {TypeError} if `concurrency` is less than 1.
     */
    constructor(options: RequestQueueOptions) {
        if (options.concurrency < 1) {
            throw new TypeError("concurrency must be >= 1");
        }
        this._concurrency = options.concurrency;
        this._onError = options.onError;
    }

    /**
     * Enqueues a task. The task factory receives an internal AbortSignal
     * that fires when the task is cancelled via `cancel(id)`.
     *
     * @returns `Promise<T>` resolving to the task's return value.
     * @throws {@link QueueAbortError} if cancelled before or during execution.
     * @throws Whatever the task itself throws.
     */
    add<T>(
        task: (signal: AbortSignal) => Promise<T>,
        options?: AddOptions
    ): Promise<T> {
        const priority = options?.priority ?? "normal";
        const externalSignal = options?.signal;

        if (externalSignal?.aborted) {
            return Promise.reject(new QueueAbortError());
        }

        const controller = new AbortController();
        const id = String(++this._counter);

        return new Promise<T>((resolve, reject) => {
            const item: QueueItem = {
                task,
                priority,
                resolve,
                reject,
                controller,
                id,
            };

            const lane =
                priority === "high"
                    ? this._high
                    : priority === "low"
                      ? this._low
                      : this._normal;
            lane.push(item);

            if (externalSignal) {
                externalSignal.addEventListener(
                    "abort",
                    () => {
                        this.cancel(id);
                    },
                    { once: true }
                );
            }

            this._drain();
        });
    }

    private _drain(): void {
        while (this._running < this._concurrency) {
            const item =
                this._high.shift() ?? this._normal.shift() ?? this._low.shift();
            if (!item) break;

            this._running++;
            this._active.set(item.id, item);

            const p = item
                .task(item.controller.signal)
                .then(
                    (value: unknown) => {
                        item.resolve(value);
                    },
                    (err: unknown) => {
                        this._onError?.(
                            err instanceof Error ? err : new Error(String(err)),
                            item.id
                        );
                        item.reject(err);
                    }
                )
                .finally(() => {
                    this._running--;
                    this._active.delete(item.id);
                    this._drain();
                });

            void p;
        }

        this._notifyFlushWaiters();
    }

    private _notifyFlushWaiters(): void {
        if (this._running === 0 && this.size === 0) {
            const waiters = this._flushWaiters.splice(0);
            for (const w of waiters) w();
        }
    }

    /**
     * Cancels a task by ID.
     * - **Queued task**: removed from its lane; promise rejects with {@link QueueAbortError}.
     *   Task factory is never called.
     * - **In-flight task**: internal AbortSignal is fired. The task is responsible
     *   for reacting to signal abortion and rejecting its promise.
     *
     * @returns `true` if the ID was found; `false` otherwise.
     * @internal Public consumers should use `AddOptions.signal` for cancellation.
     */
    cancel(id: string): boolean {
        for (const lane of [this._high, this._normal, this._low]) {
            const idx = lane.findIndex((i) => i.id === id);
            if (idx !== -1) {
                const [item] = lane.splice(idx, 1) as [QueueItem];
                item.reject(new QueueAbortError());
                this._notifyFlushWaiters();
                return true;
            }
        }

        const active = this._active.get(id);
        if (active) {
            active.controller.abort();
            return true;
        }

        return false;
    }

    /**
     * Resolves when all currently queued and running tasks have settled.
     * Tasks added after `flush()` is called are included in the wait.
     */
    flush(): Promise<void> {
        if (this._running === 0 && this.size === 0) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            this._flushWaiters.push(resolve);
        });
    }

    /** @internal Returns IDs of all queued (not yet running) items across all lanes. */
    _queuedIds(): string[] {
        return [
            /* v8 ignore next */
            ...this._high.map((i) => i.id),
            ...this._normal.map((i) => i.id),
            ...this._low.map((i) => i.id),
        ];
    }

    /** @internal Returns IDs of all currently running items. */
    _runningIds(): string[] {
        return [...this._active.keys()];
    }

    /** Number of tasks waiting to start (across all priority lanes). */
    get size(): number {
        return this._high.length + this._normal.length + this._low.length;
    }

    /** Number of tasks currently executing. */
    get running(): number {
        return this._running;
    }

    /** Total active work: `size + running`. */
    get pending(): number {
        return this.size + this._running;
    }
}
