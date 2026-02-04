export interface RateLimiterConfig {
    maxRequests?: number;
    windowMs?: number;
    keyGenerator?: (url: string) => string;
}

export interface RateLimiterStats {
    remaining: number;
    limit: number;
    resetAt: number;
    retryAfter?: number;
}

/**
 * Token bucket rate limiter
 * Allows bursts but maintains average rate
 */
export class RateLimiter {
    private buckets: Map<string, { tokens: number; lastRefill: number }> =
        new Map();
    private readonly maxRequests: number;
    private readonly windowMs: number;
    private readonly keyGenerator: (url: string) => string;

    constructor(config: RateLimiterConfig = {}) {
        this.maxRequests = config.maxRequests ?? 100;
        this.windowMs = config.windowMs ?? 60 * 1000; // 1 minute
        this.keyGenerator =
            config.keyGenerator ?? ((url) => new URL(url).hostname);
    }

    /**
     * Check if request is allowed
     */
    isAllowed(url: string): boolean {
        const key = this.keyGenerator(url);
        const now = Date.now();
        let bucket = this.buckets.get(key);

        if (!bucket) {
            bucket = { tokens: this.maxRequests, lastRefill: now };
            this.buckets.set(key, bucket);
        }

        // Refill tokens based on time elapsed
        const timePassed = now - bucket.lastRefill;
        const tokensToAdd = (timePassed / this.windowMs) * this.maxRequests;
        bucket.tokens = Math.min(this.maxRequests, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return true;
        }

        return false;
    }

    /**
     * Get rate limiter stats for a URL
     */
    getStats(url: string): RateLimiterStats {
        const key = this.keyGenerator(url);
        const now = Date.now();
        const bucket = this.buckets.get(key);

        if (!bucket) {
            return {
                remaining: this.maxRequests,
                limit: this.maxRequests,
                resetAt: now + this.windowMs,
            };
        }

        const timePassed = now - bucket.lastRefill;
        const tokensToAdd = (timePassed / this.windowMs) * this.maxRequests;
        const currentTokens = Math.min(
            this.maxRequests,
            bucket.tokens + tokensToAdd
        );
        const remaining = Math.floor(currentTokens);

        return {
            remaining,
            limit: this.maxRequests,
            resetAt: bucket.lastRefill + this.windowMs,
            retryAfter:
                remaining === 0
                    ? Math.ceil((this.windowMs - timePassed) / 1000)
                    : undefined,
        };
    }

    /**
     * Reset rate limiter for a specific URL
     */
    reset(url: string): void {
        const key = this.keyGenerator(url);
        this.buckets.delete(key);
    }

    /**
     * Reset all rate limiters
     */
    resetAll(): void {
        this.buckets.clear();
    }

    /**
     * Wait until request is allowed (blocking)
     */
    async waitForAllowance(url: string): Promise<void> {
        while (!this.isAllowed(url)) {
            const stats = this.getStats(url);
            const waitTime = Math.min(stats.retryAfter ?? 1, 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }
}

/**
 * Sliding window rate limiter
 * More accurate but uses more memory
 */
export class SlidingWindowRateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly maxRequests: number;
    private readonly windowMs: number;
    private readonly keyGenerator: (url: string) => string;

    constructor(config: RateLimiterConfig = {}) {
        this.maxRequests = config.maxRequests ?? 100;
        this.windowMs = config.windowMs ?? 60 * 1000;
        this.keyGenerator =
            config.keyGenerator ?? ((url) => new URL(url).hostname);
    }

    /**
     * Check if request is allowed
     */
    isAllowed(url: string): boolean {
        const key = this.keyGenerator(url);
        const now = Date.now();
        let timestamps = this.requests.get(key);

        if (!timestamps) {
            timestamps = [];
            this.requests.set(key, timestamps);
        }

        // Remove old requests outside the window
        const cutoff = now - this.windowMs;
        const validRequests = timestamps.filter((t) => t > cutoff);

        if (validRequests.length < this.maxRequests) {
            validRequests.push(now);
            this.requests.set(key, validRequests);
            return true;
        }

        return false;
    }

    /**
     * Get rate limiter stats
     */
    getStats(url: string): RateLimiterStats {
        const key = this.keyGenerator(url);
        const now = Date.now();
        const timestamps = this.requests.get(key) ?? [];

        const cutoff = now - this.windowMs;
        const validRequests = timestamps.filter((t) => t > cutoff);
        const remaining = Math.max(0, this.maxRequests - validRequests.length);

        const oldestRequest = validRequests[0];
        const resetAt = oldestRequest
            ? oldestRequest + this.windowMs
            : now + this.windowMs;

        return {
            remaining,
            limit: this.maxRequests,
            resetAt,
            retryAfter:
                remaining === 0 ? Math.ceil((resetAt - now) / 1000) : undefined,
        };
    }

    /**
     * Reset rate limiter for a specific URL
     */
    reset(url: string): void {
        const key = this.keyGenerator(url);
        this.requests.delete(key);
    }

    /**
     * Reset all rate limiters
     */
    resetAll(): void {
        this.requests.clear();
    }

    /**
     * Wait until request is allowed
     */
    async waitForAllowance(url: string): Promise<void> {
        while (!this.isAllowed(url)) {
            const stats = this.getStats(url);
            const waitTime = Math.min(stats.retryAfter ?? 1, 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }
}
