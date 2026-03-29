# JSDoc Implementation Guide — bytekit 009-add-jsdoc-docs

**Audience**: Developer implementing this feature  
**Purpose**: Authoritative reference for JSDoc style, patterns, and file-by-file checklist

---

## Quick Rules

1. Every **public class** gets a class-level `/** ... */` block: description + `@template` (if generic) + `@example`.
2. Every **constructor** gets `@param` tags for every parameter; omit `@returns` (constructors don't return).
3. Every **public method** gets: description + `@param` per arg + `@returns` + `@throws` per thrown error type + `@example`.
4. Every **interface/type** property gets an inline `/** description. */` comment.
5. Every **factory function** (top-level `export function/const`) is treated the same as a public method.
6. **Private methods** → `/** @internal */` only (one-liner).
7. No `{Type}` in `@param` — TypeScript already provides the type. TypeDoc infers it.
8. Max line width: **80 characters** (Prettier `.prettierrc` default).
9. Run `npx prettier --write <file>` after editing each file before committing.

---

## Tag Reference

```typescript
/**
 * One-sentence summary (imperative mood: "Emits", "Creates", "Returns").
 *
 * Optional additional paragraph for behaviour details, caveats,
 * environment differences, etc.
 *
 * @template T - What the type parameter represents.
 *
 * @param name - What this parameter is and any constraints (e.g., "must be ≥ 0").
 * @param options - Configuration object; see {@link OptionsInterface} for fields.
 * @returns What the return value contains and when it may be null/undefined.
 * @throws {ErrorClass} When and why this error is thrown.
 *
 * @example
 * ```typescript
 * // Minimal working example
 * const result = myFunction('value', { key: true });
 * console.log(result); // expected output
 * ```
 */
```

---

## File-by-File Checklist

### `src/utils/core/Logger.ts`

- [ ] `LogLevel` type alias — description of the ordered severity levels
- [ ] `LogEntry<TContext>` interface — class-level description + all 6 field comments
- [ ] `LogTransport` type alias — what a transport is, async support note
- [ ] `LoggerOptions` interface — all 4 field comments (namespace, level, transports, includeTimestamp)
- [ ] `consoleTransportNode()` — description (Node.js ANSI colours), `@param options`, `@returns LogTransport`, `@example`
- [ ] `consoleTransportBrowser()` — description (browser `console.log %c`), `@param options`, `@returns LogTransport`, `@example`
- [ ] `Logger<TContext>` class — class description, `@template TContext`
- [ ] `Logger` constructor — `@param options`
- [ ] `Logger.setLevel()` — description, `@param level`, `@returns void`
- [ ] `Logger.child()` — description (inherits transports/level), `@param namespace`, `@returns Logger`
- [ ] `Logger.debug()` — `@param message`, `@param context`, `@returns void`
- [ ] `Logger.info()` — same pattern
- [ ] `Logger.warn()` — same pattern
- [ ] `Logger.error()` — `@param message`, `@param context`, `@param error`, `@returns void`
- [ ] `Logger.log()` — description (low-level emit), all params, `@returns void`
- [ ] `Logger.silent()` — static, description, `@returns Logger`
- [ ] `createLogger()` — factory description, `@param options`, `@returns Logger`, `@example`

### `src/utils/core/Profiler.ts`

- [ ] `Profiler` class — class description (namespace-scoped timing), `@example`
- [ ] `Profiler` constructor — `@param namespace`
- [ ] `Profiler.start()` — description, `@param label`, `@returns void`
- [ ] `Profiler.end()` — description (uses `performance.now()`), `@param label`, `@returns void`
- [ ] `Profiler.summary()` — description (flat vs namespaced result), `@returns Record<string, number> | Record<string, Record<string, number>>`

### `src/utils/core/RetryPolicy.ts`

- [ ] `RetryConfig` interface — description + all 5 field comments
- [ ] `CircuitBreakerConfig` interface — description + all 4 field comments
- [ ] `CircuitBreakerState` type — description of the three states
- [ ] `CircuitBreaker` class — class description (closed/open/half-open state machine), `@example`
- [ ] `CircuitBreaker` constructor — `@param config`
- [ ] `CircuitBreaker.execute<T>()` — description, `@template T`, `@param fn`, `@returns Promise<T>`, `@throws {Error}` when open
- [ ] `CircuitBreaker.getState()` — description, `@returns CircuitBreakerState`
- [ ] `CircuitBreaker.reset()` — description (resets counters + closes), `@returns void`
- [ ] `RetryPolicy` class — class description (exponential backoff + jitter), `@example`
- [ ] `RetryPolicy` constructor — `@param config`
- [ ] `RetryPolicy.execute<T>()` — description, `@template T`, `@param fn`, `@returns Promise<T>`, `@throws {Error}` on exhaustion
- [ ] `RetryPolicy.getConfig()` — description, `@returns` shape

### `src/utils/helpers/EnvManager.ts`

- [ ] `EnvManager` class — class description (browser via `import.meta.env`, Node via `process.env`), `@example`
- [ ] `EnvManager.get()` — `@param name`, `@returns string | undefined`
- [ ] `EnvManager.require()` — `@param name`, `@returns string`, `@throws {Error}` when missing
- [ ] `EnvManager.isProd()` — description, `@returns boolean`

### `src/utils/helpers/StorageUtils.ts`

- [ ] `StorageManager` class — class description (wraps `Storage` API with TTL + JSON serialisation), `@example`
- [ ] `StorageManager` constructor — `@param storage` (defaults to `localStorage`)
- [ ] `StorageManager.set<T>()` — `@template T`, `@param key`, `@param value`, `@param ttlMs` (optional, TTL in ms), `@returns void`
- [ ] `StorageManager.get<T>()` — `@template T`, `@param key`, `@returns T | null` (null on miss or expiry), `@example`
- [ ] `StorageManager.remove()` — `@param key`, `@returns void`
- [ ] `StorageManager.clear()` — description, `@returns void`

### `src/utils/core/ResponseValidator.ts` (partial — add only missing)

- [ ] `ValidationSchema` interface — all 11 field comments (type, required, properties, items, minLength, maxLength, minimum, maximum, pattern, enum, custom)
- [ ] `ValidationError` interface — all 3 field comments (path, message, value)
- [ ] `ResponseValidator.validate()` — description, `@param data`, `@param schema`, `@param path`, `@returns ValidationError[]`, `@example`

### `src/utils/helpers/UrlHelper.ts` (partial — add only missing)

- [ ] `QueryStringOptions.arrayFormat` field comment (already has `/** The character to use... */` on separator — add missing fields)
- [ ] `QueryStringOptions.skipNull` — add comment
- [ ] `QueryStringOptions.skipEmptyString` — add comment
- [ ] `QueryStringOptions.encode` — add comment
- [ ] `QueryStringOptions.sortKeys` — add comment
- [ ] `UrlHelper.stringify()` — description, `@param params`, `@param customOptions`, `@returns string`, `@example`

---

## Example: Documenting `EnvManager` (complete reference)

```typescript
/**
 * Isomorphic environment variable accessor.
 *
 * Reads from `import.meta.env` in browser environments (Vite / bundler)
 * and from `process.env` in Node.js. Provides a unified API for both runtimes.
 *
 * @example
 * ```typescript
 * const env = new EnvManager();
 * const apiUrl = env.require('API_URL');
 * console.log(env.isProd()); // true in production
 * ```
 */
export class EnvManager {
  private readonly isBrowser = typeof window !== 'undefined';

  /**
   * Reads an environment variable by name.
   *
   * Returns `undefined` if the variable is not set.
   *
   * @param name - The environment variable name (e.g., `"API_URL"`).
   * @returns The variable's string value, or `undefined` if not set.
   */
  get(name: string): string | undefined { ... }

  /**
   * Reads a required environment variable, throwing if absent.
   *
   * @param name - The environment variable name.
   * @returns The variable's string value.
   * @throws {Error} If the variable is not set in the current environment.
   *
   * @example
   * ```typescript
   * const secret = env.require('API_SECRET'); // throws if missing
   * ```
   */
  require(name: string): string { ... }

  /**
   * Returns `true` when running in production mode.
   *
   * Checks `NODE_ENV` (Node.js) or `MODE` (Vite) for the value `"production"`.
   *
   * @returns `true` if the environment is production, `false` otherwise.
   */
  isProd(): boolean { ... }
}
```

---

## Verification Steps (after implementation)

1. `pnpm run format:check` — must pass with zero warnings.
2. `pnpm run lint` — must pass with zero new errors.
3. `pnpm run build` — confirms `.d.ts` files are emitted with JSDoc preserved (`removeComments: false`).
4. `pnpm test` — all existing tests must remain green (no logic changes expected).
5. Open each edited file in VS Code → hover over class name and each public method → confirm tooltip shows description + params.
6. Optional: `npx typedoc --out /tmp/docs src/` → confirm all 7 target files have entries in the generated HTML.
