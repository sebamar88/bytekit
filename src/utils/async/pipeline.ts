/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A function that transforms one value into another, synchronously or asynchronously.
 * This is the atomic unit of a pipeline.
 *
 * @template TIn  - Type of the input value.
 * @template TOut - Type of the output value.
 *
 * @example
 * const double: PipelineOp<number, number> = (n) => n * 2;
 * const stringify: PipelineOp<number, string> = async (n) => String(n);
 */
export type PipelineOp<TIn, TOut> = (input: TIn) => TOut | Promise<TOut>;

// ── Pipeline class ────────────────────────────────────────────────────────────

/**
 * An immutable, lazy pipeline that accumulates transformation operators and
 * executes them sequentially when {@link Pipeline.process} is called.
 *
 * Build pipelines with the {@link pipe} factory function or by calling
 * `.pipe(op)` on an existing instance. Each `.pipe()` call returns a **new**
 * `Pipeline` — the original is never mutated.
 *
 * @template TIn  - Type of the data accepted by {@link Pipeline.process}.
 * @template TOut - Type of the value resolved by {@link Pipeline.process}.
 *
 * @example
 * const pipeline = pipe(
 *   filter<number>((n) => n > 0),
 *   map<number, string>((n) => String(n)),
 * );
 * const result = await pipeline.process([1, -2, 3]); // ["1", "3"]
 */
export class Pipeline<TIn, TOut> {
    /** @internal */
    private readonly ops: PipelineOp<any, any>[];

    /**
     * @internal — Use {@link pipe} to create pipelines.
     */
    constructor(ops: PipelineOp<any, any>[]) {
        this.ops = ops;
    }

    /**
     * Appends an operator and returns a **new** `Pipeline` instance.
     * The original pipeline is not mutated.
     *
     * @param op - The operator to append.
     * @returns A new `Pipeline<TIn, TNext>` with the operator appended.
     *
     * @example
     * const base = pipe(filter<number>((n) => n > 0));
     * const doubled = base.pipe(map<number, number>((n) => n * 2));
     * // base is unchanged
     */
    pipe<TNext>(op: PipelineOp<TOut, TNext>): Pipeline<TIn, TNext> {
        return new Pipeline<TIn, TNext>([...this.ops, op]);
    }

    /**
     * Executes all accumulated operators sequentially, passing the output of
     * each as the input to the next. Always returns a `Promise`.
     *
     * @param data - The initial input value.
     * @returns A `Promise` that resolves to the final transformed value.
     * @throws The error thrown by the first operator that rejects.
     *
     * @example
     * const result = await pipeline.process([1, 2, 3]);
     */
    async process(data: TIn): Promise<TOut> {
        let result: any = data;
        for (const op of this.ops) {
            result = await op(result);
        }
        return result as TOut;
    }
}

// ── pipe() factory function (typed overloads) ─────────────────────────────────

/**
 * Creates a typed, immutable {@link Pipeline} from a sequence of operators.
 * Type inference flows left-to-right through the overloads (up to 7 operators).
 * For dynamic/runtime pipelines of arbitrary length, use the variadic overload
 * or the `.pipe(op)` builder method on an existing `Pipeline`.
 *
 * @example
 * // 1-op: filter numbers
 * const p1 = pipe(filter<number>((n) => n > 0));
 *
 * @example
 * // 3-op with full inference
 * const p3 = pipe(
 *   filter<number>((n) => n > 0),
 *   map<number, string>((n) => n.toFixed(2)),
 *   reduce<string, number>((acc, s) => acc + s.length, 0),
 * );
 * // Inferred: Pipeline<number[], number>
 */
export function pipe<T, A>(
    op1: PipelineOp<T, A>
): Pipeline<T, A>;

export function pipe<T, A, B>(
    op1: PipelineOp<T, A>,
    op2: PipelineOp<A, B>
): Pipeline<T, B>;

export function pipe<T, A, B, C>(
    op1: PipelineOp<T, A>,
    op2: PipelineOp<A, B>,
    op3: PipelineOp<B, C>
): Pipeline<T, C>;

export function pipe<T, A, B, C, D>(
    op1: PipelineOp<T, A>,
    op2: PipelineOp<A, B>,
    op3: PipelineOp<B, C>,
    op4: PipelineOp<C, D>
): Pipeline<T, D>;

export function pipe<T, A, B, C, D, E>(
    op1: PipelineOp<T, A>,
    op2: PipelineOp<A, B>,
    op3: PipelineOp<B, C>,
    op4: PipelineOp<C, D>,
    op5: PipelineOp<D, E>
): Pipeline<T, E>;

export function pipe<T, A, B, C, D, E, F>(
    op1: PipelineOp<T, A>,
    op2: PipelineOp<A, B>,
    op3: PipelineOp<B, C>,
    op4: PipelineOp<C, D>,
    op5: PipelineOp<D, E>,
    op6: PipelineOp<E, F>
): Pipeline<T, F>;

export function pipe<T, A, B, C, D, E, F, G>(
    op1: PipelineOp<T, A>,
    op2: PipelineOp<A, B>,
    op3: PipelineOp<B, C>,
    op4: PipelineOp<C, D>,
    op5: PipelineOp<D, E>,
    op6: PipelineOp<E, F>,
    op7: PipelineOp<F, G>
): Pipeline<T, G>;

/**
 * Escape hatch: create a pipeline from a dynamic list of operators.
 * Type inference is not available for the escape-hatch overload.
 *
 * @example
 * const ops: PipelineOp<unknown, unknown>[] = [...];
 * const p = pipe<number[]>(...ops);
 */
export function pipe<T = unknown>(
    ...ops: PipelineOp<any, any>[]
): Pipeline<T, unknown>;

// ── Implementation ────────────────────────────────────────────────────────────
export function pipe<T>(...ops: PipelineOp<any, any>[]): Pipeline<T, any> {
    return new Pipeline<T, any>(ops);
}

// ── Operator factories ────────────────────────────────────────────────────────

/**
 * Creates a pipeline operator that transforms each element of an array.
 * Async mapper functions are awaited **concurrently** via `Promise.all`,
 * so all items are processed in parallel. Order is preserved.
 *
 * @param fn - A mapping function that receives `(item, index)` and returns the
 *   transformed value synchronously or as a `Promise`.
 * @returns A `PipelineOp<T[], U[]>`.
 *
 * @example
 * const double = map<number, number>((n) => n * 2);
 * const result = await pipe(double).process([1, 2, 3]); // [2, 4, 6]
 *
 * @example
 * // Async map — all fetch calls run concurrently
 * const enrich = map<string, { id: string; name: string }>(async (id) => {
 *   const res = await fetch(`/api/users/${id}`);
 *   return res.json();
 * });
 */
export function map<T, U>(
    fn: (item: T, index: number) => U | Promise<U>
): PipelineOp<T[], U[]> {
    return (items: T[]): Promise<U[]> =>
        Promise.all(items.map((item, index) => fn(item, index)));
}

/**
 * Creates a pipeline operator that retains only the elements for which the
 * predicate returns `true` (or resolves to `true`).
 * Predicate calls run **concurrently** via `Promise.all`; the original order
 * of retained elements is preserved.
 *
 * @param fn - A predicate function that receives `(item, index)` and returns a
 *   `boolean` or `Promise<boolean>`.
 * @returns A `PipelineOp<T[], T[]>`.
 *
 * @example
 * const positives = filter<number>((n) => n > 0);
 * const result = await pipe(positives).process([1, -2, 3]); // [1, 3]
 *
 * @example
 * // Async filter
 * const active = filter<string>(async (id) => {
 *   const res = await fetch(`/api/items/${id}/active`);
 *   return res.ok;
 * });
 */
export function filter<T>(
    fn: (item: T, index: number) => boolean | Promise<boolean>
): PipelineOp<T[], T[]> {
    return async (items: T[]): Promise<T[]> => {
        const results = await Promise.all(
            items.map((item, index) => fn(item, index))
        );
        return items.filter((_, index) => results[index]);
    };
}

/**
 * Creates a pipeline operator that reduces an array to a single accumulated
 * value. The reducer function runs **sequentially** — each step awaits the
 * previous accumulator before proceeding, ensuring deterministic results.
 *
 * @param fn - A reducer function that receives `(accumulator, item, index)` and
 *   returns the next accumulator value synchronously or as a `Promise`.
 * @param initial - The initial accumulator value.
 * @returns A `PipelineOp<T[], U>`.
 *
 * @example
 * const sum = reduce<number, number>((acc, n) => acc + n, 0);
 * const result = await pipe(sum).process([1, 2, 3]); // 6
 *
 * @example
 * // Async sequential reduce
 * const writeAll = reduce<string, string[]>(async (acc, id) => {
 *   await db.delete(id);
 *   return [...acc, id];
 * }, []);
 */
export function reduce<T, U>(
    fn: (acc: U, item: T, index: number) => U | Promise<U>,
    initial: U
): PipelineOp<T[], U> {
    return async (items: T[]): Promise<U> => {
        let acc = initial;
        for (let i = 0; i < items.length; i++) {
            acc = await fn(acc, items[i], i);
        }
        return acc;
    };
}
