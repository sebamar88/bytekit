import type {
    AsyncFunction,
    ThrottleOptions,
    ThrottledFunction,
} from "./types.js";

/**
 * Creates a throttled version of an async function that limits execution frequency
 * to at most once per interval.
 *
 * @template TArgs - The argument types of the function
 * @template TReturn - The return type of the function
 * @param fn - The async function to throttle
 * @param interval - The minimum interval in milliseconds between executions
 * @param options - Optional configuration
 * @returns A throttled version of the function with a cancel method
 *
 * @example
 * ```typescript
 * const throttledAPI = throttleAsync(callAPI, 1000);
 *
 * // First call executes immediately
 * throttledAPI('request1');
 * // Second call within 1000ms is queued for trailing execution
 * throttledAPI('request2');
 * ```
 */
export function throttleAsync<TArgs extends any[], TReturn>(
    fn: AsyncFunction<TArgs, TReturn>,
    interval: number,
    options: ThrottleOptions = {}
): ThrottledFunction<TArgs, TReturn> {
    // Validate inputs
    if (typeof fn !== "function") {
        throw new TypeError("First argument must be a function");
    }
    if (typeof interval !== "number" || interval < 0) {
        throw new TypeError("Interval must be a non-negative number");
    }

    const { trailing = true } = options;

    let lastExecutionTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingArgs: TArgs | null = null;
    let pendingResolve: ((value: TReturn) => void) | null = null;
    let pendingReject: ((reason: any) => void) | null = null;

    /**
     * Executes the function with the given arguments
     */
    const execute = async (args: TArgs): Promise<TReturn> => {
        lastExecutionTime = Date.now();
        return await fn(...args);
    };

    /**
     * Executes the pending call if one exists
     */
    const executePending = async (): Promise<void> => {
        if (pendingArgs === null) return;

        const args = pendingArgs;
        const resolve = pendingResolve;
        const reject = pendingReject;

        // Clear pending state
        pendingArgs = null;
        pendingResolve = null;
        pendingReject = null;
        timeoutId = null;

        try {
            const result = await execute(args);
            resolve?.(result);
        } catch (error) {
            reject?.(error);
        }
    };

    /**
     * The throttled function
     */
    const throttled = function (...args: TArgs): Promise<TReturn> {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecutionTime;

        // If interval has elapsed, execute immediately
        if (timeSinceLastExecution >= interval) {
            return execute(args);
        }

        // If trailing is disabled, reject immediately
        if (!trailing) {
            return Promise.reject(
                new Error("Throttled call rejected (trailing disabled)")
            );
        }

        // Cancel any existing pending call
        if (pendingReject !== null) {
            pendingReject(new Error("Throttled call cancelled"));
        }

        // Clear existing timeout
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        // Store the arguments for trailing execution
        pendingArgs = args;

        // Create a new promise for this call
        const promise = new Promise<TReturn>((resolve, reject) => {
            pendingResolve = resolve;
            pendingReject = reject;
        });

        // Schedule trailing execution
        const remainingTime = interval - timeSinceLastExecution;
        timeoutId = setTimeout(() => {
            executePending();
        }, remainingTime);

        return promise;
    };

    /**
     * Cancels any queued execution and rejects pending promises
     */
    throttled.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        if (pendingReject !== null) {
            pendingReject(new Error("Throttled call cancelled"));
            pendingResolve = null;
            pendingReject = null;
        }

        pendingArgs = null;
    };

    return throttled;
}
