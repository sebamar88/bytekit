/**
 * Batch Request Helper
 * Execute multiple requests in parallel, sequence, or with fallback
 */

export interface BatchRequestOptions {
    /**
     * Abort all requests if one fails
     * @default false
     */
    abortOnError?: boolean;

    /**
     * Timeout for all requests in milliseconds
     */
    timeout?: number;
}

export class BatchRequest {
    private requests: Array<() => Promise<unknown>> = [];
    private labels: Map<number, string> = new Map();

    constructor(private options: BatchRequestOptions = {}) {}

    /**
     * Add a request to the batch
     * @example
     * batch.add(() => client.get("/users"))
     * batch.add(() => client.get("/posts"), "posts")
     */
    add<T>(fn: () => Promise<T>, label?: string): this {
        const index = this.requests.length;
        this.requests.push(fn);
        if (label) {
            this.labels.set(index, label);
        }
        return this;
    }

    /**
     * Execute all requests in parallel
     * @throws If any request fails and abortOnError is true
     */
    async execute(): Promise<unknown[]> {
        const promises = this.requests.map((fn, index) =>
            this.executeWithTimeout(fn, index)
        );

        if (this.options.abortOnError) {
            return Promise.all(promises);
        }

        return Promise.allSettled(promises).then((results) =>
            results.map((result) =>
                result.status === "fulfilled" ? result.value : null
            )
        );
    }

    /**
     * Execute all requests sequentially
     * @throws If any request fails and abortOnError is true
     */
    async executeSequential(): Promise<unknown[]> {
        const results = [];

        for (let i = 0; i < this.requests.length; i++) {
            try {
                const result = await this.executeWithTimeout(
                    this.requests[i],
                    i
                );
                results.push(result);
            } catch (error) {
                if (this.options.abortOnError) {
                    throw error;
                }
                results.push(null);
            }
        }

        return results;
    }

    /**
     * Execute with fallback - returns null for failed requests
     */
    async executeWithFallback(): Promise<(unknown | null)[]> {
        const promises = this.requests.map((fn, index) =>
            this.executeWithTimeout(fn, index).catch(() => null)
        );

        return Promise.all(promises);
    }

    /**
     * Execute and return results as object with labels
     * @example
     * const { users, posts } = await batch
     *   .add(() => client.get("/users"), "users")
     *   .add(() => client.get("/posts"), "posts")
     *   .executeAsObject();
     */
    async executeAsObject(): Promise<Record<string, unknown>> {
        const results = await this.execute();
        const obj: Record<string, unknown> = {};

        results.forEach((result, index) => {
            const label = this.labels.get(index) || `request_${index}`;
            obj[label] = result;
        });

        return obj;
    }

    /**
     * Execute sequentially and return results as object
     */
    async executeSequentialAsObject(): Promise<Record<string, unknown>> {
        const results = await this.executeSequential();
        const obj: Record<string, unknown> = {};

        results.forEach((result, index) => {
            const label = this.labels.get(index) || `request_${index}`;
            obj[label] = result;
        });

        return obj;
    }

    /**
     * Get number of requests in batch
     */
    size(): number {
        return this.requests.length;
    }

    /**
     * Clear all requests
     */
    clear(): this {
        this.requests = [];
        this.labels.clear();
        return this;
    }

    /**
     * Clone the batch
     */
    clone(): BatchRequest {
        const cloned = new BatchRequest(this.options);
        cloned.requests = [...this.requests];
        cloned.labels = new Map(this.labels);
        return cloned;
    }

    private async executeWithTimeout(
        fn: () => Promise<unknown>,
        index: number
    ): Promise<unknown> {
        if (!this.options.timeout) {
            return fn();
        }

        return Promise.race([
            fn(),
            new Promise((_, reject) =>
                setTimeout(
                    () =>
                        reject(
                            new Error(
                                `Request ${index} timed out after ${this.options.timeout}ms`
                            )
                        ),
                    this.options.timeout
                )
            ),
        ]);
    }
}

/**
 * Create a new batch request
 * @example
 * const batch = createBatchRequest();
 * const [users, posts] = await batch
 *   .add(() => client.get("/users"))
 *   .add(() => client.get("/posts"))
 *   .execute();
 */
export function createBatchRequest(
    options?: BatchRequestOptions
): BatchRequest {
    return new BatchRequest(options);
}
