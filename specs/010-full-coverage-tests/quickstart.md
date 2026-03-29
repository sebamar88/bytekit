# Quickstart: Verify and Develop Test Coverage

**Feature**: 010-full-coverage-tests  
**Branch**: `010-full-coverage-tests`

## Prerequisites

- Node.js 18+
- pnpm installed (`npm i -g pnpm`)
- Project dependencies installed (`pnpm install`)

## Running the full test suite with coverage

```bash
# Full run — shows the complete coverage table
pnpm test -- --coverage
```

The target result is:

```
All files  | 100  | 100  | 100  | 100  |
```

## Running coverage for a specific area

Use `--reporter=verbose` and pass a file-path filter to focus on one area:

```bash
# Async utilities only
pnpm test -- --coverage --reporter=verbose tests/async/

# Core utilities only
pnpm test -- --coverage --reporter=verbose tests/logger.test.ts tests/retry-policy.test.ts tests/error-boundary*.test.ts tests/api-client*.test.ts tests/rate-limiter.test.ts tests/request-cache.test.ts tests/response-validator.test.ts tests/debug.test.ts

# Helper utilities only
pnpm test -- --coverage --reporter=verbose tests/cache-manager.test.ts tests/compression-utils.test.ts tests/crypto-utils.test.ts tests/diff-utils.test.ts tests/env-manager.test.ts tests/event-emitter.test.ts tests/streaming-helper.test.ts tests/url-helper.test.ts tests/websocket-helper.test.ts tests/file-upload.test.ts tests/polling-helper.test.ts

# CLI only
pnpm test -- --coverage --reporter=verbose tests/cli-main.test.ts tests/ddd-boilerplate.test.ts tests/swagger-generator.test.ts tests/type-generator*.test.ts tests/bytekit-cli.test.ts tests/cli.test.ts
```

## Checking a specific source file's coverage

```bash
# Inspect which lines are still uncovered in a single file
pnpm test -- --coverage 2>&1 | Select-String "RetryPolicy|Logger|ApiClient|ErrorBoundary"
```

## Verifying no regressions

```bash
# Run without coverage for speed — confirms the 720+ existing tests still pass
pnpm test
```

## Checking format compliance of new test files

```bash
# Prettier check
pnpm run format:check

# Auto-fix if needed
pnpm run format
```

## Coverage HTML report

After running `pnpm test -- --coverage`, open `coverage/index.html` in your browser for a line-by-line view:

```bash
# macOS
open coverage/index.html

# Windows
start coverage/index.html

# Linux
xdg-open coverage/index.html
```

## Threshold guard

`vitest.config.ts` thresholds will be raised to 100 at the end of this feature. If any test introduces a regression, CI will fail with:

```
ERROR: Coverage for lines (XX%) does not meet global threshold (100%)
```

## Key vitest APIs used in this feature

| API | Purpose |
| --- | --- |
| `vi.stubGlobal(name, value)` | Replace a global (e.g. `Buffer`, `localStorage`, `performance`) for browser-path tests |
| `vi.unstubAllGlobals()` | Restore all stubbed globals in `afterEach` |
| `vi.spyOn(obj, method)` | Observe calls to `console.error`, `console.warn`, etc. |
| `vi.fn()` | Create a mock function |
| `vi.mock('module')` | Mock an entire module (e.g. `node:zlib` for inflate tests) |
| `vi.useFakeTimers()` | Control time for debounce/throttle/retry backoff |
| `vi.advanceTimersByTimeAsync(ms)` | Advance fake timers asynchronously |

## Test file conventions in this project

- **Top-level flat tests** (`test(...)` without `describe`) are written with the `assert.*` shim defined in `tests/setup.ts`
- **Structured tests** use `describe` / `it` from vitest
- **Mock teardown**: always call `mockFn.mockRestore()` in `afterEach` or at end of test to avoid bleeding into other tests
- **Fake timers**: call `vi.useRealTimers()` in `afterEach` when `vi.useFakeTimers()` is used
