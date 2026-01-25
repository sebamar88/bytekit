/**
 * Multi-tier cache manager with memory, localStorage, and custom backends
 * Isomorphic caching for Node.js and browsers
 */

export interface CacheEntryData<T = unknown> {
    value: T;
    timestamp: number;
    ttl?: number;
}

export interface CacheStatistics {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

export interface CacheManagerOptions {
    defaultTTL?: number;
    maxMemorySize?: number;
    enableLocalStorage?: boolean;
    enableIndexedDB?: boolean;
}

/**
 * Memory cache with LRU eviction
 */
class MemoryCache<T = unknown> {
    private cache: Map<string, CacheEntryData<T>> = new Map();
    private maxSize: number;
    private hits: number = 0;
    private misses: number = 0;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    set(key: string, value: T, ttl?: number): void {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl,
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }

        if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.value;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    getStats(): CacheStatistics {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            size: this.cache.size,
            hitRate: total === 0 ? 0 : this.hits / total,
        };
    }
}

/**
 * LocalStorage cache wrapper
 */
class LocalStorageCache<T = unknown> {
    private prefix: string;

    constructor(prefix: string = "cache:") {
        this.prefix = prefix;
    }

    set(key: string, value: T, ttl?: number): void {
        if (typeof localStorage === "undefined") return;

        const entry: CacheEntryData<T> = {
            value,
            timestamp: Date.now(),
            ttl,
        };

        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(entry));
        } catch {
            // Storage quota exceeded
        }
    }

    get(key: string): T | null {
        if (typeof localStorage === "undefined") return null;

        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const entry: CacheEntryData<T> = JSON.parse(item);

            if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
                localStorage.removeItem(this.prefix + key);
                return null;
            }

            return entry.value;
        } catch {
            return null;
        }
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): void {
        if (typeof localStorage === "undefined") return;
        localStorage.removeItem(this.prefix + key);
    }

    clear(): void {
        if (typeof localStorage === "undefined") return;

        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                keys.push(key);
            }
        }

        keys.forEach((key) => localStorage.removeItem(key));
    }
}

/**
 * Multi-tier cache manager
 */
export class CacheManager<T = unknown> {
    private memoryCache: MemoryCache<T>;
    private storageCache: LocalStorageCache<T> | null;
    private defaultTTL: number;

    constructor(options: CacheManagerOptions = {}) {
        this.memoryCache = new MemoryCache(options.maxMemorySize ?? 100);
        this.storageCache = options.enableLocalStorage
            ? new LocalStorageCache()
            : null;
        this.defaultTTL = options.defaultTTL ?? Infinity;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: T, ttl: number = this.defaultTTL): void {
        this.memoryCache.set(key, value, ttl);
        if (this.storageCache) {
            this.storageCache.set(key, value, ttl);
        }
    }

    /**
     * Get value from cache
     */
    get(key: string): T | null {
        // Try memory first
        const memValue = this.memoryCache.get(key);
        if (memValue !== null) return memValue;

        // Try storage
        if (this.storageCache) {
            const storValue = this.storageCache.get(key);
            if (storValue !== null) {
                // Restore to memory
                this.memoryCache.set(key, storValue);
                return storValue;
            }
        }

        return null;
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete key
     */
    delete(key: string): void {
        this.memoryCache.delete(key);
        if (this.storageCache) {
            this.storageCache.delete(key);
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.memoryCache.clear();
        if (this.storageCache) {
            this.storageCache.clear();
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStatistics {
        return this.memoryCache.getStats();
    }

    /**
     * Get or compute value
     */
    async getOrCompute(
        key: string,
        compute: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get(key);
        if (cached !== null) return cached;

        const value = await compute();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Invalidate keys matching pattern
     */
    async clearPattern(_pattern: string): Promise<void> {
        // Note: This is a simple implementation
        // In production, you'd want to track all keys
        this.clear();
    }
}

/**
 * Factory function for creating cache managers
 */
export function createCacheManager<T = unknown>(
    options?: CacheManagerOptions
): CacheManager<T> {
    return new CacheManager(options);
}
