# Tasks: Add JSDoc Documentation to Undocumented Library Files

**Input**: Design documents from `/specs/009-add-jsdoc-docs/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | quickstart.md ✅

**No tests generated** — JSDoc-only change; no new logic; existing tests stay green by definition.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between them)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm tooling and style rules before writing any JSDoc.

- [X] T001 Review `quickstart.md` and `.prettierrc` to internalise the tag subset, 80-char wrap rule, and `@template` placement convention

**Checkpoint**: Rules confirmed — JSDoc implementation can begin.

---

## Phase 2: Foundational

**Purpose**: No shared infrastructure tasks needed. This phase is intentionally minimal because all 7 target files are independent — each can be tackled in any order once the style rules (Phase 1) are clear.

> ⚠️ **GATE**: Complete T001 before starting any Phase 3+ task.

---

## Phase 3: User Story 1 — Document core utility classes (Priority: P1) 🎯 MVP

**Goal**: `Logger.ts`, `Profiler.ts`, and `RetryPolicy.ts` are fully documented. Every public symbol in those three files shows a populated tooltip in a TypeScript-aware IDE.

**Independent Test**: Open each file in VS Code, hover over the class name and each public method, and confirm a tooltip appears with description + `@param` + `@returns`. Run `pnpm run format:check` — must pass with zero warnings.

### Implementation

- [X] T002 [P] [US1] Add JSDoc to all types, interfaces, transport factories, `Logger<TContext>` class, all public methods, and `createLogger()` in `src/utils/core/Logger.ts`
  - Symbols: `LogLevel`, `LogEntry<TContext>` (+ 6 field comments), `LogTransport`, `LoggerOptions` (+ 4 field comments), `consoleTransportNode()`, `consoleTransportBrowser()`, `Logger<TContext>` class, `constructor`, `setLevel`, `child`, `debug`, `info`, `warn`, `error`, `log`, `Logger.silent()`, `createLogger()`
  - Private `shouldLog` → `/** @internal */`
  - After edit: `npx prettier --write src/utils/core/Logger.ts`

- [X] T003 [P] [US1] Add JSDoc to `Profiler` class, constructor, and all public methods in `src/utils/core/Profiler.ts`
  - Symbols: `Profiler` class, `constructor(namespace?)`, `start(label)`, `end(label)`, `summary()`
  - After edit: `npx prettier --write src/utils/core/Profiler.ts`

- [X] T004 [P] [US1] Add JSDoc to both classes, all interfaces, and all public methods in `src/utils/core/RetryPolicy.ts`
  - Symbols: `RetryConfig` (+ 5 field comments), `CircuitBreakerConfig` (+ 4 field comments), `CircuitBreakerState`, `CircuitBreaker` class, `constructor`, `execute<T>`, `getState`, `reset`; `RetryPolicy` class, `constructor`, `execute<T>`, `getConfig`
  - Private helpers (`onSuccess`, `onFailure`, `shouldAttemptReset`, `getRetryAfterMs`, `calculateDelay`, `sleep`, `isRetryableError`) → `/** @internal */`
  - After edit: `npx prettier --write src/utils/core/RetryPolicy.ts`

- [X] T005 [US1] Run `pnpm run format:check` after T002–T004 complete and fix any remaining style issues

**Checkpoint**: US1 complete — `Logger`, `Profiler`, and `RetryPolicy` are fully documented and pass `format:check`.

---

## Phase 4: User Story 2 — Document helper classes (Priority: P2)

**Goal**: `EnvManager.ts` and `StorageUtils.ts` are fully documented, and the missing JSDoc in `UrlHelper.ts` (`stringify` + `QueryStringOptions` fields) is filled in.

**Independent Test**: Hover over `EnvManager.require()`, `StorageManager.set()`, and `UrlHelper.stringify()` in VS Code — each must show a tooltip with error-throwing behaviour (`require`) and optional parameter semantics (`ttlMs`). Run `pnpm run format:check` — must pass.

### Implementation

- [X] T006 [P] [US2] Add JSDoc to `EnvManager` class and all public methods in `src/utils/helpers/EnvManager.ts`
  - Symbols: `EnvManager` class, `get(name)`, `require(name)`, `isProd()`
  - After edit: `npx prettier --write src/utils/helpers/EnvManager.ts`

- [X] T007 [P] [US2] Add JSDoc to `StorageManager` class and all public methods in `src/utils/helpers/StorageUtils.ts`
  - Symbols: `StorageManager` class, `constructor(storage?)`, `set<T>(key, value, ttlMs?)`, `get<T>(key)`, `remove(key)`, `clear()`
  - After edit: `npx prettier --write src/utils/helpers/StorageUtils.ts`

- [X] T008 [P] [US2] Add missing JSDoc to `UrlHelper.stringify()` and all undocumented `QueryStringOptions` fields in `src/utils/helpers/UrlHelper.ts`
  - Symbols: `QueryStringOptions.arrayFormat`, `skipNull`, `skipEmptyString`, `encode`, `sortKeys` field comments; `UrlHelper.stringify(params, customOptions)` static method
  - Do NOT touch existing `slugify` JSDoc or existing field comments
  - After edit: `npx prettier --write src/utils/helpers/UrlHelper.ts`

- [X] T009 [US2] Run `pnpm run format:check` after T006–T008 complete and fix any remaining style issues

**Checkpoint**: US2 complete — `EnvManager`, `StorageManager`, and `UrlHelper.stringify` are documented and pass `format:check`.

---

## Phase 5: User Story 3 — Document ResponseValidator public API (Priority: P3)

**Goal**: `ResponseValidator.validate()` and both its interface types (`ValidationSchema`, `ValidationError`) have complete JSDoc. The already-documented private helpers are left untouched.

**Independent Test**: Hover over `ResponseValidator.validate()` and a `ValidationSchema` property in VS Code — the tooltip must describe the return shape and each interface field. Run `pnpm run format:check` — must pass.

### Implementation

- [X] T010 [US3] Add JSDoc to `ValidationSchema` interface fields, `ValidationError` interface fields, and `ResponseValidator.validate()` static method in `src/utils/core/ResponseValidator.ts`
  - Symbols: `ValidationSchema` (11 field comments: `type`, `required`, `properties`, `items`, `minLength`, `maxLength`, `minimum`, `maximum`, `pattern`, `enum`, `custom`); `ValidationError` (3 field comments: `path`, `message`, `value`); `ResponseValidator.validate(data, schema, path?)` static method
  - Do NOT touch existing private-method JSDoc (`validateByType`, `validateCustom`)
  - After edit: `npx prettier --write src/utils/core/ResponseValidator.ts`

**Checkpoint**: US3 complete — `ResponseValidator` public surface is documented and passes `format:check`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all changes.

- [X] T011 [P] Run full format check `pnpm run format:check` across all 7 edited files and confirm zero warnings
- [X] T012 [P] Run full test suite `pnpm test` and confirm zero regressions
- [X] T013 Run `pnpm run build` and confirm `.d.ts` files contain JSDoc comments (spot-check `dist/utils/core/Logger.d.ts`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: N/A — intentionally empty.
- **Phases 3–5 (User Stories)**: Depend on T001 only. All three phases can start independently once T001 is done.
- **Phase 6 (Polish)**: Depends on all user story phases completing.

### User Story Dependencies

| Story | Depends on | Blocks |
|---|---|---|
| US1 (Phase 3) | T001 | Nothing |
| US2 (Phase 4) | T001 | Nothing |
| US3 (Phase 5) | T001 | Nothing |

All three stories touch **different files** — they can be worked on in parallel by different team members.

### Within Each User Story

- All `[P]`-marked tasks within a phase touch different files and can be run in parallel.
- The trailing `format:check` task (T005, T009) should run after all `[P]` tasks in that phase complete.

---

## Parallel Opportunities

### Full parallel (single developer, Phase 3)

```
T002 (Logger.ts)    ─┐
T003 (Profiler.ts)  ─┼─ all in parallel → T005 format:check
T004 (RetryPolicy.ts)┘
```

### Full parallel (single developer, Phase 4)

```
T006 (EnvManager.ts)  ─┐
T007 (StorageUtils.ts) ─┼─ all in parallel → T009 format:check
T008 (UrlHelper.ts)   ─┘
```

### Cross-story parallel (two developers)

```
Developer A: T002 → T003 → T004 → T005 (US1)
Developer B: T006 → T007 → T008 → T009 (US2)
Developer C: T010 (US3)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. T001 — read style guide
2. T002, T003, T004 in parallel
3. T005 — format check
4. **STOP**: Validate tooltips in VS Code for `Logger`, `Profiler`, `RetryPolicy`

### Incremental Delivery

1. Complete Phase 3 (US1) → MVP: core classes documented
2. Complete Phase 4 (US2) → helpers documented
3. Complete Phase 5 (US3) → `ResponseValidator` public API documented
4. Complete Phase 6 → full build + test validation

---

## Notes

- `[P]` tasks in Phases 3–4 all touch different files — zero merge conflicts when run in parallel.
- No test files are created or modified — this is a pure documentation PR.
- After each file edit run `npx prettier --write <file>` immediately to avoid a bulk fix at the end.
- Use the file-by-file checklist in `quickstart.md` to track individual symbol completion within each task.
- Commit after each user story phase for cleaner review history.
