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
}