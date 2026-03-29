# Research: Raise Test Coverage to 100% with Robust Tests

**Phase**: 0 — Unknowns & Best Practices  
**Branch**: `010-full-coverage-tests`

---

## R-001: Mocking `Buffer` absence to force `btoa`/`atob` paths in CryptoUtils

**Question**: `CryptoUtils.uint8ArrayToBase64` (lines 373-376) and `base64ToUint8Array` (lines 386-391) check `typeof Buffer !== "undefined"` before taking the Node.js path. In Node tests, `Buffer` is always defined. How do we force the browser path?

**Decision**: Use `vi.stubGlobal('Buffer', undefined)` before the test and `vi.unstubAllGlobals()` in `afterEach`. In vitest (Node environment), `Buffer` lives on `globalThis`, so stubbing it to `undefined` makes `typeof Buffer === "undefined"` true during that test.

**Rationale**: `vi.stubGlobal` is the idiomatic vitest API for replacing global values for a single test. It handles cleanup automatically via `vi.unstubAllGlobals()`. This is safer than `delete globalThis.Buffer` which is irreversible in a fork.

**Alternatives considered**:
- Switching vitest `environment` to `jsdom` — rejected; would break Node-specific tests and require per-file environment config
- `delete globalThis.Buffer` — rejected; modifies the global permanently for the fork's lifetime

**Usage pattern**:
```typescript
describe("browser path (no Buffer)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("base64 encodes via btoa when Buffer is undefined", () => {
    vi.stubGlobal("Buffer", undefined);
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const result = CryptoUtils.uint8ArrayToBase64(bytes);
    expect(result).toBe(btoa("Hello"));
  });
});
```

---

## R-002: Forcing `performance.now` absence in `debug.ts` (line 9)

**Question**: `debug.ts` line 6-8 checks `typeof performance !== "undefined" && typeof performance.now === "function"`. In Node 18+, `performance` is always defined. How do we reach the `Date.now()` fallback on line 9?

**Decision**: Use `vi.stubGlobal('performance', undefined)` before importing or instantiating the stopwatch, then restore with `vi.unstubAllGlobals()`.

**Rationale**: The `now()` helper is a module-level arrow function that captures `performance` at call time (not at module-load time), so stubbing the global before the test call is sufficient.

**Usage pattern**:
```typescript
it("falls back to Date.now when performance is unavailable", () => {
  vi.stubGlobal("performance", undefined);
  const sw = createStopwatch();
  const elapsed = sw.elapsed();
  expect(elapsed).toBeGreaterThanOrEqual(0);
  vi.unstubAllGlobals();
});
```

---

## R-003: Covering `CircuitBreaker.reset()` and `errorMessageFormatter` exception (lines 105-109, 48)

**Question**: `CircuitBreaker.reset()` (lines 105-109) resets state, failureCount, successCount, and lastFailureTime. It is never called in existing tests. The `errorMessageFormatter` exception catch (line 48) requires a formatter that throws.

**Decisions**:

- **reset() coverage**: Open the circuit by triggering enough failures (`failureThreshold` exceeded), call `reset()`, then assert `getState() === "closed"` and that a subsequent `execute()` succeeds.
- **formatter-throws coverage (line 48)**: Construct a `CircuitBreaker` with `errorMessageFormatter: () => { throw new Error("fmt fail"); }` and an `execute()` that calls a forced-open circuit. The `catch` block silently uses the default message.

**Usage pattern**:
```typescript
it("reset() returns circuit to closed state after failures", async () => {
  const cb = new CircuitBreaker({ failureThreshold: 1, timeoutMs: 60_000 });
  await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
  expect(cb.getState()).toBe("open");
  cb.reset();
  expect(cb.getState()).toBe("closed");
  await expect(cb.execute(() => Promise.resolve(42))).resolves.toBe(42);
});

it("uses default message when errorMessageFormatter throws", async () => {
  const cb = new CircuitBreaker({
    failureThreshold: 1,
    timeoutMs: 60_000,
    errorMessageFormatter: () => { throw new Error("formatter broke"); },
  });
  await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
  await expect(cb.execute(() => Promise.resolve())).rejects.toThrow(/Circuit breaker is open/);
});
```

---

## R-004: Covering `RetryPolicy` exhaustion fallback `lastError ?? new Error("Retry policy failed")` (line 150)

**Question**: Line 150 is `throw lastError ?? new Error("Retry policy failed")`. The `?? new Error(...)` branch fires only if `lastError` is `undefined` after exhausting retries. But `lastError` is assigned in the catch block — how can it be `undefined`?

**Decision**: In practice `lastError` is always set before exhaustion; line 150 is the entire `throw` statement, not just the `??` arm. The v8 coverage tool marks the throw statement as a branch when the ternary is involved. Covering it requires a `RetryPolicy` that exhausts all attempts with a real error — the `throw` statement itself is the branch target v8 records.

Existing tests for `RetryPolicy.execute()` already fail fast; what's missing is the path where `maxAttempts` is reached with a specific `shouldRetry` that blocks early exit. A test with `maxAttempts: 1` where the wrapped fn always throws will exercise lines 148-150 directly.

**Usage pattern**:
```typescript
it("throws after all attempts are exhausted", async () => {
  const policy = new RetryPolicy({ maxAttempts: 1, initialDelayMs: 0 });
  const err = new Error("always fails");
  await expect(policy.execute(() => { throw err; })).rejects.toThrow("always fails");
});
```

---

## R-005: Covering `retry.ts` abort-during-sleep (lines 106-107)

**Question**: Lines 106-107 are the `if (sleepError instanceof AbortError) throw sleepError` branch inside the sleep `catch`. How do we abort specifically during the sleep, not before the operation?

**Decision**: Use a `AbortController` whose `abort()` is called inside the function under retry — after the first failure, the signal fires and the next `sleep()` call receives an already-aborted signal. The `sleep()` function in `src/utils/async/sleep.ts` throws an `AbortError` when the signal is aborted, which propagates through lines 104-107.

**Usage pattern**:
```typescript
it("re-throws AbortError when sleep is aborted mid-retry", async () => {
  const controller = new AbortController();
  let calls = 0;
  const fn = vi.fn(async () => {
    calls++;
    controller.abort(); // abort after first failure so sleep throws
    throw new Error("fail");
  });
  await expect(
    retry(fn, { maxAttempts: 3, baseDelay: 50, signal: controller.signal })
  ).rejects.toBeInstanceOf(AbortError);
});
```

---

## R-006: Covering `throttle.ts` reject-callback error path (lines 78-79)

**Question**: Lines 78-79 are `reject?.(error)` inside the trailing-call rejection. This branch fires when a `reject` option is provided and the throttled function has a queued trailing call that gets replaced. How do we trigger this path?

**Decision**: Construct a `throttleAsync` with a `reject` callback. Make the first call succeed, then queue a second (trailing) call, then queue a third call which replaces the second — the second's promise rejects and `reject?.(error)` fires.

**Usage pattern**:
```typescript
it("calls reject callback when a trailing call is superseded", async () => {
  const reject = vi.fn();
  const fn = vi.fn(async (x: number) => x);
  const throttled = throttleAsync(fn, 50, { reject });

  await throttled(1);          // first call executes immediately
  const p2 = throttled(2);     // queued as trailing
  p2.catch(() => {});
  throttled(3).catch(() => {}); // supersedes p2 → reject fires for p2

  await new Promise((r) => setTimeout(r, 100));
  expect(reject).toHaveBeenCalled();
});
```

---

## R-007: Covering `Logger` browser-transport level filter (lines 112, 114, 146, 158)

**Question**: Lines 112 and 114 are inside `consoleTransportBrowser`'s level-dispatch ternary. Line 146 is the `console.warn` call for `level !== "error"` in the browser transport. Line 158 is another branch in the same transport. These require a logger using `consoleTransportBrowser`.

**Decision**: Construct a `Logger` explicitly wired to `consoleTransportBrowser()` and spy on `console.warn` / `console.log`. Call `logger.warn(...)` and `logger.info(...)` to exercise the non-error branch (line 146) and the info/debug path (line 158).

**Usage pattern**:
```typescript
it("browser transport uses console.warn for warn level", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const logger = new Logger({ transports: [consoleTransportBrowser()], level: "debug" });
  logger.warn("browser warn test");
  expect(warnSpy).toHaveBeenCalled();
  warnSpy.mockRestore();
});
```

---

## R-008: Covering `RateLimiter.cancelRequest` (lines 194-196)

**Question**: Lines 194-196 are inside `cancelRequest(key)` — `this.requests.delete(key)`. This method is never called in existing tests.

**Decision**: Call `rateLimiter.cancelRequest(url)` on a known tracked URL after making a request that was queued. Assert the next request to that URL is allowed immediately.

---

## R-009: Covering `CacheManager` localStorage-undefined guard (lines 143-145)

**Question**: Lines 143-145 check `typeof localStorage !== "undefined"` before calling `localStorage.removeItem`. In Node tests, `localStorage` is undefined, so this branch may already be executed — but it's reported as uncovered. This is a branch-coverage gap, not a statement gap.

**Decision**: The current tests do not exercise the `localStorage` path (where it IS defined). Use `vi.stubGlobal('localStorage', { removeItem: vi.fn(), clear: vi.fn(), getItem: vi.fn(), setItem: vi.fn() })` to simulate a browser environment, then call `cacheManager.delete(key)` and assert `localStorage.removeItem` was called.

---

## R-010: Covering `CompressionUtils.getSize` `Buffer.byteLength` path (line 249)

**Question**: Line 249 is `return Buffer.byteLength(str, "utf-8")`, which is the fallback when `globalThis.Blob` is undefined. In Node 18+, `Blob` is available. We need to stub it away.

**Decision**: Use `vi.stubGlobal('Blob', undefined)` before calling `CompressionUtils.getSize(str)`. The method then falls through to `Buffer.byteLength`.

---

## R-011: Covering `CompressionUtils.inflate` string branch (lines 228-232)

**Question**: Lines 228-232 are the `catch` block of `inflate()` when `zlib.inflate` throws — it falls back to `this.decompress(data)` if `data` is a string. To trigger the catch, we need zlib to throw.

**Decision**: Use `vi.mock('zlib', ...)` to make the `inflate` promisify throw. Then call `CompressionUtils.inflate("some-compressed-string")` and assert the fallback decompression result.

**Alternative**: Pass deliberately invalid compressed data to real `zlib.inflate` — it will throw a `Z_DATA_ERROR`. This avoids mocking zlib entirely. This is preferred as it is more realistic.

---

## R-012: Barrel exclusion list for `vitest.config.ts`

**Question**: Which files need to be added to the coverage `exclude` array?

**Decision**: Add the following to the `exclude` array in `vitest.config.ts`:

```
"src/api-client.ts",
"src/debug.ts",
"src/env-manager.ts",
"src/file-upload.ts",
"src/logger.ts",
"src/profiler.ts",
"src/response-validator.ts",
"src/retry-policy.ts",
"src/storage-utils.ts",
"src/streaming.ts",
"src/websocket.ts",
"src/utils/index.ts",
"src/utils/core/index.ts",
"src/utils/helpers/index.ts",
"src/utils/async/index.ts",
```

These 15 files contain only `export * from` **or** `export { X } from` re-export statements with zero executable statements — no functions, no conditionals, no assignments. Including them inflates the denominator and shows false 0% coverage. Note: `src/utils/async/index.ts` uses named `export { X } from` syntax rather than `export *`, but qualifies under this definition as it contains zero executable logic.

---

## R-013: Covering CLI index.ts uncovered paths

**Question**: `src/cli/index.ts` is at 46.1% coverage. The main uncovered paths are:
- `handleTypeGeneration` function (requires `--type` flag + valid URL)
- `handleSimpleFetch` function (requires a URL without `--type`)
- Header parsing with complex values (`--header=Authorization: Bearer key:123`)
- `process.argv[1] === fileURLToPath(import.meta.url)` block (module self-invocation)
- `parseDddArgs` with missing domain / missing port

**Decision**:
- `handleTypeGeneration` — mock `generateTypesFromEndpoint` and `fs.mkdir` to avoid real HTTP; call `runCli(["--type", "--method=POST", "https://api.example.com/users"])`.
- `handleSimpleFetch` — mock `globalThis.fetch` with `vi.stubGlobal("fetch", ...)`.
- Header parsing — call `runCli(["--header=Authorization: Bearer key:123", "https://example.com"])` with fetch mocked.
- Module self-invocation block — not coverable via `runCli()` import; mark this block as a known limitation (it only fires when the file is executed directly via Node, not via the test runner). If v8 still counts it as a branch, consider a thin wrapper test that dynamically imports the module — but this is complex. Skip if the remaining lines bring overall to 100%.
- `parseDddArgs` missing-domain — call `runCli(["--ddd", "--port=OrderRepository"])` with `process.exit` mocked.

**Rationale**: Using real tmp directories (as the existing `ddd-boilerplate.test.ts` does) is acceptable for CLI tests because it matches real user behaviour. For HTTP calls, mocking is required to avoid network dependencies.
