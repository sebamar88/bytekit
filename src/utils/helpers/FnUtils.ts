export interface MemoizeOptions {
    ttl?: number;
}

interface CacheEntry<V> {
    value: V;
    expiresAt?: number;
}

export function memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    options?: MemoizeOptions,
): T {
    const primitiveCache = new Map<string, CacheEntry<ReturnType<T>>>();
    const objectCache = new WeakMap<object, CacheEntry<ReturnType<T>>>();
    const ttl = options?.ttl;

    return function (...args: Parameters<T>): ReturnType<T> {
        const now = ttl !== undefined ? Date.now() : 0;

        if (args.length === 1 && args[0] !== null && typeof args[0] === "object") {
            const key = args[0] as object;
            const cached = objectCache.get(key);
            if (cached && (ttl === undefined || now < cached.expiresAt!)) {
                return cached.value;
            }
            const value = fn(...args) as ReturnType<T>;
            objectCache.set(key, ttl !== undefined ? { value, expiresAt: now + ttl } : { value });
            return value;
        }

        const cacheKey = JSON.stringify(args);
        const cached = primitiveCache.get(cacheKey);
        if (cached && (ttl === undefined || now < cached.expiresAt!)) {
            return cached.value;
        }
        const value = fn(...args) as ReturnType<T>;
        primitiveCache.set(cacheKey, ttl !== undefined ? { value, expiresAt: now + ttl } : { value });
        return value;
    } as T;
}

export function once<T extends (...args: unknown[]) => unknown>(fn: T): T {
    let called = false;
    let result: ReturnType<T>;
    return function (...args: Parameters<T>): ReturnType<T> {
        if (!called) {
            called = true;
            result = fn(...args) as ReturnType<T>;
        }
        return result;
    } as T;
}

export function partial<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ...partialArgs: Partial<Parameters<T>>
): (...remainingArgs: unknown[]) => ReturnType<T> {
    return function (...remainingArgs: unknown[]): ReturnType<T> {
        return fn(...(partialArgs as unknown[]), ...remainingArgs) as ReturnType<T>;
    };
}

export function noop(): void {}

export function identity<T>(x: T): T {
    return x;
}
