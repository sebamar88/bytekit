# Tasks: Request Queue & Batching System

**Input**: Design documents from `/specs/004-batching-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Feature branch**: `004-batching-system`
**Tech stack**: TypeScript 5.x strict · ESM · Vitest 3.x · Zero-deps · Fake timers

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no inter-dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup

**Purpose**: Verify the build is healthy and the `PromisePool` (003) internal dependency is importable before any story work begins.

- [ ] T001 Verify `npm run build` passes and `PromisePool` is importable from `src/utils/async/index.ts` (required internal dep for `RequestQueue` concurrency mechanics)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create file scaffolding and exports that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Create `src/utils/async/request-queue.ts` skeleton with `QueueAbortError extends Error`, `QueuePriority` type, `RequestQueueOptions`, `AddOptions`, `QueueItem<T>` interfaces, and an empty `RequestQueue` class stub
- [ ] T003 Create `src/utils/async/request-batcher.ts` skeleton with `BatchOptions`, `BatchEntry<T>` interfaces and an empty `RequestBatcher` class stub
- [ ] T004 [P] Export `RequestQueue`, `RequestBatcher`, `QueueAbortError`, `QueuePriority`, `RequestQueueOptions`, `AddOptions`, and `BatchOptions` from `src/utils/async/index.ts`

**Checkpoint**: Build passes, all new identifiers are exported and resolvable, no TypeScript errors.

---

## Phase 3: User Story 1 — Cola de Requests con Concurrencia Controlada (Priority: P1) 🎯 MVP

**Goal**: A `RequestQueue` instance correctly limits concurrent task execution, isolates individual failures, exposes accurate queue state through `size`/`running`/`pending` getters, and resolves `flush()` only when all active work settles.

**Independent Test**: Enqueue 20 tasks with `concurrency: 3`, assert no more than 3 run simultaneously, assert all 20 eventually settle regardless of individual failures.

### Tests for User Story 1

- [ ] T005 [P] [US1] Write test: 20 tasks with `concurrency=3` — max 3 run simultaneously (track with a shared counter) in `tests/async/request-queue.test.ts`
- [ ] T006 [P] [US1] Write test: one failing task does NOT block the queue; all remaining tasks complete successfully in `tests/async/request-queue.test.ts`
- [ ] T007 [P] [US1] Write test: `flush()` resolves only after all queued + running tasks have settled in `tests/async/request-queue.test.ts`
- [ ] T008 [P] [US1] Write test: `size`, `running`, `pending` getters return correct values before, during, and after execution in `tests/async/request-queue.test.ts`
- [ ] T009 [P] [US1] Write test: `concurrency < 1` constructor throws `TypeError` in `tests/async/request-queue.test.ts`

### Implementation for User Story 1

- [ ] T010 [US1] Implement private priority lane arrays (`_high[]`, `_normal[]`, `_low[]`) and `_running` counter as fields in `RequestQueue` in `src/utils/async/request-queue.ts`
- [ ] T011 [US1] Implement `add<T>()` — create internal `AbortController`, build `QueueItem<T>`, push to the appropriate lane, call `_drain()`, return the public promise in `src/utils/async/request-queue.ts`
- [ ] T012 [US1] Implement `_drain()` private method — dequeue from high→normal→low until `_running === concurrency`, execute each task with its `AbortSignal`, call `onError` on failure, recurse from `finally` in `src/utils/async/request-queue.ts`
- [ ] T013 [US1] Implement `size`, `running`, `pending` getters and `flush()` (resolves when all in-flight + pending tasks have settled using a `Promise.allSettled` over active promises) in `src/utils/async/request-queue.ts`
- [ ] T014 [US1] Add `concurrency < 1` guard in `RequestQueue` constructor throwing `TypeError` in `src/utils/async/request-queue.ts`

**Checkpoint**: `npm run test -- request-queue` passes T005–T009. Concurrency limit respected, error isolation confirmed, getters accurate.

---

## Phase 4: User Story 2 — Priorización y Cancelación de Requests (Priority: P2)

**Goal**: Tasks with `priority: "high"` always execute before `"normal"` and `"low"`. `cancel(id)` removes queued tasks (rejecting with `QueueAbortError`) or fires the `AbortSignal` for in-flight tasks. External `signal` in `AddOptions` is respected.

**Independent Test**: Enqueue one `high` and one `low` task with `concurrency=1`; assert the `high` task executes first.

### Tests for User Story 2

- [ ] T015 [P] [US2] Write test: `high` priority tasks execute before `normal` and `low` when `concurrency=1` in `tests/async/request-queue.test.ts`
- [ ] T016 [P] [US2] Write test: `cancel(id)` removes a queued task and rejects its promise with `QueueAbortError` — obtain the ID by capturing it from the task factory's `AbortController` via a test helper that wraps `add()` and exposes the internal ID (internal mechanism test) in `tests/async/request-queue.test.ts`
- [ ] T017 [P] [US2] Write test: `cancel(id)` on an in-flight task fires its internal `AbortSignal` — verify via the `aborted` flag on the signal passed to the task factory in `tests/async/request-queue.test.ts`
- [ ] T018 [P] [US2] Write test: `cancel(id)` returns `false` when the task ID is not found in any lane in `tests/async/request-queue.test.ts`
- [ ] T019 [P] [US2] Write test: external `signal` in `AddOptions` cancels a queued task with `QueueAbortError` before execution starts — this is the **public consumer cancellation path** in `tests/async/request-queue.test.ts`

### Implementation for User Story 2

- [ ] T020 [US2] Implement `cancel(id)` — search all three lanes; if found queued → splice, reject with `new QueueAbortError()`, call `_drain()`; if running → call `controller.abort()`; return boolean. Note: `cancel(id)` is an internal queue-management method; the public consumer cancellation path is `AddOptions.signal` (T019/T021) in `src/utils/async/request-queue.ts`
- [ ] T021 [US2] Wire external `signal` in `add()` — if `signal.aborted` on entry → reject immediately with `QueueAbortError`; otherwise add `abort` event listener that calls `cancel(id)` before the task executes in `src/utils/async/request-queue.ts`

**Checkpoint**: `npm run test -- request-queue` passes US1 + US2 tests. Priority ordering and both cancellation paths (queued + in-flight) work correctly.

---

## Phase 5: User Story 3 — Agrupación Inteligente / Batching (Priority: P2)

**Goal**: `RequestBatcher` coalesces same-key requests within a time window into a single fetcher invocation; every caller sharing the key receives the same resolved value.

**Independent Test**: Send 5 requests with the same key within 100ms (fake timers); assert fetcher is called exactly once and all 5 promises resolve to the same value.

### Tests for User Story 3

- [ ] T022 [P] [US3] Write test: 5 requests with identical key in 100ms window → fetcher called exactly once, all 5 promises resolve to same value (use `vi.useFakeTimers()`) in `tests/async/request-batcher.test.ts`
- [ ] T023 [P] [US3] Write test: `windowMs` elapses → batch auto-dispatches without explicit `flush()` call in `tests/async/request-batcher.test.ts`
- [ ] T024 [P] [US3] Write test: `maxSize` reached → batch flushes early before `windowMs` expires in `tests/async/request-batcher.test.ts`
- [ ] T025 [P] [US3] Write test: `sliding: true` resets the timer on each new request (timer fires only after 200ms of inactivity, not after the first request) in `tests/async/request-batcher.test.ts`
- [ ] T026 [P] [US3] Write test: requests with different keys (different URLs) are NOT coalesced — each bucket dispatches independently in `tests/async/request-batcher.test.ts`
- [ ] T027 [P] [US3] Write test: custom `keyFn` override controls grouping (same URL, different body → same key when keyFn ignores body) in `tests/async/request-batcher.test.ts`
- [ ] T028 [P] [US3] Write test: `flush()` dispatches all pending batches immediately and resolves when all settle in `tests/async/request-batcher.test.ts`
- [ ] T029 [P] [US3] Write test: `pendingCount` getter returns correct total across all bucket keys before and after dispatch in `tests/async/request-batcher.test.ts`
- [ ] T030 [P] [US3] Write test: `windowMs <= 0` throws `TypeError`; `maxSize < 1` throws `TypeError` in `tests/async/request-batcher.test.ts`

### Implementation for User Story 3

- [ ] T031 [US3] Implement `defaultKeyFn` — returns `"${method}:${url}:${stableSerialize(body)}"` where `stableSerialize` handles `undefined`, primitives, and `JSON.stringify` for objects in `src/utils/async/request-batcher.ts`
- [ ] T032 [US3] Implement `_buckets: Map<string, BatchEntry<unknown>[]>` and `_timers: Map<string, ReturnType<typeof setTimeout>>` as private fields in `RequestBatcher` in `src/utils/async/request-batcher.ts`
- [ ] T033 [US3] Implement `add<T>()` — compute key via `keyFn`, push `BatchEntry<T>` to bucket, start timer (or reset if `sliding: true`), immediately call `_dispatch(key)` if `maxSize` is reached in `src/utils/async/request-batcher.ts`
- [ ] T034 [US3] Implement `_dispatch(key)` private method — cancel the bucket timer, splice all entries for key, call the first entry's fetcher once, resolve or reject every entry promise with the same outcome in `src/utils/async/request-batcher.ts`
- [ ] T035 [US3] Implement `flush()` (iterate all bucket keys, call `_dispatch(key)` for each, await all settlements) and `pendingCount` getter (sum sizes of all `_buckets` values) in `src/utils/async/request-batcher.ts`
- [ ] T036 [US3] Add constructor guards: `windowMs <= 0` → `TypeError("windowMs must be > 0")`; `maxSize < 1` → `TypeError("maxSize must be >= 1")` in `src/utils/async/request-batcher.ts`

**Checkpoint**: `npm run test -- request-batcher` passes T022–T030. Fixed window, sliding window, maxSize early flush, custom keyFn, and flush() all work correctly.

---

## Phase 6: User Story 4 — Integración con ApiClient (Priority: P3)

**Goal**: `ApiClient` transparently routes requests through `RequestQueue` and `RequestBatcher` when configured via constructor options, with no behavioural change when neither option is set.

**Independent Test**: Configure `ApiClient` with `queue: { concurrency: 5 }`, fire 10 concurrent requests via a mock fetch, assert no more than 5 are in-flight simultaneously.

### Tests for User Story 4

- [ ] T037 [P] [US4] Write integration test: `ApiClient` with `queue: { concurrency: 5 }` limits concurrent in-flight fetch calls (track with counter spy) in `tests/request-queue-api-client.test.ts`
- [ ] T038 [P] [US4] Write integration test: `ApiClient` with `batch: { windowMs: 100 }` coalesces same-URL requests into a single fetch call (use fake timers) in `tests/request-queue-api-client.test.ts`
- [ ] T039 [P] [US4] Write test: `ApiClient` without `queue` or `batch` options behaves exactly as before (no regression) in `tests/request-queue-api-client.test.ts`

### Implementation for User Story 4

- [ ] T040 [P] [US4] Add `queue?: RequestQueueOptions` and `batch?: BatchOptions` fields to `ApiClientConfig` interface in `src/utils/core/ApiClient.ts`
- [ ] T041 [US4] Instantiate `RequestQueue` in `ApiClient` constructor when `config.queue` is provided; store as `private _queue: RequestQueue | undefined` in `src/utils/core/ApiClient.ts`
- [ ] T042 [US4] Instantiate `RequestBatcher` in `ApiClient` constructor when `config.batch` is provided; store as `private _batcher: RequestBatcher | undefined` in `src/utils/core/ApiClient.ts`
- [ ] T043 [US4] Route `ApiClient.request()` through `this._queue.add()` when queue is active, through `this._batcher.add()` when batcher is active, and unchanged when neither is configured in `src/utils/core/ApiClient.ts`

**Checkpoint**: `npm run test` passes all stories. `ApiClient` queue and batch integration work transparently without regressions.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T044 [P] Add full JSDoc to all public members of `RequestQueue` and `QueueAbortError` in `src/utils/async/request-queue.ts`
- [ ] T045 [P] Add full JSDoc to all public members of `RequestBatcher` in `src/utils/async/request-batcher.ts`
- [ ] T046 [P] Create usage examples matching the `quickstart.md` scenarios: `examples/request-queue.ts` (TypeScript) and `examples/request-queue.js` (JavaScript CJS/ESM) covering priority queue + batching + cancellation (constitution requires both TS and JS)
- [ ] T047 [P] Document `RequestQueue` and `RequestBatcher` in `docs/api-reference/async.mdx` (API table, constructor options, method signatures, error types)
- [ ] T048 [P] Add `RequestQueue` and `RequestBatcher` sections to `bytekit.wiki/Async-Toolkit.md` with API table, comparison table, and examples
- [ ] T049 Verify test coverage ≥95% with `npm run coverage`; fix any gaps in `src/utils/async/request-queue.ts` and `src/utils/async/request-batcher.ts`
- [ ] T050 Validate all TypeScript quickstart scenarios from `specs/004-batching-system/quickstart.md` run without errors
- [ ] T051 [P] Measure bundle size delta: assert `request-queue.ts` and `request-batcher.ts` each add <2KB gzipped (run `npm run build` and inspect dist output)
- [ ] T052 [P] Add JavaScript (CJS + ESM) usage examples to `specs/004-batching-system/quickstart.md` (constitution requirement: TS and JS examples)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**.
- **US1 (Phase 3)**: Depends on Phase 2 — independent of US2, US3, US4.
- **US2 (Phase 4)**: Depends on US1 — `cancel()` extends `RequestQueue`; cannot run before US1 implementation is complete.
- **US3 (Phase 5)**: Depends on Phase 2 — `RequestBatcher` is a separate class; can run in parallel with US1/US2.
- **US4 (Phase 6)**: Depends on US1 + US3 — `ApiClient` wraps both; must wait for both classes to be implemented.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### User Story Dependencies

| Story | Depends on | Can run in parallel with |
| ----- | ---------- | ------------------------ |
| US1 (P1) | Phase 2 complete | US3 |
| US2 (P2) | US1 complete | US3 |
| US3 (P2) | Phase 2 complete | US1, US2 |
| US4 (P3) | US1 + US3 complete | — |

### Within Each User Story

- Tests (marked `[P]`) → Implementation (non-parallel) — write tests first, confirm they fail, then implement
- `_drain()` (T012) must exist before `cancel()` (T020) is implemented
- `_dispatch()` (T034) must exist before `flush()` (T035) is implemented
- `ApiClientConfig` type field (T040) can be written in parallel with integration tests (T037–T039)

### Parallel Opportunities Per Story

```text
US1 — tests T005–T009 can all start at once (same file, no inter-deps)
US2 — tests T015–T019 can all start at once; US1 impl must be complete first
US3 — tests T022–T030 can all start at once (separate file; fully independent of US1/US2)
US4 — tests T037–T039 can run together; T040 (type change) in parallel with tests
Polish — T044–T048, T051–T052 can all run in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (critical blockers — skeleton + exports)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm run test -- request-queue`, verify concurrency limit, error isolation, getters
5. Continue to US2 (Phase 4)

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ✅
2. Phase 3 (US1) → Basic concurrency queue usable standalone → **MVP**
3. Phase 4 (US2) → Priority lanes + cancellation → Minor release
4. Phase 5 (US3) → Batching class standalone → Minor release
5. Phase 6 (US4) → `ApiClient` integration → Minor release
6. Phase 7 → Polish & docs → Patch release

### Task Summary

| Phase | Description | Tasks | Parallelizable |
| ----- | ----------- | ----- | -------------- |
| Phase 1 | Setup | 1 | 0 |
| Phase 2 | Foundational | 3 | 1 |
| Phase 3 | US1 — Concurrency Queue | 10 | 5 |
| Phase 4 | US2 — Priority & Cancellation | 7 | 5 |
| Phase 5 | US3 — Batching | 15 | 9 |
| Phase 6 | US4 — ApiClient Integration | 7 | 4 |
| Phase 7 | Polish | 9 | 7 |
| **Total** | | **52** | **31** |
