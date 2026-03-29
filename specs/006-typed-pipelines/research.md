# Research: Typed Data Pipelines

**Feature**: `006-typed-pipelines`
**Phase**: 0 — Research
**Date**: 2026-03-28

---

## D1 — Primary API Shape

**Decision**: Hybrid — `pipe(...ops)` factory function (with TypeScript overloads) **and** a chainable `.pipe(op)` builder method on the `Pipeline` class.

**Rationale**:
- The spec explicitly calls for `pipe(...ops): Pipeline`. A free function is idiomatic for functional pipelines and familiar to fp-ts/RxJS users.
- TypeScript overloads (`pipe<T,A>`, `pipe<T,A,B>`, …, `pipe<T,A,B,C,D,E,F,G>`) provide type inference for up to 7 chained operators — sufficient for all practical use cases.
- The builder `.pipe(op)` method allows runtime construction of pipelines of unbounded length where type inference past overload depth falls back to `unknown`.
- Combining both gives full DX: short pipelines get compile-time inference from the function form; dynamic/long pipelines use the builder.

**Alternatives considered**:
- *Pure variadic generics*: TypeScript does not support variadic tuple inference through arbitrary function chains cleanly (conditional types become unreadably complex). Rejected.
- *Pure builder only*: Conflicts with the spec requirement `pipe(...ops)`. Rejected.
- *Generator-based pipelines*: Over-engineering for this use case; async arrays suffice. Rejected.

---

## D2 — Reduce Model (array vs scalar output)

**Decision**: `map` and `filter` preserve the array structure (`T[] → U[]` / `T[] → T[]`). `reduce` collapses the array to a scalar (`T[] → U`). After a `reduce`, further operators receive the scalar and must be compatible (e.g., a subsequent `map` would receive `U`, not `U[]`).

**Rationale**:
- This mirrors JavaScript's native `Array.prototype.reduce` semantics exactly — no conceptual friction for developers.
- The pipeline's generic parameter `TOut` accurately tracks the current output type, so TypeScript catches mismatches at compile time.
- A post-reduce `map(fn: (item: U) => V)` would be unusual and `fn` would receive the scalar `U` directly — this is the "tap/transform a value" pattern, which is valid and useful.

**Alternatives considered**:
- *Wrap reduce output in array*: Artificial — forces consumers to unwrap `[result][0]`. Rejected.
- *Prohibit ops after reduce at the type level*: Over-constrained; valid pipelines (`reduce` then `tap`) would be disallowed. Rejected.

---

## D3 — ApiClient Integration Point

**Decision**: Add optional `pipeline?: Pipeline<TResponse, unknown>` field to `RequestOptions<TResponse>`. After response parsing/validation resolves to `TResponse`, if `pipeline` is set, run `await pipeline.process(data)` and return the result cast as the declared response type.

**Rationale**:
- Per-request option is non-breaking: zero impact on existing callers.
- Placed in `RequestOptions` (not `ApiClientConfig`) because pipelines are typically response-specific, not global.
- Keeps `ApiClient` ignorant of pipeline internals — it only knows `{ process(data: unknown): Promise<unknown> }`.

**Alternatives considered**:
- *Global pipeline on `ApiClientConfig`*: Applies to all responses — too broad and inflexible. Rejected.
- *Separate `post()` / `transform()` option*: Redundant with pipeline; adds API surface. Rejected.

---

## D4 — Lazy Evaluation Strategy

**Decision**: Ops are stored as a plain array of `PipelineOp` functions. `process(data)` executes them sequentially using a `for…of` loop with `await`. No generators, iterators, or observables needed.

**Rationale**:
- Matches the project's zero-dependency constraint and simplicity ethos.
- Sequential `async/await` composition is idiomatic TypeScript and easy to test.
- The `map` and `filter` operators internally use `Promise.all` for concurrency within a single step (parallel processing of array items).

**Alternatives considered**:
- *Generator-based lazy iterators*: Better for infinite streams; overkill for finite arrays. Rejected.
- *Observable-based (RxJS-like)*: Adds subscription/disposal complexity; contradicts zero-dep principle. Rejected.

---

## D5 — Export Path & Module Placement

**Decision**:
- Source file: `src/utils/async/pipeline.ts`
- Re-exported from `src/utils/async/index.ts`
- New package export: `"./pipeline"` entry in `package.json` pointing to `dist/utils/async/pipeline`
- Also available from the root `"bytekit"` entry via `async/index.ts` → `src/utils/index.ts`

**Rationale**:
- `src/utils/async/` already contains all async composition utilities (`parallel`, `sequential`, `retry`, `request-batcher`). Pipeline is a natural fit.
- Dedicated `"./pipeline"` export allows tree-shaking consumers to import only the pipeline module.
- Mirrors the existing pattern (e.g., `"./websocket"`, `"./streaming"`).

**Alternatives considered**:
- *Place in `src/utils/core/`*: Core is for infrastructure primitives (ApiClient, Logger). Pipeline is a user-facing composition utility. Rejected.
- *Place in `src/utils/helpers/`*: Helpers are DOM/IO-adjacent. Pipeline is pure functional composition. Rejected.
