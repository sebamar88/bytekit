import { ApiClient, ApiError } from "./ApiClient.js";
import type { RequestOptions } from "./ApiClient.js";
import { EventEmitter } from "#helpers/EventEmitter.js";
import { CacheManager } from "#helpers/CacheManager.js";
import { CryptoUtils } from "#helpers/CryptoUtils.js";
import {
    RequestState,
    RequestContext,
    RequestLifecycleCallbacks,
    QueryClientEvents,
    CachedQuery,
    createInitialState,
    createLoadingState,
    createSuccessState,
    createErrorState,
} from "./QueryState.js";

/**
 * QueryClient configuration
 */
export interface QueryClientConfig {
    /** Default time before data is considered stale (ms) */
    defaultStaleTime?: number;
    /** Default time before cache is garbage collected (ms) */
    defaultCacheTime?: number;
    /** Maximum number of queries to cache */
    maxCacheSize?: number;
    /** Refetch on window focus */
    refetchOnWindowFocus?: boolean;
    /** Refetch on reconnect */
    refetchOnReconnect?: boolean;
    /** Global lifecycle callbacks */
    globalCallbacks?: RequestLifecycleCallbacks;
    /** Enable automatic deduplication */
    enableDeduplication?: boolean;
}

/**
 * Query options
 */
export interface QueryOptions<T = unknown> extends Omit<
    RequestOptions,
    "method"
> {
    /** Unique identifier for the query */
    queryKey: string[];
    /** API endpoint path */
    path: string;
    /** HTTP method */
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    /** Time before data is considered stale (ms) */
    staleTime?: number;
    /** Time before cache is garbage collected (ms) */
    cacheTime?: number;
    /** Refetch on window focus */
    refetchOnWindowFocus?: boolean;
    /** Refetch on reconnect */
    refetchOnReconnect?: boolean;
    /** Auto-refetch interval (ms) */
    refetchInterval?: number;
    /** Lifecycle callbacks */
    callbacks?: RequestLifecycleCallbacks<T>;
    /** Initial data */
    initialData?: T;
    /** Placeholder data while loading */
    placeholderData?: T;
}

/**
 * Mutation options
 */
export interface MutationOptions<T = unknown> extends RequestOptions {
    /** API endpoint path */
    path: string;
    /** HTTP method */
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    /** Lifecycle callbacks */
    callbacks?: RequestLifecycleCallbacks<T>;
    /** Called before mutation */
    onMutate?: (variables: unknown) => void | Promise<void>;
    /** Query keys to invalidate on success */
    invalidateQueries?: string[][];
}

/**
 * QueryClient - State management wrapper for ApiClient
 * Provides React Query-like functionality with cache, state tracking, and lifecycle callbacks
 */
export class QueryClient {
    private readonly apiClient: ApiClient;
    private readonly eventEmitter: EventEmitter<
        QueryClientEvents & Record<string, unknown>
    >;
    private readonly cache: CacheManager<CachedQuery>;
    private readonly stateManager: Map<string, RequestState>;
    private config: Required<QueryClientConfig>;
    private pendingRequests: Map<string, Promise<unknown>>;

    constructor(apiClient: ApiClient, options: QueryClientConfig = {}) {
        this.apiClient = apiClient;
        this.eventEmitter = new EventEmitter<
            QueryClientEvents & Record<string, unknown>
        >();
        this.stateManager = new Map();
        this.pendingRequests = new Map();

        // Set default config
        this.config = {
            defaultStaleTime: options.defaultStaleTime ?? 0,
            defaultCacheTime: options.defaultCacheTime ?? 5 * 60 * 1000, // 5 min
            maxCacheSize: options.maxCacheSize ?? 100,
            refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
            refetchOnReconnect: options.refetchOnReconnect ?? true,
            globalCallbacks: options.globalCallbacks ?? {},
            enableDeduplication: options.enableDeduplication ?? true,
        };

        // Initialize cache
        this.cache = new CacheManager<CachedQuery>({
            maxMemorySize: this.config.maxCacheSize,
            defaultTTL: this.config.defaultCacheTime,
        });

        // Setup window focus refetch
        if (
            this.config.refetchOnWindowFocus &&
            globalThis.window !== undefined
        ) {
            globalThis.window.addEventListener("focus", () =>
                this.refetchStaleQueries()
            );
        }

        // Setup reconnect refetch
        if (this.config.refetchOnReconnect && globalThis.window !== undefined) {
            globalThis.window.addEventListener("online", () =>
                this.refetchStaleQueries()
            );
        }
    }

    /**
     * Execute a query
     */
    async query<T>(options: QueryOptions<T>): Promise<T> {
        const cacheKey = this.getCacheKey(options.queryKey);
        const requestId = this.generateRequestId();

        // Check for deduplication
        if (this.config.enableDeduplication) {
            const pending = this.pendingRequests.get(cacheKey);
            if (pending) {
                return pending as Promise<T>;
            }
        }

        // Check cache
        const cached = this.cache.get(cacheKey) ?? undefined;
        const staleTime = options.staleTime ?? this.config.defaultStaleTime;

        if (cached && !this.isStale(cached, staleTime)) {
            // Return cached data
            return cached.data as T;
        }

        // Create context
        const context: RequestContext = {
            queryKey: options.queryKey,
            url: options.path,
            method: options.method ?? "GET",
            timestamp: Date.now(),
            requestId,
        };

        // Initialize state
        let initialState: RequestState<T>;
        if (cached) {
            initialState = createLoadingState<T>(cached.data as T);
        } else if (options.placeholderData) {
            initialState = createLoadingState<T>(options.placeholderData);
        } else {
            initialState = createLoadingState<T>();
        }

        this.stateManager.set(cacheKey, initialState);

        // Execute request
        const requestPromise = this.executeQuery<T>(options, context, cached);

        // Store pending request for deduplication
        if (this.config.enableDeduplication) {
            this.pendingRequests.set(cacheKey, requestPromise);
        }

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Clean up pending request
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * Execute a mutation
     */
    async mutate<T>(options: MutationOptions<T>): Promise<T> {
        const requestId = this.generateRequestId();

        const context: RequestContext = {
            url: options.path,
            method: options.method ?? "POST",
            timestamp: Date.now(),
            requestId,
        };

        // Call onMutate if provided
        if (options.onMutate) {
            await options.onMutate(options.body);
        }

        // Execute callbacks
        await this.executeCallbacks("onStart", context, options.callbacks);
        this.eventEmitter.emit("query:start", { context });

        try {
            // Execute request
            const method = options.method ?? "POST";
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {
                callbacks: _callbacks,
                onMutate: _onMutate,
                invalidateQueries: _invalidate,
                ...requestOptions
            } = options;

            let result: T;
            if (method === "POST") {
                result = await this.apiClient.post<T>(
                    options.path,
                    requestOptions
                );
            } else if (method === "PUT") {
                result = await this.apiClient.put<T>(
                    options.path,
                    requestOptions
                );
            } else if (method === "PATCH") {
                result = await this.apiClient.patch<T>(
                    options.path,
                    requestOptions
                );
            } else {
                result = await this.apiClient.delete<T>(
                    options.path,
                    requestOptions
                );
            }

            // Success callbacks
            await this.executeCallbacks(
                "onSuccess",
                context,
                options.callbacks,
                result
            );
            this.eventEmitter.emit("query:success", { data: result, context });

            // Invalidate queries if specified
            if (options.invalidateQueries) {
                options.invalidateQueries.forEach((queryKey) =>
                    this.invalidateQueries(queryKey)
                );
            }

            // Settled callback
            await this.executeCallbacks(
                "onSettled",
                context,
                options.callbacks,
                result,
                undefined
            );
            this.eventEmitter.emit("query:settled", {
                data: result,
                context,
            });

            return result;
        } catch (err) {
            const error = err as ApiError;

            // Error callbacks
            await this.executeCallbacks(
                "onError",
                context,
                options.callbacks,
                undefined,
                error
            );
            this.eventEmitter.emit("query:error", { error, context });

            // Settled callback
            await this.executeCallbacks(
                "onSettled",
                context,
                options.callbacks,
                undefined,
                error
            );
            this.eventEmitter.emit("query:settled", {
                error,
                context,
            });

            throw error;
        }
    }

    /**
     * Get current state of a query
     */
    getQueryState<T = unknown>(
        queryKey: string[]
    ): RequestState<T> | undefined {
        const cacheKey = this.getCacheKey(queryKey);
        return this.stateManager.get(cacheKey) as RequestState<T> | undefined;
    }

    /**
     * Get cached data for a query
     */
    getQueryData<T = unknown>(queryKey: string[]): T | undefined {
        const cacheKey = this.getCacheKey(queryKey);
        const cached = this.cache.get(cacheKey);
        return cached?.data as T | undefined;
    }

    /**
     * Set query data manually
     */
    setQueryData<T = unknown>(queryKey: string[], data: T): void {
        const cacheKey = this.getCacheKey(queryKey);
        const cached: CachedQuery<T> = {
            data,
            state: createSuccessState(data),
            queryKey,
            cachedAt: Date.now(),
            staleTime: this.config.defaultStaleTime,
            cacheTime: this.config.defaultCacheTime,
        };

        this.cache.set(cacheKey, cached as CachedQuery);
        this.stateManager.set(cacheKey, cached.state);
        this.eventEmitter.emit("cache:update", { queryKey, data });
    }

    /**
     * Invalidate queries matching the query key
     */
    invalidateQueries(queryKey: string[]): void {
        const pattern = this.getCacheKey(queryKey);

        // Find all matching queries
        const keysToInvalidate: string[] = [];
        this.stateManager.forEach((_, key) => {
            if (this.matchesQueryKey(key, pattern)) {
                keysToInvalidate.push(key);
            }
        });

        // Invalidate each matching query
        keysToInvalidate.forEach((key) => {
            const state = this.stateManager.get(key);
            if (state) {
                // Mark as stale by setting to idle
                this.stateManager.set(key, createInitialState());
            }
        });

        this.eventEmitter.emit("cache:invalidate", { queryKey });
    }

    /**
     * Refetch queries matching the query key
     */
    async refetchQueries(queryKey: string[]): Promise<void> {
        // For now, just invalidate - actual refetch would require storing query options
        this.invalidateQueries(queryKey);
    }

    /**
     * Clear all cache
     */
    clearCache(): void {
        this.cache.clear();
        this.stateManager.clear();
    }

    /**
     * Subscribe to events
     */
    on<K extends keyof QueryClientEvents>(
        event: K,
        listener: (data: QueryClientEvents[K]) => void
    ): () => void {
        this.eventEmitter.on(event, listener);
        return () => this.eventEmitter.off(event, listener);
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    // -------------------------
    // Private methods
    // -------------------------

    private async executeQuery<T>(
        options: QueryOptions<T>,
        context: RequestContext,
        cached?: CachedQuery
    ): Promise<T> {
        const cacheKey = this.getCacheKey(options.queryKey);

        // Execute callbacks
        await this.executeCallbacks("onStart", context, options.callbacks);
        this.eventEmitter.emit("query:start", { context });

        try {
            // Execute request
            const method = options.method ?? "GET";
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {
                queryKey: _queryKey,
                callbacks: _callbacks,
                initialData: _initialData,
                placeholderData: _placeholderData,
                staleTime: _staleTime,
                cacheTime: _cacheTime,
                refetchInterval: _refetchInterval,
                refetchOnWindowFocus: _refetchOnWindowFocus,
                refetchOnReconnect: _refetchOnReconnect,
                ...requestOptions
            } = options;

            let result: T;
            if (method === "GET") {
                result = await this.apiClient.get<T>(
                    options.path,
                    requestOptions
                );
            } else if (method === "POST") {
                result = await this.apiClient.post<T>(
                    options.path,
                    requestOptions
                );
            } else if (method === "PUT") {
                result = await this.apiClient.put<T>(
                    options.path,
                    requestOptions
                );
            } else if (method === "PATCH") {
                result = await this.apiClient.patch<T>(
                    options.path,
                    requestOptions
                );
            } else {
                result = await this.apiClient.delete<T>(
                    options.path,
                    requestOptions
                );
            }

            // Update state
            const successState = createSuccessState(result);
            this.stateManager.set(cacheKey, successState);

            // Update cache
            const cachedQuery: CachedQuery<T> = {
                data: result,
                state: successState,
                queryKey: options.queryKey,
                cachedAt: Date.now(),
                staleTime: options.staleTime ?? this.config.defaultStaleTime,
                cacheTime: options.cacheTime ?? this.config.defaultCacheTime,
            };
            this.cache.set(
                cacheKey,
                cachedQuery as CachedQuery,
                cachedQuery.cacheTime
            );

            // Success callbacks
            await this.executeCallbacks(
                "onSuccess",
                context,
                options.callbacks,
                result
            );
            this.eventEmitter.emit("query:success", { data: result, context });
            this.eventEmitter.emit("state:change", {
                state: successState,
                context,
            });

            // Settled callback
            await this.executeCallbacks(
                "onSettled",
                context,
                options.callbacks,
                result
            );
            this.eventEmitter.emit("query:settled", {
                data: result,
                context,
            });

            return result;
        } catch (err) {
            const error = err as ApiError;

            // Update state
            const errorState = createErrorState(
                error,
                cached?.data as T | undefined
            );
            this.stateManager.set(cacheKey, errorState);

            // Error callbacks
            await this.executeCallbacks(
                "onError",
                context,
                options.callbacks,
                undefined,
                error
            );
            this.eventEmitter.emit("query:error", { error, context });
            this.eventEmitter.emit("state:change", {
                state: errorState,
                context,
            });

            // Settled callback
            await this.executeCallbacks(
                "onSettled",
                context,
                options.callbacks,
                undefined,
                error
            );
            this.eventEmitter.emit("query:settled", {
                error,
                context,
            });

            throw error;
        }
    }

    /**
     * Execute onStart callbacks
     */
    private async executeOnStartCallbacks<T>(
        context: RequestContext,
        callbacks?: RequestLifecycleCallbacks<T>
    ): Promise<void> {
        const globalCallback = this.config.globalCallbacks.onStart;
        const localCallback = callbacks?.onStart;

        if (globalCallback) {
            await (
                globalCallback as (
                    context: RequestContext
                ) => void | Promise<void>
            )(context);
        }
        if (localCallback) {
            await (
                localCallback as (
                    context: RequestContext
                ) => void | Promise<void>
            )(context);
        }
    }

    /**
     * Execute onSuccess callbacks
     */
    private async executeOnSuccessCallbacks<T>(
        data: T,
        context: RequestContext,
        callbacks?: RequestLifecycleCallbacks<T>
    ): Promise<void> {
        const globalCallback = this.config.globalCallbacks.onSuccess;
        const localCallback = callbacks?.onSuccess;

        if (globalCallback) {
            await (
                globalCallback as (
                    data: T,
                    context: RequestContext
                ) => void | Promise<void>
            )(data, context);
        }
        if (localCallback) {
            await (
                localCallback as (
                    data: T,
                    context: RequestContext
                ) => void | Promise<void>
            )(data, context);
        }
    }

    /**
     * Execute onError callbacks
     */
    private async executeOnErrorCallbacks<T>(
        error: ApiError,
        context: RequestContext,
        callbacks?: RequestLifecycleCallbacks<T>
    ): Promise<void> {
        const globalCallback = this.config.globalCallbacks.onError;
        const localCallback = callbacks?.onError;

        if (globalCallback) {
            await (
                globalCallback as (
                    error: ApiError,
                    context: RequestContext
                ) => void | Promise<void>
            )(error, context);
        }
        if (localCallback) {
            await (
                localCallback as (
                    error: ApiError,
                    context: RequestContext
                ) => void | Promise<void>
            )(error, context);
        }
    }

    /**
     * Execute onSettled callbacks
     */
    private async executeOnSettledCallbacks<T>(
        data: T | undefined,
        error: ApiError | undefined,
        context: RequestContext,
        callbacks?: RequestLifecycleCallbacks<T>
    ): Promise<void> {
        const globalCallback = this.config.globalCallbacks.onSettled;
        const localCallback = callbacks?.onSettled;

        if (globalCallback) {
            await (
                globalCallback as (
                    data: T | undefined,
                    error: ApiError | undefined,
                    context: RequestContext
                ) => void | Promise<void>
            )(data, error, context);
        }
        if (localCallback) {
            await (
                localCallback as (
                    data: T | undefined,
                    error: ApiError | undefined,
                    context: RequestContext
                ) => void | Promise<void>
            )(data, error, context);
        }
    }

    private async executeCallbacks<T>(
        type: "onStart" | "onSuccess" | "onError" | "onSettled",
        context: RequestContext,
        callbacks?: RequestLifecycleCallbacks<T>,
        data?: T,
        error?: ApiError
    ): Promise<void> {
        if (type === "onStart") {
            await this.executeOnStartCallbacks(context, callbacks);
        } else if (type === "onSuccess" && data !== undefined) {
            await this.executeOnSuccessCallbacks(data, context, callbacks);
        } else if (type === "onError" && error) {
            await this.executeOnErrorCallbacks(error, context, callbacks);
        } else if (type === "onSettled") {
            await this.executeOnSettledCallbacks(
                data,
                error,
                context,
                callbacks
            );
        }
    }

    private getCacheKey(queryKey: string[]): string {
        return JSON.stringify(queryKey);
    }

    private matchesQueryKey(cacheKey: string, pattern: string): boolean {
        // Simple prefix matching
        return cacheKey.startsWith(pattern.slice(0, -1));
    }

    private isStale(cached: CachedQuery, staleTime: number): boolean {
        if (staleTime === Infinity) return false;
        return Date.now() - cached.cachedAt > staleTime;
    }

    private generateRequestId(): string {
        // Use CryptoUtils from the library for cryptographically secure UUID generation
        return CryptoUtils.generateUUID();
    }

    private async refetchStaleQueries(): Promise<void> {
        // Iterate through all cached queries and refetch stale ones
        // This is a simplified implementation
        // In production, you'd want to track query options to refetch properly
        this.stateManager.forEach((state, key) => {
            if (state.status === "success") {
                // Mark as potentially stale for next query
                this.stateManager.set(key, { ...state, isFetching: false });
            }
        });
    }
}

/**
 * Factory function for creating QueryClient
 */
export function createQueryClient(
    apiClient: ApiClient,
    options?: QueryClientConfig
): QueryClient {
    return new QueryClient(apiClient, options);
}
