export interface QueryStringOptions {
    arrayFormat?: "repeat" | "bracket" | "comma";
    skipNull?: boolean;
    skipEmptyString?: boolean;
    encode?: boolean;
    sortKeys?: boolean;
}

type InterpolableValue = string | number | boolean | null | undefined;

const safeString = (value: InterpolableValue) =>
    value === null || value === undefined ? "" : String(value);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

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

export class QueryStringHelper {
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
        const opts: SlugifyOptions = typeof options === "string" ? { separator: options } : options;
        const { separator = "-", lowercase = true } = opts;
        
        let rawString = "";

        if (typeof params === "string") {
            rawString = params;
        } else {
            const queryOptions = { ...DEFAULT_QUERY_OPTIONS };
            const pairs: QueryPair[] = [];
            const entries = Object.entries(params);
            if (queryOptions.sortKeys) entries.sort(([a], [b]) => a.localeCompare(b));

            for (const [key, value] of entries) {
                // We use the same deep flattening logic as stringify but we skip encoding
                buildQueryPairs(key, value, { ...queryOptions, encode: false }, pairs);
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

        return base
            .replace(NON_ALPHANUMERIC_REGEX, separator)
            .replace(new RegExp(`${escapedSeparator}+`, "g"), separator)
            .replace(
                new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"),
                ""
            );
    }
}
