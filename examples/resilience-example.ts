import { ApiClient, RateLimiter, createLogger } from "bytekit";

/**
 * Example: Combining Retries, Circuit Breakers, and Rate Limiting
 */
export async function configureBulletproofClient() {
    const logger = createLogger({ namespace: "API" });

    // 1. Setup global rate limiter (e.g. max 10 requests per second)
    const rateLimiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 1000
    });

    const api = new ApiClient({
        baseUrl: "https://api.example.com",
        logger, // Attach logger for structured logging of retries

        // 2. Setup Retry Policy (Transient failures)
        retryPolicy: {
            maxAttempts: 3,
            initialDelayMs: 200,
            backoffMultiplier: 2
        },

        // 3. Setup Circuit Breaker (Cascading failures)
        circuitBreaker: {
            failureThreshold: 5,
            resetTimeoutMs: 30000
        }
    });

    // 4. Connect Rate Limiter via Interceptor
    api.addInterceptor({
        request: async (url, init) => {
            await rateLimiter.waitForAllowance(url);
            return [url, init];
        }
    });

    return api;
}
