/**
 * Enhanced Promise.race implementation with better error handling
 *
 * Unlike native Promise.race, this implementation:
 * - Validates non-empty array input
 * - Returns AggregateError when all promises reject
 * - Tracks all promise settlements for comprehensive error reporting
 */

/**
 * Race multiple promises and resolve/reject with the first settled promise.
 * If all promises reject, rejects with an AggregateError containing all rejection reasons.
 *
 * @param promises - Array of promises to race
 * @returns Promise that resolves/rejects with the first settled promise
 * @throws TypeError if promises array is empty
 *
 * @example
 * ```typescript
 * // Resolves with the fastest promise
 * const result = await race([
 *   fetch('/api/fast'),
 *   fetch('/api/slow')
 * ]);
 *
 * // Rejects with AggregateError if all fail
 * try {
 *   await race([
 *     Promise.reject('error 1'),
 *     Promise.reject('error 2')
 *   ]);
 * } catch (error) {
 *   console.log(error.errors); // ['error 1', 'error 2']
 * }
 * ```
 */
export function race<T>(promises: Array<Promise<T>>): Promise<T> {
    // Validate non-empty array
    if (!Array.isArray(promises)) {
        throw new TypeError("Expected an array of promises");
    }

    if (promises.length === 0) {
        throw new TypeError("Cannot race an empty array of promises");
    }

    // Use native Promise.race for the core behavior
    // But also track if all promises reject to provide AggregateError
    return new Promise<T>((resolve, reject) => {
        let rejectionCount = 0;
        const errors: unknown[] = new Array(promises.length);
        let settled = false;

        promises.forEach((promise, index) => {
            Promise.resolve(promise).then(
                (value) => {
                    if (!settled) {
                        settled = true;
                        resolve(value);
                    }
                },
                (error) => {
                    errors[index] = error;
                    rejectionCount++;

                    // If all promises have rejected, reject with AggregateError
                    if (rejectionCount === promises.length) {
                        if (!settled) {
                            settled = true;
                            reject(
                                new AggregateError(
                                    errors,
                                    `All ${promises.length} promises rejected`
                                )
                            );
                        }
                    }
                    // If this is the first to settle (and it's a rejection), reject immediately
                    else if (!settled) {
                        settled = true;
                        reject(error);
                    }
                }
            );
        });
    });
}
