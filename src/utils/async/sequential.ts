import type { SequentialTask, SequentialOptions } from "./types.js";

/**
 * Execute async tasks sequentially, one after another
 *
 * Each task receives the result of the previous task as an optional parameter.
 * By default, execution stops on the first error. Use continueOnError option
 * to execute all tasks regardless of failures.
 *
 * @param tasks - Array of async task functions to execute sequentially
 * @param options - Optional configuration for error handling
 * @returns Promise that resolves with array of results in execution order
 * @throws First error encountered if any task fails (unless continueOnError is true)
 *
 * @example
 * ```typescript
 * // Basic sequential execution
 * const results = await sequential([
 *   () => fetchUser(1),
 *   (user) => fetchPosts(user.id),
 *   (posts) => processPosts(posts)
 * ]);
 *
 * // Continue on error
 * const results = await sequential(tasks, { continueOnError: true });
 * ```
 */
export async function sequential<T>(
    tasks: Array<SequentialTask<T>>,
    options?: SequentialOptions
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

    const continueOnError = options?.continueOnError ?? false;
    const results: T[] = [];
    let previousResult: any = undefined;

    // Execute tasks one by one using for...of loop
    for (let i = 0; i < tasks.length; i++) {
        try {
            // Pass previous result to current task
            const result = await tasks[i](previousResult);
            results.push(result);
            previousResult = result;
        } catch (error) {
            if (continueOnError) {
                // Store error as result and continue
                results.push(error as T);
                previousResult = error;
            } else {
                // Fail fast - reject immediately
                throw error;
            }
        }
    }

    return results;
}
