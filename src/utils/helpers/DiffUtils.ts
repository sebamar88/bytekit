/**
 * Diff and patch utilities for tracking changes
 * Deep comparison, change detection, and patch generation
 */

export interface DiffResult {
    changed: string[];
    added: string[];
    removed: string[];
}

export interface Patch {
    op: "add" | "remove" | "replace";
    path: string;
    value?: unknown;
    oldValue?: unknown;
}

/**
 * Diff utilities for comparing objects and tracking changes
 */
export class DiffUtils {
    /**
     * Deep compare two values
     */
    static deepEqual(a: unknown, b: unknown): boolean {
        if (a === b) return true;
        if (a == null || b == null) return a === b;
        if (typeof a !== typeof b) return false;

        if (typeof a === "object") {
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

        return false;
    }

    /**
     * Diff two objects and return changed, added, removed keys
     */
    static diff(
        oldObj: Record<string, unknown>,
        newObj: Record<string, unknown>
    ): DiffResult {
        const changed: string[] = [];
        const added: string[] = [];
        const removed: string[] = [];

        const oldKeys = new Set(Object.keys(oldObj));
        const newKeys = new Set(Object.keys(newObj));

        // Find changed and removed
        for (const key of oldKeys) {
            if (!newKeys.has(key)) {
                removed.push(key);
            } else if (!this.deepEqual(oldObj[key], newObj[key])) {
                changed.push(key);
            }
        }

        // Find added
        for (const key of newKeys) {
            if (!oldKeys.has(key)) {
                added.push(key);
            }
        }

        return { changed, added, removed };
    }

    /**
     * Create patches from old to new object
     */
    static createPatch(
        oldObj: Record<string, unknown>,
        newObj: Record<string, unknown>
    ): Patch[] {
        const patches: Patch[] = [];
        const diff = this.diff(oldObj, newObj);

        // Handle removed
        for (const key of diff.removed) {
            patches.push({
                op: "remove",
                path: key,
                oldValue: oldObj[key],
            });
        }

        // Handle changed
        for (const key of diff.changed) {
            patches.push({
                op: "replace",
                path: key,
                value: newObj[key],
                oldValue: oldObj[key],
            });
        }

        // Handle added
        for (const key of diff.added) {
            patches.push({
                op: "add",
                path: key,
                value: newObj[key],
            });
        }

        return patches;
    }

    /**
     * Apply patches to object
     */
    static applyPatch(
        obj: Record<string, unknown>,
        patches: Patch[]
    ): Record<string, unknown> {
        const result = { ...obj };

        for (const patch of patches) {
            switch (patch.op) {
                case "add":
                    result[patch.path] = patch.value;
                    break;
                case "remove":
                    delete result[patch.path];
                    break;
                case "replace":
                    result[patch.path] = patch.value;
                    break;
            }
        }

        return result;
    }

    /**
     * Reverse patches (undo)
     */
    static reversePatch(patches: Patch[]): Patch[] {
        return patches.map((patch) => {
            switch (patch.op) {
                case "add":
                    return { op: "remove" as const, path: patch.path };
                case "remove":
                    return {
                        op: "add" as const,
                        path: patch.path,
                        value: patch.oldValue,
                    };
                case "replace":
                    return {
                        op: "replace" as const,
                        path: patch.path,
                        value: patch.oldValue,
                    };
            }
        });
    }

    /**
     * Get nested value using dot notation
     */
    private static getNestedValue(obj: unknown, path: string): unknown {
        const keys = path.split(".");
        let current = obj;

        for (const key of keys) {
            if (current == null) return undefined;
            current = (current as Record<string, unknown>)[key];
        }

        return current;
    }

    /**
     * Set nested value using dot notation
     */
    private static setNestedValue(
        obj: Record<string, unknown>,
        path: string,
        value: unknown
    ): void {
        const keys = path.split(".");
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key] as Record<string, unknown>;
        }

        current[keys.at(-1)!] = value;
    }

    /**
     * Deep diff with nested paths
     */
    static deepDiff(oldObj: unknown, newObj: unknown, prefix = ""): DiffResult {
        const result: DiffResult = { changed: [], added: [], removed: [] };

        if (
            typeof oldObj !== "object" ||
            oldObj === null ||
            typeof newObj !== "object" ||
            newObj === null
        ) {
            if (!this.deepEqual(oldObj, newObj)) {
                result.changed.push(prefix || "root");
            }
            return result;
        }

        const oldKeys = new Set(Object.keys(oldObj as Record<string, unknown>));
        const newKeys = new Set(Object.keys(newObj as Record<string, unknown>));

        for (const key of oldKeys) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (!newKeys.has(key)) {
                result.removed.push(path);
            } else {
                const oldVal = (oldObj as Record<string, unknown>)[key];
                const newVal = (newObj as Record<string, unknown>)[key];

                if (
                    typeof oldVal === "object" &&
                    oldVal !== null &&
                    typeof newVal === "object" &&
                    newVal !== null
                ) {
                    const nested = this.deepDiff(oldVal, newVal, path);
                    result.changed.push(...nested.changed);
                    result.added.push(...nested.added);
                    result.removed.push(...nested.removed);
                } else if (!this.deepEqual(oldVal, newVal)) {
                    result.changed.push(path);
                }
            }
        }

        for (const key of newKeys) {
            if (!oldKeys.has(key)) {
                const path = prefix ? `${prefix}.${key}` : key;
                result.added.push(path);
            }
        }

        return result;
    }

    /**
     * Merge two objects with conflict resolution
     */
    static merge(
        obj1: Record<string, unknown>,
        obj2: Record<string, unknown>,
        strategy: "first" | "second" | "merge" = "merge"
    ): Record<string, unknown> {
        if (strategy === "first") return { ...obj1 };
        if (strategy === "second") return { ...obj2 };

        const result = { ...obj1 };

        for (const key of Object.keys(obj2)) {
            const val1 = result[key];
            const val2 = obj2[key];

            if (
                typeof val1 === "object" &&
                val1 !== null &&
                typeof val2 === "object" &&
                val2 !== null
            ) {
                result[key] = this.merge(
                    val1 as Record<string, unknown>,
                    val2 as Record<string, unknown>
                );
            } else {
                result[key] = val2;
            }
        }

        return result;
    }

    /**
     * Get summary of changes
     */
    static getSummary(diff: DiffResult): string {
        const parts: string[] = [];
        if (diff.changed.length > 0)
            parts.push(`${diff.changed.length} changed`);
        if (diff.added.length > 0) parts.push(`${diff.added.length} added`);
        if (diff.removed.length > 0)
            parts.push(`${diff.removed.length} removed`);
        return parts.join(", ") || "no changes";
    }
}
