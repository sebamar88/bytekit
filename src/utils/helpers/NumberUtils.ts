/**
 * Number utilities for formatting, parsing, and mathematical operations
 * Isomorphic utilities for Node.js and browsers
 * @module NumberUtils
 */

/**
 * Options for number formatting
 */
export interface FormatNumberOptions {
    /** Locale for formatting (e.g., 'en-US', 'es-AR') */
    locale?: string;
    /** Minimum fraction digits */
    minimumFractionDigits?: number;
    /** Maximum fraction digits */
    maximumFractionDigits?: number;
    /** Use grouping separators (thousands) */
    useGrouping?: boolean;
}

/**
 * Options for currency formatting
 */
export interface FormatCurrencyOptions extends FormatNumberOptions {
    /** Currency code (e.g., 'USD', 'EUR', 'ARS') */
    currency?: string;
    /** Currency display style */
    currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
}

/**
 * Options for percentage formatting
 */
export interface FormatPercentOptions {
    /** Locale for formatting */
    locale?: string;
    /** Decimal places */
    decimals?: number;
    /** Whether the value is already a percentage (vs decimal like 0.5 = 50%) */
    isPercentage?: boolean;
}

/**
 * Number utilities
 */
export class NumberUtils {
    private constructor() {}

    /**
     * Format a number according to locale
     * @example
     * NumberUtils.format(1234567.89, 'es-AR'); // '1.234.567,89'
     * NumberUtils.format(1234567.89, 'en-US'); // '1,234,567.89'
     */
    static format(
        value: number,
        locale?: string,
        options?: FormatNumberOptions
    ): string {
        const opts: Intl.NumberFormatOptions = {
            minimumFractionDigits: options?.minimumFractionDigits,
            maximumFractionDigits: options?.maximumFractionDigits,
            useGrouping: options?.useGrouping ?? true,
        };
        return new Intl.NumberFormat(locale ?? options?.locale, opts).format(
            value
        );
    }

    /**
     * Format a number as currency
     * @example
     * NumberUtils.currency(99.99, 'USD'); // '$99.99'
     * NumberUtils.currency(1500, 'EUR', 'de-DE'); // '1.500,00 €'
     * NumberUtils.currency(2500.5, 'ARS', 'es-AR'); // '$ 2.500,50'
     */
    static currency(
        value: number,
        currency: string = "USD",
        locale?: string,
        options?: FormatCurrencyOptions
    ): string {
        const opts: Intl.NumberFormatOptions = {
            style: "currency",
            currency,
            currencyDisplay: options?.currencyDisplay ?? "symbol",
            minimumFractionDigits: options?.minimumFractionDigits ?? 2,
            maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        };
        return new Intl.NumberFormat(locale, opts).format(value);
    }

    /**
     * Format a number as percentage
     * @example
     * NumberUtils.percentage(0.456); // '45.6%'
     * NumberUtils.percentage(75, { isPercentage: true }); // '75%'
     * NumberUtils.percentage(0.3333, { decimals: 2 }); // '33.33%'
     */
    static percentage(value: number, options?: FormatPercentOptions): string {
        const decimals = options?.decimals ?? 1;
        const actualValue = options?.isPercentage ? value / 100 : value;
        const opts: Intl.NumberFormatOptions = {
            style: "percent",
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        };
        return new Intl.NumberFormat(options?.locale, opts).format(actualValue);
    }

    /**
     * Convert number to ordinal string
     * @example
     * NumberUtils.ordinal(1); // '1st'
     * NumberUtils.ordinal(2); // '2nd'
     * NumberUtils.ordinal(3); // '3rd'
     * NumberUtils.ordinal(4); // '4th'
     * NumberUtils.ordinal(11); // '11th'
     * NumberUtils.ordinal(21); // '21st'
     */
    static ordinal(value: number, locale: string = "en"): string {
        if (locale.startsWith("es")) {
            return `${value}°`;
        }

        // English ordinals
        const absValue = Math.abs(Math.floor(value));
        const lastTwo = absValue % 100;

        if (lastTwo >= 11 && lastTwo <= 13) {
            return `${value}th`;
        }

        switch (absValue % 10) {
            case 1:
                return `${value}st`;
            case 2:
                return `${value}nd`;
            case 3:
                return `${value}rd`;
            default:
                return `${value}th`;
        }
    }

    /**
     * Clamp a number between min and max values
     * @example
     * NumberUtils.clamp(150, 0, 100); // 100
     * NumberUtils.clamp(-50, 0, 100); // 0
     * NumberUtils.clamp(50, 0, 100); // 50
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Round a number to specified decimal places
     * @example
     * NumberUtils.round(3.14159, 2); // 3.14
     * NumberUtils.round(3.14159, 4); // 3.1416
     * NumberUtils.round(1234.5, -2); // 1200 (round to hundreds)
     */
    static round(value: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * Floor a number to specified decimal places
     * @example
     * NumberUtils.floor(3.999, 2); // 3.99
     */
    static floor(value: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.floor(value * factor) / factor;
    }

    /**
     * Ceil a number to specified decimal places
     * @example
     * NumberUtils.ceil(3.001, 2); // 3.01
     */
    static ceil(value: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.ceil(value * factor) / factor;
    }

    /**
     * Generate an array of numbers from start to end (inclusive)
     * @example
     * NumberUtils.range(1, 5); // [1, 2, 3, 4, 5]
     * NumberUtils.range(0, 10, 2); // [0, 2, 4, 6, 8, 10]
     * NumberUtils.range(5, 1); // [5, 4, 3, 2, 1]
     */
    static range(start: number, end: number, step: number = 1): number[] {
        const result: number[] = [];
        const actualStep = start <= end ? Math.abs(step) : -Math.abs(step);

        if (actualStep === 0) {
            throw new Error("Step cannot be zero");
        }

        if (start <= end) {
            for (let i = start; i <= end; i += actualStep) {
                result.push(i);
            }
        } else {
            for (let i = start; i >= end; i += actualStep) {
                result.push(i);
            }
        }

        return result;
    }

    /**
     * Generate a random integer between min and max (inclusive)
     * @example
     * NumberUtils.random(1, 100); // Random number between 1 and 100
     */
    static random(min: number, max: number): number {
        const range = max - min + 1;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return min + (array[0] % range);
    }

    /**
     * Generate a random float between min and max
     * @example
     * NumberUtils.randomFloat(0, 1); // Random float between 0 and 1
     */
    static randomFloat(min: number, max: number, decimals: number = 2): number {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const random = array[0] / (0xffffffff + 1); // Normalize to 0-1
        const value = random * (max - min) + min;
        return this.round(value, decimals);
    }

    /**
     * Check if a number is even
     */
    static isEven(value: number): boolean {
        return value % 2 === 0;
    }

    /**
     * Check if a number is odd
     */
    static isOdd(value: number): boolean {
        return value % 2 !== 0;
    }

    /**
     * Check if a number is an integer
     */
    static isInteger(value: number): boolean {
        return Number.isInteger(value);
    }

    /**
     * Check if a number is a float (has decimal places)
     */
    static isFloat(value: number): boolean {
        return Number.isFinite(value) && !Number.isInteger(value);
    }

    /**
     * Check if a number is positive
     */
    static isPositive(value: number): boolean {
        return value > 0;
    }

    /**
     * Check if a number is negative
     */
    static isNegative(value: number): boolean {
        return value < 0;
    }

    /**
     * Check if a number is between min and max (inclusive)
     * @example
     * NumberUtils.isBetween(5, 1, 10); // true
     * NumberUtils.isBetween(0, 1, 10); // false
     */
    static isBetween(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    /**
     * Convert number to words (English)
     * @example
     * NumberUtils.toWords(123); // 'one hundred twenty-three'
     * NumberUtils.toWords(1000); // 'one thousand'
     */
    static toWords(value: number, locale: string = "en"): string {
        if (value === 0) return locale === "es" ? "cero" : "zero";

        if (locale === "es") {
            return this.toWordsSpanish(value);
        }

        return this.toWordsEnglish(value);
    }

    private static toWordsEnglish(value: number): string {
        const ones = [
            "",
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten",
            "eleven",
            "twelve",
            "thirteen",
            "fourteen",
            "fifteen",
            "sixteen",
            "seventeen",
            "eighteen",
            "nineteen",
        ];
        const tens = [
            "",
            "",
            "twenty",
            "thirty",
            "forty",
            "fifty",
            "sixty",
            "seventy",
            "eighty",
            "ninety",
        ];

        const convert = (n: number): string => {
            if (n === 0) return "";
            if (n < 20) return ones[n];
            if (n < 100) {
                const remainder = n % 10;
                return (
                    tens[Math.floor(n / 10)] +
                    (remainder ? "-" + ones[remainder] : "")
                );
            }
            if (n < 1000) {
                const remainder = n % 100;
                return (
                    ones[Math.floor(n / 100)] +
                    " hundred" +
                    (remainder ? " " + convert(remainder) : "")
                );
            }
            if (n < 1000000) {
                const remainder = n % 1000;
                return (
                    convert(Math.floor(n / 1000)) +
                    " thousand" +
                    (remainder ? " " + convert(remainder) : "")
                );
            }
            if (n < 1000000000) {
                const remainder = n % 1000000;
                return (
                    convert(Math.floor(n / 1000000)) +
                    " million" +
                    (remainder ? " " + convert(remainder) : "")
                );
            }
            const remainder = n % 1000000000;
            return (
                convert(Math.floor(n / 1000000000)) +
                " billion" +
                (remainder ? " " + convert(remainder) : "")
            );
        };

        const isNegative = value < 0;
        const result = convert(Math.abs(Math.floor(value)));
        return isNegative ? "negative " + result : result;
    }

    private static toWordsSpanish(value: number): string {
        const ones = [
            "",
            "uno",
            "dos",
            "tres",
            "cuatro",
            "cinco",
            "seis",
            "siete",
            "ocho",
            "nueve",
            "diez",
            "once",
            "doce",
            "trece",
            "catorce",
            "quince",
            "dieciséis",
            "diecisiete",
            "dieciocho",
            "diecinueve",
            "veinte",
            "veintiuno",
            "veintidós",
            "veintitrés",
            "veinticuatro",
            "veinticinco",
            "veintiséis",
            "veintisiete",
            "veintiocho",
            "veintinueve",
        ];
        const tens = [
            "",
            "",
            "",
            "treinta",
            "cuarenta",
            "cincuenta",
            "sesenta",
            "setenta",
            "ochenta",
            "noventa",
        ];

        /**
         * Helper to convert hundreds
         */
        const convertHundreds = (n: number): string => {
            const remainder = n % 100;
            const hundreds = Math.floor(n / 100);
            const hundredNames: Record<number, string> = {
                1: "ciento",
                5: "quinientos",
                7: "setecientos",
                9: "novecientos",
            };
            const prefix = hundredNames[hundreds] || ones[hundreds] + "cientos";
            return prefix + (remainder ? " " + convert(remainder) : "");
        };

        /**
         * Helper to convert thousands
         */
        const convertThousands = (n: number): string => {
            const remainder = n % 1000;
            const thousands = Math.floor(n / 1000);
            const prefix =
                thousands === 1 ? "mil" : convert(thousands) + " mil";
            return prefix + (remainder ? " " + convert(remainder) : "");
        };

        /**
         * Helper to convert millions
         */
        const convertMillions = (n: number): string => {
            const remainder = n % 1000000;
            const millions = Math.floor(n / 1000000);
            const prefix =
                millions === 1 ? "un millón" : convert(millions) + " millones";
            return prefix + (remainder ? " " + convert(remainder) : "");
        };

        const convert = (n: number): string => {
            if (n === 0) return "";
            if (n < 30) return ones[n];
            if (n < 100) {
                const remainder = n % 10;
                return (
                    tens[Math.floor(n / 10)] +
                    (remainder ? " y " + ones[remainder] : "")
                );
            }
            if (n === 100) return "cien";
            if (n < 1000) return convertHundreds(n);
            if (n < 1000000) return convertThousands(n);
            return convertMillions(n);
        };

        const isNegative = value < 0;
        const result = convert(Math.abs(Math.floor(value)));
        return isNegative ? "menos " + result : result;
    }

    /**
     * Format bytes to human readable string
     * @example
     * NumberUtils.formatBytes(1536); // '1.5 KB'
     * NumberUtils.formatBytes(1048576); // '1 MB'
     */
    static formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return (
            Number.parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) +
            " " +
            sizes[i]
        );
    }

    /**
     * Parse a formatted number string back to number
     * @example
     * NumberUtils.parse('1,234.56'); // 1234.56
     * NumberUtils.parse('1.234,56', 'es'); // 1234.56
     */
    static parse(value: string, locale: string = "en"): number {
        // Determine decimal and thousand separators based on locale
        const parts = new Intl.NumberFormat(locale).formatToParts(1000000.1);
        const decimalSep =
            parts.find((p) => p.type === "decimal")?.value ?? ".";
        const groupSep = parts.find((p) => p.type === "group")?.value ?? ",";

        let normalized = value;
        // Remove thousand separators
        if (groupSep) {
            normalized = normalized.split(groupSep).join("");
        }
        // Normalize decimal separator
        if (decimalSep && decimalSep !== ".") {
            normalized = normalized.split(decimalSep).join(".");
        }

        // Remove currency symbols and other non-numeric characters (except - and .)
        normalized = normalized.replaceAll(/[^\d.-]/g, "");

        return Number.parseFloat(normalized);
    }

    /**
     * Add padding zeros to a number
     * @example
     * NumberUtils.pad(5, 3); // '005'
     * NumberUtils.pad(42, 5); // '00042'
     */
    static pad(value: number, length: number): string {
        return String(Math.abs(value)).padStart(length, "0");
    }

    /**
     * Calculate the sum of numbers
     */
    static sum(values: number[]): number {
        return values.reduce((acc, val) => acc + val, 0);
    }

    /**
     * Calculate the average (mean) of numbers
     */
    static average(values: number[]): number {
        if (values.length === 0) return 0;
        return this.sum(values) / values.length;
    }

    /**
     * Alias for average
     */
    static mean(values: number[]): number {
        return this.average(values);
    }

    /**
     * Calculate the median of numbers
     */
    static median(values: number[]): number {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    /**
     * Calculate the mode (most frequent value) of numbers
     */
    static mode(values: number[]): number | null {
        if (values.length === 0) return null;

        const frequency = new Map<number, number>();
        let maxFreq = 0;
        let mode: number | null = null;

        for (const val of values) {
            const count = (frequency.get(val) ?? 0) + 1;
            frequency.set(val, count);
            if (count > maxFreq) {
                maxFreq = count;
                mode = val;
            }
        }

        return mode;
    }

    /**
     * Calculate the minimum value
     */
    static min(values: number[]): number | null {
        if (values.length === 0) return null;
        return Math.min(...values);
    }

    /**
     * Calculate the maximum value
     */
    static max(values: number[]): number | null {
        if (values.length === 0) return null;
        return Math.max(...values);
    }

    /**
     * Calculate the standard deviation
     */
    static standardDeviation(
        values: number[],
        population: boolean = true
    ): number {
        if (values.length === 0) return 0;
        const avg = this.average(values);
        const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
        const avgSquareDiff =
            this.sum(squareDiffs) /
            (population ? values.length : values.length - 1);
        return Math.sqrt(avgSquareDiff);
    }

    /**
     * Calculate variance
     */
    static variance(values: number[], population: boolean = true): number {
        if (values.length === 0) return 0;
        const avg = this.average(values);
        const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
        return (
            this.sum(squareDiffs) /
            (population ? values.length : values.length - 1)
        );
    }

    /**
     * Calculate percentile
     * @example
     * NumberUtils.percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90); // 9.1
     */
    static percentile(values: number[], p: number): number {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sorted[lower];
        return (
            sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
        );
    }
}
