# Tasks: Raise Test Coverage to 100% with Robust Tests

**Input**: Design documents from `/specs/010-full-coverage-tests/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅
**Branch**: `010-full-coverage-tests`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US5)
- No tests are generated separately — this feature IS tests

---

## Phase 1: Setup — US4 Barrel Exclusion (Priority: P0, blocks all other phases)

**Purpose**: Update `vitest.config.ts` to exclude the 11+4 logic-free barrel re-export files from the coverage report. This is a pure config change with no test code. Does not require threshold raise yet — thresholds stay at 80 until all gaps are closed (Phase 7).

- [ ] T001 [US4] Add all logic-free barrel files to `vitest.config.ts` coverage exclusion list in `vitest.config.ts`

**Excluded barrel files to add**:
- `src/api-client.ts`, `src/debug.ts`, `src/env-manager.ts`, `src/file-upload.ts`, `src/logger.ts`, `src/profiler.ts`, `src/response-validator.ts`, `src/retry-policy.ts`, `src/storage-utils.ts`, `src/streaming.ts`, `src/websocket.ts`
- `src/utils/index.ts`, `src/utils/core/index.ts`, `src/utils/helpers/index.ts`, `src/utils/async/index.ts`

**Checkpoint**: Run `pnpm test -- --coverage` — barrel files should no longer appear in the coverage table. Existing tests still pass.

---

## Phase 2: Foundational

**Not required** — all test files in `tests/` are independent of each other. No shared infrastructure needs to be built before user story work begins. All Phase 3+ tasks can start immediately after Phase 1.

---

## Phase 3: User Story 1 — Async Edge Cases (Priority: P1) 🎯 MVP

**Goal**: Close all coverage gaps in `src/utils/async/` — the 5 remaining uncovered branches across 5 files. Each task targets a different file.

**Independent Test**: `pnpm test -- --coverage tests/async/` — all async files must show 100% across all four metrics.

- [ ] T002 [P] [US1] Add `flush()`-after-`cancel()` guard test covering `pendingArgs === null` return in `tests/async/debounce.test.ts` (line 57)
- [ ] T003 [P] [US1] Add `AbortError` re-throw test covering abort-during-sleep path in `tests/async/retry.test.ts` (lines 106-107)
- [ ] T004 [P] [US1] Add `reject` callback error path test covering `reject?.(error)` in trailing-call supersede in `tests/async/throttle.test.ts` (lines 78-79)
- [ ] T005 [P] [US1] Add empty-entries guard test covering `if (!entries || entries.length === 0) return` in `tests/async/request-batcher.test.ts` (line 166)
- [ ] T006 [P] [US1] Add non-Error throwable normalisation test covering `err instanceof Error ? err : new Error(String(err))` in `tests/async/request-queue.test.ts` (line 176)

**Checkpoint**: `pnpm test -- --coverage tests/async/` shows 100 | 100 | 100 | 100 for all async files.

---

## Phase 4: User Story 2 — Core Utility Gaps (Priority: P2)

**Goal**: Close all coverage gaps in `src/utils/core/` — 8 files each with specific uncovered branches in error-handling and environment-switching paths.

**Independent Test**: `pnpm test -- --coverage tests/debug.test.ts tests/logger.test.ts tests/rate-limiter.test.ts tests/request-cache.test.ts tests/response-validator.test.ts tests/retry-policy.test.ts tests/error-boundary-exhaustive.test.ts tests/api-client-coverage.test.ts`

- [ ] T007 [P] [US2] Add `performance.now` unavailable fallback test using `vi.stubGlobal('performance', undefined)` in `tests/debug.test.ts` (line 9), **and** add logger-option-absent branch test covering line 119
- [ ] T008 [P] [US2] Add browser-transport level-filter tests using `consoleTransportBrowser()` with `vi.spyOn(console, 'warn')` and `vi.spyOn(console, 'log')` in `tests/logger.test.ts` (lines 112, 114, 146, 158)
- [ ] T009 [P] [US2] Add sliding-window boundary test and `cancelRequest(url)` call test in `tests/rate-limiter.test.ts` (lines 179, 194-196)
- [ ] T010 [P] [US2] Add `RequestCache.has(key)` cache-miss branch test for a key that does not exist in `tests/request-cache.test.ts` (line 92)
- [ ] T011 [P] [US2] Add null-data early-return test and `schema.minimum` violation test in `tests/response-validator.test.ts` (lines 102-103, 218-223)
- [ ] T012 [P] [US2] Add `CircuitBreaker.reset()` test, `errorMessageFormatter` that throws test, and `RetryPolicy` exhaustion-fallback test in `tests/retry-policy.test.ts` (lines 48, 105-109, 150)
- [ ] T013 [P] [US2] Add wrapped-sync-error `.catch` handler test, `"UNKNOWN"` error code test, and `: 500` statusCode test in `tests/error-boundary-exhaustive.test.ts` (lines 299-304, 425, 430)
- [ ] T014 [P] [US2] Add response body parse-failure `catch` test, locale-fallback error-message test, and `createApiClient` factory test in `tests/api-client-coverage.test.ts` (lines 878-881, 909, 926)

**Checkpoint**: All 8 core files show 100 | 100 | 100 | 100 in the coverage table.

---

## Phase 5: User Story 3 — Helper Utility Gaps (Priority: P3)

**Goal**: Close all coverage gaps in `src/utils/helpers/` — 11 files each with specific uncovered branches in environment-branching and error-handling paths. All tasks target different files and can run in parallel.

**Independent Test**: `pnpm test -- --coverage tests/cache-manager.test.ts tests/compression-utils.test.ts tests/crypto-utils.test.ts tests/diff-utils.test.ts tests/env-manager.test.ts tests/event-emitter.test.ts tests/streaming-helper.test.ts tests/url-helper.test.ts tests/websocket-helper.test.ts tests/file-upload.test.ts tests/polling-helper.test.ts`

- [ ] T015 [P] [US3] Add `localStorage` undefined-guard test and TTL eviction `storageCache.delete` test using `vi.stubGlobal('localStorage', ...)` in `tests/cache-manager.test.ts` (lines 143-145, 222-223)
- [ ] T016 [P] [US3] Add `zlib.inflate` catch-fallback string-branch test and `Blob`-undefined `Buffer.byteLength` path test using `vi.stubGlobal('Blob', undefined)` in `tests/compression-utils.test.ts` (lines 228-232, 238, 249)
- [ ] T017 [P] [US3] Add `btoa` browser-path encode test and `atob` browser-path decode test using `vi.stubGlobal('Buffer', undefined)` in `tests/crypto-utils.test.ts` (lines 373-376, 386-391)
- [ ] T018 [P] [US3] Add `invertPatch` `"add"` operation inversion test and `diff()` removed-key detection test in `tests/diff-utils.test.ts` (lines 164-168, 205, 240)
- [ ] T019 [P] [US3] Add `import.meta.env` browser-path `get()` value return test using `vi.stubGlobal('window', {})` in `tests/env-manager.test.ts` (line 17)
- [ ] T020 [P] [US3] Add `off()` listener-not-found no-op test, `throwErrors: true` error re-throw test, and `listeners()` empty-array fallback test in `tests/event-emitter.test.ts` (lines 189, 198-199, 242)
- [ ] T021 [P] [US3] Add SSE `\r`-stripping test, blank-line field/val reset test, and value-after-colon slice test in `tests/streaming-helper.test.ts` (lines 411, 422-423, 430)
- [ ] T022 [P] [US3] Add `safeString(null)` empty-string test and `serializeValue` unknown-type fallback test in `tests/url-helper.test.ts` (lines 12, 26-27)
- [ ] T023 [P] [US3] Add reconnect-handler-throws `console.error` catch test and validation-error-handler-throws `console.error` catch test in `tests/websocket-helper.test.ts` (lines 338-339, 383-384)
- [ ] T024 [P] [US3] Add upload error-message fallback `"Upload failed"` branch test in `tests/file-upload.test.ts` (line 241)
- [ ] T025 [P] [US3] Add non-Error thrown normalisation `instanceof Error ? error : new Error(String(error))` test in `tests/polling-helper.test.ts` (line 126)

**Checkpoint**: All 11 helper files show 100 | 100 | 100 | 100 in the coverage table.

---

## Phase 6: User Story 5 — CLI Coverage to 100% (Priority: P5)

**Goal**: Raise `src/cli/` from ~50% to 100% across all 4 CLI files. CLI tests use real tmp directories for file-system writes (following the existing pattern in `ddd-boilerplate.test.ts`) and `vi.stubGlobal('fetch', ...)` for HTTP calls.

**Independent Test**: `pnpm test -- --coverage tests/ddd-boilerplate.test.ts tests/cli-main.test.ts tests/swagger-generator.test.ts tests/type-generator-extra.test.ts`

- [ ] T026 [P] [US5] Add `EEXIST`-silenced `.gitkeep` write test and multi-action scaffold test covering `actions` normalisation path in `tests/ddd-boilerplate.test.ts` (lines 64-372, 420-481)
- [ ] T027 [P] [US5] Add missing-URL exit test, `handleTypeGeneration` mock test, `handleSimpleFetch` mock test, and complex `--header=` value parsing test in `tests/cli-main.test.ts` (index.ts lines 46.1% gaps)
- [ ] T028 [P] [US5] Add HTML-body spec fallback test and no-valid-schemas warning test in `tests/swagger-generator.test.ts` (lines 181-186, 199)
- [ ] T029 [P] [US5] Add HTTP non-OK status error test and non-JSON body error test in `tests/type-generator-extra.test.ts` (lines 176-203)

**Checkpoint**: All 4 CLI files show 100 | 100 | 100 | 100 in the coverage table.

---

## Phase 7: Polish & Validation

**Purpose**: Raise the coverage thresholds to enforce 100% permanently, then verify the final state of the entire test suite.

- [ ] T030 Raise all four coverage thresholds from `80` to `100` in `vitest.config.ts`
- [ ] T031 Run `pnpm test -- --coverage` and confirm `All files | 100 | 100 | 100 | 100` with zero test failures (if the CLI self-invocation guard in `src/cli/index.ts` remains uncoverable, add it to the `vitest.config.ts` exclusion list before re-running — per SC-001 qualifier)
- [ ] T032 [P] Run `pnpm run format:check` and confirm zero Prettier warnings across all modified files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 3–6 (User Stories)**: All depend on Phase 1 completion; all stories can run in parallel with each other since every task targets a different file
- **Phase 7 (Polish)**: Depends on all user story phases being complete

### User Story Dependencies

| Story | Depends on | Can parallel with |
| --- | --- | --- |
| US1 async (Phase 3) | Phase 1 | US2, US3, US5 |
| US2 core (Phase 4) | Phase 1 | US1, US3, US5 |
| US3 helpers (Phase 5) | Phase 1 | US1, US2, US5 |
| US5 CLI (Phase 6) | Phase 1 | US1, US2, US3 |

### Within Each User Story

All tasks within Phase 3, 4, 5, and 6 marked `[P]` can run simultaneously — they target different files with zero inter-task dependencies.

---

## Parallel Example: User Story 2 (Phase 4)

```bash
# All 8 core tasks can be launched at the same time:
T007: tests/debug.test.ts           → src/utils/core/debug.ts
T008: tests/logger.test.ts          → src/utils/core/Logger.ts
T009: tests/rate-limiter.test.ts    → src/utils/core/RateLimiter.ts
T010: tests/request-cache.test.ts   → src/utils/core/RequestCache.ts
T011: tests/response-validator.test.ts → src/utils/core/ResponseValidator.ts
T012: tests/retry-policy.test.ts    → src/utils/core/RetryPolicy.ts
T013: tests/error-boundary-exhaustive.test.ts → src/utils/core/ErrorBoundary.ts
T014: tests/api-client-coverage.test.ts → src/utils/core/ApiClient.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 — async gaps only)

1. Complete Phase 1: add barrel exclusions to `vitest.config.ts`
2. Complete Phase 3: T002–T006 (5 tests, all in `tests/async/`)
3. **Validate**: `pnpm test -- --coverage tests/async/` → 100% for all async files
4. Proceed to Phase 4 when ready

### Incremental Delivery

- After Phase 1 + Phase 3: async layer is at 100% ✅
- After Phase 4: core layer is at 100% ✅
- After Phase 5: helpers layer is at 100% ✅
- After Phase 6: CLI layer is at 100% ✅
- After Phase 7: thresholds enforced → CI will catch future regressions

### Key Testing Patterns (from research.md)

| Pattern | Use case |
| --- | --- |
| `vi.stubGlobal('Buffer', undefined)` | Force `btoa`/`atob` browser path in CryptoUtils (T017) |
| `vi.stubGlobal('performance', undefined)` | Force `Date.now()` fallback in debug.ts (T007) |
| `vi.stubGlobal('localStorage', {...})` | Simulate browser `localStorage` in CacheManager (T015) |
| `vi.stubGlobal('window', {})` | Trigger `import.meta.env` path in EnvManager (T019) |
| `vi.stubGlobal('Blob', undefined)` | Force `Buffer.byteLength` path in CompressionUtils (T016) |
| `vi.spyOn(console, 'warn').mockImplementation()` | Intercept Logger browser transport (T008) |
| `vi.stubGlobal('fetch', vi.fn())` | Mock HTTP in CLI tests (T027–T029) |
| Real `tmp` directory via `os.tmpdir()` | File-system tests in ddd-boilerplate (T026) |
| `controller.abort()` inside fn | Trigger abort-during-sleep in retry (T003) |
| Always call `vi.unstubAllGlobals()` in `afterEach` | Prevent global state bleed between tests |
