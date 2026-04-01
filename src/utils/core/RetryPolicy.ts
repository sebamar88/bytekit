/** Configuration options for the {@link RetryPolicy} class. */
export interface RetryConfig {
    /** Maximum number of attempts before giving up. Defaults to `3`. */
    maxAttempts?: number;
    /** Delay in milliseconds before the first retry. Defaults to `100`. */
    initialDelayMs?: number;
    /** Maximum delay in milliseconds between retries. Defaults to `10000`. */
    maxDelayMs?: number;
    /**
     * Multiplier applied to the delay after each failed attempt (exponential
     * backoff). Defaults to `2`.
     */
    backoffMultiplier?: number;
    /**
     * Predicate that determines whether a given error should trigger a retry.
     * Receives the error and the current attempt number (1-based).
     * Defaults to retrying on network errors and HTTP 408 / 429 / 5xx status codes.
     */
    shouldRetry?: (error: Error, attempt: number) => boolean;
}

/** Configuration options for the {@link CircuitBreaker} class. */
export interface CircuitBreakerConfig {
    /**
     * Number of consecutive failures required to open the circuit.
     * Defaults to `5`.
     */
    failureThreshold?: number;
    /**
     * Number of consecutive successes in `half-open` state required to close
     * the circuit. Defaults to `2`.
     */
    successThreshold?: number;
    /**
     * Time in milliseconds to wait in `open` state before attempting a reset
     * to `half-open`. Defaults to `60000` (60 seconds).
     */
    timeoutMs?: number;
    /**
     * Optional function to customise the error message thrown when the circuit
     * is open. Receives the number of milliseconds until the next reset attempt.
     */
    errorMessageFormatter?: (ms: number) => string;
}

/**
 * Possible states of a {@link CircuitBreaker}.
 *
 * - `"closed"` — normal operation; requests are forwarded.
 * - `"open"` — circuit is tripped; requests are rejected immediately.
 * - `"half-open"` — circuit is testing recovery; limited requests are forwarded.
 */
export type CircuitBreakerState = "closed" | "open" | "half-open";

/**
 * Implements the Circuit Breaker pattern to prevent cascading failures.
 *
 * The breaker transitions between three states: `closed` (normal operation),
 * `open` (tripped after too many failures), and `half-open` (testing recovery).
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({ failureThreshold: 3, timeoutMs: 5000 });
 * try {
 *     const result = await breaker.execute(() => fetchData());
 * } catch (error) {
 *     // Either the underlying call failed, or the circuit is open.
 * }
 * ```
 */
export class CircuitBreaker {
    private state: CircuitBreakerState = "closed";
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime?: number;
    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly timeoutMs: number;
    private readonly errorMessageFormatter?: (ms: number) => string;

    /**
     * Creates a new `CircuitBreaker` instance.
     *
     * @param config - Circuit breaker configuration.
     */
    constructor(config: CircuitBreakerConfig = {}) {
        this.failureThreshold = config.failureThreshold ?? 5;
        this.successThreshold = config.successThreshold ?? 2;
        this.timeoutMs = config.timeoutMs ?? 60000;
        this.errorMessageFormatter = config.errorMessageFormatter;
    }

    /**
     * Executes a function through the circuit breaker.
     *
     * When the circuit is `open`, immediately throws without calling `fn`.
     * When `closed` or `half-open`, calls `fn` and tracks the outcome to
     * update the circuit state.
     *
     * @template T - The return type of the wrapped function.
     * @param fn - Async function to execute.
     * @returns The resolved value of `fn`.
     * @throws {Error} If the circuit is open and the timeout has not elapsed.
     *
     * @example
     * ```typescript
     * const data = await breaker.execute(() =>
     *     fetch('/api/data').then((r) => r.json()),
     * );
     * ```
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === "open") {
            if (this.shouldAttemptReset()) {
                this.state = "half-open";
            } else {
                const retryAfter = this.getRetryAfterMs();
                let message = `Circuit breaker is open. Retry after ${retryAfter}ms`;

                if (this.errorMessageFormatter) {
                    try {
                        message = this.errorMessageFormatter(retryAfter);
                    } catch {
                        // Fallback to default message if formatter fails
                    }
                }

                throw new Error(message);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    /** @internal */
    private onSuccess(): void {
        this.failureCount = 0;

        if (this.state === "half-open") {
            this.successCount++;
            /* v8 ignore next */
            if (this.successCount >= this.successThreshold) {
                this.state = "closed";
                this.successCount = 0;
            }
        }
    }

    /** @internal */
    private onFailure(): void {
        this.lastFailureTime = Date.now();
        this.failureCount++;
        this.successCount = 0;

        if (this.failureCount >= this.failureThreshold) {
            this.state = "open";
        }
    }

    /** @internal */
    private shouldAttemptReset(): boolean {
        return (
            this.lastFailureTime !== undefined &&
            Date.now() - this.lastFailureTime >= this.timeoutMs
        );
    }

    /** @internal */
    private getRetryAfterMs(): number {
        /* v8 ignore next */
        if (this.lastFailureTime === undefined) return 0;
        const elapsed = Date.now() - this.lastFailureTime;
        return Math.max(0, this.timeoutMs - elapsed);
    }

    /**
     * Returns the current state of the circuit breaker.
     *
     * @returns The current {@link CircuitBreakerState}.
     */
    getState(): CircuitBreakerState {
        return this.state;
    }

    /**
     * Manually resets the circuit breaker to `closed` state.
     *
     * Clears all failure and success counters. Useful in tests or when
     * manually recovering from an incident.
     *
     * @example
     * ```typescript
     * breaker.reset();
     * console.log(breaker.getState()); // "closed"
     * ```
     */
    reset(): void {
        this.state = "closed";
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = undefined;
    }
}

/**
 * Implements a retry policy with configurable exponential backoff and jitter.
 *
 * Automatically retries a failing async operation up to a configured maximum
 * number of attempts, applying a jittered exponential delay between each
 * attempt to avoid thundering-herd problems.
 *
 * @example
 * ```typescript
 * const policy = new RetryPolicy({ maxAttempts: 5, initialDelayMs: 200 });
 * const data = await policy.execute(() => fetchData());
 * ```
 */
export class RetryPolicy {
    private readonly maxAttempts: number;
    private readonly initialDelayMs: number;
    private readonly maxDelayMs: number;
    private readonly backoffMultiplier: number;
    private readonly shouldRetry: (error: Error, attempt: number) => boolean;

    /**
     * Creates a new `RetryPolicy` instance.
     *
     * @param config - Retry configuration.
     */
    constructor(config: RetryConfig = {}) {
        this.maxAttempts = config.maxAttempts ?? 3;
        this.initialDelayMs = config.initialDelayMs ?? 100;
        this.maxDelayMs = config.maxDelayMs ?? 10000;
        this.backoffMultiplier = config.backoffMultiplier ?? 2;
        this.shouldRetry =
            config.shouldRetry ?? ((error) => this.isRetryableError(error));
    }

    /**
     * Executes a function, retrying on failure according to the configured policy.
     *
     * @template T - The return type of the wrapped function.
     * @param fn - Async function to execute and potentially retry.
     * @returns The resolved value of `fn` on a successful attempt.
     * @throws {Error} The last encountered error once all attempts are exhausted.
     *
     * @example
     * ```typescript
     * const result = await policy.execute(() =>
     *     fetch('/api').then((r) => r.json()),
     * );
     * ```
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                if (
                    attempt === this.maxAttempts ||
                    !this.shouldRetry(lastError, attempt)
                ) {
                    throw lastError;
                }

                const delayMs = this.calculateDelay(attempt);
                await this.sleep(delayMs);
            }
        }

        throw lastError ?? new Error("Retry policy failed");
    }

    /** @internal */
    private calculateDelay(attempt: number): number {
        const exponentialDelay =
            this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt - 1);
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const randomValue = array[0] / (0xffffffff + 1);
        const jitter = randomValue * 0.1 * exponentialDelay;
        return Math.min(exponentialDelay + jitter, this.maxDelayMs);
    }

    /** @internal */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /** @internal */
    private isRetryableError(error: Error): boolean {
        const status = (error as { status?: number }).status;
        if (typeof status === "number") {
            return status === 408 || status === 429 || status >= 500;
        }

        // Retry on network errors and timeouts
        const message = error.message.toLowerCase();
        return (
            message.includes("timeout") ||
            message.includes("network") ||
            message.includes("econnrefused") ||
            message.includes("econnreset")
        );
    }

    /**
     * Returns a snapshot of the policy's current configuration.
     *
     * @returns An object containing all configured retry parameters.
     *
     * @example
     * ```typescript
     * const { maxAttempts, initialDelayMs } = policy.getConfig();
     * ```
     */
    getConfig(): {
        maxAttempts: number;
        initialDelayMs: number;
        maxDelayMs: number;
        backoffMultiplier: number;
        shouldRetry: (error: Error, attempt: number) => boolean;
    } {
        return {
            maxAttempts: this.maxAttempts,
            initialDelayMs: this.initialDelayMs,
            maxDelayMs: this.maxDelayMs,
            backoffMultiplier: this.backoffMultiplier,
            shouldRetry: this.shouldRetry,
        };
    }
}
