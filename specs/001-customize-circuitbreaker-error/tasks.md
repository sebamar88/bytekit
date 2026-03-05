# Tasks: Customize Circuit Breaker Error Message

**Input**: Design documents from `/specs/001-customize-circuitbreaker-error/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify existing project structure and dependency availability
- [x] T002 Ensure tests can run at the repository root with `npm run test` or `vitest`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Update `CircuitBreakerConfig` interface to include optional `errorMessageFormatter` function in `src/utils/core/RetryPolicy.ts`
- [x] T004 Update `CircuitBreaker` constructor to initialize optional `errorMessageFormatter` in `src/utils/core/RetryPolicy.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Human-readable Circuit Breaker Error (Priority: P1) 🎯 MVP

**Goal**: Provide a more user-friendly error message when the circuit breaker is open, converting the raw milliseconds into units like seconds or minutes.

**Independent Test**: Initialize an `ApiClient` with a formatter that converts 5000ms to "5 seconds". Trigger an open circuit and verify the thrown error message contains "5 seconds".

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Create unit test for custom error formatting in `tests/retry-policy.test.ts`

### Implementation for User Story 1

- [x] T006 [US1] Update `CircuitBreaker.getRetryAfterMs` return value usage in `src/utils/core/RetryPolicy.ts`
- [x] T007 [US1] Implement error message formatting logic in `CircuitBreaker.execute` within `src/utils/core/RetryPolicy.ts`, utilizing the provided `errorMessageFormatter`
- [x] T008 [US1] Ensure `ApiClient` correctly propagates the `circuitBreaker` configuration to the `CircuitBreaker` instance in `src/utils/core/ApiClient.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Default Error Message Fallback (Priority: P2)

**Goal**: Ensure existing `ApiClient` behavior remains unchanged if no custom formatter is provided.

**Independent Test**: Use `ApiClient` without a custom circuit breaker formatter. Trigger an open circuit and verify it still shows raw milliseconds as "Circuit breaker is open. Retry after XXXms".

### Implementation for User Story 2

- [x] T009 [US2] Implement fallback to the default error message if `errorMessageFormatter` is not provided in `src/utils/core/RetryPolicy.ts`
- [x] T010 [US2] Add error handling around the `errorMessageFormatter` call to fallback to the default message if the formatter itself throws an error

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T011 [P] Run `npm run lint` and `npm run format` to ensure code style consistency
- [x] T012 Run final validation using the `quickstart.md` examples

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independently testable fallback behavior

### Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
