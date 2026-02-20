/**
 * AsyncUtils Module
 *
 * Comprehensive utilities for managing asynchronous operations in TypeScript.
 * Provides Promise-based utilities for delays, timeouts, retries, parallel/sequential
 * execution, and rate limiting with zero dependencies.
 */

// Export error classes
export { TimeoutError, AbortError, RetryError } from "./errors.js";

// Export type definitions
export type {
    BackoffStrategy,
    Task,
    SequentialTask,
    AsyncFunction,
    RetryOptions,
    ParallelOptions,
    SequentialOptions,
    AllSettledResult,
    DebounceOptions,
    DebouncedFunction,
    ThrottleOptions,
    ThrottledFunction,
} from "./types.js";

// Utility functions will be exported as they are implemented
export { sleep } from "./sleep.js";
export { timeout, withTimeout } from "./timeout.js";
export { retry } from "./retry.js";
export { parallel } from "./parallel.js";
export { sequential } from "./sequential.js";
export { race } from "./race.js";
export { allSettled } from "./allSettled.js";
export { debounceAsync } from "./debounce.js";
export { throttleAsync } from "./throttle.js";
