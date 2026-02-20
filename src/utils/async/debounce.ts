import type {
    AsyncFunction,
    DebounceOptions,
    DebouncedFunction,
} from "./types.js";

/**
 * Creates a debounced version of an async function that delays execution until after
 * the specified delay has elapsed since the last call.
 *
 * @template TArgs - The argument types of the function
 * @template TReturn - The return type of the function
 * @param fn - The async function to debounce
 * @param delay - The delay in milliseconds
 * @param options - Optional configuration
 * @returns A debounced version of the function with cancel and flush methods
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounceAsync(searchAPI, 300);
 *
 * // Only the last call within 300ms will execute
 * debouncedSearch('query1');
 * debouncedSearch('query2');
 * debouncedSearch('query3'); // Only this executes after 300ms
 * ```
 */
export function debounceAsync<TArgs extends any[], TReturn>(
    fn: AsyncFunction<TArgs, TReturn>,
    delay: number,
    options: DebounceOptions = {}
): DebouncedFunction<TArgs, TReturn> {
    // Validate inputs
    if (typeof fn !== "function") {
        throw new TypeError("First argument must be a function");
    }
    if (typeof delay !== "number" || delay < 0) {
        throw new TypeError("Delay must be a non-negative number");
    }

    const { leading = false, trailing = options.leading === true ? false : true } = options;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingArgs: TArgs | null = null;
    let pendingResolve: ((value: TReturn) => void) | null = null;
    let pendingReject: ((reason: any) => void) | null = null;
    let lastCallTime = 0;

    /**
     * Executes the function with the pending arguments
     */
    const execute = async (): Promise<void> => {
        if (pendingArgs === null) return;

        const args = pendingArgs;
        const resolve = pendingResolve;
        const reject = pendingReject;

        // Clear pending state
        pendingArgs = null;
        pendingResolve = null;
        pendingReject = null;

        try {
            const result = await fn(...args);
            resolve?.(result);
        } catch (error) {
            reject?.(error);
        }
    };

    /**
     * The debounced function
     */
    const debounced = function (...args: TArgs): Promise<TReturn> {
        const now = Date.now();
        const isInvoking = leading && (now - lastCallTime >= delay || lastCallTime === 0);
        
        lastCallTime = now;
        pendingArgs = args;

        // Create a new promise for this call
        const promise = new Promise<TReturn>((resolve, reject) => {
            // Reject previous pending promise
            if (pendingResolve !== null) {
                pendingReject?.(new Error("Debounced call cancelled"));
            }

            pendingResolve = resolve;
            pendingReject = reject;
        });

        // Clear existing timeout
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        if (isInvoking) {
            execute();
        } else if (!trailing) {
            // If not invoking and trailing is disabled, we must still handle the promise
            // and we should probably reject it as it won't be executed.
            pendingReject?.(new Error("Debounced call cancelled"));
            pendingResolve = null;
            pendingReject = null;
        }

        // Schedule execution for trailing edge if allowed
        if (trailing) {
            timeoutId = setTimeout(() => {
                timeoutId = null;
                execute();
            }, delay);
        } else {
            // If no trailing edge, we still need a timeout to reset the leading ability after delay
            timeoutId = setTimeout(() => {
                timeoutId = null;
            }, delay);
        }

        return promise;
    };

    /**
     * Cancels any pending execution and rejects pending promises
     */
    debounced.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        if (pendingReject !== null) {
            pendingReject(new Error("Debounced call cancelled"));
            pendingResolve = null;
            pendingReject = null;
        }

        pendingArgs = null;
        lastCallTime = 0;
    };

    /**
     * Immediately executes any pending call and returns its result
     */
    debounced.flush = async (): Promise<TReturn | undefined> => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        if (pendingArgs !== null) {
            lastCallTime = 0;
            await execute();
            // The execute function already resolved/rejected the promise
            return undefined;
        }

        return undefined;
    };

    return debounced;
}
