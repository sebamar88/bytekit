/**
 * Helper to generate URL-friendly strings (slugs)
 */

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/gi;

export interface SlugifyOptions {
    /** The character to use between words. Default: "-" */
    separator?: string;
    /** Whether to convert the string to lowercase. Default: true */
    lowercase?: boolean;
}

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const removeDiacritics = (value: string) =>
    value.normalize("NFD").replace(DIACRITICS_REGEX, "");

export class UrlSlugHelper {
    /**
     * Converts a string into a URL-friendly slug.
     * Examples:
     * - "Mejores celulares para 2026" -> "mejores-celulares-para-2026"
     * - "Café & Té" -> "cafe-te"
     */
    static generate(
        value: string | null | undefined,
        { separator = "-", lowercase = true }: SlugifyOptions = {}
    ): string {
        if (!value) return "";

        const normalized = removeDiacritics(String(value));
        const base = lowercase ? normalized.toLowerCase() : normalized;
        const escapedSeparator = escapeRegExp(separator);

        return base
            .replace(NON_ALPHANUMERIC_REGEX, separator)
            .replace(new RegExp(`${escapedSeparator}+`, "g"), separator)
            .replace(
                new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"),
                ""
            );
    }
}
