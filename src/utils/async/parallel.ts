import type { Task, ParallelOptions } from "./types.js";

/**
 * Execute multiple async tasks in parallel with optional concurrency control
 *
 * @param tasks - Array of async task functions to execute
 * @param options - Optional configuration for concurrency control
 * @returns Promise that resolves with array of results in original order
 * @throws First error encountered if any task fails
 *
 * @example
 * ```typescript
 * // Unlimited concurrency
 * const results = await parallel([
 *   () => fetchUser(1),
 *   () => fetchUser(2),
 *   () => fetchUser(3)
 * ]);
 *
 * // Limited concurrency
 * const results = await parallel(tasks, { concurrency: 2 });
 * ```
 */
export async function parallel<T>(
    tasks: Array<Task<T>>,
    options?: ParallelOptions
): Promise<T[]> {
    // Validate input
    if (!Array.isArray(tasks)) {
        throw new TypeError("tasks must be an array");
    }

    // Handle empty array
    if (tasks.length === 0) {
        return [];
    }

    // Validate all tasks are functions
    for (let i = 0; i < tasks.length; i++) {
        if (typeof tasks[i] !== "function") {
            throw new TypeError(`Task at index ${i} is not a function`);
        }
    }

    const concurrency = options?.concurrency;

    // Validate concurrency if provided
    if (concurrency !== undefined) {
        if (typeof concurrency !== "number" || !Number.isInteger(concurrency)) {
            throw new TypeError("concurrency must be an integer");
        }
        if (concurrency < 1) {
            throw new TypeError("concurrency must be at least 1");
        }
    }

    // If no concurrency limit, use Promise.all for maximum performance
    if (concurrency === undefined) {
        return Promise.all(tasks.map((task) => task()));
    }

    // Queue-based execution with concurrency limit
    return executeWithConcurrencyLimit(tasks, concurrency);
}

/**
 * Execute tasks with a concurrency limit using a queue-based approach
 */
async function executeWithConcurrencyLimit<T>(
    tasks: Array<Task<T>>,
    concurrency: number
): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let nextIndex = 0;
    let hasError = false;
    let firstError: unknown = null;

    // Worker function that processes tasks from the queue
    const worker = async (): Promise<void> => {
        while (nextIndex < tasks.length && !hasError) {
            const index = nextIndex++;

            try {
                const result = await tasks[index]();

                // Only store result if no error has occurred
                if (!hasError) {
                    results[index] = result;
                }
            } catch (err) {
                // Store first error and set flag
                if (!hasError) {
                    hasError = true;
                    firstError = err;
                }
                // Stop this worker
                return;
            }
        }
    };

    // Start workers up to concurrency limit
    const workers: Promise<void>[] = [];
    const workerCount = Math.min(concurrency, tasks.length);

    for (let i = 0; i < workerCount; i++) {
        workers.push(worker());
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    // If an error occurred, throw it
    if (hasError) {
        throw firstError;
    }

    return results;
}
