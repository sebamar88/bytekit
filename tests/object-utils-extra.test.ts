import { describe, it, expect } from "vitest";
import { ObjectUtils } from "../src/utils/helpers/ObjectUtils";

describe("ObjectUtils Extra Coverage", () => {
    it("should cover size method", () => {
        expect(ObjectUtils.size({ a: 1, b: 2 })).toBe(2);
        expect(ObjectUtils.size({})).toBe(0);
        // We avoid null as it's not a Record<string, unknown> per types
    });

    it("should cover entries and fromEntries", () => {
        const obj = { a: 1 };
        const entries = ObjectUtils.entries(obj);
        expect(entries).toEqual([["a", 1]]);
        expect(ObjectUtils.fromEntries(entries)).toEqual(obj);
    });

    it("should cover fromKeys", () => {
        expect(ObjectUtils.fromKeys(["a", "b"], 0)).toEqual({ a: 0, b: 0 });
    });

    it("should cover filter edge cases", () => {
        // @ts-expect-error - Testing invalid input
        expect(ObjectUtils.filter(null, () => true)).toEqual({});
    });

    it("should cover mapValues edge cases", () => {
        // @ts-expect-error - Testing invalid input
        expect(ObjectUtils.mapValues(null, (v) => v)).toEqual({});
    });

    it("should cover get with empty/invalid paths", () => {
        const obj = { a: 1 };
        expect(ObjectUtils.get(obj, "")).toBeUndefined();
        // @ts-expect-error - Testing invalid input
        expect(ObjectUtils.get(null, "a")).toBeUndefined();
    });
});
