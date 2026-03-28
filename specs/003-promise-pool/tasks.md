# Tasks: Promise Pool con Concurrencia Controlada

**Input**: Design documents from `/specs/003-promise-pool/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Feature branch**: `003-promise-pool`
**Tech stack**: TypeScript 5.x strict · ESM · Vitest 3.x · Zero-deps

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Verify the existing scaffolding is wired up correctly before any story work begins.

> The base `PromisePool` class in `src/utils/async/promise-pool.ts` and its export in `src/utils/async/index.ts` were created as part of planning. This phase confirms everything is connected.

- [X] T001 Verify `npm run build` passes and `PromisePool` is exported from `bytekit/async` in `src/utils/async/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Close the gaps in the existing implementation that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `PoolTimeoutError extends Error` class with `name = "PoolTimeoutError"` in `src/utils/async/promise-pool.ts`
- [X] T003 [P] Export `PoolTimeoutError` class and `PromisePoolOptions` type from `src/utils/async/index.ts`
- [X] T004 Update `withTimeout()` to throw `PoolTimeoutError` instead of generic `Error`, and verify `error.name === "PoolTimeoutError"` in `src/utils/async/promise-pool.ts`
- [X] T005 Add `timeout <= 0` guard in `PromisePool` constructor in `src/utils/async/promise-pool.ts`
- [X] T006 Add empty-array fast-path (`return []`) at top of `run()` in `src/utils/async/promise-pool.ts`

**Checkpoint**: Build passes, `PoolTimeoutError` is exported, all guards are in place.

---

## Phase 3: User Story 1 — Ejecutar Promesas con Límite de Concurrencia (Priority: P1) 🎯 MVP

**Goal**: A `PromisePool` instance correctly limits concurrent task execution and returns results in the original input order.

**Independent Test**: Run 10 tasks with `concurrency: 2` and assert that no more than 2 run simultaneously; assert results array matches input order.

### Tests for User Story 1

- [X] T007 [P] [US1] Write test: basic concurrency limit is respected (track concurrent count with a counter) in `tests/async/promise-pool.test.ts`
- [X] T008 [P] [US1] Write test: results are returned in original input order regardless of completion order in `tests/async/promise-pool.test.ts`
- [X] T009 [P] [US1] Write tests for edge cases: empty array returns `[]`, non-array input throws `TypeError`, `concurrency < 1` throws `TypeError` in `tests/async/promise-pool.test.ts`
- [X] T010 [P] [US1] Write test: `concurrency = 1` executes tasks sequentially in `tests/async/promise-pool.test.ts`
- [X] T011 [P] [US1] Write test: `concurrency >= tasks.length` runs all tasks at once (equivalent to `Promise.all`) in `tests/async/promise-pool.test.ts`

### Implementation for User Story 1

- [X] T012 [US1] Add task-function validation in `run()` — throw `TypeError` if any element is not a function in `src/utils/async/promise-pool.ts`
- [X] T013 [US1] Audit `processQueue()` for race condition: ensure re-entrant calls from `finally` don't dequeue the same item twice in `src/utils/async/promise-pool.ts`
- [X] T014 [US1] Verify `run()` resets correctly between multiple invocations on the same instance in `src/utils/async/promise-pool.ts`

**Checkpoint**: `npm run test -- promise-pool` passes US1 tests. The pool correctly limits concurrency and preserves order.

---

## Phase 4: User Story 2 — Configurar Opciones Avanzadas (Priority: P2)

**Goal**: `PoolTimeoutError` is thrown for slow tasks; `onError` callback is invoked for any task failure without stopping the pool.

**Independent Test**: Configure `timeout: 200ms`, run a task that takes 300ms, assert `PoolTimeoutError` is thrown; assert pool continues executing remaining tasks.

### Tests for User Story 2

- [X] T015 [P] [US2] Write test: task exceeding `timeout` rejects with `PoolTimeoutError` (not generic `Error`) in `tests/async/promise-pool.test.ts`
- [X] T016 [P] [US2] Write test: pool continues executing remaining tasks after a timeout in `tests/async/promise-pool.test.ts`
- [X] T017 [P] [US2] Write test: `onError` is called with `(error, taskIndex)` when a task fails in `tests/async/promise-pool.test.ts`
- [X] T018 [P] [US2] Write test: pool continues executing remaining tasks after `onError` fires in `tests/async/promise-pool.test.ts`
- [X] T019 [P] [US2] Write test: timer is cleared via `clearTimeout` when task resolves before timeout (no leaks) in `tests/async/promise-pool.test.ts`

### Implementation for User Story 2

- [X] T020 [US2] Ensure `onError` receives the unwrapped original error (not a wrapper) and the correct zero-based `index` in `src/utils/async/promise-pool.ts`

**Checkpoint**: `npm run test -- promise-pool` passes US1 + US2 tests. Timeout and error isolation work correctly.

---

## Phase 5: User Story 3 — Integración con ApiClient (Priority: P3)

**Goal**: `ApiClient` accepts a `pool` option and channels parallel requests through a `PromisePool` instance automatically.

**Independent Test**: Create an `ApiClient` with `pool: { concurrency: 3 }`, fire 10 concurrent requests with a mock fetch, assert no more than 3 requests are in-flight simultaneously.

### Tests for User Story 3

- [X] T022 [P] [US3] Write integration test: `ApiClient` with `pool: { concurrency: 3 }` limits concurrent in-flight fetch calls in `tests/async/promise-pool-api-client.test.ts`
- [X] T023 [P] [US3] Write test: `ApiClient` without `pool` option behaves exactly as before (no regression) in `tests/async/promise-pool-api-client.test.ts`

### Implementation for User Story 3

- [X] T024 [P] [US3] Add `pool?: PromisePoolOptions` field to `ApiClientConfig` interface in `src/utils/core/ApiClient.ts`
- [X] T025 [US3] Instantiate `PromisePool` in `ApiClient` constructor when `pool` option is provided in `src/utils/core/ApiClient.ts`
- [X] T026 [US3] Wrap parallel fetch execution through the pool instance in the relevant `ApiClient` request method in `src/utils/core/ApiClient.ts`

**Checkpoint**: `npm run test` passes all stories. `ApiClient` pool integration works without regressions.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T027 [P] Add full JSDoc to all public members (`PromisePool`, `PromisePoolOptions`, `PoolTimeoutError`, `run()`) in `src/utils/async/promise-pool.ts`
- [X] T028 [P] Create usage example file in `examples/promise-pool.ts` matching the `quickstart.md` scenarios
- [X] T029 [P] Document `PromisePool` and `PoolTimeoutError` in `docs/api-reference/async.mdx`
- [X] T030 [P] Add `PromisePool` section to `bytekit.wiki/Async-Toolkit.md` with API table and examples
- [X] T031 Verify test coverage ≥95% with `npm run coverage` and fix any gaps
- [X] T032 Validate quickstart scenarios from `specs/003-promise-pool/quickstart.md` run without errors
- [X] T033 [P] Measure bundle size delta: run `npm run build` before and after, assert `PromisePool` export adds <1KB gzipped (use `bundlephobia` or `size-limit` locally)
- [X] T034 [P] Add JavaScript (CJS/ESM) usage examples to `specs/003-promise-pool/quickstart.md` and `bytekit.wiki/Async-Toolkit.md` (constitution requirement: examples in both TS and JS)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**.
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on US2 or US3.
- **US2 (Phase 4)**: Depends on Phase 2 — can start in parallel with US1 after Phase 2 completes.
- **US3 (Phase 5)**: Depends on Phase 2 — can start in parallel with US1/US2 after Phase 2 completes.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

| Story | Depends on | Can run in parallel with |
| ----- | ---------- | ------------------------ |
| US1 (P1) | Phase 2 complete | US2, US3 |
| US2 (P2) | Phase 2 complete | US1, US3 |
| US3 (P3) | Phase 2 complete | US1, US2 |

### Within Each User Story

- Tests → Implementation (write tests first, verify they fail)
- Task function validation before concurrency logic
- Core `PromisePool` changes before `ApiClient` integration (US3)

### Parallel Opportunities Per Story

```text
US1 — tests T007–T011 can all launch in parallel (same file, no inter-dependency)
US2 — tests T015–T019 can all launch in parallel
US3 — T022 and T023 can run in parallel; T024 is parallel to T022/T023
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (critical blockers)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm run test -- promise-pool`, verify concurrency limit and ordering
5. Publish patch/minor if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ✅
2. Phase 3 (US1) → Basic pool usable by community → **MVP release**
3. Phase 4 (US2) → Timeout + error isolation → Minor release
4. Phase 5 (US3) → ApiClient integration → Minor release
5. Phase 6 → Polish → Patch release

### Task Summary

| Phase | Tasks | Parallelizable |
| ----- | ----- | -------------- |
| Phase 1 — Setup | 1 | 0 |
| Phase 2 — Foundational | 5 | 1 |
| Phase 3 — US1 | 8 | 5 |
| Phase 4 — US2 | 6 | 5 |
| Phase 5 — US3 | 5 | 2 |
| Phase 6 — Polish | 8 | 7 |
| **Total** | **33** | **20** |
