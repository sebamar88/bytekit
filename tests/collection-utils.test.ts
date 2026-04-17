import { describe, it, expect } from "vitest";
import { chunk, groupBy, uniqueBy, flatten, zip } from "../src/utils/helpers/CollectionUtils.js";

describe("chunk", () => {
    it("splits array into chunks", () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
    it("returns empty array for empty input", () => {
        expect(chunk([], 3)).toEqual([]);
    });
    it("throws for size <= 0", () => {
        expect(() => chunk([1], 0)).toThrow(RangeError);
    });
});

describe("groupBy", () => {
    it("groups by key", () => {
        const items = [{ type: "a", v: 1 }, { type: "b", v: 2 }, { type: "a", v: 3 }];
        expect(groupBy(items, "type")).toEqual({
            a: [{ type: "a", v: 1 }, { type: "a", v: 3 }],
            b: [{ type: "b", v: 2 }],
        });
    });
    it("returns empty object for empty array", () => {
        expect(groupBy([], "id" as never)).toEqual({});
    });
});

describe("uniqueBy", () => {
    it("removes duplicates by key", () => {
        const items = [{ id: 1, x: "a" }, { id: 2, x: "b" }, { id: 1, x: "c" }];
        expect(uniqueBy(items, "id")).toEqual([{ id: 1, x: "a" }, { id: 2, x: "b" }]);
    });
    it("returns empty array for empty input", () => {
        expect(uniqueBy([], "id" as never)).toEqual([]);
    });
});

describe("flatten", () => {
    it("flattens one level by default", () => {
        expect(flatten([[1, 2], [3, [4]]])).toEqual([1, 2, 3, [4]]);
    });
    it("flattens to specified depth", () => {
        expect(flatten([[1, [2, [3]]]], 2)).toEqual([1, 2, [3]]);
    });
    it("returns empty array for empty input", () => {
        expect(flatten([])).toEqual([]);
    });
});

describe("zip", () => {
    it("zips two arrays", () => {
        expect(zip([1, 2, 3], ["a", "b", "c"])).toEqual([[1, "a"], [2, "b"], [3, "c"]]);
    });
    it("truncates to shortest array", () => {
        expect(zip([1, 2], ["a"])).toEqual([[1, "a"]]);
    });
    it("returns empty array for empty inputs", () => {
        expect(zip([], [])).toEqual([]);
    });
});
