import { describe, it, expect, vi, beforeEach } from "vitest";
import { memoize, once, partial, noop, identity } from "../src/utils/helpers/FnUtils.js";

describe("identity", () => {
    it("returns the same value", () => {
        expect(identity(42)).toBe(42);
        expect(identity("hello")).toBe("hello");
        const obj = { a: 1 };
        expect(identity(obj)).toBe(obj);
    });
});

describe("noop", () => {
    it("returns undefined", () => {
        expect(noop()).toBeUndefined();
    });
    it("can be called with any arguments", () => {
        expect(() => (noop as (...args: unknown[]) => void)(1, 2, 3)).not.toThrow();
    });
});

describe("once", () => {
    it("calls fn only once", () => {
        const fn = vi.fn(() => 42);
        const onceFn = once(fn);
        expect(onceFn()).toBe(42);
        expect(onceFn()).toBe(42);
        expect(fn).toHaveBeenCalledTimes(1);
    });
    it("returns the result from the first call on subsequent calls", () => {
        let counter = 0;
        const fn = once(() => ++counter);
        fn();
        fn();
        fn();
        expect(counter).toBe(1);
    });
});

describe("partial", () => {
    it("partially applies arguments", () => {
        const add = (a: number, b: number) => a + b;
        const add5 = partial(add, 5);
        expect(add5(3)).toBe(8);
        expect(add5(10)).toBe(15);
    });
    it("works with multiple partial args", () => {
        const sum3 = (a: number, b: number, c: number) => a + b + c;
        const sum3From1And2 = partial(sum3, 1, 2);
        expect(sum3From1And2(3)).toBe(6);
    });
});

describe("memoize", () => {
    it("caches results for primitive args", () => {
        const fn = vi.fn((a: number, b: number) => a + b);
        const memoized = memoize(fn);
        expect(memoized(1, 2)).toBe(3);
        expect(memoized(1, 2)).toBe(3);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("computes again for different args", () => {
        const fn = vi.fn((x: number) => x * 2);
        const memoized = memoize(fn);
        memoized(3);
        memoized(4);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("uses WeakMap for single object arg", () => {
        const fn = vi.fn((obj: { x: number }) => obj.x * 2);
        const memoized = memoize(fn);
        const key = { x: 5 };
        expect(memoized(key)).toBe(10);
        expect(memoized(key)).toBe(10);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("respects TTL expiration", async () => {
        const fn = vi.fn((x: number) => x * 2);
        const memoized = memoize(fn, { ttl: 50 });
        expect(memoized(3)).toBe(6);
        expect(memoized(3)).toBe(6);
        expect(fn).toHaveBeenCalledTimes(1);
        await new Promise((res) => setTimeout(res, 60));
        expect(memoized(3)).toBe(6);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("performance: 10k calls under 50ms", () => {
        const fn = (x: number) => x * x;
        const memoized = memoize(fn);
        const start = Date.now();
        for (let i = 0; i < 10_000; i++) memoized(i % 100);
        expect(Date.now() - start).toBeLessThan(50);
    });
});
