export interface DeduplicatorConfig {
    keyGenerator?: (url: string, options?: Record<string, unknown>) => string;
}

export interface DeduplicatorStats {
    deduplicated: number;
    total: number;
    deduplicationRate: number;
}

/**
 * Deduplicates in-flight requests
 * Multiple consumers of the same request share the same response
 */
export class RequestDeduplicator {
    private inFlightRequests: Map<string, Promise<unknown>> = new Map();
    private readonly keyGenerator: (
        url: string,
        options?: Record<string, unknown>
    ) => string;
    private stats = { deduplicated: 0, total: 0 };

    constructor(config: DeduplicatorConfig = {}) {
        this.keyGenerator = config.keyGenerator ?? this.defaultKeyGenerator;
    }

    /**
     * Execute request with deduplication
     * If same request is in-flight, returns the same promise
     */
    async execute<T>(
        url: string,
        fn: () => Promise<T>,
        options?: Record<string, unknown>
    ): Promise<T> {
        const key = this.keyGenerator(url, options);
        this.stats.total++;

        // Check if request is already in-flight
        const inFlight = this.inFlightRequests.get(key);
        if (inFlight) {
            this.stats.deduplicated++;
            return inFlight as Promise<T>;
        }

        // Create new request promise
        const promise = fn()
            .then((result) => {
                // Remove from in-flight on success
                this.inFlightRequests.delete(key);
                return result;
            })
            .catch((error) => {
                // Remove from in-flight on error
                this.inFlightRequests.delete(key);
                throw error;
            });

        // Store in-flight request
        this.inFlightRequests.set(key, promise);

        return promise;
    }

    /**
     * Get deduplication statistics
     */
    getStats(): DeduplicatorStats {
        return {
            deduplicated: this.stats.deduplicated,
            total: this.stats.total,
            deduplicationRate:
                this.stats.total > 0
                    ? this.stats.deduplicated / this.stats.total
                    : 0,
        };
    }

    /**
     * Get number of in-flight requests
     */
    getInFlightCount(): number {
        return this.inFlightRequests.size;
    }

    /**
     * Clear all in-flight requests
     */
    clear(): void {
        this.inFlightRequests.clear();
        this.stats = { deduplicated: 0, total: 0 };
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = { deduplicated: 0, total: 0 };
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
}
