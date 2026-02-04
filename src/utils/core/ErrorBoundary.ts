import { Logger } from "#core/Logger.js";

export interface ErrorContext {
    component?: string;
    context?: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    originalError?: Error;
}

export interface ErrorHandler {
    (error: Error, context: ErrorContext): void | Promise<void>;
}

export interface ErrorBoundaryConfig {
    logger?: Logger;
    handlers?: ErrorHandler[];
    onError?: (error: Error, context: ErrorContext) => void;
    onErrorRecovery?: (error: Error, context: ErrorContext) => void;
    maxRetries?: number;
    retryDelay?: number;
    fallbackUI?: string;
    isDevelopment?: boolean;
}

export class AppError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number = 500,
        public readonly context?: ErrorContext,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class AppValidationError extends AppError {
    constructor(message: string, context?: ErrorContext) {
        super("VALIDATION_ERROR", message, 400, context);
        this.name = "AppValidationError";
    }
}

export class NotFoundError extends AppError {
    constructor(message: string, context?: ErrorContext) {
        super("NOT_FOUND", message, 404, context);
        this.name = "NotFoundError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string, context?: ErrorContext) {
        super("UNAUTHORIZED", message, 401, context);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string, context?: ErrorContext) {
        super("FORBIDDEN", message, 403, context);
        this.name = "ForbiddenError";
    }
}

export class ConflictError extends AppError {
    constructor(message: string, context?: ErrorContext) {
        super("CONFLICT", message, 409, context);
        this.name = "ConflictError";
    }
}

export class RateLimitError extends AppError {
    constructor(message: string, retryAfter?: number, context?: ErrorContext) {
        const contextWithRetry = retryAfter
            ? {
                  ...context,
                  metadata: { ...(context?.metadata ?? {}), retryAfter },
              }
            : context;
        super("RATE_LIMIT", message, 429, contextWithRetry);
        this.name = "RateLimitError";
    }
}

export class TimeoutError extends AppError {
    constructor(message: string, context?: ErrorContext) {
        super("TIMEOUT", message, 408, context);
        this.name = "TimeoutError";
    }
}

/**
 * Global error boundary for handling and recovering from errors
 */
export class ErrorBoundary {
    private handlers: ErrorHandler[] = [];
    private logger?: Logger;
    private onError?: (error: Error, context: ErrorContext) => void;
    private maxRetries: number;
    private retryDelay: number;
    private errorStack: Array<{
        error: Error;
        context: ErrorContext;
        timestamp: number;
    }> = [];
    private maxStackSize = 100;

    constructor(config: ErrorBoundaryConfig = {}) {
        this.logger = config.logger;
        this.handlers = config.handlers ?? [];
        this.onError = config.onError;
        this.maxRetries = config.maxRetries ?? 3;
        this.retryDelay = config.retryDelay ?? 1000;

        this.setupGlobalHandlers();
    }

    /**
     * Setup global error handlers
     */
    private setupGlobalHandlers(): void {
        if (typeof globalThis !== "undefined") {
            // Handle unhandled promise rejections
            if (typeof globalThis.addEventListener === "function") {
                globalThis.addEventListener("unhandledrejection", (event) => {
                    this.handle(
                        event.reason instanceof Error
                            ? event.reason
                            : new Error(String(event.reason)),
                        { context: "unhandledRejection" }
                    );
                });
            }

            // Handle global errors
            if (typeof globalThis.onerror === "function") {
                const originalOnError = globalThis.onerror;
                globalThis.onerror = (
                    message,
                    source,
                    lineno,
                    colno,
                    error
                ) => {
                    this.handle(
                        error instanceof Error
                            ? error
                            : new Error(String(message)),
                        {
                            context: "globalError",
                            metadata: { source, lineno, colno },
                        }
                    );
                    return originalOnError?.(
                        message,
                        source,
                        lineno,
                        colno,
                        error
                    );
                };
            }
        }
    }

    /**
     * Handle an error
     */
    async handle(error: Error, context: ErrorContext = {}): Promise<void> {
        const appError = this.normalizeError(error);

        // Add to error stack
        this.errorStack.push({
            error: appError,
            context,
            timestamp: Date.now(),
        });

        // Keep stack size manageable
        if (this.errorStack.length > this.maxStackSize) {
            this.errorStack.shift();
        }

        // Log error
        this.logger?.error(
            appError.message,
            context as Record<string, unknown>,
            appError
        );

        // Call custom error handler
        if (this.onError) {
            try {
                this.onError(appError, context);
            } catch (e: unknown) {
                const err = e instanceof Error ? e : new Error(String(e));
                this.logger?.error("Error in custom error handler", {}, err);
            }
        }

        // Execute registered handlers
        for (const handler of this.handlers) {
            try {
                await handler(appError, context);
            } catch (e: unknown) {
                const err = e instanceof Error ? e : new Error(String(e));
                this.logger?.error("Error in error handler", {}, err);
            }
        }
    }

    /**
     * Execute function with error handling and retry logic
     */
    async execute<T>(
        fn: () => Promise<T>,
        context: ErrorContext = {},
        retries = this.maxRetries
    ): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            const appError = this.normalizeError(
                error instanceof Error ? error : new Error(String(error))
            );

            if (retries > 0 && this.isRetryable(appError)) {
                this.logger?.warn(
                    `Retrying after ${this.retryDelay}ms (${retries} retries left)`,
                    context as Record<string, unknown>
                );
                await new Promise((resolve) =>
                    setTimeout(resolve, this.retryDelay)
                );
                return this.execute(fn, context, retries - 1);
            }

            await this.handle(appError, context);
            throw appError;
        }
    }

    /**
     * Execute function synchronously with error handling
     */
    executeSync<T>(fn: () => T, context: ErrorContext = {}): T {
        try {
            return fn();
        } catch (error) {
            const appError = this.normalizeError(
                error instanceof Error ? error : new Error(String(error))
            );
            this.handle(appError, context).catch((e: unknown) => {
                const err = e instanceof Error ? e : new Error(String(e));
                this.logger?.error("Error handling sync error", {}, err);
            });
            throw appError;
        }
    }

    /**
     * Wrap async function with error handling
     */
    wrap<T extends (...args: unknown[]) => Promise<unknown>>(
        fn: T,
        context?: ErrorContext
    ): T {
        return (async (...args: unknown[]) => {
            try {
                return await fn(...args);
            } catch (error) {
                const appError = this.normalizeError(
                    error instanceof Error ? error : new Error(String(error))
                );
                await this.handle(appError, context);
                throw appError;
            }
        }) as T;
    }

    /**
     * Wrap sync function with error handling
     */
    wrapSync<T extends (...args: unknown[]) => unknown>(
        fn: T,
        context?: ErrorContext
    ): T {
        return ((...args: unknown[]) => {
            try {
                return fn(...args);
            } catch (error) {
                const appError = this.normalizeError(
                    error instanceof Error ? error : new Error(String(error))
                );
                this.handle(appError, context ?? {}).catch((e: unknown) => {
                    const err = e instanceof Error ? e : new Error(String(e));
                    this.logger?.error(
                        "Error handling wrapped sync error",
                        {},
                        err
                    );
                });
                throw appError;
            }
        }) as T;
    }

    /**
     * Register error handler
     */
    addHandler(handler: ErrorHandler): void {
        this.handlers.push(handler);
    }

    /**
     * Remove error handler
     */
    removeHandler(handler: ErrorHandler): void {
        const index = this.handlers.indexOf(handler);
        if (index > -1) {
            this.handlers.splice(index, 1);
        }
    }

    /**
     * Clear all handlers
     */
    clearHandlers(): void {
        this.handlers = [];
    }

    /**
     * Get error history
     */
    getErrorHistory(
        limit = 10
    ): Array<{ error: Error; context: ErrorContext; timestamp: number }> {
        return this.errorStack.slice(-limit);
    }

    /**
     * Clear error history
     */
    clearErrorHistory(): void {
        this.errorStack = [];
    }

    /**
     * Normalize error to AppError
     */
    private normalizeError(error: Error): AppError {
        if (error instanceof AppError) {
            return error;
        }

        // Try to detect error type from message or properties
        if (
            error.message.includes("timeout") ||
            error.message.includes("Timeout")
        ) {
            return new TimeoutError(error.message, {
                originalError: error,
            });
        }

        if (
            error.message.includes("validation") ||
            error.message.includes("Validation")
        ) {
            return new AppValidationError(error.message, {
                originalError: error,
            });
        }

        if (
            error.message.includes("not found") ||
            error.message.includes("Not Found")
        ) {
            return new NotFoundError(error.message, { originalError: error });
        }

        return new AppError(
            "UNKNOWN_ERROR",
            error.message,
            500,
            { originalError: error },
            error
        );
    }

    /**
     * Check if error is retryable
     */
    private isRetryable(error: AppError): boolean {
        // Retry on timeout, rate limit, and 5xx errors
        return (
            error.statusCode === 408 ||
            error.statusCode === 429 ||
            (error.statusCode >= 500 && error.statusCode < 600)
        );
    }

    /**
     * Create error report
     */
    createErrorReport(): {
        timestamp: string;
        errors: Array<{
            code: string;
            message: string;
            statusCode: number;
            context?: ErrorContext;
            timestamp: number;
        }>;
    } {
        return {
            timestamp: new Date().toISOString(),
            errors: this.errorStack.map((item) => ({
                code:
                    item.error instanceof AppError
                        ? item.error.code
                        : "UNKNOWN",
                message: item.error.message,
                statusCode:
                    item.error instanceof AppError
                        ? item.error.statusCode
                        : 500,
                context: item.context,
                timestamp: item.timestamp,
            })),
        };
    }
}

/**
 * Global error boundary instance
 */
let globalErrorBoundary: ErrorBoundary | null = null;

/**
 * Get or create global error boundary
 */
export function getGlobalErrorBoundary(
    config?: ErrorBoundaryConfig
): ErrorBoundary {
    if (!globalErrorBoundary) {
        globalErrorBoundary = new ErrorBoundary(config);
    }
    return globalErrorBoundary;
}

/**
 * Reset global error boundary
 */
export function resetGlobalErrorBoundary(): void {
    globalErrorBoundary = null;
}
