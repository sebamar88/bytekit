/**
 * Color utilities for conversion, manipulation, and accessibility
 * Isomorphic utilities for Node.js and browsers
 * @module ColorUtils
 */

/**
 * RGB color representation
 */
export interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * RGBA color representation
 */
export interface RGBA extends RGB {
    a: number;
}

/**
 * HSL color representation
 */
export interface HSL {
    h: number;
    s: number;
    l: number;
}

/**
 * HSLA color representation
 */
export interface HSLA extends HSL {
    a: number;
}

/**
 * Color utilities
 */
export class ColorUtils {
    private constructor() {}

    // ==================== CONVERSION ====================

    /**
     * Convert hex color to RGB
     * @example
     * ColorUtils.hexToRgb('#ff5733'); // { r: 255, g: 87, b: 51 }
     * ColorUtils.hexToRgb('#f53'); // { r: 255, g: 85, b: 51 }
     */
    static hexToRgb(hex: string): RGB | null {
        // Remove # if present
        let cleanHex = hex.replace(/^#/, "");

        // Handle shorthand (e.g., #f53 -> #ff5533)
        if (cleanHex.length === 3) {
            cleanHex = cleanHex
                .split("")
                .map((c) => c + c)
                .join("");
        }

        // Handle 8-character hex (with alpha)
        if (cleanHex.length === 8) {
            cleanHex = cleanHex.slice(0, 6);
        }

        if (cleanHex.length !== 6) {
            return null;
        }

        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
        if (!result) return null;

        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        };
    }

    /**
     * Convert hex color to RGBA
     * @example
     * ColorUtils.hexToRgba('#ff573380'); // { r: 255, g: 87, b: 51, a: 0.5 }
     */
    static hexToRgba(hex: string): RGBA | null {
        let cleanHex = hex.replace(/^#/, "");

        // Handle shorthand with alpha (e.g., #f538 -> #ff553388)
        if (cleanHex.length === 4) {
            cleanHex = cleanHex
                .split("")
                .map((c) => c + c)
                .join("");
        }

        if (cleanHex.length === 6) {
            const rgb = this.hexToRgb(hex);
            return rgb ? { ...rgb, a: 1 } : null;
        }

        if (cleanHex.length !== 8) {
            return null;
        }

        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
        if (!result) return null;

        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: parseInt(result[4], 16) / 255,
        };
    }

    /**
     * Convert RGB to hex color
     * @example
     * ColorUtils.rgbToHex(255, 87, 51); // '#ff5733'
     * ColorUtils.rgbToHex({ r: 255, g: 87, b: 51 }); // '#ff5733'
     */
    static rgbToHex(rOrRgb: number | RGB, g?: number, b?: number): string {
        let r: number;
        let gVal: number;
        let bVal: number;

        if (typeof rOrRgb === "object") {
            r = rOrRgb.r;
            gVal = rOrRgb.g;
            bVal = rOrRgb.b;
        } else {
            r = rOrRgb;
            gVal = g!;
            bVal = b!;
        }

        const toHex = (n: number) =>
            Math.round(Math.max(0, Math.min(255, n)))
                .toString(16)
                .padStart(2, "0");

        return `#${toHex(r)}${toHex(gVal)}${toHex(bVal)}`;
    }

    /**
     * Convert RGBA to hex color with alpha
     * @example
     * ColorUtils.rgbaToHex(255, 87, 51, 0.5); // '#ff573380'
     */
    static rgbaToHex(
        rOrRgba: number | RGBA,
        g?: number,
        b?: number,
        a?: number
    ): string {
        let r: number;
        let gVal: number;
        let bVal: number;
        let aVal: number;

        if (typeof rOrRgba === "object") {
            r = rOrRgba.r;
            gVal = rOrRgba.g;
            bVal = rOrRgba.b;
            aVal = rOrRgba.a;
        } else {
            r = rOrRgba;
            gVal = g!;
            bVal = b!;
            aVal = a ?? 1;
        }

        const toHex = (n: number) =>
            Math.round(Math.max(0, Math.min(255, n)))
                .toString(16)
                .padStart(2, "0");

        const alphaHex = Math.round(aVal * 255)
            .toString(16)
            .padStart(2, "0");

        return `#${toHex(r)}${toHex(gVal)}${toHex(bVal)}${alphaHex}`;
    }

    /**
     * Convert RGB to HSL
     * @example
     * ColorUtils.rgbToHsl(255, 87, 51); // { h: 11, s: 100, l: 60 }
     */
    static rgbToHsl(rOrRgb: number | RGB, g?: number, b?: number): HSL {
        let r: number;
        let gVal: number;
        let bVal: number;

        if (typeof rOrRgb === "object") {
            r = rOrRgb.r;
            gVal = rOrRgb.g;
            bVal = rOrRgb.b;
        } else {
            r = rOrRgb;
            gVal = g!;
            bVal = b!;
        }

        r /= 255;
        gVal /= 255;
        bVal /= 255;

        const max = Math.max(r, gVal, bVal);
        const min = Math.min(r, gVal, bVal);
        const l = (max + min) / 2;
        let h = 0;
        let s = 0;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((gVal - bVal) / d + (gVal < bVal ? 6 : 0)) / 6;
                    break;
                case gVal:
                    h = ((bVal - r) / d + 2) / 6;
                    break;
                case bVal:
                    h = ((r - gVal) / d + 4) / 6;
                    break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    }

    /**
     * Convert HSL to RGB
     * @example
     * ColorUtils.hslToRgb(11, 100, 60); // { r: 255, g: 87, b: 51 }
     */
    static hslToRgb(hOrHsl: number | HSL, s?: number, l?: number): RGB {
        let h: number;
        let sVal: number;
        let lVal: number;

        if (typeof hOrHsl === "object") {
            h = hOrHsl.h;
            sVal = hOrHsl.s;
            lVal = hOrHsl.l;
        } else {
            h = hOrHsl;
            sVal = s!;
            lVal = l!;
        }

        h /= 360;
        sVal /= 100;
        lVal /= 100;

        let r: number;
        let g: number;
        let b: number;

        if (sVal === 0) {
            r = g = b = lVal;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = lVal < 0.5 ? lVal * (1 + sVal) : lVal + sVal - lVal * sVal;
            const p = 2 * lVal - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
        };
    }

    /**
     * Convert hex to HSL
     */
    static hexToHsl(hex: string): HSL | null {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return null;
        return this.rgbToHsl(rgb);
    }

    /**
     * Convert HSL to hex
     */
    static hslToHex(hOrHsl: number | HSL, s?: number, l?: number): string {
        const rgb = this.hslToRgb(hOrHsl, s, l);
        return this.rgbToHex(rgb);
    }

    // ==================== MANIPULATION ====================

    /**
     * Lighten a color by a percentage
     * @example
     * ColorUtils.lighten('#ff5733', 20); // Lighter color
     */
    static lighten(color: string, percent: number): string {
        const hsl = this.hexToHsl(color);
        if (!hsl) return color;

        hsl.l = Math.min(100, hsl.l + percent);
        return this.hslToHex(hsl);
    }

    /**
     * Darken a color by a percentage
     * @example
     * ColorUtils.darken('#ff5733', 20); // Darker color
     */
    static darken(color: string, percent: number): string {
        const hsl = this.hexToHsl(color);
        if (!hsl) return color;

        hsl.l = Math.max(0, hsl.l - percent);
        return this.hslToHex(hsl);
    }

    /**
     * Saturate a color by a percentage
     */
    static saturate(color: string, percent: number): string {
        const hsl = this.hexToHsl(color);
        if (!hsl) return color;

        hsl.s = Math.min(100, hsl.s + percent);
        return this.hslToHex(hsl);
    }

    /**
     * Desaturate a color by a percentage
     */
    static desaturate(color: string, percent: number): string {
        const hsl = this.hexToHsl(color);
        if (!hsl) return color;

        hsl.s = Math.max(0, hsl.s - percent);
        return this.hslToHex(hsl);
    }

    /**
     * Convert color to grayscale
     */
    static grayscale(color: string): string {
        return this.desaturate(color, 100);
    }

    /**
     * Get the complementary color (opposite on color wheel)
     * @example
     * ColorUtils.complement('#ff5733'); // Complementary color
     */
    static complement(color: string): string {
        const hsl = this.hexToHsl(color);
        if (!hsl) return color;

        hsl.h = (hsl.h + 180) % 360;
        return this.hslToHex(hsl);
    }

    /**
     * Invert a color
     * @example
     * ColorUtils.invert('#ff5733'); // '#00a8cc'
     */
    static invert(color: string): string {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;

        return this.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
    }

    /**
     * Mix two colors together
     * @example
     * ColorUtils.mix('#ff0000', '#0000ff', 50); // Purple-ish
     */
    static mix(color1: string, color2: string, weight: number = 50): string {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        if (!rgb1 || !rgb2) return color1;

        const w = weight / 100;
        const r = Math.round(rgb1.r * (1 - w) + rgb2.r * w);
        const g = Math.round(rgb1.g * (1 - w) + rgb2.g * w);
        const b = Math.round(rgb1.b * (1 - w) + rgb2.b * w);

        return this.rgbToHex(r, g, b);
    }

    /**
     * Set the alpha/opacity of a color
     */
    static alpha(color: string, alpha: number): string {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;

        return this.rgbaToHex(rgb.r, rgb.g, rgb.b, alpha);
    }

    /**
     * Adjust hue of a color
     */
    static adjustHue(color: string, degrees: number): string {
        const hsl = this.hexToHsl(color);
        if (!hsl) return color;

        hsl.h = (hsl.h + degrees + 360) % 360;
        return this.hslToHex(hsl);
    }

    // ==================== ACCESSIBILITY ====================

    /**
     * Calculate relative luminance of a color (WCAG definition)
     */
    static luminance(color: string): number {
        const rgb = this.hexToRgb(color);
        if (!rgb) return 0;

        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Calculate contrast ratio between two colors (WCAG)
     * @example
     * ColorUtils.contrast('#000000', '#ffffff'); // 21 (maximum)
     * ColorUtils.contrast('#777777', '#ffffff'); // ~4.48
     */
    static contrast(color1: string, color2: string): number {
        const l1 = this.luminance(color1);
        const l2 = this.luminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Check if color is light (for determining text color)
     * @example
     * ColorUtils.isLight('#ffffff'); // true
     * ColorUtils.isLight('#000000'); // false
     */
    static isLight(color: string): boolean {
        return this.luminance(color) > 0.179;
    }

    /**
     * Check if color is dark
     */
    static isDark(color: string): boolean {
        return !this.isLight(color);
    }

    /**
     * Get best text color (black or white) for a background
     * @example
     * ColorUtils.textColor('#ff5733'); // '#ffffff' (white text on orange)
     * ColorUtils.textColor('#ffffff'); // '#000000' (black text on white)
     */
    static textColor(backgroundColor: string): string {
        return this.isLight(backgroundColor) ? "#000000" : "#ffffff";
    }

    /**
     * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
     */
    static meetsContrastAA(color1: string, color2: string, largeText: boolean = false): boolean {
        const ratio = this.contrast(color1, color2);
        return largeText ? ratio >= 3 : ratio >= 4.5;
    }

    /**
     * Check if contrast meets WCAG AAA standard (7:1 for normal text)
     */
    static meetsContrastAAA(color1: string, color2: string, largeText: boolean = false): boolean {
        const ratio = this.contrast(color1, color2);
        return largeText ? ratio >= 4.5 : ratio >= 7;
    }

    // ==================== GENERATION ====================

    /**
     * Generate a random hex color
     * @example
     * ColorUtils.random(); // '#a3f2b1' (random)
     */
    static random(): string {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return this.rgbToHex(r, g, b);
    }

    /**
     * Generate a random color with specific lightness
     */
    static randomWithLightness(lightness: number): string {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 40) + 60; // 60-100% saturation
        return this.hslToHex(h, s, lightness);
    }

    /**
     * Generate a color palette from a base color
     * @example
     * ColorUtils.palette('#ff5733', 5); // Array of 5 harmonious colors
     */
    static palette(baseColor: string, count: number = 5): string[] {
        const hsl = this.hexToHsl(baseColor);
        if (!hsl) return [baseColor];

        const colors: string[] = [];
        const hueStep = 360 / count;

        for (let i = 0; i < count; i++) {
            const newHue = (hsl.h + i * hueStep) % 360;
            colors.push(this.hslToHex(newHue, hsl.s, hsl.l));
        }

        return colors;
    }

    /**
     * Generate complementary color palette
     */
    static complementaryPalette(baseColor: string): string[] {
        return [baseColor, this.complement(baseColor)];
    }

    /**
     * Generate triadic color palette
     */
    static triadicPalette(baseColor: string): string[] {
        const hsl = this.hexToHsl(baseColor);
        if (!hsl) return [baseColor];

        return [
            baseColor,
            this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
            this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
        ];
    }

    /**
     * Generate analogous color palette
     */
    static analogousPalette(baseColor: string, angle: number = 30): string[] {
        const hsl = this.hexToHsl(baseColor);
        if (!hsl) return [baseColor];

        return [
            this.hslToHex((hsl.h - angle + 360) % 360, hsl.s, hsl.l),
            baseColor,
            this.hslToHex((hsl.h + angle) % 360, hsl.s, hsl.l),
        ];
    }

    /**
     * Generate a gradient of colors between two colors
     * @example
     * ColorUtils.gradient('#ff0000', '#0000ff', 5); // Red to blue in 5 steps
     */
    static gradient(startColor: string, endColor: string, steps: number): string[] {
        const colors: string[] = [];
        for (let i = 0; i < steps; i++) {
            const weight = (i / (steps - 1)) * 100;
            colors.push(this.mix(startColor, endColor, weight));
        }
        return colors;
    }

    /**
     * Generate shades (darker variations) of a color
     */
    static shades(baseColor: string, count: number = 5): string[] {
        const shades: string[] = [];
        const step = 100 / (count + 1);

        for (let i = 1; i <= count; i++) {
            shades.push(this.darken(baseColor, step * i));
        }

        return shades;
    }

    /**
     * Generate tints (lighter variations) of a color
     */
    static tints(baseColor: string, count: number = 5): string[] {
        const tints: string[] = [];
        const step = 100 / (count + 1);

        for (let i = 1; i <= count; i++) {
            tints.push(this.lighten(baseColor, step * i));
        }

        return tints;
    }

    // ==================== PARSING ====================

    /**
     * Parse any color format to hex
     * @example
     * ColorUtils.parse('rgb(255, 87, 51)'); // '#ff5733'
     * ColorUtils.parse('hsl(11, 100%, 60%)'); // '#ff5733'
     * ColorUtils.parse('#ff5733'); // '#ff5733'
     */
    static parse(color: string): string | null {
        color = color.trim().toLowerCase();

        // Already hex
        if (color.startsWith("#")) {
            const rgb = this.hexToRgb(color);
            return rgb ? this.rgbToHex(rgb) : null;
        }

        // RGB/RGBA format
        const rgbMatch = color.match(
            /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/
        );
        if (rgbMatch) {
            return this.rgbToHex(
                parseInt(rgbMatch[1]),
                parseInt(rgbMatch[2]),
                parseInt(rgbMatch[3])
            );
        }

        // HSL/HSLA format
        const hslMatch = color.match(
            /hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)/
        );
        if (hslMatch) {
            return this.hslToHex(
                parseInt(hslMatch[1]),
                parseInt(hslMatch[2]),
                parseInt(hslMatch[3])
            );
        }

        // Named colors (common ones)
        const namedColors: Record<string, string> = {
            white: "#ffffff",
            black: "#000000",
            red: "#ff0000",
            green: "#00ff00",
            blue: "#0000ff",
            yellow: "#ffff00",
            cyan: "#00ffff",
            magenta: "#ff00ff",
            orange: "#ffa500",
            purple: "#800080",
            pink: "#ffc0cb",
            gray: "#808080",
            grey: "#808080",
        };

        return namedColors[color] ?? null;
    }

    /**
     * Format color as CSS rgb() string
     */
    static toCssRgb(color: string): string | null {
        const rgb = this.hexToRgb(color);
        if (!rgb) return null;
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    /**
     * Format color as CSS hsl() string
     */
    static toCssHsl(color: string): string | null {
        const hsl = this.hexToHsl(color);
        if (!hsl) return null;
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    /**
     * Check if a string is a valid hex color
     */
    static isValidHex(color: string): boolean {
        return /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/.test(color);
    }
}
