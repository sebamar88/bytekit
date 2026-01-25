/**
 * Polling helper with intelligent backoff and stop conditions
 * Adaptive polling for status checks, webhooks, etc.
 */

export interface PollingOptions<T = unknown> {
    interval?: number;
    maxAttempts?: number;
    maxDuration?: number;
    backoffMultiplier?: number;
    maxBackoffInterval?: number;
    stopCondition?: (result: T) => boolean;
    onAttempt?: (attempt: number, result?: T, error?: Error) => void;
    onSuccess?: (result: T, attempts: number) => void;
    onError?: (error: Error, attempts: number) => void;
    /** Add random jitter to intervals (true = 10%, number = custom percentage 0-100) */
    jitter?: boolean | number;
    /** Timeout for each individual attempt in milliseconds */
    attemptTimeout?: number;
    /** Whether to retry on error (default: true) */
    retryOnError?: boolean;
    /** Base for exponential backoff (default: 2) */
    exponentialBase?: number;
}

export interface PollingResult<T = unknown> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
    duration: number;
    /** Performance metrics for successful attempts */
    metrics?: {
        minResponseTime: number;
        maxResponseTime: number;
        avgResponseTime: number;
    };
}

/**
 * Polling helper for repeated operations with backoff
 */
export class PollingHelper<T = unknown> {
    private fn: () => Promise<T>;
    private options: Required<Omit<PollingOptions<T>, 'attemptTimeout'>> & { attemptTimeout?: number };
    private abortController: AbortController | null = null;

    constructor(fn: () => Promise<T>, options: PollingOptions<T> = {}) {
        this.fn = fn;
        this.options = {
            interval: options.interval ?? 1000,
            maxAttempts: options.maxAttempts ?? Infinity,
            maxDuration: options.maxDuration ?? Infinity,
            backoffMultiplier: options.backoffMultiplier ?? 1,
            maxBackoffInterval: options.maxBackoffInterval ?? 30000,
            stopCondition: options.stopCondition ?? (() => true),
            onAttempt: options.onAttempt ?? (() => {}),
            onSuccess: options.onSuccess ?? (() => {}),
            onError: options.onError ?? (() => {}),
            jitter: options.jitter ?? false,
            attemptTimeout: options.attemptTimeout,
            retryOnError: options.retryOnError ?? true,
            exponentialBase: options.exponentialBase ?? 2,
        };
        this.validateOptions();
    }

    /**
     * Start polling
     */
    async start(): Promise<PollingResult<T>> {
        const startTime = Date.now();
        let attempt = 0;
        let currentInterval = this.options.interval;
        let lastError: Error | undefined;
        let lastResult: T | undefined;
        const responseTimes: number[] = [];

        while (attempt < this.options.maxAttempts) {
            // Check if aborted
            if (this.abortController?.signal.aborted) {
                return {
                    success: false,
                    error: new Error("Polling aborted"),
                    attempts: attempt,
                    duration: Date.now() - startTime,
                };
            }

            const elapsed = Date.now() - startTime;
            if (elapsed > this.options.maxDuration) {
                return {
                    success: false,
                    error: new Error("Polling timeout exceeded"),
                    attempts: attempt,
                    duration: elapsed,
                };
            }

            attempt++;

            try {
                const attemptStartTime = Date.now();
                
                // Execute with optional timeout
                lastResult = this.options.attemptTimeout
                    ? await this.executeWithTimeout(
                          this.fn(),
                          this.options.attemptTimeout
                      )
                    : await this.fn();
                
                const responseTime = Date.now() - attemptStartTime;
                responseTimes.push(responseTime);
                
                this.options.onAttempt(attempt, lastResult);

                if (this.options.stopCondition(lastResult)) {
                    this.options.onSuccess(lastResult, attempt);
                    return {
                        success: true,
                        result: lastResult,
                        attempts: attempt,
                        duration: Date.now() - startTime,
                        metrics: this.calculateMetrics(responseTimes),
                    };
                }
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));
                this.options.onAttempt(attempt, undefined, lastError);
                
                // If retryOnError is false, stop immediately
                if (!this.options.retryOnError) {
                    this.options.onError(lastError, attempt);
                    return {
                        success: false,
                        error: lastError,
                        attempts: attempt,
                        duration: Date.now() - startTime,
                        metrics: this.calculateMetrics(responseTimes),
                    };
                }
            }

            if (attempt < this.options.maxAttempts) {
                const delayTime = this.applyJitter(currentInterval);
                await this.delay(delayTime);
                currentInterval = Math.min(
                    currentInterval * this.options.backoffMultiplier,
                    this.options.maxBackoffInterval
                );
            }
        }

        this.options.onError(
            lastError || new Error("Max attempts exceeded"),
            attempt
        );
        return {
            success: false,
            error: lastError || new Error("Max attempts exceeded"),
            attempts: attempt,
            duration: Date.now() - startTime,
            metrics: this.calculateMetrics(responseTimes),
        };
    }

    /**
     * Start polling with abort capability
     */
    async startWithAbort(): Promise<PollingResult<T>> {
        this.abortController = new AbortController();
        return this.start();
    }

    /**
     * Abort polling
     */
    abort(): void {
        this.abortController?.abort();
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Validate polling options
     */
    private validateOptions(): void {
        if (this.options.interval <= 0) {
            throw new Error("interval must be greater than 0");
        }
        if (this.options.maxAttempts <= 0) {
            throw new Error("maxAttempts must be greater than 0");
        }
        if (this.options.maxDuration <= 0) {
            throw new Error("maxDuration must be greater than 0");
        }
        if (this.options.backoffMultiplier < 1) {
            throw new Error("backoffMultiplier must be >= 1");
        }
        if (this.options.maxBackoffInterval < this.options.interval) {
            throw new Error("maxBackoffInterval must be >= interval");
        }
        if (typeof this.options.jitter === "number") {
            if (this.options.jitter < 0 || this.options.jitter > 100) {
                throw new Error("jitter percentage must be between 0 and 100");
            }
        }
        if (
            this.options.attemptTimeout !== undefined &&
            this.options.attemptTimeout <= 0
        ) {
            throw new Error("attemptTimeout must be greater than 0");
        }
        if (this.options.exponentialBase < 1) {
            throw new Error("exponentialBase must be >= 1");
        }
    }

    /**
     * Apply jitter to interval
     */
    private applyJitter(interval: number): number {
        if (!this.options.jitter) return interval;

        const jitterPercent =
            typeof this.options.jitter === "number" ? this.options.jitter : 10;
        const jitterAmount = interval * (jitterPercent / 100);
        // Add random jitter: -jitterAmount to +jitterAmount
        return interval + (Math.random() * jitterAmount * 2 - jitterAmount);
    }

    /**
     * Execute promise with timeout
     */
    private async executeWithTimeout<R>(
        promise: Promise<R>,
        timeout: number
    ): Promise<R> {
        return Promise.race([
            promise,
            new Promise<R>((_, reject) =>
                setTimeout(
                    () => reject(new Error("Attempt timeout exceeded")),
                    timeout
                )
            ),
        ]);
    }

    /**
     * Calculate performance metrics
     */
    private calculateMetrics(
        responseTimes: number[]
    ):
        | { minResponseTime: number; maxResponseTime: number; avgResponseTime: number }
        | undefined {
        if (responseTimes.length === 0) return undefined;

        const min = Math.min(...responseTimes);
        const max = Math.max(...responseTimes);
        const avg =
            responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length;

        return {
            minResponseTime: min,
            maxResponseTime: max,
            avgResponseTime: Math.round(avg * 100) / 100, // Round to 2 decimals
        };
    }

    /**
     * Poll until condition is met
     */
    static async poll<T>(
        fn: () => Promise<T>,
        options: PollingOptions<T> = {}
    ): Promise<PollingResult<T>> {
        const poller = new PollingHelper(fn, options);
        return poller.start();
    }

    /**
     * Poll with exponential backoff
     */
    static async pollWithBackoff<T>(
        fn: () => Promise<T>,
        options: PollingOptions<T> = {}
    ): Promise<PollingResult<T>> {
        const poller = new PollingHelper(fn, {
            ...options,
            backoffMultiplier: options.backoffMultiplier ?? 2,
            maxBackoffInterval: options.maxBackoffInterval ?? 30000,
        });
        return poller.start();
    }

    /**
     * Poll with linear backoff
     */
    static async pollWithLinearBackoff<T>(
        fn: () => Promise<T>,
        options: PollingOptions<T> = {}
    ): Promise<PollingResult<T>> {
        const poller = new PollingHelper(fn, {
            ...options,
            backoffMultiplier: options.backoffMultiplier ?? 1.5,
        });
        return poller.start();
    }
}

/**
 * Factory function for creating pollers
 */
export function createPoller<T = unknown>(
    fn: () => Promise<T>,
    options?: PollingOptions<T>
): PollingHelper<T> {
    return new PollingHelper(fn, options);
}
