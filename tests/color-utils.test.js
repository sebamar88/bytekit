import { describe, it } from "node:test";
import assert from "node:assert";
import { ColorUtils } from "../dist/utils/helpers/ColorUtils.js";

describe("ColorUtils", () => {
    describe("hexToRgb", () => {
        it("should convert 6-digit hex to RGB", () => {
            const result = ColorUtils.hexToRgb("#ff5733");
            assert.deepStrictEqual(result, { r: 255, g: 87, b: 51 });
        });

        it("should convert 3-digit hex to RGB", () => {
            const result = ColorUtils.hexToRgb("#f53");
            assert.deepStrictEqual(result, { r: 255, g: 85, b: 51 });
        });

        it("should handle hex without #", () => {
            const result = ColorUtils.hexToRgb("ff5733");
            assert.deepStrictEqual(result, { r: 255, g: 87, b: 51 });
        });

        it("should return null for invalid hex", () => {
            assert.strictEqual(ColorUtils.hexToRgb("invalid"), null);
        });
    });

    describe("rgbToHex", () => {
        it("should convert RGB values to hex", () => {
            const result = ColorUtils.rgbToHex(255, 87, 51);
            assert.strictEqual(result, "#ff5733");
        });

        it("should convert RGB object to hex", () => {
            const result = ColorUtils.rgbToHex({ r: 255, g: 87, b: 51 });
            assert.strictEqual(result, "#ff5733");
        });

        it("should clamp values outside 0-255", () => {
            const result = ColorUtils.rgbToHex(300, -10, 128);
            assert.ok(result.startsWith("#"));
        });
    });

    describe("rgbToHsl / hslToRgb", () => {
        it("should convert RGB to HSL", () => {
            const result = ColorUtils.rgbToHsl(255, 0, 0);
            assert.strictEqual(result.h, 0);
            assert.strictEqual(result.s, 100);
            assert.strictEqual(result.l, 50);
        });

        it("should convert HSL to RGB", () => {
            const result = ColorUtils.hslToRgb(0, 100, 50);
            assert.strictEqual(result.r, 255);
            assert.strictEqual(result.g, 0);
            assert.strictEqual(result.b, 0);
        });

        it("should handle grayscale", () => {
            const result = ColorUtils.rgbToHsl(128, 128, 128);
            assert.strictEqual(result.s, 0);
        });
    });

    describe("lighten / darken", () => {
        it("should lighten a color", () => {
            const original = ColorUtils.hexToHsl("#ff5733");
            const result = ColorUtils.lighten("#ff5733", 20);
            const lightenedHsl = ColorUtils.hexToHsl(result);
            assert.ok(lightenedHsl.l > original.l);
        });

        it("should darken a color", () => {
            const original = ColorUtils.hexToHsl("#ff5733");
            const result = ColorUtils.darken("#ff5733", 20);
            const darkenedHsl = ColorUtils.hexToHsl(result);
            assert.ok(darkenedHsl.l < original.l);
        });
    });

    describe("complement", () => {
        it("should return complementary color", () => {
            const result = ColorUtils.complement("#ff0000");
            const hsl = ColorUtils.hexToHsl(result);
            // Red's complement is cyan (hue ~180)
            assert.ok(hsl.h >= 170 && hsl.h <= 190);
        });
    });

    describe("invert", () => {
        it("should invert black to white", () => {
            const result = ColorUtils.invert("#000000");
            assert.strictEqual(result.toLowerCase(), "#ffffff");
        });

        it("should invert white to black", () => {
            const result = ColorUtils.invert("#ffffff");
            assert.strictEqual(result.toLowerCase(), "#000000");
        });
    });

    describe("mix", () => {
        it("should mix two colors equally", () => {
            const result = ColorUtils.mix("#ff0000", "#0000ff", 50);
            const rgb = ColorUtils.hexToRgb(result);
            // Red + Blue = Purple-ish
            assert.ok(rgb.r > 100);
            assert.ok(rgb.b > 100);
        });

        it("should return first color at 0 weight", () => {
            const result = ColorUtils.mix("#ff0000", "#0000ff", 0);
            assert.strictEqual(result.toLowerCase(), "#ff0000");
        });

        it("should return second color at 100 weight", () => {
            const result = ColorUtils.mix("#ff0000", "#0000ff", 100);
            assert.strictEqual(result.toLowerCase(), "#0000ff");
        });
    });

    describe("luminance", () => {
        it("should return 0 for black", () => {
            assert.strictEqual(ColorUtils.luminance("#000000"), 0);
        });

        it("should return 1 for white", () => {
            assert.strictEqual(ColorUtils.luminance("#ffffff"), 1);
        });

        it("should return value between 0 and 1 for other colors", () => {
            const lum = ColorUtils.luminance("#ff5733");
            assert.ok(lum > 0 && lum < 1);
        });
    });

    describe("contrast", () => {
        it("should return maximum contrast for black and white", () => {
            const result = ColorUtils.contrast("#000000", "#ffffff");
            assert.ok(result >= 20 && result <= 21);
        });

        it("should return 1 for same colors", () => {
            const result = ColorUtils.contrast("#ff5733", "#ff5733");
            assert.strictEqual(result, 1);
        });
    });

    describe("isLight / isDark", () => {
        it("should identify white as light", () => {
            assert.strictEqual(ColorUtils.isLight("#ffffff"), true);
        });

        it("should identify black as dark", () => {
            assert.strictEqual(ColorUtils.isDark("#000000"), true);
        });
    });

    describe("textColor", () => {
        it("should return black text for light backgrounds", () => {
            assert.strictEqual(ColorUtils.textColor("#ffffff"), "#000000");
        });

        it("should return white text for dark backgrounds", () => {
            assert.strictEqual(ColorUtils.textColor("#000000"), "#ffffff");
        });
    });

    describe("WCAG compliance", () => {
        it("should pass AA for black on white", () => {
            assert.strictEqual(ColorUtils.meetsContrastAA("#000000", "#ffffff"), true);
        });

        it("should pass AAA for black on white", () => {
            assert.strictEqual(ColorUtils.meetsContrastAAA("#000000", "#ffffff"), true);
        });
    });

    describe("random", () => {
        it("should generate valid hex color", () => {
            const result = ColorUtils.random();
            assert.ok(ColorUtils.isValidHex(result));
        });
    });

    describe("palette", () => {
        it("should generate specified number of colors", () => {
            const result = ColorUtils.palette("#ff5733", 5);
            assert.strictEqual(result.length, 5);
        });

        it("should include base color", () => {
            const result = ColorUtils.palette("#ff0000", 3);
            assert.strictEqual(result[0].toLowerCase(), "#ff0000");
        });
    });

    describe("gradient", () => {
        it("should generate gradient with correct number of steps", () => {
            const result = ColorUtils.gradient("#ff0000", "#0000ff", 5);
            assert.strictEqual(result.length, 5);
        });

        it("should start with first color", () => {
            const result = ColorUtils.gradient("#ff0000", "#0000ff", 5);
            assert.strictEqual(result[0].toLowerCase(), "#ff0000");
        });

        it("should end with second color", () => {
            const result = ColorUtils.gradient("#ff0000", "#0000ff", 5);
            assert.strictEqual(result[4].toLowerCase(), "#0000ff");
        });
    });

    describe("parse", () => {
        it("should parse hex color", () => {
            const result = ColorUtils.parse("#ff5733");
            assert.strictEqual(result.toLowerCase(), "#ff5733");
        });

        it("should parse rgb format", () => {
            const result = ColorUtils.parse("rgb(255, 87, 51)");
            assert.strictEqual(result.toLowerCase(), "#ff5733");
        });

        it("should parse hsl format", () => {
            const result = ColorUtils.parse("hsl(0, 100%, 50%)");
            assert.strictEqual(result.toLowerCase(), "#ff0000");
        });

        it("should parse named colors", () => {
            assert.strictEqual(ColorUtils.parse("white"), "#ffffff");
            assert.strictEqual(ColorUtils.parse("black"), "#000000");
            assert.strictEqual(ColorUtils.parse("red"), "#ff0000");
        });

        it("should return null for unknown colors", () => {
            assert.strictEqual(ColorUtils.parse("unknowncolor"), null);
        });
    });

    describe("isValidHex", () => {
        it("should validate 3-digit hex", () => {
            assert.strictEqual(ColorUtils.isValidHex("#fff"), true);
        });

        it("should validate 6-digit hex", () => {
            assert.strictEqual(ColorUtils.isValidHex("#ff5733"), true);
        });

        it("should validate 8-digit hex (with alpha)", () => {
            assert.strictEqual(ColorUtils.isValidHex("#ff573380"), true);
        });

        it("should reject invalid hex", () => {
            assert.strictEqual(ColorUtils.isValidHex("ff5733"), false);
            assert.strictEqual(ColorUtils.isValidHex("#gggggg"), false);
        });
    });
});
