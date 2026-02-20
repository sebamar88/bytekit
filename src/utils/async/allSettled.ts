import type { AllSettledResult } from "./types.js";

/**
 * Better handling of Promise.allSettled results
 *
 * Wraps native Promise.allSettled to provide a more convenient API
 * that separates fulfilled and rejected results into separate arrays,
 * each with the original index for traceability.
 *
 * @template T - The type of values in the promises
 * @param promises - Array of promises to settle
 * @returns Promise that resolves with separated fulfilled and rejected results
 *
 * @example
 * ```typescript
 * const promises = [
 *   Promise.resolve(1),
 *   Promise.reject(new Error('failed')),
 *   Promise.resolve(3)
 * ];
 *
 * const result = await allSettled(promises);
 * // result.fulfilled: [{ value: 1, index: 0 }, { value: 3, index: 2 }]
 * // result.rejected: [{ reason: Error('failed'), index: 1 }]
 * ```
 */
export async function allSettled<T>(
    promises: Array<Promise<T>>
): Promise<AllSettledResult<T>> {
    // Validate input
    if (!Array.isArray(promises)) {
        throw new TypeError("Expected an array of promises");
    }

    // Use native Promise.allSettled to wait for all promises to settle
    const results = await Promise.allSettled(promises);

    // Separate fulfilled and rejected results with original indices
    const fulfilled: Array<{ value: T; index: number }> = [];
    const rejected: Array<{ reason: unknown; index: number }> = [];

    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            fulfilled.push({ value: result.value, index });
        } else {
            rejected.push({ reason: result.reason, index });
        }
    });

    return { fulfilled, rejected };
}
