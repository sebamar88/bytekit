/**
 * RequestBatcher — Time-window deduplication batcher for HTTP requests.
 * Feature: 004-batching-system
 * Zero external dependencies: Map, setTimeout/clearTimeout (built-in).
 */

/** Constructor options for {@link RequestBatcher}. */
export interface BatchOptions {
    /**
     * Time window in milliseconds for collecting requests before dispatching.
     * Must be greater than 0.
     */
    windowMs: number;
    /**
     * Maximum requests per batch. Flushes early when reached.
     * Default: `Infinity`.
     */
    maxSize?: number;
    /**
     * If `true`, the window timer resets on each new request (sliding window).
     * Default: `false` — fixed window: timer fires once after the first request.
     */
    sliding?: boolean;
    /**
     * Custom function to compute the batch deduplication key.
     * Requests with the same key within a window are coalesced.
     * Default: `"METHOD:url:serialized(body)"`.
     */
    keyFn?: (url: string, init: RequestInit) => string;
}

/** @internal */
interface BatchEntry {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetcher: (url: string, init: RequestInit) => Promise<any>;
    url: string;
    init: RequestInit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value: any) => void;
    reject: (reason: unknown) => void;
}

function stableSerialize(body: unknown): string {
    if (body === undefined || body === null) return "";
    if (
        typeof body === "string" ||
        typeof body === "number" ||
        typeof body === "boolean"
    ) {
        return String(body);
    }
    try {
        return JSON.stringify(body);
    } catch {
        return String(body);
    }
}

function defaultKeyFn(url: string, init: RequestInit): string {
    const method = (init.method ?? "GET").toUpperCase();
    const body = stableSerialize(init.body);
    return `${method}:${url}:${body}`;
}

/**
 * Coalesces same-key HTTP requests within a time window into a single fetch invocation.
 * All callers sharing the same key receive the same resolved value.
 *
 * The deduplication key defaults to `"METHOD:url:serialized(body)"` and can be
 * overridden via `BatchOptions.keyFn`.
 *
 * @example
 * ```typescript
 * const batcher = new RequestBatcher({ windowMs: 50 });
 *
 * // These three calls share the same key → fetcher invoked once
 * const [a, b, c] = await Promise.all([
 *   batcher.add("/api/users", { method: "GET" }, fetch),
 *   batcher.add("/api/users", { method: "GET" }, fetch),
 *   batcher.add("/api/users", { method: "GET" }, fetch),
 * ]);
 * ```
 */
export class RequestBatcher {
    private readonly _windowMs: number;
    private readonly _maxSize: number;
    private readonly _sliding: boolean;
    private readonly _keyFn: (url: string, init: RequestInit) => string;
    private readonly _buckets = new Map<string, BatchEntry[]>();
    private readonly _timers = new Map<string, ReturnType<typeof setTimeout>>();

    /**
     * Creates a new RequestBatcher.
     * @throws {TypeError} if `windowMs` is not greater than 0.
     * @throws {TypeError} if `maxSize` is less than 1.
     */
    constructor(options: BatchOptions) {
        if (options.windowMs <= 0) {
            throw new TypeError("windowMs must be > 0");
        }
        if (options.maxSize !== undefined && options.maxSize < 1) {
            throw new TypeError("maxSize must be >= 1");
        }
        this._windowMs = options.windowMs;
        this._maxSize = options.maxSize ?? Infinity;
        this._sliding = options.sliding ?? false;
        this._keyFn = options.keyFn ?? defaultKeyFn;
    }

    /**
     * Adds a request to the current batch window.
     * Requests with the same key (method + url + body) are coalesced —
     * all callers receive the same resolved value when the window fires.
     *
     * @param url      The request URL.
     * @param init     The RequestInit options (method, headers, body).
     * @param fetcher  The actual fetch function to invoke when the window fires.
     * @returns `Promise<T>` resolving to the fetch result.
     */
    add<T>(
        url: string,
        init: RequestInit,
        fetcher: (url: string, init: RequestInit) => Promise<T>
    ): Promise<T> {
        const key = this._keyFn(url, init);

        return new Promise<T>((resolve, reject) => {
            const entry: BatchEntry = { fetcher, url, init, resolve, reject };

            if (!this._buckets.has(key)) {
                this._buckets.set(key, []);
            }
            this._buckets.get(key)!.push(entry);

            // Sliding window: reset timer on each new request
            if (this._sliding && this._timers.has(key)) {
                clearTimeout(this._timers.get(key)!);
                this._timers.delete(key);
            }

            // Start timer if not already running (or just cleared for sliding)
            if (!this._timers.has(key)) {
                const timer = setTimeout(() => {
                    void this._dispatch(key);
                }, this._windowMs);
                this._timers.set(key, timer);
            }

            // Early flush if maxSize reached
            if (this._buckets.get(key)!.length >= this._maxSize) {
                void this._dispatch(key);
            }
        });
    }

    private async _dispatch(key: string): Promise<void> {
        // Cancel the timer for this key
        const timer = this._timers.get(key);
        if (timer !== undefined) {
            clearTimeout(timer);
            this._timers.delete(key);
        }

        // Splice the bucket — guard against double dispatch
        const entries = this._buckets.get(key);
        /* v8 ignore next — defensive guard against double-dispatch; unreachable via public API */
        if (!entries || entries.length === 0) return;
        this._buckets.delete(key);

        // Call the first entry's fetcher once; share result with all callers
        const first = entries[0];
        try {
            const result = await first.fetcher(first.url, first.init);
            for (const entry of entries) {
                entry.resolve(result);
            }
        } catch (err) {
            for (const entry of entries) {
                entry.reject(err);
            }
        }
    }

    /**
     * Forces immediate dispatch of all pending batches.
     * Resolves when all dispatched fetchers have settled.
     */
    async flush(): Promise<void> {
        const keys = [...this._buckets.keys()];
        await Promise.allSettled(keys.map((key) => this._dispatch(key)));
    }

    /** Total pending requests across all batch buckets. */
    get pendingCount(): number {
        let count = 0;
        for (const bucket of this._buckets.values()) {
            count += bucket.length;
        }
        return count;
    }
}
