/**
 * Type definitions for AsyncUtils module
 */

/**
 * Backoff strategy for retry operations
 * - 'linear': delay increases linearly (baseDelay * attempt)
 * - 'exponential': delay increases exponentially (baseDelay * 2^(attempt-1))
 * - Custom function: user-provided function that takes attempt number and returns delay in ms
 */
export type BackoffStrategy =
    | "linear"
    | "exponential"
    | ((attempt: number) => number);

/**
 * A task function that returns a Promise
 */
export type Task<T> = () => Promise<T>;

/**
 * A sequential task function that can receive the previous result
 */
export type SequentialTask<T> = (previousResult?: any) => Promise<T>;

/**
 * Generic async function type
 */
export type AsyncFunction<TArgs extends any[], TReturn> = (
    ...args: TArgs
) => Promise<TReturn>;

/**
 * Options for retry operations
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Base delay in milliseconds between retries (default: 1000) */
    baseDelay?: number;
    /** Maximum delay cap in milliseconds (default: Infinity) */
    maxDelay?: number;
    /** Backoff strategy to use (default: 'exponential') */
    backoff?: BackoffStrategy;
    /** Predicate to determine if an error should trigger a retry */
    shouldRetry?: (error: unknown) => boolean;
    /** AbortSignal for cancellation support */
    signal?: AbortSignal;
}

/**
 * Options for parallel execution
 */
export interface ParallelOptions {
    /** Maximum number of concurrent executions (default: unlimited) */
    concurrency?: number;
}

/**
 * Options for sequential execution
 */
export interface SequentialOptions {
    /** Whether to continue executing tasks after an error (default: false) */
    continueOnError?: boolean;
}

/**
 * Result of allSettled operation
 */
export interface AllSettledResult<T> {
    /** Array of fulfilled promises with their values and original indices */
    fulfilled: Array<{ value: T; index: number }>;
    /** Array of rejected promises with their reasons and original indices */
    rejected: Array<{ reason: unknown; index: number }>;
}

/**
 * Options for debounce operations
 */
export interface DebounceOptions {
    /** Execute on the leading edge instead of trailing (default: false) */
    leading?: boolean;
}

/**
 * Debounced function with additional control methods
 */
export interface DebouncedFunction<TArgs extends any[], TReturn> {
    /** Call the debounced function */
    (...args: TArgs): Promise<TReturn>;
    /** Cancel any pending execution */
    cancel(): void;
    /** Immediately execute any pending call */
    flush(): Promise<TReturn | undefined>;
}

/**
 * Options for throttle operations
 */
export interface ThrottleOptions {
    /** Execute the last call after the interval (default: true) */
    trailing?: boolean;
}

/**
 * Throttled function with additional control methods
 */
export interface ThrottledFunction<TArgs extends any[], TReturn> {
    /** Call the throttled function */
    (...args: TArgs): Promise<TReturn>;
    /** Cancel any queued execution */
    cancel(): void;
}
