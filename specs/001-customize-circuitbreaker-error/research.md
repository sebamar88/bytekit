# Research: Customize Circuit Breaker Error Message

## Decision

We will extend `CircuitBreakerConfig` to include an optional `errorMessageFormatter` field and update the `CircuitBreaker` class to use this formatter when throwing errors in the "open" state.

## Rationale

- **Flexibility**: Allowing a function as a formatter gives the user full control over the output, satisfying the need for different units (seconds, minutes) and custom labels (e.g., "5segs", "10 mins").
- **Backward Compatibility**: By making the formatter optional and falling back to the current behavior, we ensure that existing users of `ApiClient` aren't affected.
- **Isomorphism**: The solution remains isomorphic as it doesn't depend on any Node.js-specific or Browser-specific APIs (other than basic math).

## Alternatives Considered

1. **Hardcoding more units in the default message**: Rejected because users often have specific localization needs (e.g., "segs" vs "seconds", "mins" vs "minutos").
2. **Adding a `locale` to Circuit Breaker**: Rejected because the `ApiClient` already has a locale, but the Circuit Breaker is a lower-level component that shouldn't necessarily depend on a full dictionary system. A formatter function is cleaner and more direct.

## Implementation Details

- **Location**: `src/utils/core/RetryPolicy.ts`
- **Interface Change**:
    ```typescript
    export interface CircuitBreakerConfig {
        // ... existing
        errorMessageFormatter?: (ms: number) => string;
    }
    ```
- **Class Change**:
  In `CircuitBreaker.execute`:
    ```typescript
    const retryAfter = this.getRetryAfterMs();
    const message = this.errorMessageFormatter
        ? this.errorMessageFormatter(retryAfter)
        : `Circuit breaker is open. Retry after ${retryAfter}ms`;
    throw new Error(message);
    ```

## Dependencies & Patterns

- Uses `Date.now()` which is already used in the class.
- Follows the existing strategy of passing configuration objects to constructors.

## Research Findings

- `TimeUtils.formatDuration` exists in the codebase but its format (`X.XXs`) is slightly different from the user's desired format (`Xsegs`). We should not force `TimeUtils` as the default if it changes the current behavior (which currently outputs raw `ms`).
