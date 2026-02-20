/**
 * Object manipulation utilities for everyday development tasks
 */

export class ObjectUtils {
    /**
     * Check if value is empty (null, undefined, empty string, empty array, empty object)
     */
    static isEmpty(value: unknown): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === "string") return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (value instanceof Map || value instanceof Set)
            return value.size === 0;
        if (typeof value === "object") {
            return Object.keys(value as Record<string, unknown>).length === 0;
        }
        return false;
    }

    /**
     * Check if value is NOT empty
     */
    static isNotEmpty(value: unknown): boolean {
        return !this.isEmpty(value);
    }

    /**
     * Deep clone an object
     */
    static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj.getTime()) as T;
        if (obj instanceof Array) {
            return obj.map((item) => this.deepClone(item)) as T;
        }
        if (obj instanceof Object) {
            const cloned = {} as T;
            for (const key in obj) {
                if (Object.hasOwn(obj, key)) {
                    (cloned as Record<string, unknown>)[key] = this.deepClone(
                        obj[key as keyof T]
                    );
                }
            }
            return cloned;
        }
        return obj;
    }

    /**
     * Shallow merge objects (right overwrites left)
     */
    static merge<T extends Record<string, unknown>>(
        ...objects: Partial<T>[]
    ): T {
        return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {}) as T;
    }

    /**
     * Deep merge objects (recursive)
     */
    static deepMerge(
        ...objects: Array<Record<string, unknown>>
    ): Record<string, unknown> {
        return objects.reduce(
            (acc, obj) => {
                for (const key in obj) {
                    if (Object.hasOwn(obj, key)) {
                        const accValue = (acc as Record<string, unknown>)[key];
                        const objValue = obj[key];

                        if (
                            typeof accValue === "object" &&
                            accValue !== null &&
                            !Array.isArray(accValue) &&
                            typeof objValue === "object" &&
                            objValue !== null &&
                            !Array.isArray(objValue)
                        ) {
                            (acc as Record<string, unknown>)[key] =
                                this.deepMerge(
                                    accValue as Record<string, unknown>,
                                    objValue as Record<string, unknown>
                                );
                        } else {
                            (acc as Record<string, unknown>)[key] = objValue;
                        }
                    }
                }
                return acc;
            },
            {} as Record<string, unknown>
        );
    }

    /**
     * Pick specific keys from object
     */
    static pick<T extends Record<string, unknown>, K extends keyof T>(
        obj: T,
        keys: K[]
    ): Partial<T> {
        const result: Partial<T> = {};
        for (const key of keys) {
            if (key in obj) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    /**
     * Omit specific keys from object
     */
    static omit<T extends Record<string, unknown>, K extends keyof T>(
        obj: T,
        keys: K[]
    ): Partial<T> {
        const result: Partial<T> = { ...obj };
        for (const key of keys) {
            delete result[key];
        }
        return result;
    }

    /**
     * Get nested value using dot notation
     */
    static get<T = unknown>(
        obj: Record<string, unknown>,
        path: string,
        defaultValue?: T
    ): T {
        const keys = path.split(".");
        let value: unknown = obj;

        for (const key of keys) {
            if (value && typeof value === "object" && key in value) {
                value = (value as Record<string, unknown>)[key];
            } else {
                return defaultValue as T;
            }
        }

        return value as T;
    }

    /**
     * Set nested value using dot notation
     */
    static set(
        obj: Record<string, unknown>,
        path: string,
        value: unknown
    ): Record<string, unknown> {
        const keys = path.split(".");
        let current: Record<string, unknown> = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== "object") {
                current[key] = {};
            }
            current = current[key] as Record<string, unknown>;
        }

        current[keys.at(-1)!] = value;
        return obj;
    }

    /**
     * Flatten nested object
     */
    static flatten(
        obj: Record<string, unknown>,
        prefix = ""
    ): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}.${key}` : key;

                if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value) &&
                    !(value instanceof Date)
                ) {
                    Object.assign(
                        result,
                        this.flatten(value as Record<string, unknown>, newKey)
                    );
                } else {
                    result[newKey] = value;
                }
            }
        }

        return result;
    }

    /**
     * Unflatten object (reverse of flatten)
     */
    static unflatten(obj: Record<string, unknown>): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                this.set(result, key, obj[key]);
            }
        }

        return result;
    }

    /**
     * Filter object by predicate
     */
    static filter<T extends Record<string, unknown>>(
        obj: T,
        predicate: (key: string, value: unknown) => boolean
    ): Partial<T> {
        const result: Partial<T> = {};

        for (const key in obj) {
            if (Object.hasOwn(obj, key) && predicate(key, obj[key])) {
                result[key as keyof T] = obj[key];
            }
        }

        return result;
    }

    /**
     * Map object values
     */
    static mapValues<T extends Record<string, unknown>, R>(
        obj: T,
        mapper: (value: unknown, key: string) => R
    ): Record<string, R> {
        const result: Record<string, R> = {};

        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                result[key] = mapper(obj[key], key);
            }
        }

        return result;
    }

    /**
     * Check if object has all keys
     */
    static hasKeys<T extends Record<string, unknown>>(
        obj: T,
        keys: (keyof T)[]
    ): boolean {
        return keys.every((key) => key in obj);
    }

    /**
     * Check if object has any of the keys
     */
    static hasAnyKey<T extends Record<string, unknown>>(
        obj: T,
        keys: (keyof T)[]
    ): boolean {
        return keys.some((key) => key in obj);
    }

    /**
     * Invert object keys and values
     */
    static invert<T extends Record<string, string | number>>(
        obj: T
    ): Record<string | number, string> {
        const result: Record<string | number, string> = {};

        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                result[obj[key]] = key;
            }
        }

        return result;
    }

    /**
     * Group array of objects by key
     */
    static groupBy<T extends Record<string, unknown>>(
        arr: T[],
        key: keyof T
    ): Record<string, T[]> {
        return arr.reduce(
            (acc, item) => {
                const groupKey = String(item[key]);
                if (!acc[groupKey]) {
                    acc[groupKey] = [];
                }
                acc[groupKey].push(item);
                return acc;
            },
            {} as Record<string, T[]>
        );
    }

    /**
     * Index array of objects by key
     */
    static indexBy<T extends Record<string, unknown>>(
        arr: T[],
        key: keyof T
    ): Record<string, T> {
        return arr.reduce(
            (acc, item) => {
                acc[String(item[key])] = item;
                return acc;
            },
            {} as Record<string, T>
        );
    }

    /**
     * Check if two objects are deeply equal
     */
    static deepEqual(a: unknown, b: unknown): boolean {
        if (a === b) return true;
        if (a === null || b === null) return a === b;
        if (typeof a !== "object" || typeof b !== "object") return false;

        const aKeys = Object.keys(a as Record<string, unknown>);
        const bKeys = Object.keys(b as Record<string, unknown>);

        if (aKeys.length !== bKeys.length) return false;

        for (const key of aKeys) {
            if (!bKeys.includes(key)) return false;
            if (
                !this.deepEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key]
                )
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get object size (number of keys)
     */
    static size(obj: Record<string, unknown> | null | undefined): number {
        if (!obj) return 0;
        return Object.keys(obj).length;
    }

    /**
     * Convert object to array of [key, value] pairs
     */
    static entries<T extends Record<string, unknown>>(
        obj: T | null | undefined
    ): Array<[string, unknown]> {
        if (!obj) return [];
        return Object.entries(obj);
    }

    /**
     * Convert array of [key, value] pairs to object
     */
    static fromEntries(
        entries: Array<[string, unknown]>
    ): Record<string, unknown> {
        return Object.fromEntries(entries);
    }

    /**
     * Assign properties from source to target (like Object.assign)
     */
    static assign<T extends Record<string, unknown>>(
        target: T,
        ...sources: Partial<T>[]
    ): T {
        return Object.assign(target, ...sources);
    }

    /**
     * Create object from keys with same value
     */
    static fromKeys<T extends string | number>(
        keys: T[],
        value: unknown
    ): Record<T, unknown> {
        return keys.reduce(
            (acc, key) => {
                acc[key] = value;
                return acc;
            },
            {} as Record<T, unknown>
        );
    }
}
