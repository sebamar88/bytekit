import { AbortError } from "./errors.js";

/**
 * Promise-based delay function with optional cancellation support
 *
 * @param ms - Duration to sleep in milliseconds (must be non-negative)
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after the specified duration
 * @throws {TypeError} If ms is negative
 * @throws {AbortError} If the operation is aborted via AbortSignal
 *
 * @example
 * ```typescript
 * // Basic usage
 * await sleep(1000); // Wait 1 second
 *
 * // With cancellation
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 500);
 * try {
 *   await sleep(1000, controller.signal);
 * } catch (error) {
 *   if (error instanceof AbortError) {
 *     console.log('Sleep was cancelled');
 *   }
 * }
 * ```
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    // Validate input
    if (ms < 0) {
        throw new TypeError(
            `Sleep duration must be non-negative, got ${ms} milliseconds`
        );
    }

    // Check if already aborted
    if (signal?.aborted) {
        return Promise.reject(new AbortError("Sleep aborted before starting"));
    }

    return new Promise<void>((resolve, reject) => {
        // Handle zero milliseconds - resolve immediately
        if (ms === 0) {
            resolve();
            return;
        }

        // Set up the timeout
        const timeoutId = setTimeout(() => {
            cleanup();
            resolve();
        }, ms);

        // Set up abort handler
        const abortHandler = () => {
            cleanup();
            reject(new AbortError("Sleep aborted"));
        };

        // Cleanup function to prevent memory leaks
        const cleanup = () => {
            clearTimeout(timeoutId);
            signal?.removeEventListener("abort", abortHandler);
        };

        // Register abort listener if signal provided
        if (signal) {
            signal.addEventListener("abort", abortHandler, { once: true });
        }
    });
}
