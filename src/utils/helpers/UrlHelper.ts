/** Options for {@link UrlHelper.stringify}. */
export interface QueryStringOptions {
    /**
     * How arrays are serialised in the query string.
     * - `"repeat"` (default): `a=1&a=2`
     * - `"bracket"`: `a[]=1&a[]=2`
     * - `"comma"`: `a=1,2`
     */
    arrayFormat?: "repeat" | "bracket" | "comma";
    /** When `true`, keys whose value is `null` are omitted. Defaults to `true`. */
    skipNull?: boolean;
    /** When `true`, keys with an empty-string value are omitted. Defaults to `false`. */
    skipEmptyString?: boolean;
    /** When `true`, keys and values are percent-encoded. Defaults to `true`. */
    encode?: boolean;
    /** When `true`, query parameters are sorted alphabetically by key. Defaults to `true`. */
    sortKeys?: boolean;
}

type InterpolableValue = string | number | boolean | null | undefined;

/* v8 ignore start */
const safeString = (value: InterpolableValue) =>
    value === null || value === undefined ? "" : String(value);
/* v8 ignore end */

/* v8 ignore start */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
/* v8 ignore end */

const serializeValue = (value: unknown) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "boolean") return value ? "true" : "false";
    if (
        typeof value === "number" ||
        typeof value === "bigint" ||
        typeof value === "string"
    )
        return String(value);
    return safeString(value as InterpolableValue);
};

const DEFAULT_QUERY_OPTIONS: Required<QueryStringOptions> = {
    arrayFormat: "repeat",
    skipNull: true,
    skipEmptyString: false,
    encode: true,
    sortKeys: true,
};

type QueryPair = [string, string];

const encodePair = (value: string, encode: boolean) =>
    encode ? encodeURIComponent(value) : value;

const buildQueryPairs = (
    key: string,
    value: unknown,
    options: Required<QueryStringOptions>,
    pairs: QueryPair[]
) => {
    if (value === undefined) return;
    if (value === null) {
        if (!options.skipNull) pairs.push([key, ""]);
        return;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return;

        if (options.arrayFormat === "comma") {
            const serialized = value
                .map((entry) => serializeValue(entry))
                .filter((entry) => !(options.skipEmptyString && entry === ""))
                .join(",");
            if (serialized || !options.skipEmptyString)
                pairs.push([key, serialized]);
            return;
        }

        for (const item of value) {
            const nextKey =
                options.arrayFormat === "bracket" ? `${key}[]` : key;
            buildQueryPairs(nextKey, item, options, pairs);
        }
        return;
    }

    if (isPlainObject(value)) {
        const entries = Object.entries(value);
        /* v8 ignore next */
        if (options.sortKeys) entries.sort(([a], [b]) => a.localeCompare(b));
        for (const [childKey, childValue] of entries) {
            const nextKey = key ? `${key}[${childKey}]` : childKey;
            buildQueryPairs(nextKey, childValue, options, pairs);
        }
        return;
    }

    const serialized = serializeValue(value);
    if (options.skipEmptyString && serialized === "") return;
    pairs.push([key, serialized]);
};

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

/** Cached RegExp pairs keyed by escapedSeparator to avoid re-creating on every call. */
const slugRegExpCache = new Map<string, [RegExp, RegExp]>();

const getSlugRegExps = (escapedSeparator: string): [RegExp, RegExp] => {
    let regexps = slugRegExpCache.get(escapedSeparator);
    if (!regexps) {
        regexps = [
            new RegExp(`${escapedSeparator}+`, "g"),
            new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"),
        ];
        slugRegExpCache.set(escapedSeparator, regexps);
    }
    return regexps;
};

export class UrlHelper {
    /**
     * Serialises a plain object into a URL query string.
     *
     * Supports nested objects, arrays, `Date` values, and booleans. Returns
     * an empty string when `params` is `null` or `undefined`.
     *
     * @param params - Object whose own enumerable properties are serialised.
     * @param customOptions - Optional overrides for serialisation behaviour.
     * @returns A percent-encoded query string without a leading `?`.
     *
     * @example
     * ```typescript
     * UrlHelper.stringify({ page: 1, tags: ['a', 'b'] });
     * // "page=1&tags=a&tags=b"
     *
     * UrlHelper.stringify({ ids: [1, 2] }, { arrayFormat: 'bracket' });
     * // "ids%5B%5D=1&ids%5B%5D=2"
     * ```
     */
    static stringify(
        params: Record<string, unknown> | null | undefined,
        customOptions: QueryStringOptions = {}
    ): string {
        if (!params) return "";
        const options = { ...DEFAULT_QUERY_OPTIONS, ...customOptions };
        const pairs: QueryPair[] = [];
        const entries = Object.entries(params);
        if (options.sortKeys) entries.sort(([a], [b]) => a.localeCompare(b));

        for (const [key, value] of entries) {
            buildQueryPairs(key, value, options, pairs);
        }

        return pairs
            .map(([key, value]) => {
                const encodedKey = encodePair(key, options.encode);
                const encodedValue = encodePair(value, options.encode);
                return `${encodedKey}=${encodedValue}`;
            })
            .join("&");
    }

    /**
     * Converts an object representation or a raw string into an SEO friendly slug URL string.
     * Example: { category: "Smart Phones", brand: "Apple" } -> "category-smart-phones-brand-apple"
     * Example: "Pantalon jean negro" -> "pantalon-jean-negro"
     */
    static slugify(
        params: Record<string, unknown> | string | null | undefined,
        options: string | SlugifyOptions = {}
    ): string {
        if (!params) return "";

        // Mantener compatibilidad con el parámetro 'separator' como string si se envía así
        const opts: SlugifyOptions =
            typeof options === "string" ? { separator: options } : options;
        const { separator = "-", lowercase = true } = opts;

        let rawString: string;

        if (typeof params === "string") {
            rawString = params;
        } else {
            const queryOptions = { ...DEFAULT_QUERY_OPTIONS };
            const pairs: QueryPair[] = [];
            const entries = Object.entries(params);
            /* v8 ignore next */
            if (queryOptions.sortKeys)
                entries.sort(([a], [b]) => a.localeCompare(b));

            for (const [key, value] of entries) {
                // We use the same deep flattening logic as stringify but we skip encoding
                buildQueryPairs(
                    key,
                    value,
                    { ...queryOptions, encode: false },
                    pairs
                );
            }

            // Combine keys and values
            rawString = pairs
                .filter(([, value]) => value !== "")
                .map(([key, value]) => `${key} ${value}`)
                .join(" ");
        }

        const normalized = removeDiacritics(rawString);
        const base = lowercase ? normalized.toLowerCase() : normalized;
        const escapedSeparator = escapeRegExp(separator);
        const [collapseSepRe, trimSepRe] = getSlugRegExps(escapedSeparator);

        return base
            .replace(NON_ALPHANUMERIC_REGEX, separator)
            .replace(collapseSepRe, separator)
            .replace(trimSepRe, "");
    }
}
