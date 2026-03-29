# Tasks: Typed Data Pipelines

**Input**: Design documents from `/specs/006-typed-pipelines/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/pipeline.md ✅, quickstart.md ✅

**Feature branch**: `006-typed-pipelines`
**Tech stack**: TypeScript 5.x strict · ESM · Vitest 3.x · Zero-deps

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm the existing baseline is green before any changes are made.

- [X] T001 Run `pnpm test` and `pnpm build` to confirm all existing tests pass and TypeScript compiles cleanly

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the `Pipeline` class, `PipelineOp` type, and the `pipe()` factory — the core infrastructure that all three user stories share. No story work can begin until T002–T004 are complete.

**⚠️ CRITICAL**: US1, US2, and US3 all depend on this foundation.

- [X] T002 Create `src/utils/async/pipeline.ts` with: exported `PipelineOp<TIn, TOut>` type, `Pipeline<TIn, TOut>` class (private `ops` array, immutable `.pipe(op)` returning new instance, `.process(data)` executing ops sequentially with `await`, empty-pipeline passthrough), and JSDoc on every public symbol
- [X] T003 Add `pipe(...ops)` factory function with 7 typed overloads (1-op to 7-op) and an escape-hatch variadic overload — all returning `Pipeline<TIn, TOut>` — in `src/utils/async/pipeline.ts`
- [X] T004 Export `Pipeline`, `PipelineOp`, and `pipe` from `src/utils/async/index.ts`

**Checkpoint**: `pnpm build` passes. Consumers can `import { Pipeline, pipe } from "bytekit"` and chain `.pipe()` calls, but operator factories are not yet available.

---

## Phase 3: User Story 1 — Componer Transformaciones (Priority: P1) 🎯 MVP

**Goal**: Developers can compose typed `map`, `filter`, and `reduce` operators into a pipeline and execute it synchronously (values that happen to be non-Promise) with full TypeScript inference.

**Independent Test**: Create a `pipe(filter(...), map(...), reduce(...))` over a plain `number[]`, call `.process([1, 2, 3, 4, 5])`, assert the result value and type. TypeScript must infer `Pipeline<number[], number>` without any manual type annotations.

### Implementation for User Story 1

- [X] T005 [US1] Implement `map<T, U>(fn)` operator factory returning `PipelineOp<T[], U[]>` — uses `Promise.all` for concurrent item processing, passes `(item, index)` to `fn`, preserves order — with JSDoc and `@example`, in `src/utils/async/pipeline.ts`
- [X] T006 [US1] Implement `filter<T>(fn)` operator factory returning `PipelineOp<T[], T[]>` — runs all predicates concurrently via `Promise.all`, retains items whose predicate resolves to `true` in original order — with JSDoc and `@example`, in `src/utils/async/pipeline.ts`
- [X] T007 [US1] Implement `reduce<T, U>(fn, initial)` operator factory returning `PipelineOp<T[], U>` — sequential execution (each step awaits previous), returns `initial` for empty arrays — with JSDoc and `@example`, in `src/utils/async/pipeline.ts`
- [X] T008 [US1] Export `map`, `filter`, `reduce` from `src/utils/async/index.ts`

### Tests for User Story 1

- [X] T009 [P] [US1] Write tests: `pipe(map(...))` with sync fn transforms each element, preserves order, receives correct `(item, index)` args — in `tests/pipeline.test.ts`
- [X] T010 [P] [US1] Write tests: `pipe(filter(...))` with sync predicate retains matching items in order; empty array returns `[]` — in `tests/pipeline.test.ts`
- [X] T011 [P] [US1] Write tests: `pipe(reduce(...))` with sync reducer accumulates to correct value; empty array returns `initial` — in `tests/pipeline.test.ts`
- [X] T012 [P] [US1] Write tests: 3-op pipeline `pipe(filter, map, reduce)` produces correct typed output; `Pipeline` is immutable (`.pipe()` does not mutate original) — in `tests/pipeline.test.ts`
- [X] T013 [P] [US1] Write tests: empty `Pipeline` (created via `new Pipeline([])`) returns input unchanged from `.process()` — in `tests/pipeline.test.ts`
- [X] T014 [P] [US1] Write tests: `pipe()` escape-hatch overload (variadic, no type inference) builds and executes correctly — in `tests/pipeline.test.ts`

**Checkpoint**: `pnpm test -- pipeline` passes all US1 tests. Sync composition, operator factories, immutability, and type inference all verified.

---

## Phase 4: User Story 2 — Soporte Async (Priority: P2)

**Goal**: All three operators (`map`, `filter`, `reduce`) accept async `fn` arguments returning `Promise<U>`, and `Pipeline.process()` awaits them correctly. `map` and `filter` run async `fn` calls concurrently; `reduce` runs sequentially.

**Independent Test**: Create a `pipe(map(async (n) => fetchEnriched(n)))` where `fetchEnriched` is a spy returning `Promise.resolve(n * 2)`. Call `.process([1, 2, 3])`. Assert all spy calls were made and the result is `[2, 4, 6]`. Verify concurrency: all spies called before any resolves (use `vi.useFakeTimers` or ordering assertions).

### Tests for User Story 2

- [X] T015 [P] [US2] Write tests: `map` with async `fn` — all items processed, order preserved, concurrent calls (spy resolves in reverse order, result still ordered) — in `tests/pipeline.test.ts`
- [X] T016 [P] [US2] Write tests: `filter` with async predicate — items filtered correctly, concurrent evaluation, original order preserved in output — in `tests/pipeline.test.ts`
- [X] T017 [P] [US2] Write tests: `reduce` with async reducer — accumulates correctly, sequential execution (each step awaits previous, spy call order is 0→1→2) — in `tests/pipeline.test.ts`
- [X] T018 [P] [US2] Write tests: pipeline with mixed sync and async ops executes correctly end-to-end — in `tests/pipeline.test.ts`
- [X] T019 [P] [US2] Write tests: operator error propagation — error thrown inside `map` fn rejects `process()` with the original error; error thrown inside `reduce` fn rejects with original error — in `tests/pipeline.test.ts`
- [X] T020 [P] [US2] Write tests: `.pipe(op)` builder method — chains additional op to existing pipeline, returns new instance, original pipeline unaffected — in `tests/pipeline.test.ts`

**Checkpoint**: `pnpm test -- pipeline` passes all US1 + US2 tests. Async concurrency, sequential reduce, and error propagation all verified.

---

## Phase 5: User Story 3 — Integración con ApiClient (Priority: P3)

**Goal**: `RequestOptions<TResponse>` gains an optional `pipeline` field. When present, `ApiClient` applies `pipeline.process(responseData)` after response parsing/validation and returns the result.

**Independent Test**: Instantiate `ApiClient` with a mock `fetchImpl`. Make a `GET` request with `pipeline: pipe(map<number, string>((n) => String(n)))`. Assert the returned value is `["1", "2", "3"]` when the mock returns `[1, 2, 3]`.

### Implementation for User Story 3

- [X] T021 [US3] Add `pipeline?: { process(data: TResponse): Promise<unknown> }` optional field to `RequestOptions<TResponse>` interface in `src/utils/core/ApiClient.ts` with JSDoc comment
- [X] T022 [US3] In `ApiClient`'s internal response-handling logic, after `validateResponse` (if any) resolves, call `await options.pipeline.process(data)` when `pipeline` is set and return the result — in `src/utils/core/ApiClient.ts`

### Tests for User Story 3

- [X] T023 [P] [US3] Write tests: `GET` with `pipeline` option — mock `fetchImpl` returns raw array, pipeline transforms it, returned value matches pipeline output — in `tests/pipeline.test.ts`
- [X] T024 [P] [US3] Write tests: `GET` without `pipeline` option — existing behaviour unchanged, no regression — in `tests/pipeline.test.ts`
- [X] T025 [P] [US3] Write tests: `pipeline` error propagation — if `pipeline.process()` throws, the error surfaces from the `ApiClient` method call — in `tests/pipeline.test.ts`

**Checkpoint**: `pnpm test -- pipeline` passes all US1 + US2 + US3 tests. ApiClient integration non-breaking and fully exercised.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T026 [P] Add `"./pipeline"` export entry to `package.json` pointing to `dist/utils/async/pipeline` (types + import) following the existing pattern for `"./async"`, `"./websocket"` etc.
- [X] T027 [P] Create `examples/pipeline-example.ts` demonstrating: sync composition (filter + map + reduce), async map with enrichment, mixed sync/async pipeline, ApiClient integration, and the dynamic builder pattern — per quickstart.md
- [X] T028 [P] Update `bytekit.wiki/` (create `Pipeline.md`) with: description, all exported types/functions with signatures, options table, How It Works section, and 3+ examples
- [X] T029 Run `pnpm test` (full suite) and confirm all tests pass with zero regressions across all existing tests
- [X] T030 Run `pnpm test -- --coverage pipeline` scoped to `src/utils/async/pipeline.ts` and confirm statement/branch/function/line coverage ≥ 95%

---

## Dependencies

```
T001 (baseline check)
  └─ T002–T004 (foundational — Pipeline class + pipe() + exports)
        ├─ T005–T014 (US1: map/filter/reduce sync + tests) — independent of US2/US3
        ├─ T015–T020 (US2: async support + tests) — independent of US1/US3
        │    Note: US2 tests build on US1 implementation (map/filter/reduce already exist)
        └─ T021–T025 (US3: ApiClient integration + tests) — independent of US1/US2
              └─ T026–T030 (polish — after all stories)
```

US1, US2, and US3 are independent after the foundational phase. Implementation tasks within each story are sequential; test tasks within a story are all parallelisable.

## Parallel Execution Examples

### After T001–T004, full story parallelism:

**Stream A (US1)**:
```
T005 → T006 → T007 → T008 → T009–T014 (all parallel)
```

**Stream B (US2)** (starts simultaneously with Stream A — uses operators from US1):
```
T015–T020 (all parallel, after US1 operators exist)
```

**Stream C (US3)** (starts simultaneously with Streams A and B):
```
T021 → T022 → T023–T025 (all parallel)
```

**Stream D (Polish)** — after all stories complete:
```
T026–T028 (parallel) → T029 → T030
```

## Implementation Strategy

**MVP scope** (deliver US1 first, independently shippable):
1. Complete Phase 1 (T001) + Phase 2 (T002–T004)
2. Complete US1 (T005–T014) — sync pipeline with map/filter/reduce working
3. Ship as increment; US2 (async support) and US3 (ApiClient) follow independently

**Task counts**:
| Phase | Tasks | Parallelisable |
|-------|-------|----------------|
| Phase 1: Setup | 1 | 0 |
| Phase 2: Foundational | 3 | 0 |
| Phase 3: US1 | 10 | 6 (T009–T014) |
| Phase 4: US2 | 6 | 6 (T015–T020) |
| Phase 5: US3 | 5 | 3 (T023–T025) |
| Final: Polish | 5 | 3 (T026–T028) |
| **Total** | **30** | **18** |
