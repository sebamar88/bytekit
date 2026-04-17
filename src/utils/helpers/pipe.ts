/**
 * pipe / compose — type-safe functional composition up to 10 functions
 * @bundlesize ~800B minified+gzipped
 */

// ─── pipe ────────────────────────────────────────────────────────────────────

export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
): D;
export function pipe<A, B, C, D, E>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
): E;
export function pipe<A, B, C, D, E, F>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
): F;
export function pipe<A, B, C, D, E, F, G>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
): G;
export function pipe<A, B, C, D, E, F, G, H>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
): H;
export function pipe<A, B, C, D, E, F, G, H, I>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
): I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
): J;
export function pipe(value: unknown, ...fns: Array<(x: unknown) => unknown>): unknown {
    return fns.reduce((acc, fn) => fn(acc), value);
}

// ─── compose ─────────────────────────────────────────────────────────────────

export function compose<A>(a: A): A;
export function compose<A, B>(ba: (b: B) => A, b: B): A;
export function compose<A, B, C>(ab: (a: A) => B, bc: (b: B) => C, c: C): A;
export function compose<A, B, C, D>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    d: D,
): A;
export function compose<A, B, C, D, E>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    e: E,
): A;
export function compose<A, B, C, D, E, F>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    f: F,
): A;
export function compose<A, B, C, D, E, F, G>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    g: G,
): A;
export function compose<A, B, C, D, E, F, G, H>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    h: H,
): A;
export function compose<A, B, C, D, E, F, G, H, I>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    i: I,
): A;
export function compose<A, B, C, D, E, F, G, H, I, J>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    j: J,
): A;
export function compose(...args: unknown[]): unknown {
    const value = args[args.length - 1];
    const fns = args.slice(0, -1).reverse() as Array<(x: unknown) => unknown>;
    return fns.reduce((acc, fn) => fn(acc), value);
}

// ─── pipeAsync ───────────────────────────────────────────────────────────────

export function pipeAsync<A>(a: A): Promise<A>;
export function pipeAsync<A, B>(a: A, ab: (a: A) => B | Promise<B>): Promise<B>;
export function pipeAsync<A, B, C>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
): Promise<C>;
export function pipeAsync<A, B, C, D>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
): Promise<D>;
export function pipeAsync<A, B, C, D, E>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
): Promise<E>;
export function pipeAsync<A, B, C, D, E, F>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
): Promise<F>;
export function pipeAsync<A, B, C, D, E, F, G>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
    fg: (f: F) => G | Promise<G>,
): Promise<G>;
export function pipeAsync<A, B, C, D, E, F, G, H>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
    fg: (f: F) => G | Promise<G>,
    gh: (g: G) => H | Promise<H>,
): Promise<H>;
export function pipeAsync<A, B, C, D, E, F, G, H, I>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
    fg: (f: F) => G | Promise<G>,
    gh: (g: G) => H | Promise<H>,
    hi: (h: H) => I | Promise<I>,
): Promise<I>;
export function pipeAsync<A, B, C, D, E, F, G, H, I, J>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
    fg: (f: F) => G | Promise<G>,
    gh: (g: G) => H | Promise<H>,
    hi: (h: H) => I | Promise<I>,
    ij: (i: I) => J | Promise<J>,
): Promise<J>;
export async function pipeAsync(
    value: unknown,
    ...fns: Array<(x: unknown) => unknown | Promise<unknown>>
): Promise<unknown> {
    let acc = value;
    for (const fn of fns) {
        acc = await fn(acc);
    }
    return acc;
}
