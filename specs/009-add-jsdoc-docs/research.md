# Research: Add JSDoc Documentation to Undocumented Library Files

**Feature**: 009-add-jsdoc-docs  
**Phase**: 0 — Research & Resolution  
**Date**: 2026-03-29

---

## Decision 1: JSDoc tag subset

**Decision**: Use `@param`, `@returns`, `@throws`, `@template`, `@example`, and `@internal` only.

**Rationale**: These are the tags already used consistently across the fully-documented files in the codebase (`pipeline.ts`, `ApiClient.ts`, `ErrorBoundary.ts`, `RateLimiter.ts`). TypeDoc (the configured doc generator) renders all of them correctly. Adding extra tags (`@since`, `@version`, `@author`, `@deprecated`) would break consistency and would need to be retrofitted across the entire codebase.

**Alternatives considered**:
- Adding `@since` / `@version` — rejected: not used anywhere in the codebase; would require a full-codebase pass to be consistent.
- Using `@typedef` for interface documentation — rejected: TypeScript interfaces are already type-safe; inline `/** */` comments per property are the idiomatic TypeScript approach and are what TypeDoc picks up.

---

## Decision 2: Generic type parameter documentation

**Decision**: Use `@template T - Description` placed before `@param` tags.

**Rationale**: TypeDoc renders `@template` in the "Type Parameters" section of the generated docs. Already used in `pipeline.ts` (lines 18–35) and `types.ts`. Placing it before `@param` matches the codebase convention.

**Alternatives considered**:
- Inline `<T>` descriptions in the method description prose — rejected: less discoverable in IDE tooltips; TypeDoc doesn't parse it as a type param entry.

---

## Decision 3: Prettier compatibility

**Decision**: All JSDoc blocks wrapped at 80 characters, using standard `/** ... */` multi-line blocks. No Prettier-incompatible syntax (e.g., no `@param {Type}` — rely on TypeScript types instead).

**Rationale**: `.prettierrc` enforces 80-char print width. `format:check` CI step would fail otherwise. Verified against existing JSDoc in `pipeline.ts` which passes `format:check`. TypeScript-aware JSDoc does not need redundant `{Type}` annotations in `@param` — the type is inferred from the signature.

**Alternatives considered**:
- Using `@param {Type} name` style — rejected: redundant in TypeScript; breaks Prettier's JSDoc formatting in some edge cases; not used in existing codebase docs.

---

## Decision 4: Private method treatment

**Decision**: Private methods receive `/** @internal */` (one-liner) rather than full JSDoc.

**Rationale**: TypeDoc excludes `@internal` symbols from the generated documentation by default. Full JSDoc on private methods would pollute the public API docs and create noise in IDE tooltips. Already used in `pipeline.ts` line 37 (`/** @internal */`).

**Alternatives considered**:
- Full JSDoc on private methods — rejected: leaks implementation details into public docs; inconsistent with current codebase convention.
- No comment on private methods at all — rejected: `@internal` is still useful for future contributors and tools that may expose internals.

---

## Decision 5: Factory function treatment

**Decision**: `createLogger`, `consoleTransportNode`, and `consoleTransportBrowser` receive full JSDoc (description + `@param` + `@returns` + `@example`).

**Rationale**: All three are named exports in `Logger.ts` and re-exported from the package entry points. They are consumed directly by library users, making them public API surface. FR-007 in the spec explicitly requires factory functions to be documented.

**Alternatives considered**:
- Treating transport factories as internal helpers — rejected: they are exported at the package level and documented in the wiki (`Logger.md`). Users are expected to compose them when configuring the `Logger` constructor.

---

## Decision 6: `StorageUtils.ts` class name discrepancy

**Decision**: Document the class as `StorageManager` (the actual exported class name), not `StorageUtils` (the file name).

**Rationale**: The file is named `StorageUtils.ts` but the exported class is `StorageManager`. JSDoc is added to the class declaration — the file name is irrelevant. This is consistent with how `EnvManager.ts` exports `EnvManager`.

**Alternatives considered**:
- Renaming the file to `StorageManager.ts` — rejected: out of scope; would break `package.json` exports and `tsconfig` path aliases; no spec requirement for renaming.

---

## Decision 7: Scope boundaries confirmed

**Decision**: The following are explicitly OUT of scope for this feature:
- `src/cli/` — internal tooling, no public API surface.
- Barrel files (`src/index.ts`, `src/utils/index.ts`, `src/utils/helpers/index.ts`, `src/utils/core/index.ts`) — they only re-export; JSDoc on the source files is inherited by TypeDoc and IDE tooling.
- Files already at 100% JSDoc coverage (`pipeline.ts`, `ApiClient.ts`, `ErrorBoundary.ts`, `RateLimiter.ts`, `RequestCache.ts`, `CacheManager.ts`, `CompressionUtils.ts`, `CryptoUtils.ts`, `DiffUtils.ts`, `EventEmitter.ts`, `FileUploadHelper.ts`, `PollingHelper.ts`, `StreamingHelper.ts`, `WebSocketHelper.ts`, `SchemaAdapter.ts`, `RequestDeduplicator.ts`, `debug.ts`, `allSettled.ts`, `debounce.ts`, `errors.ts`, `parallel.ts`, `promise-pool.ts`, `race.ts`, `request-batcher.ts`, `request-queue.ts`, `retry.ts`, `sequential.ts`, `sleep.ts`, `throttle.ts`, `timeout.ts`, `types.ts`).

**Rationale**: Limiting scope prevents the PR from being too large to review and keeps the blast radius minimal. Barrel files inherit their documentation from the re-exported symbols.

---

## Codebase audit summary (from pre-research scan)

| File | JSDoc blocks before | Target after |
|---|---|---|
| `src/utils/core/Logger.ts` | 0 | ~18 (class, 2 transports, factory, all methods, all interface fields) |
| `src/utils/core/Profiler.ts` | 0 | ~5 (class, 3 methods) |
| `src/utils/core/RetryPolicy.ts` | 0 | ~15 (2 classes, all public methods, all interface fields) |
| `src/utils/helpers/EnvManager.ts` | 0 | ~4 (class, 3 methods) |
| `src/utils/helpers/StorageUtils.ts` | 0 | ~5 (class, 4 methods) |
| `src/utils/core/ResponseValidator.ts` | 2 (private helpers) | +3 (`validate`, 2 interface docs) |
| `src/utils/helpers/UrlHelper.ts` | 3 (slugify + 2 fields) | +1 (`stringify`) + 5 (`QueryStringOptions` fields) |

**Total new JSDoc blocks to add**: ~51 across 7 files.
