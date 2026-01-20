export interface RetryConfig {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface CircuitBreakerConfig {
    failureThreshold?: number;
    successThreshold?: number;
    timeoutMs?: number;
}

export type CircuitBreakerState = "closed" | "open" | "half-open";

export class CircuitBreaker {
    private state: CircuitBreakerState = "closed";
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime?: number;
    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly timeoutMs: number;

    constructor(config: CircuitBreakerConfig = {}) {
        this.failureThreshold = config.failureThreshold ?? 5;
        this.successThreshold = config.successThreshold ?? 2;
        this.timeoutMs = config.timeoutMs ?? 60000;
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === "open") {
            if (this.shouldAttemptReset()) {
                this.state = "half-open";
            } else {
                throw new Error(
                    `Circuit breaker is open. Retry after ${this.getRetryAfterMs()}ms`
                );
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

    private onSuccess(): void {
        this.failureCount = 0;

        if (this.state === "half-open") {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.state = "closed";
                this.successCount = 0;
            }
        }
    }

    private onFailure(): void {
        this.lastFailureTime = Date.now();
        this.failureCount++;
        this.successCount = 0;

        if (this.failureCount >= this.failureThreshold) {
            this.state = "open";
        }
    }

    private shouldAttemptReset(): boolean {
        return (
            this.lastFailureTime !== undefined &&
            Date.now() - this.lastFailureTime >= this.timeoutMs
        );
    }

    private getRetryAfterMs(): number {
        if (this.lastFailureTime === undefined) return 0;
        const elapsed = Date.now() - this.lastFailureTime;
        return Math.max(0, this.timeoutMs - elapsed);
    }

    getState(): CircuitBreakerState {
        return this.state;
    }

    reset(): void {
        this.state = "closed";
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = undefined;
    }
}

export class RetryPolicy {
    private readonly maxAttempts: number;
    private readonly initialDelayMs: number;
    private readonly maxDelayMs: number;
    private readonly backoffMultiplier: number;
    private readonly shouldRetry: (error: Error, attempt: number) => boolean;

    constructor(config: RetryConfig = {}) {
        this.maxAttempts = config.maxAttempts ?? 3;
        this.initialDelayMs = config.initialDelayMs ?? 100;
        this.maxDelayMs = config.maxDelayMs ?? 10000;
        this.backoffMultiplier = config.backoffMultiplier ?? 2;
        this.shouldRetry =
            config.shouldRetry ?? ((error) => this.isRetryableError(error));
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt === this.maxAttempts || !this.shouldRetry(lastError, attempt)) {
                    throw lastError;
                }

                const delayMs = this.calculateDelay(attempt);
                await this.sleep(delayMs);
            }
        }

        throw lastError ?? new Error("Retry policy failed");
    }

    private calculateDelay(attempt: number): number {
        const exponentialDelay =
            this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return Math.min(exponentialDelay + jitter, this.maxDelayMs);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

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
}
