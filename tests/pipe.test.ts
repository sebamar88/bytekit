import { describe, test, expect } from "vitest";
import { pipe, compose, pipeAsync } from "#helpers/pipe.js";

// ─── pipe ────────────────────────────────────────────────────────────────────

describe("pipe", () => {
    test("1 arg returns value unchanged", () => {
        expect(pipe(42)).toBe(42);
    });

    test("2 fns applied left-to-right", () => {
        const result = pipe(
            "hello",
            (s: string) => s.toUpperCase(),
            (s: string) => s + "!",
        );
        expect(result).toBe("HELLO!");
    });

    test("3 fns — type-safe chaining", () => {
        const result = pipe(
            1,
            (n: number) => n + 1,
            (n: number) => n * 3,
            (n: number) => String(n),
        );
        expect(result).toBe("6");
    });

    test("10 fns — maximum overload", () => {
        const result = pipe(
            0,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
            (n: number) => n + 1,
        );
        expect(result).toBe(10);
    });

    test("works with objects", () => {
        const result = pipe(
            { x: 1 },
            (o: { x: number }) => ({ ...o, y: 2 }),
            (o: { x: number; y: number }) => o.x + o.y,
        );
        expect(result).toBe(3);
    });

    test("functions receive exact output of previous step", () => {
        const calls: number[] = [];
        pipe(
            10,
            (n: number) => { calls.push(n); return n * 2; },
            (n: number) => { calls.push(n); return n + 5; },
        );
        expect(calls).toEqual([10, 20]);
    });
});

// ─── compose ─────────────────────────────────────────────────────────────────

describe("compose", () => {
    test("1 arg returns value unchanged", () => {
        expect(compose(42)).toBe(42);
    });

    test("2 args applied right-to-left", () => {
        const double = (n: number) => n * 2;
        const addOne = (n: number) => n + 1;
        // compose(double, addOne, 3) → addOne(3) then double(4) → 8
        const result = compose(double, addOne, 3);
        expect(result).toBe(8);
    });

    test("3 fns right-to-left order", () => {
        const result = compose(
            (s: string) => s + "!",
            (s: string) => s.toUpperCase(),
            (s: string) => s.trim(),
            "  hello  ",
        );
        expect(result).toBe("HELLO!");
    });

    test("compose is the reverse of pipe", () => {
        const add = (n: number) => n + 10;
        const triple = (n: number) => n * 3;
        const toString = (n: number) => String(n);

        const piped = pipe(1, add, triple, toString);
        const composed = compose(toString, triple, add, 1);
        expect(piped).toBe(composed);
    });
});

// ─── pipeAsync ───────────────────────────────────────────────────────────────

describe("pipeAsync", () => {
    test("1 arg returns resolved value", async () => {
        expect(await pipeAsync(99)).toBe(99);
    });

    test("2 fns — sync functions work", async () => {
        const result = await pipeAsync(
            5,
            (n: number) => n * 2,
        );
        expect(result).toBe(10);
    });

    test("3 fns — mix of async and sync", async () => {
        const result = await pipeAsync(
            "a",
            async (s: string) => s + "b",
            (s: string) => s + "c",
            async (s: string) => s + "d",
        );
        expect(result).toBe("abcd");
    });

    test("10 fns — maximum overload async", async () => {
        const result = await pipeAsync(
            0,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
            async (n: number) => n + 1,
        );
        expect(result).toBe(10);
    });

    test("awaits each step sequentially", async () => {
        const order: number[] = [];
        await pipeAsync(
            0,
            async (n: number) => { order.push(1); return n + 1; },
            async (n: number) => { order.push(2); return n + 1; },
            async (n: number) => { order.push(3); return n + 1; },
        );
        expect(order).toEqual([1, 2, 3]);
    });

    test("propagates rejection", async () => {
        await expect(
            pipeAsync(
                0,
                async (n: number) => n + 1,
                () => { throw new Error("step failed"); },
                async (n: number) => n + 1,
            ),
        ).rejects.toThrow("step failed");
    });

    test("rejects when async step rejects", async () => {
        await expect(
            pipeAsync(
                "x",
                async (_: string) => { throw new Error("async error"); },
            ),
        ).rejects.toThrow("async error");
    });
});
