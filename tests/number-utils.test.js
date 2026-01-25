import { describe, it } from "node:test";
import assert from "node:assert";
import { NumberUtils } from "../dist/utils/helpers/NumberUtils.js";

describe("NumberUtils", () => {
    describe("format", () => {
        it("should format numbers with locale", () => {
            const result = NumberUtils.format(1234567.89, "en-US");
            assert.ok(result.includes("1"));
            assert.ok(result.includes("234"));
        });

        it("should handle zero", () => {
            assert.strictEqual(NumberUtils.format(0), "0");
        });
    });

    describe("currency", () => {
        it("should format currency with USD", () => {
            const result = NumberUtils.currency(99.99, "USD", "en-US");
            assert.ok(result.includes("99.99") || result.includes("99,99"));
            assert.ok(result.includes("$"));
        });

        it("should format with different currencies", () => {
            const result = NumberUtils.currency(100, "EUR", "de-DE");
            assert.ok(result.includes("100") || result.includes("€"));
        });
    });

    describe("percentage", () => {
        it("should format decimal as percentage", () => {
            const result = NumberUtils.percentage(0.456);
            assert.ok(result.includes("45") || result.includes("46"));
            assert.ok(result.includes("%"));
        });

        it("should handle isPercentage option", () => {
            const result = NumberUtils.percentage(75, { isPercentage: true });
            assert.ok(result.includes("75"));
            assert.ok(result.includes("%"));
        });
    });

    describe("ordinal", () => {
        it("should return correct ordinal for 1", () => {
            assert.strictEqual(NumberUtils.ordinal(1), "1st");
        });

        it("should return correct ordinal for 2", () => {
            assert.strictEqual(NumberUtils.ordinal(2), "2nd");
        });

        it("should return correct ordinal for 3", () => {
            assert.strictEqual(NumberUtils.ordinal(3), "3rd");
        });

        it("should return correct ordinal for 4", () => {
            assert.strictEqual(NumberUtils.ordinal(4), "4th");
        });

        it("should return correct ordinal for 11", () => {
            assert.strictEqual(NumberUtils.ordinal(11), "11th");
        });

        it("should return correct ordinal for 21", () => {
            assert.strictEqual(NumberUtils.ordinal(21), "21st");
        });

        it("should return Spanish ordinal", () => {
            assert.strictEqual(NumberUtils.ordinal(1, "es"), "1°");
        });
    });

    describe("clamp", () => {
        it("should clamp high values", () => {
            assert.strictEqual(NumberUtils.clamp(150, 0, 100), 100);
        });

        it("should clamp low values", () => {
            assert.strictEqual(NumberUtils.clamp(-50, 0, 100), 0);
        });

        it("should not clamp values in range", () => {
            assert.strictEqual(NumberUtils.clamp(50, 0, 100), 50);
        });
    });

    describe("round", () => {
        it("should round to specified decimals", () => {
            assert.strictEqual(NumberUtils.round(3.14159, 2), 3.14);
        });

        it("should round to integer by default", () => {
            assert.strictEqual(NumberUtils.round(3.7), 4);
        });

        it("should handle negative decimals", () => {
            assert.strictEqual(NumberUtils.round(1234.5, -2), 1200);
        });
    });

    describe("range", () => {
        it("should generate ascending range", () => {
            assert.deepStrictEqual(NumberUtils.range(1, 5), [1, 2, 3, 4, 5]);
        });

        it("should generate range with step", () => {
            assert.deepStrictEqual(NumberUtils.range(0, 10, 2), [0, 2, 4, 6, 8, 10]);
        });

        it("should generate descending range", () => {
            assert.deepStrictEqual(NumberUtils.range(5, 1), [5, 4, 3, 2, 1]);
        });

        it("should throw on zero step", () => {
            assert.throws(() => NumberUtils.range(1, 5, 0));
        });
    });

    describe("random", () => {
        it("should generate number within range", () => {
            for (let i = 0; i < 100; i++) {
                const result = NumberUtils.random(1, 100);
                assert.ok(result >= 1 && result <= 100);
            }
        });
    });

    describe("isEven/isOdd", () => {
        it("should identify even numbers", () => {
            assert.strictEqual(NumberUtils.isEven(4), true);
            assert.strictEqual(NumberUtils.isEven(3), false);
        });

        it("should identify odd numbers", () => {
            assert.strictEqual(NumberUtils.isOdd(3), true);
            assert.strictEqual(NumberUtils.isOdd(4), false);
        });
    });

    describe("isBetween", () => {
        it("should return true for values in range", () => {
            assert.strictEqual(NumberUtils.isBetween(5, 1, 10), true);
        });

        it("should return true for boundary values", () => {
            assert.strictEqual(NumberUtils.isBetween(1, 1, 10), true);
            assert.strictEqual(NumberUtils.isBetween(10, 1, 10), true);
        });

        it("should return false for values outside range", () => {
            assert.strictEqual(NumberUtils.isBetween(0, 1, 10), false);
        });
    });

    describe("toWords", () => {
        it("should convert zero", () => {
            assert.strictEqual(NumberUtils.toWords(0), "zero");
        });

        it("should convert single digits", () => {
            assert.strictEqual(NumberUtils.toWords(5), "five");
        });

        it("should convert two digits", () => {
            assert.strictEqual(NumberUtils.toWords(21), "twenty-one");
        });

        it("should convert hundreds", () => {
            const result = NumberUtils.toWords(123);
            assert.ok(result.includes("hundred"));
            assert.ok(result.includes("twenty"));
            assert.ok(result.includes("three"));
        });

        it("should convert thousands", () => {
            const result = NumberUtils.toWords(1000);
            assert.ok(result.includes("thousand"));
        });

        it("should handle Spanish locale", () => {
            assert.strictEqual(NumberUtils.toWords(0, "es"), "cero");
            assert.strictEqual(NumberUtils.toWords(5, "es"), "cinco");
        });
    });

    describe("formatBytes", () => {
        it("should format bytes", () => {
            assert.strictEqual(NumberUtils.formatBytes(0), "0 Bytes");
        });

        it("should format KB", () => {
            const result = NumberUtils.formatBytes(1536);
            assert.ok(result.includes("KB"));
        });

        it("should format MB", () => {
            const result = NumberUtils.formatBytes(1048576);
            assert.ok(result.includes("MB"));
        });
    });

    describe("pad", () => {
        it("should pad numbers with zeros", () => {
            assert.strictEqual(NumberUtils.pad(5, 3), "005");
            assert.strictEqual(NumberUtils.pad(42, 5), "00042");
        });
    });

    describe("statistics", () => {
        const numbers = [1, 2, 3, 4, 5];

        it("should calculate sum", () => {
            assert.strictEqual(NumberUtils.sum(numbers), 15);
        });

        it("should calculate average", () => {
            assert.strictEqual(NumberUtils.average(numbers), 3);
        });

        it("should calculate median", () => {
            assert.strictEqual(NumberUtils.median(numbers), 3);
        });

        it("should calculate median for even count", () => {
            assert.strictEqual(NumberUtils.median([1, 2, 3, 4]), 2.5);
        });

        it("should calculate mode", () => {
            assert.strictEqual(NumberUtils.mode([1, 1, 2, 3]), 1);
        });

        it("should calculate min", () => {
            assert.strictEqual(NumberUtils.min(numbers), 1);
        });

        it("should calculate max", () => {
            assert.strictEqual(NumberUtils.max(numbers), 5);
        });

        it("should handle empty arrays", () => {
            assert.strictEqual(NumberUtils.sum([]), 0);
            assert.strictEqual(NumberUtils.average([]), 0);
            assert.strictEqual(NumberUtils.min([]), null);
            assert.strictEqual(NumberUtils.max([]), null);
        });
    });

    describe("percentile", () => {
        it("should calculate 50th percentile (median)", () => {
            const result = NumberUtils.percentile([1, 2, 3, 4, 5], 50);
            assert.strictEqual(result, 3);
        });

        it("should calculate 90th percentile", () => {
            const result = NumberUtils.percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90);
            assert.ok(result >= 9 && result <= 10);
        });
    });
});
