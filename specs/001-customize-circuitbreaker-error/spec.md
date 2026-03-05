# Feature Specification: Customize Circuit Breaker Error Message

**Feature Branch**: `001-customize-circuitbreaker-error`  
**Created**: 2026-03-05
**Status**: Draft  
**Input**: User description: "añadir a la inicializacion de la class apiClient, para posibilidad de modificar el error 'CircuitBreaker' para mostrar el error dependiendo de la cantidad de ms, ejemplo si son 5000ms q diga 5segs, si son 600000ms q diga 10 mins, ese tipo de conversion"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Human-readable Circuit Breaker Error (Priority: P1)

As a developer using the `ApiClient`, I want to provide a more user-friendly error message when the circuit breaker is open, converting the raw milliseconds into units like seconds or minutes.

**Why this priority**: It improves the developer experience and end-user messaging by providing meaningful wait times instead of raw milliseconds.

**Independent Test**: Can be tested by initializing an `ApiClient` with a custom `circuitBreaker.errorMessageFormatter` and triggering an open circuit state, then verifying the thrown error message.

**Acceptance Scenarios**:

1. **Given** an `ApiClient` initialized with a formatter that converts 5000ms to "5 seconds", **When** a request is made while the circuit is open and has 5000ms remaining, **Then** the thrown Error message should contain "5 seconds".
2. **Given** an `ApiClient` initialized with a formatter that converts 600000ms to "10 minutes", **When** a request is made while the circuit is open and has 600000ms remaining, **Then** the thrown Error message should contain "10 minutes".

---

### User Story 2 - Default Error Message Fallback (Priority: P2)

As a developer, I want the existing `ApiClient` behavior to remain unchanged if I don't provide a custom formatter.

**Why this priority**: Ensures backward compatibility and prevents breaking changes for existing library users.

**Independent Test**: Initialize `ApiClient` without a custom circuit breaker formatter and verify it still shows raw milliseconds.

**Acceptance Scenarios**:

1. **Given** an `ApiClient` without a custom formatter, **When** the circuit is open, **Then** the error message should follow the pattern "Circuit breaker is open. Retry after XXXms".

---

### Edge Cases

- What happens when the remaining time is 0 or negative during the check? (Should probably not throw or show "0ms").
- What if the custom formatter throws an error? (Should fallback to the default message).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `CircuitBreakerConfig` interface MUST be extended to include an optional `errorMessageFormatter` property.
- **FR-002**: The `errorMessageFormatter` MUST be a function that accepts `ms: number` and returns a `string`.
- **FR-003**: The `CircuitBreaker` class MUST use the provided `errorMessageFormatter` to generate the error message when the state is "open".
- **FR-004**: If no `errorMessageFormatter` is provided, the `CircuitBreaker` MUST fallback to the default message: `Circuit breaker is open. Retry after [ms]ms`.
- **FR-005**: If the `errorMessageFormatter` throws an error, the system SHOULD catch it and fallback to the default message to ensure an error is still thrown.

### Key Entities

- **CircuitBreakerConfig**: Configuration object for the circuit breaker, used during `ApiClient` initialization.
- **CircuitBreaker**: Class responsible for managing request states and throwing the "open circuit" error.
- **ApiClient**: Main class where the circuit breaker is configured.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of Circuit Breaker "open" errors use the custom formatter when provided.
- **SC-002**: 100% of existing tests pass without modification to their current `CircuitBreaker` usage.
- **SC-003**: The implementation allows conversion of milliseconds to seconds, minutes, or any other string format as requested by the user.
