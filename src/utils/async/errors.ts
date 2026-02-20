/**
 * Custom error class for timeout-related failures
 */
export class TimeoutError extends Error {
    constructor(
        message: string,
        public readonly timeout: number
    ) {
        super(message);
        this.name = "TimeoutError";
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TimeoutError);
        }
    }
}

/**
 * Custom error class for abort-related failures
 */
export class AbortError extends Error {
    constructor(message: string = "Operation aborted") {
        super(message);
        this.name = "AbortError";
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AbortError);
        }
    }
}

/**
 * Custom error class for retry-related failures
 */
export class RetryError extends Error {
    constructor(
        message: string,
        public readonly attempts: number,
        public readonly lastError: unknown
    ) {
        super(message);
        this.name = "RetryError";
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RetryError);
        }
    }
}
