import { describe, it, expect } from "vitest";
import { UrlHelper } from "../src/utils/helpers/UrlHelper";

describe("UrlHelper", () => {
    it("should serialize arrays and nested objects", () => {
        const qs = UrlHelper.stringify({
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
        const qs = UrlHelper.stringify(params);
        expect(qs).toBe("a=1&b=2&b=3&c%5Bd%5D=4&f=");

        expect(UrlHelper.stringify(params, { arrayFormat: "bracket" })).toBe(
            "a=1&b%5B%5D=2&b%5B%5D=3&c%5Bd%5D=4&f="
        );

        expect(UrlHelper.stringify(params, { arrayFormat: "comma" })).toBe(
            "a=1&b=2%2C3&c%5Bd%5D=4&f="
        );

        expect(UrlHelper.stringify(params, { skipEmptyString: true })).toBe(
            "a=1&b=2&b=3&c%5Bd%5D=4"
        );
    });

    it("should return empty string with no params", () => {
        expect(UrlHelper.stringify(null)).toBe("");
        expect(UrlHelper.stringify({})).toBe("");
    });

    describe("slugify", () => {
        it("should convert an object into an SEO string", () => {
            const slug = UrlHelper.slugify({
                category: "Zapatos Deporte",
                brand: ["Nike", "Adidas"],
            });
            expect(slug).toBe(
                "brand-nike-brand-adidas-category-zapatos-deporte"
            );
        });

        it("should handle raw strings correctly", () => {
            const slug = UrlHelper.slugify("Crème brûlée -- Especial", "_");
            expect(slug).toBe("creme_brulee_especial");
        });

        it("should create standard URL slugs", () => {
            const result = UrlHelper.slugify("Mejores celulares para 2026");
            expect(result).toBe("mejores-celulares-para-2026");
        });

        it("should handle empty or null values", () => {
            expect(UrlHelper.slugify("")).toBe("");
            expect(UrlHelper.slugify(null)).toBe("");
            expect(UrlHelper.slugify(undefined)).toBe("");
        });
    });

    it("safeString falls back to empty string for null in comma-format array (lines 12, 26-27)", () => {
        // null items in comma-format go through serializeValue(null) → safeString(null) → ""
        // This exercises the null/undefined branch of safeString and the fallback path in serializeValue
        const result = UrlHelper.stringify(
            { x: [null, "b"] } as Record<string, unknown>,
            { arrayFormat: "comma", skipNull: false }
        );
        // null → "" then joined with "," before "b" → ",b" → encoded as "%2Cb"
        expect(result).toBe("x=%2Cb");
    });

    it("serializeValue: false boolean → 'false', bigint → String(n)", () => {
        // Note: Date objects are caught by isPlainObject (Date IS an object) and handled
        // as plain objects — the instanceof Date branch in serializeValue is unreachable.

        // boolean false: isPlainObject(false) → false (typeof false !== 'object') → reaches serializeValue
        expect(
            UrlHelper.stringify(
                { flag: false as unknown as string },
                { encode: false }
            )
        ).toBe("flag=false");

        // bigint: typeof BigInt(42) === 'bigint' → not an object → reaches serializeValue
        expect(
            UrlHelper.stringify(
                { n: BigInt(42) as unknown as string },
                { encode: false }
            )
        ).toBe("n=42");
    });

    it("buildQueryPairs: undefined value skipped, null with skipNull:false, key='' nested object", () => {
        // undefined → skipped entirely
        expect(
            UrlHelper.stringify(
                { a: 1, b: undefined as unknown as string },
                { encode: false }
            )
        ).toBe("a=1");

        // null with skipNull: false → key=""
        expect(
            UrlHelper.stringify({ x: null }, { skipNull: false, encode: false })
        ).toBe("x=");

        // key="" with nested object → child keys become top-level (no brackets around "")
        expect(
            UrlHelper.stringify({ "": { sub: "val" } }, { encode: false })
        ).toBe("sub=val");
    });

    it("comma array where all filtered items are empty with skipEmptyString:true — nothing appended", () => {
        // Array of empty strings with arrayFormat=comma + skipEmptyString=true
        // All entries get filtered out → serialized="" AND skipEmptyString=true → branch NOT taken → not pushed
        const result = UrlHelper.stringify(
            { x: ["", ""] },
            { arrayFormat: "comma", skipEmptyString: true }
        );
        expect(result).toBe("");
    });

    it("sortKeys: false preserves insertion order; encode: false keeps raw chars", () => {
        const res = UrlHelper.stringify(
            { z: 1, a: 2 },
            { sortKeys: false, encode: false }
        );
        expect(res).toBe("z=1&a=2");

        expect(UrlHelper.stringify({ "a b": "c d" }, { encode: false })).toBe(
            "a b=c d"
        );
    });

    it("skipEmptyString: true skips empty serialized scalar values", () => {
        // An empty string value with skipEmptyString=true → not added
        expect(
            UrlHelper.stringify(
                { a: "", b: "x" },
                { skipEmptyString: true, encode: false }
            )
        ).toBe("b=x");
    });

    it("slugify: lowercase:false preserves case; non-empty object filters empty values", () => {
        expect(UrlHelper.slugify("Hello World", { lowercase: false })).toBe(
            "Hello-World"
        );

        // Object with null value (null → "" after buildQueryPairs → filtered by pairs.filter(([,v]) => v !== ""))
        const slug = UrlHelper.slugify({ brand: "Nike", empty: null } as Record<
            string,
            unknown
        >);
        // "empty" key is skipped because null → skipNull=true by default → not added to pairs
        expect(slug).toBe("brand-nike");
    });

    it("serializeValue: boolean true → 'true' (line 19 TRUE ternary branch)", () => {
        // typeof true === 'boolean' → true ? 'true' : 'false' → 'true' (TRUE branch of ternary)
        expect(
            UrlHelper.stringify(
                { flag: true as unknown as string },
                { encode: false }
            )
        ).toBe("flag=true");
    });

    it("serializeValue: Date in comma array hits instanceof Date branch (line 18)", () => {
        // Array items in comma-format go through serializeValue() directly
        // new Date() instanceof Date → true → toISOString() — covers line 18 TRUE branch
        const d = new Date("2025-06-15T12:00:00.000Z");
        const result = UrlHelper.stringify(
            { ts: [d] } as unknown as Record<string, unknown>,
            { arrayFormat: "comma", encode: false }
        );
        expect(result).toBe("ts=2025-06-15T12:00:00.000Z");
    });

    it("safeString: undefined in comma array hits value===undefined branch (line 12 OR branch)", () => {
        // undefined inside a comma array's .map(serializeValue) → safeString(undefined)
        // value === null → false, value === undefined → TRUE → returns ""
        const result = UrlHelper.stringify(
            { x: [undefined, "hello"] } as unknown as Record<string, unknown>,
            { arrayFormat: "comma", encode: false }
        );
        // undefined → "" then joined with "hello" → ",hello"
        expect(result).toBe("x=,hello");
    });

    it("empty array value short-circuits at length===0 check (line 55 TRUE branch)", () => {
        // Array with 0 elements → value.length === 0 → return early, nothing appended
        const result = UrlHelper.stringify(
            { a: [] as unknown as string[] },
            { encode: false }
        );
        expect(result).toBe("");
    });
});
