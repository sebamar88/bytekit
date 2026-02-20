import { TimeoutError } from "./errors.js";
import { sleep } from "./sleep.js";

/**
 * Adds timeout behavior to any promise
 *
 * @param promise - The promise to add timeout behavior to
 * @param ms - Timeout duration in milliseconds
 * @param message - Optional custom error message for timeout
 * @returns Promise that resolves/rejects with the original promise or times out
 * @throws {TimeoutError} If the promise doesn't settle within the timeout duration
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await timeout(fetchData(), 5000);
 *
 * // With custom error message
 * try {
 *   await timeout(slowOperation(), 1000, 'Operation took too long');
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.log(`Timed out after ${error.timeout}ms`);
 *   }
 * }
 * ```
 */
export function timeout<T>(
    promise: Promise<T>,
    ms: number,
    message?: string
): Promise<T> {
    // Validate inputs
    if (!(promise instanceof Promise)) {
        throw new TypeError("First argument must be a Promise");
    }
    if (typeof ms !== "number" || ms < 0) {
        throw new TypeError(
            `Timeout duration must be a non-negative number, got ${ms}`
        );
    }

    // Create a timeout promise that rejects after the specified duration
    const timeoutPromise = sleep(ms).then(() => {
        const errorMessage =
            message || `Operation timed out after ${ms} milliseconds`;
        throw new TimeoutError(errorMessage, ms);
    });

    // Race the original promise against the timeout
    return Promise.race([promise, timeoutPromise]);
}

/**
 * Wraps an async function with automatic timeout behavior
 *
 * @param fn - The async function to wrap
 * @param ms - Timeout duration in milliseconds
 * @param message - Optional custom error message for timeout
 * @returns A new function with the same signature that applies timeout behavior
 * @throws {TimeoutError} If any invocation doesn't complete within the timeout duration
 *
 * @example
 * ```typescript
 * // Wrap a function with 5 second timeout
 * const fetchWithTimeout = withTimeout(fetchData, 5000);
 *
 * // All calls to the wrapped function will have timeout behavior
 * const result = await fetchWithTimeout(userId);
 * ```
 */
export function withTimeout<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    ms: number,
    message?: string
): (...args: TArgs) => Promise<TReturn> {
    // Validate inputs
    if (typeof fn !== "function") {
        throw new TypeError("First argument must be a function");
    }
    if (typeof ms !== "number" || ms < 0) {
        throw new TypeError(
            `Timeout duration must be a non-negative number, got ${ms}`
        );
    }

    return function (this: any, ...args: TArgs): Promise<TReturn> {
        // Apply timeout to the function invocation
        // Preserve 'this' context by using the captured context
        return timeout(fn.apply(this, args), ms, message);
    };
}
