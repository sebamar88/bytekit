import { describe, it, expect } from "vitest";
import { UrlSlugHelper } from "../src/utils/helpers/UrlSlugHelper";

describe("UrlSlugHelper", () => {
    it("should remove diacritics and normalize separators", () => {
        const result = UrlSlugHelper.generate("Crème brûlée -- Especial", {
            separator: "_",
        });
        expect(result).toBe("creme_brulee_especial");
    });

    it("should create standard URL slugs", () => {
        const result = UrlSlugHelper.generate("Mejores celulares para 2026");
        expect(result).toBe("mejores-celulares-para-2026");
    });

    it("should handle empty or null values", () => {
        expect(UrlSlugHelper.generate("")).toBe("");
        expect(UrlSlugHelper.generate(null)).toBe("");
        expect(UrlSlugHelper.generate(undefined)).toBe("");
    });
});