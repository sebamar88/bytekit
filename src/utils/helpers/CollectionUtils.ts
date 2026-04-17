export function chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) throw new RangeError("size must be > 0");
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of arr) {
        const k = String(item[key]);
        (result[k] ??= []).push(item);
    }
    return result;
}

export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
    const seen = new Set<unknown>();
    return arr.filter((item) => {
        const k = item[key];
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

export function flatten<T>(arr: unknown[], depth = 1): T[] {
    return arr.flat(depth) as T[];
}

export function zip<A, B>(a: A[], b: B[]): [A, B][] {
    const len = Math.min(a.length, b.length);
    const result: [A, B][] = [];
    for (let i = 0; i < len; i++) {
        result.push([a[i], b[i]]);
    }
    return result;
}
