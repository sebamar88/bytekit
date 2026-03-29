# Contract: Pipeline Module

**Feature**: `006-typed-pipelines`
**Phase**: 1 — Design
**Date**: 2026-03-28
**Module**: `bytekit/pipeline` (also re-exported from `bytekit`)

---

## Public Exports

```typescript
// Types
export type { PipelineOp };

// Class
export { Pipeline };

// Factory function
export { pipe };

// Operator factories
export { map, filter, reduce };
```

---

## `PipelineOp<TIn, TOut>`

```typescript
type PipelineOp<TIn, TOut> = (input: TIn) => TOut | Promise<TOut>;
```

A function that transforms a value synchronously or asynchronously.

---

## `Pipeline<TIn, TOut>`

```typescript
class Pipeline<TIn, TOut> {
  pipe<TNext>(op: PipelineOp<TOut, TNext>): Pipeline<TIn, TNext>;
  process(data: TIn): Promise<TOut>;
}
```

### `pipe(op): Pipeline<TIn, TNext>`

Appends an operator and returns a **new** `Pipeline` instance.

- **Does not** mutate the original pipeline.
- Type parameter `TNext` is inferred from `op`.
- Can be chained: `pipeline.pipe(op1).pipe(op2).pipe(op3)`.

### `process(data): Promise<TOut>`

Executes all accumulated operators sequentially, passing the output of each as the input to the next.

- Returns `Promise<TOut>` — always async, even if all operators are synchronous.
- Throws if any operator throws.
- Empty pipeline (zero ops): returns `data` cast as `TOut`.

---

## `pipe(...ops)`

```typescript
// Typed overloads (op count 1–7):
function pipe<T, A>(
  op1: PipelineOp<T, A>
): Pipeline<T, A>;

function pipe<T, A, B>(
  op1: PipelineOp<T, A>,
  op2: PipelineOp<A, B>
): Pipeline<T, B>;

function pipe<T, A, B, C>(
  op1: PipelineOp<T, A>,
  op2: PipelineOp<A, B>,
  op3: PipelineOp<B, C>
): Pipeline<T, C>;

function pipe<T, A, B, C, D>(
  op1: PipelineOp<T, A>,
  op2: PipelineOp<A, B>,
  op3: PipelineOp<B, C>,
  op4: PipelineOp<C, D>
): Pipeline<T, D>;

function pipe<T, A, B, C, D, E>(
  op1: PipelineOp<T, A>,
  op2: PipelineOp<A, B>,
  op3: PipelineOp<B, C>,
  op4: PipelineOp<C, D>,
  op5: PipelineOp<D, E>
): Pipeline<T, E>;

function pipe<T, A, B, C, D, E, F>(
  op1: PipelineOp<T, A>,
  op2: PipelineOp<A, B>,
  op3: PipelineOp<B, C>,
  op4: PipelineOp<C, D>,
  op5: PipelineOp<D, E>,
  op6: PipelineOp<E, F>
): Pipeline<T, F>;

function pipe<T, A, B, C, D, E, F, G>(
  op1: PipelineOp<T, A>,
  op2: PipelineOp<A, B>,
  op3: PipelineOp<B, C>,
  op4: PipelineOp<C, D>,
  op5: PipelineOp<D, E>,
  op6: PipelineOp<E, F>,
  op7: PipelineOp<F, G>
): Pipeline<T, G>;

// Escape hatch for dynamic/runtime pipelines (no inference):
function pipe<T = unknown>(
  ...ops: PipelineOp<unknown, unknown>[]
): Pipeline<T, unknown>;
```

Creates a `Pipeline` from a sequence of operators. Type inference flows left-to-right through the overloads.

---

## `map<T, U>(fn)`

```typescript
function map<T, U>(
  fn: (item: T, index: number) => U | Promise<U>
): PipelineOp<T[], U[]>;
```

- `fn` is called **concurrently** for all items (via `Promise.all`).
- Order of results matches order of input.

---

## `filter<T>(fn)`

```typescript
function filter<T>(
  fn: (item: T, index: number) => boolean | Promise<boolean>
): PipelineOp<T[], T[]>;
```

- `fn` is called **concurrently** for all items.
- Only items whose predicate resolves to `true` are retained, in original order.

---

## `reduce<T, U>(fn, initial)`

```typescript
function reduce<T, U>(
  fn: (acc: U, item: T, index: number) => U | Promise<U>,
  initial: U
): PipelineOp<T[], U>;
```

- Executes **sequentially** (each step awaits the previous accumulator).
- Returns `initial` for empty arrays.

---

## ApiClient Integration

### Modified: `RequestOptions<TResponse>`

```typescript
interface RequestOptions<TResponse = unknown> {
  // ...existing fields unchanged...

  /**
   * Optional post-processing pipeline applied to the response body after parsing.
   * Applied after validateResponse (if present).
   */
  pipeline?: { process(data: TResponse): Promise<unknown> };
}
```

**Application order in `ApiClient`**:
```
fetch → parse JSON → validateResponse (optional) → pipeline.process() (optional) → return
```

---

## Behaviour Guarantees

| Guarantee | Details |
| --- | --- |
| Immutability | `pipe()` and `.pipe()` never mutate existing `Pipeline` instances |
| Lazy execution | No operator runs until `.process()` is called |
| Async normalisation | Sync operator return values are wrapped in `Promise.resolve` |
| Error propagation | Errors thrown by operators propagate unchanged from `.process()` |
| Concurrency in map/filter | Items processed concurrently; order preserved |
| Sequential reduce | Accumulator operations are sequential; deterministic |
| Empty pipeline | `pipeline.process(data)` returns `data` unchanged |
| Empty array | `map`, `filter`, `reduce` return `[]`, `[]`, `initial` for `[]` input |

---

## Breaking Changes

None. `RequestOptions` gains an **optional** `pipeline` field. All existing call sites are unaffected.
