import { sleep } from "./sleep.js";
import { AbortError, RetryError } from "./errors.js";
import type { RetryOptions } from "./types.js";

/**
 * Retry a failed async operation with configurable backoff strategies
 *
 * @param fn - The async function to retry
 * @param options - Configuration options for retry behavior
 * @returns Promise that resolves with the function result or rejects after all attempts fail
 * @throws {RetryError} If all retry attempts are exhausted
 * @throws {AbortError} If the operation is aborted via AbortSignal
 * @throws {TypeError} If invalid options are provided
 *
 * @example
 * ```typescript
 * // Basic usage with defaults (3 attempts, exponential backoff)
 * const result = await retry(() => fetchData());
 *
 * // Custom configuration
 * const result = await retry(() => fetchData(), {
 *   maxAttempts: 5,
 *   baseDelay: 500,
 *   maxDelay: 10000,
 *   backoff: 'linear',
 *   shouldRetry: (error) => error instanceof NetworkError
 * });
 *
 * // With cancellation
 * const controller = new AbortController();
 * const result = await retry(() => fetchData(), {
 *   signal: controller.signal
 * });
 * ```
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    // Validate function parameter
    if (typeof fn !== "function") {
        throw new TypeError("First argument must be a function");
    }

    // Extract and validate options with defaults
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = Infinity,
        backoff = "exponential",
        shouldRetry,
        signal,
    } = options;

    // Validate numeric options
    if (maxAttempts < 1) {
        throw new TypeError(
            `maxAttempts must be at least 1, got ${maxAttempts}`
        );
    }
    if (baseDelay < 0) {
        throw new TypeError(`baseDelay must be non-negative, got ${baseDelay}`);
    }
    if (maxDelay < 0) {
        throw new TypeError(`maxDelay must be non-negative, got ${maxDelay}`);
    }

    // Check if already aborted
    if (signal?.aborted) {
        throw new AbortError("Retry aborted before starting");
    }

    let lastError: unknown;

    // Attempt execution up to maxAttempts times
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Execute the function
            const result = await fn();
            return result;
        } catch (error) {
            lastError = error;

            // Check if we should retry this error
            if (shouldRetry && !shouldRetry(error)) {
                throw error;
            }

            // If this was the last attempt, don't delay
            if (attempt === maxAttempts) {
                break;
            }

            // Calculate delay based on backoff strategy
            const delay = calculateDelay(attempt, baseDelay, maxDelay, backoff);

            // Wait before next attempt (with abort support)
            try {
                await sleep(delay, signal);
            } catch (sleepError) {
                // If sleep was aborted, throw AbortError
                if (sleepError instanceof AbortError) {
                    throw sleepError;
                }
                // Otherwise, rethrow the error
                throw sleepError;
            }
        }
    }

    // All attempts exhausted, throw RetryError
    throw new RetryError(
        `Failed after ${maxAttempts} attempts`,
        maxAttempts,
        lastError
    );
}

/**
 * Calculate the delay for a retry attempt based on the backoff strategy
 *
 * @param attempt - Current attempt number (1-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay cap in milliseconds
 * @param backoff - Backoff strategy to use
 * @returns Delay in milliseconds, capped at maxDelay
 */
function calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoff: RetryOptions["backoff"]
): number {
    let delay: number;

    if (typeof backoff === "function") {
        // Custom backoff function
        delay = backoff(attempt);
    } else if (backoff === "linear") {
        // Linear backoff: baseDelay * attempt
        delay = baseDelay * attempt;
    } else {
        // Exponential backoff: baseDelay * (2 ^ (attempt - 1))
        delay = baseDelay * Math.pow(2, attempt - 1);
    }

    // Apply maxDelay cap
    return Math.min(delay, maxDelay);
}
