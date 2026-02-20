import { describe, it, expect } from "vitest";
import { DateUtils } from "../src/utils/helpers/DateUtils";

describe("DateUtils.format custom", () => {
    const date = new Date(2024, 5, 15, 14, 30, 45); // 15 de Junio 2024, 14:30:45

    it("should format with YYYY-MM-DD", () => {
        expect(DateUtils.format(date, "YYYY-MM-DD")).toBe("2024-06-15");
    });

    it("should format with time HH:mm:ss", () => {
        expect(DateUtils.format(date, "YYYY-MM-DD HH:mm:ss")).toBe(
            "2024-06-15 14:30:45"
        );
    });

    it("should maintain backward compatibility with locales", () => {
        const formatted = DateUtils.format(date, "en-US");
        expect(formatted).toContain("2024");
        expect(formatted).toContain("Jun");
    });

    it("should handle string inputs", () => {
        expect(DateUtils.format("2024-01-01T12:00:00Z", "YYYY")).toBe("2024");
    });
});
