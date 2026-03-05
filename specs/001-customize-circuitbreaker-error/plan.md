# Implementation Plan: Customize Circuit Breaker Error Message

**Branch**: `001-customize-circuitbreaker-error` | **Date**: 2026-03-05 | **Spec**: [spec.md](file:///home/sebamar88/Escritorio/Development/nubi-lab-utils/specs/001-customize-circuitbreaker-error/spec.md)
**Input**: Feature specification from `/specs/001-customize-circuitbreaker-error/spec.md`

## Summary

The goal is to provide a way for developers to customize the error message thrown by the `CircuitBreaker` when it is in the `open` state. Currently, the message is hardcoded to show raw milliseconds. We will introduce an `errorMessageFormatter` function in the `CircuitBreakerConfig` that allows arbitrary formatting (e.g., converting ms to human-readable strings like "5 seconds").

## Technical Context

**Language/Version**: TypeScript 5.9  
**Primary Dependencies**: None (Internal library logic)  
**Storage**: N/A  
**Testing**: Vitest  
**Target Platform**: Node.js >= 18 / Browser  
**Project Type**: Library  
**Performance Goals**: Negligible impact (formatting only occurs on failed/blocked requests)  
**Constraints**: Must remain isomorphic and backwards compatible.  
**Scale/Scope**: Small - scoped to `RetryPolicy.ts` and `ApiClient.ts` (for config propagation).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] Library-First: Feature is implemented in the core utility library.
- [x] Test-First: Unit tests will be added/updated in `tests/utils/core/RetryPolicy.test.ts`.
- [x] Simplicity: Minimal changes to interfaces and logic.

## Project Structure

### Documentation (this feature)

```text
specs/001-customize-circuitbreaker-error/
├── plan.md              # This file
├── research.md          # Research findings and decisions
├── data-model.md        # Updated configuration interface
├── quickstart.md        # Usage examples
├── checklists/          # Validation checklists
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

```text
src/
└── utils/
    └── core/
        ├── ApiClient.ts    # Config propagation
        └── RetryPolicy.ts  # Core logic implementation
```

**Structure Decision**: Single project/library structure as this is a utility package. Logic resides in `src/utils/core`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | -          | -                                    |
