import { describe, it, expect } from "vitest";
import {
    pick,
    omit,
    deepMerge,
    flattenObject,
    deepClone,
} from "../src/utils/helpers/ObjectUtils.js";

describe("pick", () => {
    it("returns only specified keys", () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });

    it("ignores keys not in object", () => {
        const obj = { a: 1 };
        expect(pick(obj, ["a"] as (keyof typeof obj)[])).toEqual({ a: 1 });
    });

    it("returns empty object for empty keys", () => {
        expect(pick({ a: 1 }, [])).toEqual({});
    });
});

describe("omit", () => {
    it("excludes specified keys", () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
    });

    it("returns full object for empty keys", () => {
        const obj = { a: 1, b: 2 };
        expect(omit(obj, [])).toEqual({ a: 1, b: 2 });
    });

    it("returns empty object when all keys omitted", () => {
        const obj = { a: 1 };
        expect(omit(obj, ["a"])).toEqual({});
    });
});

describe("deepMerge", () => {
    it("merges flat objects", () => {
        expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it("overrides with source values by default", () => {
        expect(deepMerge({ a: 1 }, { a: 99 })).toEqual({ a: 99 });
    });

    it("deeply merges nested objects", () => {
        const target = { x: { a: 1, b: 2 } };
        const source = { x: { b: 99, c: 3 } };
        expect(deepMerge(target, source as Partial<typeof target>)).toEqual({
            x: { a: 1, b: 99, c: 3 },
        });
    });

    it("replaces arrays by default (replace strategy)", () => {
        const result = deepMerge({ arr: [1, 2] }, { arr: [3, 4] });
        expect(result.arr).toEqual([3, 4]);
    });

    it("concatenates arrays with concat strategy", () => {
        const result = deepMerge({ arr: [1, 2] }, { arr: [3, 4] }, "concat");
        expect(result.arr).toEqual([1, 2, 3, 4]);
    });
});

describe("flattenObject", () => {
    it("flattens nested object with default delimiter", () => {
        const obj = { a: { b: { c: 1 } }, d: 2 };
        expect(flattenObject(obj)).toEqual({ "a.b.c": 1, d: 2 });
    });

    it("supports custom delimiter", () => {
        expect(flattenObject({ a: { b: 1 } }, "_")).toEqual({ a_b: 1 });
    });

    it("handles flat objects unchanged", () => {
        expect(flattenObject({ x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
    });

    it("throws on excessive depth", () => {
        const deep: Record<string, unknown> = {};
        let cur = deep;
        for (let i = 0; i < 105; i++) {
            cur.next = {};
            cur = cur.next as Record<string, unknown>;
        }
        expect(() => flattenObject(deep)).toThrow(RangeError);
    });
});

describe("deepClone", () => {
    it("clones primitives", () => {
        expect(deepClone(42)).toBe(42);
        expect(deepClone("hello")).toBe("hello");
        expect(deepClone(null)).toBeNull();
    });

    it("returns a new object, not the same reference", () => {
        const obj = { a: 1, b: { c: 2 } };
        const clone = deepClone(obj);
        expect(clone).toEqual(obj);
        expect(clone).not.toBe(obj);
        expect(clone.b).not.toBe(obj.b);
    });

    it("clones arrays", () => {
        const arr = [1, [2, 3], { x: 4 }];
        const clone = deepClone(arr);
        expect(clone).toEqual(arr);
        expect(clone).not.toBe(arr);
        expect(clone[1]).not.toBe(arr[1]);
    });

    it("handles circular references without stack overflow", () => {
        const a: Record<string, unknown> = { x: 1 };
        a.self = a;
        const clone = deepClone(a);
        expect(clone.x).toBe(1);
        expect(clone.self).toBe(clone);
    });
});
