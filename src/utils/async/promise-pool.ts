/**
 * Options for PromisePool configuration
 */
export interface PromisePoolOptions {
    /** Maximum number of tasks that can run concurrently. Minimum: 1. */
    concurrency: number;
    /** Optional timeout in milliseconds per individual task. Must be > 0. */
    timeout?: number;
    /**
     * Optional callback invoked when a task fails.
     * Does NOT stop the pool — remaining tasks continue executing.
     * @param error     The error thrown by the failing task.
     * @param taskIndex Zero-based index of the failing task in the original array.
     */
    onError?: (error: Error, taskIndex: number) => void;
}

/**
 * Error thrown when a task exceeds the configured per-task timeout.
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
 * const pool = new PromisePool({ concurrency: 3, timeout: 5000 });
 * const results = await pool.run([
 *   () => fetch("/api/1").then(r => r.json()),
 *   () => fetch("/api/2").then(r => r.json()),
 * ]);
 * ```
 */
export class PromisePool {
    private readonly options: PromisePoolOptions;
    private running = 0;
    private queue: Array<{
        task: () => Promise<unknown>;
        resolve: (value: unknown) => void;
        reject: (reason: unknown) => void;
        index: number;
    }> = [];

    constructor(options: PromisePoolOptions) {
        if (options.concurrency < 1) {
            throw new TypeError("concurrency must be at least 1");
        }
        if (options.timeout !== undefined && options.timeout <= 0) {
            throw new TypeError("timeout must be a positive number");
        }
        this.options = { ...options };
    }

    /**
     * Runs an array of task factory functions with concurrency control.
     * Tasks are lazy — they are not started until the pool has a free slot.
     *
     * @param tasks   Array of functions that return Promises.
     * @returns       Promise resolving to an array of results in original order.
     * @throws TypeError  If `tasks` is not an array or any element is not a function.
     */
    async run<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
        if (!Array.isArray(tasks)) {
            throw new TypeError("tasks must be an array");
        }
        if (tasks.length === 0) {
            return [];
        }
        for (let i = 0; i < tasks.length; i++) {
            if (typeof tasks[i] !== "function") {
                throw new TypeError(`Task at index ${i} is not a function`);
            }
        }

        const results: T[] = new Array(tasks.length);
        await Promise.all(
            tasks.map((task, index) => this.addTask(task, index, results))
        );
        return results;
    }

    private addTask<T>(
        task: () => Promise<T>,
        index: number,
        results: T[]
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.queue.push({
                task: task as () => Promise<unknown>,
                resolve: resolve as (value: unknown) => void,
                reject,
                index,
            });
            this.processQueue(results);
        });
    }

    private processQueue(results: unknown[]): void {
        while (
            this.running < this.options.concurrency &&
            this.queue.length > 0
        ) {
            const item = this.queue.shift()!;
            this.running++;
            this.executeTask(item, results);
        }
    }

    private async executeTask(
        item: {
            task: () => Promise<unknown>;
            resolve: (v: unknown) => void;
            reject: (r: unknown) => void;
            index: number;
        },
        results: unknown[]
    ): Promise<void> {
        try {
            const promise = item.task();
            const result = this.options.timeout
                ? await this.withTimeout(promise, this.options.timeout)
                : await promise;
            results[item.index] = result;
            item.resolve(result);
        } catch (error) {
            if (this.options.onError) {
                this.options.onError(error as Error, item.index);
            }
            item.reject(error);
        } finally {
            this.running--;
            this.processQueue(results);
        }
    }

    private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new PoolTimeoutError(timeoutMs));
            }, timeoutMs);

            promise
                .then(resolve)
                .catch(reject)
                .finally(() => clearTimeout(timer));
        });
    }
}
