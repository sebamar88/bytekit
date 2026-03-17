import { describe, it, expect } from "vitest";
import { QueryStringHelper } from "../src/utils/helpers/QueryStringHelper";

describe("QueryStringHelper", () => {
    it("should serialize arrays and nested objects", () => {
        const qs = QueryStringHelper.stringify({
            page: 2,
            tags: ["lab", "team"],
            filters: { status: "active" },
        });
        expect(qs).toBe("filters%5Bstatus%5D=active&page=2&tags=lab&tags=team");
    });

    it("should handle complex scenarios", () => {
        const params = {
            a: 1,
            b: [2, 3],
            c: { d: 4 },
            e: null,
            f: "",
        };

        // Default: repeat, skipNull: true, skipEmptyString: false, sortKeys: true
        const qs = QueryStringHelper.stringify(params);
        expect(qs).toBe("a=1&b=2&b=3&c%5Bd%5D=4&f=");

        expect(
            QueryStringHelper.stringify(params, { arrayFormat: "bracket" })
        ).toBe("a=1&b%5B%5D=2&b%5B%5D=3&c%5Bd%5D=4&f=");

        expect(
            QueryStringHelper.stringify(params, { arrayFormat: "comma" })
        ).toBe("a=1&b=2%2C3&c%5Bd%5D=4&f=");

        expect(
            QueryStringHelper.stringify(params, { skipEmptyString: true })
        ).toBe("a=1&b=2&b=3&c%5Bd%5D=4");
    });

    it("should return empty string with no params", () => {
        expect(QueryStringHelper.stringify(null)).toBe("");
        expect(QueryStringHelper.stringify({})).toBe("");
    });
});
