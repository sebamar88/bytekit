import { ApiClient, RateLimiter, createLogger } from "bytekit";

/**
 * Example: Combining Retries, Circuit Breakers, and Rate Limiting
 */
export async function configureBulletproofClient() {
    const logger = createLogger({ namespace: "API" });

    const api = new ApiClient({
        baseUrl: "https://api.example.com",
        logger, // Attach logger for structured logging of retries

        // 1. Setup Retry Policy (Transient failures)
        retryPolicy: {
            maxAttempts: 3,
            initialDelayMs: 200,
            backoffMultiplier: 2
        },

        // 2. Setup Circuit Breaker (Cascading failures)
        circuitBreaker: {
            failureThreshold: 5,
            resetTimeoutMs: 30000
        },

        // 3. Setup global rate limiter (e.g. max 10 requests per second)
        rateLimiter: {
            maxRequests: 10,
            windowMs: 1000
        }
    });

    return api;
}
