/**
 * Time and timing utilities for debounce, throttle, delays, etc.
 */

export type DebounceOptions = {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
};

export type ThrottleOptions = {
    leading?: boolean;
    trailing?: boolean;
};

export class TimeUtils {
    /**
     * Create a debounced function
     * Delays execution until after wait ms have elapsed since last call
     */
    static debounce<T extends (...args: unknown[]) => unknown>(
        fn: T,
        wait: number,
        options: DebounceOptions = {}
    ): (...args: Parameters<T>) => void {
        const { leading = false, trailing = true, maxWait } = options;

        let timeout: NodeJS.Timeout | null = null;
        let lastCall = 0;
        let lastInvoke = 0;

        return function debounced(...args: Parameters<T>) {
            const now = Date.now();

            if (lastCall === 0 && !leading) {
                lastInvoke = now;
            }

            lastCall = now;

            if (timeout) clearTimeout(timeout);

            const timeSinceLastInvoke = now - lastInvoke;
            const shouldInvoke = trailing && timeSinceLastInvoke >= wait;

            if (maxWait && timeSinceLastInvoke >= maxWait) {
                fn(...args);
                lastInvoke = now;
                if (timeout) clearTimeout(timeout);
                return;
            }

            if (shouldInvoke) {
                fn(...args);
                lastInvoke = now;
            } else {
                timeout = setTimeout(() => {
                    if (trailing) {
                        fn(...args);
                        lastInvoke = Date.now();
                    }
                    timeout = null;
                }, wait - timeSinceLastInvoke);
            }
        };
    }

    /**
     * Create a throttled function
     * Executes at most once every wait ms
     */
    static throttle<T extends (...args: unknown[]) => unknown>(
        fn: T,
        wait: number,
        options: ThrottleOptions = {}
    ): (...args: Parameters<T>) => void {
        const { leading = true, trailing = true } = options;

        let timeout: NodeJS.Timeout | null = null;
        let lastCall = 0;

        return function throttled(...args: Parameters<T>) {
            const now = Date.now();
            const timeSinceLastCall = now - lastCall;

            if (lastCall === 0 && !leading) {
                lastCall = now;
                return;
            }

            if (timeSinceLastCall >= wait) {
                fn(...args);
                lastCall = now;
                if (timeout) clearTimeout(timeout);
            } else if (trailing && !timeout) {
                timeout = setTimeout(() => {
                    fn(...args);
                    lastCall = Date.now();
                    timeout = null;
                }, wait - timeSinceLastCall);
            }
        };
    }

    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Delay execution of a function
     */
    static delay<T>(fn: () => T, ms: number): Promise<T> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(fn());
            }, ms);
        });
    }

    /**
     * Execute function with timeout
     */
    static async timeout<T>(
        promise: Promise<T>,
        ms: number,
        message = "Operation timed out"
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(message)), ms)
            ),
        ]);
    }

    /**
     * Retry async function with exponential backoff
     */
    static async retryAsync<T>(
        fn: () => Promise<T>,
        options: {
            maxAttempts?: number;
            initialDelayMs?: number;
            maxDelayMs?: number;
            backoffMultiplier?: number;
        } = {}
    ): Promise<T> {
        const {
            maxAttempts = 3,
            initialDelayMs = 100,
            maxDelayMs = 10000,
            backoffMultiplier = 2,
        } = options;

        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                if (attempt === maxAttempts) {
                    throw lastError;
                }

                const delayMs = Math.min(
                    initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
                    maxDelayMs
                );

                await this.sleep(delayMs);
            }
        }

        throw lastError;
    }

    /**
     * Race multiple promises
     */
    static race<T>(promises: Promise<T>[]): Promise<T> {
        return Promise.race(promises);
    }

    /**
     * Wait for all promises
     */
    static all<T>(promises: Promise<T>[]): Promise<T[]> {
        return Promise.all(promises);
    }

    /**
     * Wait for any promise to settle
     */
    static allSettled<T>(
        promises: Promise<T>[]
    ): Promise<PromiseSettledResult<T>[]> {
        return Promise.allSettled(promises);
    }

    /**
     * Create a queue for async operations
     */
    static createQueue(concurrency = 1) {
        let running = 0;
        const queue: Array<() => Promise<unknown>> = [];

        const process = async () => {
            if (running >= concurrency || queue.length === 0) return;

            running++;
            const task = queue.shift();

            if (task) {
                try {
                    await task();
                } finally {
                    running--;
                    process();
                }
            }
        };

        return {
            add: <T>(fn: () => Promise<T>): Promise<T> => {
                return new Promise((resolve, reject) => {
                    queue.push(async () => {
                        try {
                            resolve(await fn());
                        } catch (error) {
                            reject(error);
                        }
                    });
                    process();
                });
            },
            size: () => queue.length + running,
        };
    }

    /**
     * Measure execution time of a function
     */
    static async measureAsync<T>(
        fn: () => Promise<T>
    ): Promise<{ result: T; durationMs: number }> {
        const start = performance.now();
        const result = await fn();
        const durationMs = performance.now() - start;
        return { result, durationMs };
    }

    /**
     * Measure execution time of a sync function
     */
    static measureSync<T>(fn: () => T): { result: T; durationMs: number } {
        const start = performance.now();
        const result = fn();
        const durationMs = performance.now() - start;
        return { result, durationMs };
    }

    /**
     * Format milliseconds to human readable string
     */
    static formatDuration(ms: number): string {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
        return `${(ms / 3600000).toFixed(2)}h`;
    }

    /**
     * Parse duration string to milliseconds
     */
    static parseDuration(duration: string): number {
        const match = duration.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)$/i);
        if (!match) throw new Error(`Invalid duration format: ${duration}`);

        const [, value, unit] = match;
        const num = parseFloat(value);

        switch (unit.toLowerCase()) {
            case "ms":
                return num;
            case "s":
                return num * 1000;
            case "m":
                return num * 60 * 1000;
            case "h":
                return num * 60 * 60 * 1000;
            case "d":
                return num * 24 * 60 * 60 * 1000;
            default:
                throw new Error(`Unknown time unit: ${unit}`);
        }
    }
}
