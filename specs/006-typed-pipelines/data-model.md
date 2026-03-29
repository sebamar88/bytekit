# Data Model: Typed Data Pipelines

**Feature**: `006-typed-pipelines`
**Phase**: 1 — Design
**Date**: 2026-03-28

---

## Core Types

### `PipelineOp<TIn, TOut>`

The atomic unit of a pipeline. A function that transforms one value into another, synchronously or asynchronously.

```typescript
type PipelineOp<TIn, TOut> = (input: TIn) => TOut | Promise<TOut>;
```

| Field | Type | Description |
| --- | --- | --- |
| `input` | `TIn` | Value received from the previous op (or the initial `process()` input). |
| return | `TOut \| Promise<TOut>` | Transformed value. Async is normalised via `await` internally. |

**Constraints**:
- Must be a pure function (no side effects beyond the transformation).
- Thrown errors propagate out of `Pipeline.process()` — callers are responsible for catching.

---

### `Pipeline<TIn, TOut>`

The pipeline builder and executor. Accumulates `PipelineOp` instances and executes them lazily when `process()` is called.

```typescript
class Pipeline<TIn, TOut> {
  // Internal
  private readonly ops: PipelineOp<unknown, unknown>[];

  // Builder
  pipe<TNext>(op: PipelineOp<TOut, TNext>): Pipeline<TIn, TNext>;

  // Executor
  process(data: TIn): Promise<TOut>;
}
```

| Property/Method | Type | Description |
| --- | --- | --- |
| `ops` | `PipelineOp<unknown, unknown>[]` | Private. Immutable array of accumulated operators. |
| `pipe(op)` | `(op: PipelineOp<TOut, TNext>) => Pipeline<TIn, TNext>` | Returns a **new** `Pipeline` with the op appended. Does not mutate `this`. |
| `process(data)` | `(data: TIn) => Promise<TOut>` | Executes all ops sequentially. Returns a Promise of the final value. |

**Invariants**:
- `Pipeline` is **immutable** — each `.pipe()` call returns a new instance.
- An empty pipeline (zero ops) returns the input data unchanged when `process()` is called.
- Execution is **lazy** — no work happens until `process()` is called.

---

## Operator Factories

These functions create `PipelineOp` values. They are the primary way to build pipeline steps.

### `map<T, U>(fn)`

```typescript
function map<T, U>(
  fn: (item: T, index: number) => U | Promise<U>
): PipelineOp<T[], U[]>
```

Transforms each element in an array. Async `fn` values are resolved concurrently via `Promise.all`.

| Parameter | Type | Description |
| --- | --- | --- |
| `fn` | `(item: T, index: number) => U \| Promise<U>` | Mapping function, receives item and its index. |
| returns | `PipelineOp<T[], U[]>` | An operator that maps `T[]` → `U[]`. |

**Behaviour**:
- Preserves order (same as `Array.prototype.map`).
- All `fn` calls run concurrently (wrapped in `Promise.all`). For sequential processing, use `sequential` from `bytekit/async`.
- Throws (from `fn`) will reject the wrapping `Promise.all`.

---

### `filter<T>(fn)`

```typescript
function filter<T>(
  fn: (item: T, index: number) => boolean | Promise<boolean>
): PipelineOp<T[], T[]>
```

Retains elements for which `fn` returns `true` (or resolves to `true`).

| Parameter | Type | Description |
| --- | --- | --- |
| `fn` | `(item: T, index: number) => boolean \| Promise<boolean>` | Predicate function. |
| returns | `PipelineOp<T[], T[]>` | An operator that filters `T[]` → `T[]`. |

**Behaviour**:
- Preserves order of retained elements.
- All predicate calls run concurrently (items and their boolean results are collected, then the original items are filtered by result index).

---

### `reduce<T, U>(fn, initial)`

```typescript
function reduce<T, U>(
  fn: (acc: U, item: T, index: number) => U | Promise<U>,
  initial: U
): PipelineOp<T[], U>
```

Reduces an array to a single accumulated value. Runs **sequentially** (each step awaits the previous).

| Parameter | Type | Description |
| --- | --- | --- |
| `fn` | `(acc: U, item: T, index: number) => U \| Promise<U>` | Reducer function. |
| `initial` | `U` | Initial accumulator value. |
| returns | `PipelineOp<T[], U>` | An operator that reduces `T[]` → `U`. |

**Behaviour**:
- Sequential execution (reduces must be ordered — parallelism would produce non-deterministic results).
- Returns `initial` unchanged for empty arrays.

---

## Factory Function

### `pipe(...ops)`

```typescript
// Overloads (up to 7 operators with full type inference):
function pipe<T, A>(op1: PipelineOp<T, A>): Pipeline<T, A>;
function pipe<T, A, B>(op1: PipelineOp<T, A>, op2: PipelineOp<A, B>): Pipeline<T, B>;
function pipe<T, A, B, C>(op1: PipelineOp<T, A>, op2: PipelineOp<A, B>, op3: PipelineOp<B, C>): Pipeline<T, C>;
// ... (up to 7 ops)

// Escape hatch for dynamic/long pipelines:
function pipe<T = unknown>(...ops: PipelineOp<unknown, unknown>[]): Pipeline<T, unknown>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `...ops` | `PipelineOp[]` | Ordered list of operators. Each op's output type must match the next op's input type. |
| returns | `Pipeline<TIn, TOut>` | A new immutable pipeline ready for `.process()`. |

---

## ApiClient Integration

### `RequestOptions<TResponse>` — new field

```typescript
interface RequestOptions<TResponse = unknown> {
  // ...existing fields...
  
  /**
   * Optional pipeline to apply to the parsed response body before returning it.
   * Receives the response data (already parsed/validated) and returns the transformed result.
   */
  pipeline?: { process(data: TResponse): Promise<unknown> };
}
```

**Behaviour**:
- Applied **after** `validateResponse` (schema validation) has already run.
- The return type of the request method changes to `unknown` when `pipeline` is supplied — callers should cast or infer through the pipeline's `TOut`.
- If `pipeline.process()` throws, the error propagates as a request error.

---

## State Transitions

```
pipe(...ops)            → Pipeline<TIn, TOut>   [created, no ops executed]
  .pipe(op)             → Pipeline<TIn, TNext>  [new instance, op appended]
  .process(data)        → Promise<TOut>         [executing]
    → await op1(data)   → intermediate1
    → await op2(i1)     → intermediate2
    → ...
    → return TOut       [resolved]
    → throw Error       [rejected — propagates to caller]
```

---

## Error Model

Errors thrown by any operator function propagate directly from `Pipeline.process()`. The pipeline does **not** catch or wrap errors — it is the caller's responsibility:

```typescript
try {
  const result = await pipeline.process(data);
} catch (err) {
  // err is whatever the operator threw
}
```

This matches the error model of all other bytekit async utilities (no hidden error swallowing).
