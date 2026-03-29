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
});
