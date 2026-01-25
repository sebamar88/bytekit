export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    stale: boolean;
}

export interface CacheConfig {
    ttl?: number;
    staleWhileRevalidate?: number;
    keyGenerator?: (url: string, options?: Record<string, unknown>) => string;
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

export class RequestCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private readonly ttl: number;
    private readonly staleWhileRevalidate: number;
    private readonly keyGenerator: (
        url: string,
        options?: Record<string, unknown>
    ) => string;
    private stats = { hits: 0, misses: 0 };

    constructor(config: CacheConfig = {}) {
        this.ttl = config.ttl ?? 5 * 60 * 1000; // 5 minutes default
        this.staleWhileRevalidate = config.staleWhileRevalidate ?? 60 * 1000; // 1 minute
        this.keyGenerator = config.keyGenerator ?? this.defaultKeyGenerator;
    }

    /**
     * Get cached data
     */
    get<T>(url: string, options?: Record<string, unknown>): T | null {
        const key = this.keyGenerator(url, options);
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;
        const isBeyondStaleWindow = age > entry.ttl + this.staleWhileRevalidate;

        // If beyond stale window, remove and return null
        if (isBeyondStaleWindow) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        // If expired but within stale window, still return data
        this.stats.hits++;
        return entry.data;
    }

    /**
     * Set cached data
     */
    set<T>(
        url: string,
        data: T,
        ttl?: number,
        options?: Record<string, unknown>
    ): void {
        const key = this.keyGenerator(url, options);
        const now = Date.now();

        this.cache.set(key, {
            data,
            timestamp: now,
            ttl: ttl ?? this.ttl,
            stale: false,
        });
    }

    /**
     * Check if data is stale (expired but still usable)
     */
    isStale(url: string, options?: Record<string, unknown>): boolean {
        const key = this.keyGenerator(url, options);
        const entry = this.cache.get(key);

        if (!entry) return false;

        const now = Date.now();
        const age = now - entry.timestamp;
        return age > entry.ttl && age <= entry.ttl + this.staleWhileRevalidate;
    }

    /**
     * Invalidate cache entry
     */
    invalidate(url: string, options?: Record<string, unknown>): void {
        const key = this.keyGenerator(url, options);
        this.cache.delete(key);
    }

    /**
     * Invalidate by pattern (e.g., "/users/*")
     */
    invalidatePattern(pattern: string): void {
        const regex = this.patternToRegex(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            hitRate: total > 0 ? this.stats.hits / total : 0,
        };
    }

    /**
     * Get cache size in bytes (approximate)
     */
    getSize(): number {
        let size = 0;
        for (const entry of this.cache.values()) {
            size += JSON.stringify(entry.data).length;
        }
        return size;
    }

    /**
     * Prune expired entries
     */
    prune(): number {
        const now = Date.now();
        let pruned = 0;

        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > entry.ttl + this.staleWhileRevalidate) {
                this.cache.delete(key);
                pruned++;
            }
        }

        return pruned;
    }

    private defaultKeyGenerator(
        url: string,
        options?: Record<string, unknown>
    ): string {
        if (!options || Object.keys(options).length === 0) {
            return url;
        }
        const sorted = Object.keys(options)
            .sort()
            .map((k) => `${k}=${JSON.stringify(options[k])}`)
            .join("&");
        return `${url}?${sorted}`;
    }

    private patternToRegex(pattern: string): RegExp {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        const regex = escaped.replace(/\*/g, ".*");
        return new RegExp(`^${regex}$`);
    }
}
