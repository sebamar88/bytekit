import { describe, it, expect } from "vitest";
import { Validator } from "../src/utils/helpers/Validator";

describe("Validator Extra Coverage", () => {
    it("should cover missing branches in length helpers", () => {
        expect(Validator.minLength(null, 5)).toBe(false);
        expect(Validator.minLength(undefined, 5)).toBe(false);
        expect(Validator.maxLength(null, 5)).toBe(false);
    });

    it("should cover strong password requirements", () => {
        expect(Validator.isStrongPassword("abc")).toBe(false); // Too short
        expect(Validator.isStrongPassword("ABC123abc")).toBe(false); // No special
        expect(Validator.isStrongPassword("ABC!!!abc")).toBe(false); // No number
        expect(Validator.isStrongPassword("abc123!!!")).toBe(false); // No upper
        // Minimum valid: 8 chars, 1 upper, 1 number, 1 special
        expect(Validator.isStrongPassword("Abc123!!!")).toBe(true); 
    });

    it("should cover date range edge cases", () => {
        expect(Validator.isDateRange("invalid", "2024-01-01")).toBe(false);
        expect(Validator.isDateRange("2024-01-01", "invalid")).toBe(false);
    });

    it("should cover phone number edge cases", () => {
        expect(Validator.isInternationalPhone(null)).toBe(false);
        expect(Validator.isPhoneE164(null)).toBe(false);
        expect(Validator.isLocalPhone(null, "es-AR")).toBe(false);
        expect(Validator.isLocalPhone("123", "")).toBe(false);
    });

    it("should cover UUID and DNI edge cases", () => {
        expect(Validator.isUUIDv4(null)).toBe(false);
        expect(Validator.isDni(null)).toBe(false);
        expect(Validator.isDni("abc")).toBe(false);
    });
});
