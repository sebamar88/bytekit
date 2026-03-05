# Quickstart: Customizing Circuit Breaker Errors

This guide shows how to configure the `ApiClient` to display human-readable errors when the circuit breaker is open.

## Basic Usage

When initializing the `ApiClient`, provide an `errorMessageFormatter` inside the `circuitBreaker` configuration.

```typescript
import { ApiClient } from "bytekit";

const client = new ApiClient({
    baseUrl: "https://api.example.com",
    circuitBreaker: {
        timeoutMs: 10000, // 10 seconds
        errorMessageFormatter: (ms) => {
            const seconds = Math.ceil(ms / 1000);
            return `Service is resting. Try again in ${seconds}s`;
        },
    },
});

// If the circuit opens and you try again immediately:
// Error: "Service is resting. Try again in 10s"
```

## Advanced Formatting (Minutes/Seconds)

You can handle multiple units to make it even more user-friendly.

```typescript
const client = new ApiClient({
    baseUrl: "https://api.example.com",
    circuitBreaker: {
        errorMessageFormatter: (ms) => {
            if (ms >= 60000) {
                const mins = Math.ceil(ms / 60000);
                return `Circuit open. Try again in ${mins} mins`;
            }
            const secs = Math.ceil(ms / 1000);
            return `Circuit open. Try again in ${secs} segs`;
        },
    },
});
```

## Default Behavior

If you don't provide a formatter, the error message remains unchanged:
`"Circuit breaker is open. Retry after 10000ms"`
