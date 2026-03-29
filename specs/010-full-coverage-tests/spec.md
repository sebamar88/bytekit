# Feature Specification: Raise Test Coverage to 100% with Robust Tests

**Feature Branch**: `010-full-coverage-tests`  
**Created**: 2026-03-29  
**Status**: Draft  
**Input**: User description: "quiero subir el coverage general a 100% pero un coverage con pruebas robustas y reales, no pruebas simplonas"

## Context

Current overall coverage: **88% statements / 86.68% branches / 89.95% functions**.  
Target: **100% across all metrics** for all files in scope.  
The following groups of files have gaps that require real, behavioural tests — not trivial happy-path assertions.

**Coverage gaps by area (from the current run):**

| Area | Stmts | Branches | Key uncovered lines |
| --- | --- | --- | --- |
| `src/` root barrel re-exports | 0% | 0% | All (11 files — logic-free re-exports) |
| `src/cli/` | 50.86% | 65.06% | `ddd-boilerplate.ts` 28.82%, `index.ts` 46.1%, `type-generator.ts` 65.54%, `swagger-generator.ts` 88.6% |
| `src/utils/async` | 99.55% | 98.14% | `debounce` L57, `retry` L106-107, `throttle` L78-79, `request-batcher` L166, `request-queue` L176 |
| `src/utils/core` | 91.29% | 84.68% | `ApiClient` L878-881/909/926, `ErrorBoundary` L299-304/425/430, `Logger` L112/114/146/158, `RateLimiter` L179/194-196, `RequestCache` L92, `ResponseValidator` L102-103/218-223, `RetryPolicy` L48/105-109/150, `debug` L9/119 |
| `src/utils/helpers` | 94.1% | 88.73% | `CacheManager` L143-145/222-223, `CompressionUtils` L228-232/238/249, `CryptoUtils` L373-376/386-391, `DiffUtils` L205/164-168/240, `EnvManager` L17, `EventEmitter` L189/198-199/242, `FileUploadHelper` L241, `PollingHelper` L126, `StreamingHelper` L411/422-423/430, `UrlHelper` L12/26-27, `WebSocketHelper` L338-339/383-384 |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cover async edge cases (Priority: P1)

A contributor runs `pnpm test --coverage` and sees 100% across `src/utils/async`. They can trust that all async edge cases — flush-after-cancel in debounce, AbortError re-throw in retry, reject callback in throttle, empty-batch guard in request-batcher, and error normalisation in request-queue — are exercised by real scenarios that would catch regressions.

**Why this priority**: The async primitives are foundational to the library. Gaps in branch coverage here mean real failure modes in production go untested. The barrel files (logic-free `export *`) are excluded from coverage scope rather than tested — covering them would only add noise. This sets the baseline from which all higher-level tests build.

**Independent Test**: Run `pnpm test --coverage` restricted to `src/utils/async`. All files must show 100% statements, branches, functions, and lines.

**Acceptance Scenarios**:

1. **Given** `debounce`'s `flush()` is called after `cancel()`, **When** `flush` runs with `pendingArgs === null`, **Then** the function returns immediately without invoking the wrapped function, and this path is covered.
2. **Given** a `retry` operation is sleeping between attempts, **When** an `AbortSignal` fires during the sleep delay, **Then** the `AbortError` from the sleep is re-thrown (lines 106-107 covered), not swallowed.
3. **Given** `throttle` is configured with a `reject` callback, **When** a call is dropped due to rate limiting and an error is thrown inside the rejected handler, **Then** lines 78-79 (the `reject?.(error)` path) are exercised.
4. **Given** `RequestBatcher` receives an empty-entries flush (line 166), **When** the batch processor fires with no items, **Then** it returns immediately and this guard is verified.
5. **Given** `RequestQueue` encounters a non-Error throwable during processing (line 176), **When** it normalises the value to an `Error`, **Then** the queue continues and the error is properly surfaced.

---

### User Story 2 — Full coverage of `src/utils/core` gaps (Priority: P2)

A contributor runs `pnpm test --coverage` restricted to `src/utils/core` and sees 100% across all metrics. Every currently-uncovered branch — error formatter exception in `CircuitBreaker`, transport failure in `Logger`, sliding-window boundary in `RateLimiter`, cache miss in `RequestCache`, number minimum in `ResponseValidator`, `RetryPolicy.reset()`, exhaustion fallback, and locale-based error message in `ApiClient` — is validated by a test that would actually catch a regression if that code path were deleted.

**Why this priority**: Core utilities (`ApiClient`, `ErrorBoundary`, `Logger`, `RetryPolicy`, `CircuitBreaker`) are the most-used parts of the library. Untested branches in error-handling paths are the most dangerous because they only run in production under abnormal conditions.

**Independent Test**: Run `pnpm test --coverage` restricted to `src/utils/core/**`. All files must show 100% statements, branches, functions, and lines.

**Acceptance Scenarios**:

1. **Given** `CircuitBreaker` is configured with an `errorMessageFormatter` that throws internally, **When** `execute()` is called on an open circuit, **Then** the fallback default message is used (line 48 covered).
2. **Given** a `Logger` transport function throws an error, **When** `log()` is called and the transport rejects, **Then** the rejection is caught and re-reported to `console.error` without crashing the caller.
3. **Given** `Logger` is constructed with `level: "warn"`, **When** `info()` and `debug()` are called, **Then** they are suppressed; only `warn` and `error` pass the `shouldLog` filter — exercising the ternary branches in both node and browser transports (lines 112, 114, 146, 158).
4. **Given** `RateLimiter` is in sliding-window mode and the window boundary condition fires (line 179), **When** a request hits exactly at the boundary, **Then** the correct expiry time is set.
5. **Given** `RateLimiter.reset(url)` is called for a tracked URL, **When** the URL is cleared (lines 194-196), **Then** subsequent requests to that URL are allowed immediately.
6. **Given** `RequestCache.has(key)` is called for a key that does not exist (line 92), **When** the entry is not found, **Then** `false` is returned.
7. **Given** `ResponseValidator.validate()` receives a number below `schema.minimum` (lines 218-223), **When** validated, **Then** the appropriate `ValidationError` is returned with the correct path and message.
8. **Given** `RetryPolicy.reset()` is called after failures (lines 105-109), **When** `execute()` is called again, **Then** the attempt count resets and the policy retries from scratch.
9. **Given** `RetryPolicy.execute()` exhausts all attempts and `lastError` is somehow undefined (line 150 fallback), **When** the final throw executes, **Then** a generic `"Retry policy failed"` error is thrown.
10. **Given** `ApiClient` is constructed with a non-default locale (line 909), **When** a generic error occurs, **Then** the error message is localised to the configured locale.
11. **Given** `ApiClient`'s response body parsing throws during `response.text()` (lines 878-881), **When** the catch block executes, **Then** `body` is set to `null` and processing continues.
12. **Given** the `debug.ts` module is loaded without `performance.now()` available (line 9), **When** `now()` is called, **Then** it falls back to `Date.now()`.
13. **Given** `createStopwatch()` is called **without** a `logger` option (line 119), **When** `stop()` or `log()` runs, **Then** the logger-dependent branch is not entered and no error is thrown.

---

### User Story 3 — Full coverage of `src/utils/helpers` gaps (Priority: P3)

A contributor runs `pnpm test --coverage` restricted to `src/utils/helpers` and sees 100% across all metrics. Every uncovered helper path — `localStorage` undefined guard in `CacheManager`, `btoa`/`atob` paths in `CryptoUtils`, string decompression path in `CompressionUtils`, inverse patch in `DiffUtils`, error re-throw in `EventEmitter`, carriage-return stripping in `StreamingHelper`, and error handlers in `WebSocketHelper` — is validated by a test that would catch a real regression.

**Why this priority**: Helpers are the second most-used layer. The uncovered lines are disproportionately in error-handling and environment-branching code (browser vs Node) — exactly the paths that break silently in production.

**Independent Test**: Run `pnpm test --coverage` restricted to `src/utils/helpers/**`. All files must show 100% statements, branches, functions, and lines.

**Acceptance Scenarios**:

1. **Given** `CacheManager` is used in an environment where `localStorage` is undefined (lines 143-145), **When** `delete()` or `clear()` are called, **Then** the guard prevents a `ReferenceError` and the method returns cleanly.
2. **Given** `CacheManager`'s TTL-based eviction runs (lines 222-223), **When** an expired entry is encountered during cleanup, **Then** it is removed from the internal storage map.
3. **Given** `CryptoUtils` is used in a browser-like environment where `btoa`/`atob` are available (lines 373-376, 386-391), **When** base64 encode/decode operations run through the `globalThis.btoa`/`atob` path, **Then** the output is correct and the path is covered.
4. **Given** `CompressionUtils` receives a `string` as input to `decompressResponse()` (lines 228-232), **When** decompressed, **Then** the string branch is taken and the correct value returned.
5. **Given** `CompressionUtils.byteLength()` is called (line 249), **When** a UTF-8 string is passed, **Then** `Buffer.byteLength` is used and the result matches the expected byte count.
6. **Given** `DiffUtils.invertPatch()` processes an `"add"` operation (lines 164-168), **When** inverted, **Then** the patch becomes a `"remove"` with the correct path and old value.
7. **Given** `DiffUtils.diff()` detects a removed path (line 240), **When** a key is absent from the new object, **Then** the path is added to `result.removed`.
8. **Given** `EventEmitter.off()` is called for a listener that no longer exists (line 189), **When** the listener is not found, **Then** the registry is unchanged and no error is thrown.
9. **Given** `EventEmitter` has `throwErrors: true` configured and an event listener throws (lines 198-199), **When** the error propagates, **Then** it is re-thrown to the caller.
10. **Given** `EventEmitter.listeners()` is called for an event with no registered handlers (line 242), **When** invoked, **Then** an empty array is returned.
11. **Given** `StreamingHelper` processes an SSE line ending with `\r` (line 411), **When** the carriage return is stripped, **Then** the field is parsed correctly.
12. **Given** `StreamingHelper` encounters a line with an empty field name after `":"` (lines 422-423), **When** the field and val are reset, **Then** parsing continues correctly.
13. **Given** `WebSocketHelper`'s reconnect handler itself throws (lines 338-339), **When** the error occurs, **Then** it is caught and logged to `console.error` without crashing the connection manager.
14. **Given** `WebSocketHelper`'s validation error handler throws (lines 383-384), **When** the error occurs, **Then** it is caught and logged without propagating.
15. **Given** `UrlHelper.safeString()` receives `null` or `undefined` (line 12), **When** called, **Then** an empty string is returned.
16. **Given** `UrlHelper.serializeValue()` receives an unknown type (lines 26-27), **When** called, **Then** `safeString` fallback is invoked and an empty string returned.
17. **Given** `EnvManager` is in **browser** mode (`window` is defined) and `import.meta.env?.[name]` returns a value (line 17), **When** `get()` is called for that variable name, **Then** that value is returned without falling through to `process.env`.

---

### User Story 4 — Exclude logic-free barrel files from coverage scope (Priority: P0 — must precede all other stories)

A contributor reviews the coverage report and sees no noise from logic-free `export *` barrel files. The 11 files in `src/` root (`api-client.ts`, `debug.ts`, `env-manager.ts`, `file-upload.ts`, `logger.ts`, `profiler.ts`, `response-validator.ts`, `retry-policy.ts`, `storage-utils.ts`, `streaming.ts`, `websocket.ts`) are excluded from the coverage calculation in `vitest.config.ts`, as they contain zero executable logic.

**Why this priority**: These files contain only `export *` statements with no executable logic. Including them in the coverage report creates false negatives (0% coverage for code that cannot meaningfully be tested independently). Excluding them keeps the report accurate and meaningful.

**Independent Test**: Run `pnpm test --coverage` and confirm the 11 barrel files no longer appear in the coverage table and no longer drag the overall percentage below 100%.

**Acceptance Scenarios**:

1. **Given** the 11 root barrel files have only `export *` statements, **When** they are added to `vitest.config.ts` coverage exclusions, **Then** they disappear from the coverage report without affecting any test results.
2. **Given** all other coverage gaps are closed (US1–US3), **When** `pnpm test --coverage` runs, **Then** `All files | 100 | 100 | 100 | 100` is shown.

---

### User Story 5 — Raise CLI coverage to 100% (Priority: P5)

A contributor runs `pnpm test --coverage` restricted to `src/cli` and sees 100% across all files. The DDD boilerplate generator, CLI router, Swagger generator, and type generator are each tested against their full behaviour: success paths, error paths, argument validation, and file-system interactions (mocked).

**Why this priority**: CLI code has the lowest coverage (50.86%) and the most complex untested branches. It is lower priority than the utility layer because CLI failures are visible to end users at invocation time rather than silently at runtime, and because the testing infrastructure for file-system mocking is more complex to set up.

**Independent Test**: Run `pnpm test --coverage` restricted to `src/cli/**`. All files must show 100% statements, branches, functions, and lines.

**Acceptance Scenarios**:

1. **Given** `ddd-boilerplate.ts`'s `pascalFromKebabSlug` helper is called with various slug formats, **When** invoked, **Then** the correct PascalCase result is returned, exercising all split/filter/map branches.
2. **Given** the `.gitkeep` writer encounters an `EEXIST` error (lines 360-372), **When** the file already exists, **Then** the error is silently ignored and the loop continues.
3. **Given** `ddd-boilerplate.ts`'s normalised-actions path (lines 420-430) receives multiple comma-separated action specs, **When** scaffold is invoked, **Then** each action config is resolved and the correct files are generated.
4. **Given** `index.ts`'s unmatched command path (lines 202-203, 251-255), **When** an unknown command is passed, **Then** the CLI prints an error message and exits with a non-zero code.
5. **Given** `type-generator.ts`'s uncovered HTTP error paths (lines 176-177, 181-203), **When** the endpoint returns a non-OK status or a non-JSON body, **Then** the generator throws a descriptive error.
6. **Given** `swagger-generator.ts`'s uncovered branches (lines 181, 183-186, 199), **When** the spec URL returns HTML instead of JSON or has no valid schemas, **Then** the generator attempts to locate the embedded JSON spec and warns appropriately.

---

### Edge Cases

- Tests MUST NOT use `/* c8 ignore */` or `/* istanbul ignore */` annotations to artificially inflate coverage — every line must be reached by a real test scenario.
- Mocking of browser globals (`localStorage`, `btoa`, `atob`, `window`) must be properly torn down after each test to avoid cross-test contamination.
- CLI tests that touch the file system MUST use `tmp` directories or `memfs`/`vi.mock('fs')` — no real file-system writes in the test suite.
- Tests for transport failure in `Logger` must restore `console.error` after each assertion.
- The existing 720 passing tests must continue to pass — no regressions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every source file tracked by the coverage reporter MUST reach 100% statement, branch, function, and line coverage.
- **FR-002**: Logic-free barrel files (`export *` only) in `src/` root MUST be added to the vitest coverage exclusion list so they do not appear in the coverage table.
- **FR-003**: New tests MUST test real behaviour — asserting observable outputs, side effects, thrown errors, or state changes — not implementation details or call counts for their own sake.
- **FR-004**: New tests MUST NOT use coverage-bypass annotations (`/* c8 ignore */`, `/* istanbul ignore */`).
- **FR-005**: Each currently-uncovered line MUST be exercised by at least one test whose removal would cause the line to become uncovered again (i.e., the test must actually cover the line, not coincidentally pass through it).
- **FR-006**: All new tests MUST follow the existing vitest patterns in the codebase: `describe` / `it` blocks, `vi.fn()` for mocks, `vi.useFakeTimers()` where timing is involved, and `afterEach` teardown.
- **FR-007**: CLI tests that involve file-system operations MUST mock `fs` or use a temporary directory to prevent side effects on the developer's machine.
- **FR-008**: All existing 720 tests MUST continue to pass after the new tests are added.
- **FR-009**: The coverage thresholds in `vitest.config.ts` MUST be raised from 80% to 100% once all gaps are closed, so future regressions are caught by CI.

### Key Entities

- **Coverage gap**: A source line, branch, or function reachable from the public API that has no test exercising it.
- **Robust test**: A test that verifies a real behavioural contract — input → output, or action → observable side effect — such that deleting the implementation line would cause the test to fail.
- **Barrel file**: A file containing only `export * from '...'` with zero executable statements, legitimately excluded from coverage metrics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `pnpm test --coverage` reports `All files | 100 | 100 | 100 | 100` (statements, branches, functions, lines). Exception: the `if (process.argv[1] === fileURLToPath(import.meta.url))` self-invocation guard in `src/cli/index.ts` is not reachable via the test runner; if v8 counts it as an uncovered branch it must be added to the `vitest.config.ts` coverage exclusion patterns rather than bypassed with an annotation.
- **SC-002**: The 11 root barrel re-export files no longer appear in the coverage table.
- **SC-003**: All 720 pre-existing tests continue to pass; zero test regressions.
- **SC-004**: Coverage thresholds in `vitest.config.ts` are set to 100% for all four metrics.
- **SC-005**: No new test uses a coverage-bypass annotation.
- **SC-006**: Each new test file passes `pnpm run lint` and `pnpm run format:check` with zero warnings.

## Assumptions

- The testing framework (vitest) and coverage provider (v8) remain unchanged.
- Browser-specific code paths (`btoa`, `atob`, `localStorage`, `window`) are tested via `globalThis` monkey-patching or by configuring the test environment — not by switching the vitest environment to `jsdom`.
- CLI file-system interactions are mocked using `vi.mock('node:fs/promises')` or equivalent; no real files are written during the test run.
- The `src/utils/helpers/index.ts` file (0% in helpers) is also a barrel file and is added to the exclusion list.
- Performance-sensitive helpers (e.g., `CompressionUtils.byteLength`) are tested for correctness, not for speed.
- The `src/cli` tests may require `vi.mock` for `node:child_process` and `node:fs/promises` — these are acceptable test-only dependencies.
