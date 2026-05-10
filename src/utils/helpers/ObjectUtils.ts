type Picked<T, K extends keyof T> = { [P in K]: T[P] };
type Omitted<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };

export function pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Picked<T, K> {
    const result = {} as Picked<T, K>;
    for (const k of keys) {
        if (k in obj) result[k] = obj[k];
    }
    return result;
}

export function omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Omitted<T, K> {
    const excluded = new Set<PropertyKey>(keys);
    const result = {} as Omitted<T, K>;
    for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k) && !excluded.has(k)) {
            (result as Record<string, unknown>)[k] = obj[k];
        }
    }
    return result;
}

export type DeepMergeStrategy = "replace" | "concat";

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepMerge<T extends object>(
    target: T,
    source: Partial<T>,
    strategy: DeepMergeStrategy = "replace"
): T {
    const result = Object.assign({}, target) as Record<string, unknown>;
    for (const key of Object.keys(source) as (keyof T)[]) {
        const src = source[key];
        const tgt = result[key as string];
        if (Array.isArray(src) && Array.isArray(tgt) && strategy === "concat") {
            result[key as string] = [...tgt, ...src];
        } else if (isPlainObject(src) && isPlainObject(tgt)) {
            result[key as string] = deepMerge(
                tgt,
                src as Partial<typeof tgt>,
                strategy
            );
        } else if (src !== undefined) {
            result[key as string] = src;
        }
    }
    return result as T;
}

export function flattenObject(
    obj: Record<string, unknown>,
    delimiter = ".",
    prefix = "",
    depth = 0
): Record<string, unknown> {
    if (depth > 100) throw new RangeError("flattenObject: max depth exceeded");
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}${delimiter}${key}` : key;
        if (isPlainObject(value)) {
            const nested = flattenObject(value, delimiter, fullKey, depth + 1);
            Object.assign(result, nested);
        } else {
            result[fullKey] = value;
        }
    }
    return result;
}

export function deepClone<T>(obj: T, seen = new WeakMap<object, unknown>()): T {
    if (obj === null || typeof obj !== "object") return obj;
    if (seen.has(obj as object)) return seen.get(obj as object) as T;
    if (Array.isArray(obj)) {
        const arr: unknown[] = [];
        seen.set(obj as object, arr);
        for (let i = 0; i < obj.length; i++)
            arr.push(deepClone(obj[i] as unknown, seen));
        return arr as unknown as T;
    }
    const clone: Record<string, unknown> = {};
    seen.set(obj as object, clone);
    for (const key of Object.keys(obj as object)) {
        clone[key] = deepClone((obj as Record<string, unknown>)[key], seen);
    }
    return clone as T;
}
