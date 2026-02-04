/**
 * Array manipulation utilities for everyday development tasks
 */

export class ArrayUtils {
    /**
     * Split array into chunks of specified size
     */
    static chunk<T>(arr: T[], size: number): T[][] {
        if (size <= 0) throw new Error("Chunk size must be greater than 0");
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Flatten nested arrays
     */
    static flatten<T>(arr: Array<T | T[]>, depth = 1): T[] {
        if (depth <= 0) {
            return arr.filter((item) => !Array.isArray(item)) as T[];
        }
        const result: T[] = [];
        for (const item of arr) {
            if (Array.isArray(item)) {
                result.push(...this.flatten(item as T[], depth - 1));
            } else {
                result.push(item as T);
            }
        }
        return result;
    }

    /**
     * Get unique values from array
     */
    static unique<T>(arr: T[], by?: (item: T) => unknown): T[] {
        if (!by) {
            return Array.from(new Set(arr));
        }

        const seen = new Set<unknown>();
        return arr.filter((item) => {
            const key = by(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Remove duplicates and return unique array
     */
    static deduplicate<T>(arr: T[]): T[] {
        return this.unique(arr);
    }

    /**
     * Compact array (remove falsy values)
     */
    static compact<T>(arr: Array<T | null | undefined | false | 0 | "">): T[] {
        return arr.filter(Boolean) as T[];
    }

    /**
     * Flatten one level deep
     */
    static flat<T>(arr: Array<T | T[]>): T[] {
        return this.flatten(arr, 1);
    }

    /**
     * Get first element
     */
    static first<T>(arr: T[]): T | undefined {
        return arr[0];
    }

    /**
     * Get last element
     */
    static last<T>(arr: T[]): T | undefined {
        return arr.at(-1);
    }

    /**
     * Get element at index (supports negative indices)
     */
    static at<T>(arr: T[], index: number): T | undefined {
        if (index < 0) {
            return arr[arr.length + index];
        }
        return arr[index];
    }

    /**
     * Shuffle array (Fisher-Yates)
     */
    static shuffle<T>(arr: T[]): T[] {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            const j = array[0] % (i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Get random element
     */
    static random<T>(arr: T[]): T | undefined {
        if (arr.length === 0) return undefined;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const index = array[0] % arr.length;
        return arr[index];
    }

    /**
     * Get N random elements
     */
    static randomN<T>(arr: T[], n: number): T[] {
        if (n <= 0) return [];
        if (n >= arr.length) return [...arr];
        const shuffled = this.shuffle(arr);
        return shuffled.slice(0, n);
    }

    /**
     * Reverse array
     */
    static reverse<T>(arr: T[]): T[] {
        return [...arr].reverse();
    }

    /**
     * Rotate array
     */
    static rotate<T>(arr: T[], steps: number): T[] {
        if (arr.length === 0) return arr;
        const normalized = ((steps % arr.length) + arr.length) % arr.length;
        return [
            ...arr.slice(-normalized),
            ...arr.slice(0, -normalized || undefined),
        ];
    }

    /**
     * Zip arrays together
     */
    static zip<T>(...arrays: T[][]): T[][] {
        if (arrays.length === 0) return [];
        const maxLength = Math.max(...arrays.map((a) => a.length));
        const result: T[][] = [];
        for (let i = 0; i < maxLength; i++) {
            result.push(arrays.map((a) => a[i]));
        }
        return result;
    }

    /**
     * Unzip array of tuples
     */
    static unzip<T>(arr: T[][]): T[][] {
        if (arr.length === 0) return [];
        const maxLength = Math.max(...arr.map((a) => a.length));
        const result: T[][] = Array.from({ length: maxLength }, () => []);
        for (const tuple of arr) {
            for (let i = 0; i < tuple.length; i++) {
                result[i].push(tuple[i]);
            }
        }
        return result;
    }

    /**
     * Find differences between two arrays
     */
    static difference<T>(arr1: T[], arr2: T[]): T[] {
        const set2 = new Set(arr2);
        return arr1.filter((item) => !set2.has(item));
    }

    /**
     * Find intersection of two arrays
     */
    static intersection<T>(arr1: T[], arr2: T[]): T[] {
        const set2 = new Set(arr2);
        return this.unique(arr1.filter((item) => set2.has(item)));
    }

    /**
     * Find union of two arrays
     */
    static union<T>(arr1: T[], arr2: T[]): T[] {
        return this.unique([...arr1, ...arr2]);
    }

    /**
     * Check if array includes all elements from another array
     */
    static includesAll<T>(arr: T[], items: T[]): boolean {
        return items.every((item) => arr.includes(item));
    }

    /**
     * Check if array includes any element from another array
     */
    static includesAny<T>(arr: T[], items: T[]): boolean {
        return items.some((item) => arr.includes(item));
    }

    /**
     * Sum array of numbers
     */
    static sum(arr: number[]): number {
        return arr.reduce((acc, val) => acc + val, 0);
    }

    /**
     * Average of array of numbers
     */
    static average(arr: number[]): number {
        if (arr.length === 0) return 0;
        return this.sum(arr) / arr.length;
    }

    /**
     * Min value in array
     */
    static min(arr: number[]): number | undefined {
        return arr.length === 0 ? undefined : Math.min(...arr);
    }

    /**
     * Max value in array
     */
    static max(arr: number[]): number | undefined {
        return arr.length === 0 ? undefined : Math.max(...arr);
    }

    /**
     * Range of numbers
     */
    static range(start: number, end: number, step = 1): number[] {
        const result: number[] = [];
        if (step > 0) {
            for (let i = start; i < end; i += step) {
                result.push(i);
            }
        } else if (step < 0) {
            for (let i = start; i > end; i += step) {
                result.push(i);
            }
        }
        return result;
    }

    /**
     * Repeat array N times
     */
    static repeat<T>(arr: T[], times: number): T[] {
        if (times <= 0) return [];
        return Array.from({ length: times }, () => arr).flat();
    }

    /**
     * Fill array with value
     */
    static fill<T>(length: number, value: T): T[] {
        return Array.from({ length }, () => value);
    }

    /**
     * Transpose 2D array
     */
    static transpose<T>(arr: T[][]): T[][] {
        if (arr.length === 0) return [];
        const maxLength = Math.max(...arr.map((a) => a.length));
        const result: T[][] = [];
        for (let i = 0; i < maxLength; i++) {
            result.push(arr.map((a) => a[i]));
        }
        return result;
    }

    /**
     * Find index of element matching predicate
     */
    static findIndex<T>(
        arr: T[],
        predicate: (item: T, index: number) => boolean
    ): number {
        return arr.findIndex(predicate);
    }

    /**
     * Find last index of element matching predicate
     */
    static findLastIndex<T>(
        arr: T[],
        predicate: (item: T, index: number) => boolean
    ): number {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (predicate(arr[i], i)) return i;
        }
        return -1;
    }

    /**
     * Partition array into two based on predicate
     */
    static partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
        const pass: T[] = [];
        const fail: T[] = [];
        for (const item of arr) {
            if (predicate(item)) {
                pass.push(item);
            } else {
                fail.push(item);
            }
        }
        return [pass, fail];
    }
}
