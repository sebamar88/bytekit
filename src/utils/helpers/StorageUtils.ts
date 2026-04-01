/**
 * JSON-serialising wrapper around the browser `Storage` API with optional
 * time-to-live (TTL) support.
 *
 * Works with any `Storage`-compatible object (`localStorage`,
 * `sessionStorage`, or a custom in-memory implementation).
 *
 * @example
 * ```typescript
 * const store = new StorageManager();
 * store.set('preferences', { theme: 'light' }, 3_600_000); // expires in 1 h
 * const preferences = store.get<{ theme: string }>('preferences');
 * ```
 */
export class StorageManager {
    /**
     * Creates a new `StorageManager` instance.
     *
     * @param storage - The `Storage` backend to use. Defaults to
     *   `localStorage`.
     *
     * @warning Do not use browser storage for session tokens, passwords,
     *   API keys, or other secrets. Any XSS issue in the host app can expose them.
     */
    constructor(private storage: Storage = localStorage) {}

    /**
     * Serialises a value to JSON and stores it under the given key.
     *
     * @template T - Type of the value to store.
     * @param key - Storage key.
     * @param value - Value to serialise and store.
     * @param ttlMs - Optional time-to-live in milliseconds. When set, the
     *   entry is automatically invalidated after this duration.
     *
     * @example
     * ```typescript
     * store.set('preferences', { compactMode: true }, 60_000);
     * ```
     */
    set<T>(key: string, value: T, ttlMs?: number) {
        const data = { value, expires: ttlMs ? Date.now() + ttlMs : null };
        this.storage.setItem(key, JSON.stringify(data));
    }

    /**
     * Retrieves and deserialises a stored value.
     *
     * Returns `null` when the key does not exist, the stored JSON is malformed,
     * or the entry's TTL has expired (expired entries are removed automatically).
     *
     * @template T - Expected type of the stored value.
     * @param key - Storage key to retrieve.
     * @returns The deserialised value, or `null` on miss or expiry.
     *
     * @example
     * ```typescript
     * const token = store.get<string>('token');
     * ```
     */
    get<T>(key: string): T | null {
        const raw = this.storage.getItem(key);
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            if (data.expires && Date.now() > data.expires) {
                this.storage.removeItem(key);
                return null;
            }
            return data.value as T;
        } catch {
            return null;
        }
    }

    /**
     * Removes a single entry from storage.
     *
     * @param key - Storage key to remove.
     */
    remove(key: string) {
        this.storage.removeItem(key);
    }

    /**
     * Removes all entries from the underlying storage backend.
     *
     * @example
     * ```typescript
     * store.clear(); // clears all localStorage entries
     * ```
     */
    clear() {
        this.storage.clear();
    }
}
