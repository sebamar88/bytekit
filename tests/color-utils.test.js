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

        it("should handle 8-digit hex by ignoring alpha", () => {
            const result = ColorUtils.hexToRgb("#ff000080");
            assert.deepStrictEqual(result, { r: 255, g: 0, b: 0 });
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
            assert.strictEqual(
                ColorUtils.meetsContrastAA("#000000", "#ffffff"),
                true
            );
        });

        it("should pass AAA for black on white", () => {
            assert.strictEqual(
                ColorUtils.meetsContrastAAA("#000000", "#ffffff"),
                true
            );
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

    describe("hexToRgba / rgbaToHex", () => {
        it("should parse 8-digit hex with alpha", () => {
            const rgba = ColorUtils.hexToRgba("#ff000080");
            assert.equal(rgba.r, 255);
            assert.equal(rgba.g, 0);
            assert.equal(rgba.b, 0);
            assert.ok(Math.abs(rgba.a - 0.5) < 0.01);
        });

        it("should handle 4-digit shorthand", () => {
            const rgba = ColorUtils.hexToRgba("#f008");
            assert.equal(rgba?.r, 255);
            assert.equal(rgba?.g, 0);
            assert.equal(rgba?.b, 0);
        });

        it("should return null for invalid hex length", () => {
            const rgba = ColorUtils.hexToRgba("#ff0");
            assert.strictEqual(rgba, null);
        });

        it("should convert RGBA to hex", () => {
            const hex = ColorUtils.rgbaToHex(255, 0, 0, 0.5);
            assert.strictEqual(hex.toLowerCase(), "#ff000080");
        });
    });

    describe("hslToHex / hexToHsl", () => {
        it("should convert HSL object to hex", () => {
            const hex = ColorUtils.hslToHex({ h: 120, s: 100, l: 50 });
            assert.strictEqual(hex.toLowerCase(), "#00ff00");
        });

        it("should return null for invalid hex in hexToHsl", () => {
            const hsl = ColorUtils.hexToHsl("not-a-hex");
            assert.strictEqual(hsl, null);
        });
    });

    describe("saturate / desaturate / grayscale", () => {
        it("should increase and decrease saturation", () => {
            const saturated = ColorUtils.saturate("#808080", 20);
            const desaturated = ColorUtils.desaturate("#ff0000", 50);
            assert.ok(ColorUtils.isValidHex(saturated));
            assert.ok(ColorUtils.isValidHex(desaturated));
        });

        it("should convert to grayscale", () => {
            const gray = ColorUtils.grayscale("#ff0000");
            const hsl = ColorUtils.hexToHsl(gray);
            assert.strictEqual(hsl?.s, 0);
        });
    });

    describe("alpha / adjustHue", () => {
        it("should set alpha channel", () => {
            const hex = ColorUtils.alpha("#ff0000", 0.25);
            assert.strictEqual(hex.toLowerCase(), "#ff000040");
        });

        it("should adjust hue", () => {
            const shifted = ColorUtils.adjustHue("#ff0000", 120);
            const hsl = ColorUtils.hexToHsl(shifted);
            assert.ok(hsl?.h >= 100 && hsl?.h <= 140);
        });
    });

    describe("randomWithLightness", () => {
        it("should generate color with specified lightness", () => {
            const color = ColorUtils.randomWithLightness(70);
            const hsl = ColorUtils.hexToHsl(color);
            assert.strictEqual(hsl?.l, 70);
        });
    });

    describe("additional palettes", () => {
        it("should create complementary palette", () => {
            const result = ColorUtils.complementaryPalette("#ff0000");
            assert.strictEqual(result.length, 2);
        });

        it("should create triadic palette", () => {
            const result = ColorUtils.triadicPalette("#ff0000");
            assert.strictEqual(result.length, 3);
        });

        it("should create analogous palette", () => {
            const result = ColorUtils.analogousPalette("#ff0000", 20);
            assert.strictEqual(result.length, 3);
        });
    });

    describe("shades and tints", () => {
        it("should generate shades", () => {
            const result = ColorUtils.shades("#ff0000", 3);
            assert.strictEqual(result.length, 3);
        });

        it("should generate tints", () => {
            const result = ColorUtils.tints("#ff0000", 3);
            assert.strictEqual(result.length, 3);
        });
    });

    describe("toCssRgb / toCssHsl", () => {
        it("should format css rgb", () => {
            const css = ColorUtils.toCssRgb("#ff0000");
            assert.strictEqual(css, "rgb(255, 0, 0)");
        });

        it("should format css hsl", () => {
            const css = ColorUtils.toCssHsl("#ff0000");
            assert.match(css || "", /hsl\(\d+, \d+%, \d+%\)/);
        });

        it("should return null for invalid color", () => {
            assert.strictEqual(ColorUtils.toCssRgb("zzzzzz"), null);
            assert.strictEqual(ColorUtils.toCssHsl("zzzzzz"), null);
        });
    });

    describe("parse rgba/hsla", () => {
        it("should parse rgba format", () => {
            const result = ColorUtils.parse("rgba(255, 0, 0, 0.5)");
            assert.strictEqual(result?.toLowerCase(), "#ff0000");
        });

        it("should parse hsla format", () => {
            const result = ColorUtils.parse("hsla(240, 100%, 50%, 0.5)");
            assert.strictEqual(result?.toLowerCase(), "#0000ff");
        });
    });
});
