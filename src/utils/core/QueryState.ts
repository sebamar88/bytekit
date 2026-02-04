import type { ApiError } from "./ApiClient.js";

/**
 * Request status states
 */
export type RequestStatus = "idle" | "loading" | "success" | "error";

/**
 * Complete state of a request
 */
export interface RequestState<T = unknown> {
    status: RequestStatus;
    data?: T;
    error?: ApiError;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    isIdle: boolean;
    isFetching: boolean;
    dataUpdatedAt: number;
    errorUpdatedAt: number;
}

/**
 * Request context information
 */
export interface RequestContext {
    queryKey?: string[];
    url: string;
    method: string;
    timestamp: number;
    requestId: string;
}

/**
 * Lifecycle callbacks for requests
 */
export interface RequestLifecycleCallbacks<T = unknown> {
    onStart?: (context: RequestContext) => void | Promise<void>;
    onSuccess?: (data: T, context: RequestContext) => void | Promise<void>;
    onError?: (
        error: ApiError,
        context: RequestContext
    ) => void | Promise<void>;
    onSettled?: (
        data: T | undefined,
        error: ApiError | undefined,
        context: RequestContext
    ) => void | Promise<void>;
}

/**
 * Events emitted by QueryClient
 */
export interface QueryClientEvents<T = unknown> {
    "query:start": { context: RequestContext };
    "query:success": { data: T; context: RequestContext };
    "query:error": { error: ApiError; context: RequestContext };
    "query:settled": {
        data?: T;
        error?: ApiError;
        context: RequestContext;
    };
    "state:change": { state: RequestState<T>; context: RequestContext };
    "cache:invalidate": { queryKey: string[] };
    "cache:update": { queryKey: string[]; data: T };
}

/**
 * Cached query entry
 */
export interface CachedQuery<T = unknown> {
    data: T;
    state: RequestState<T>;
    queryKey: string[];
    cachedAt: number;
    staleTime: number;
    cacheTime: number;
}

/**
 * Helper to create initial request state
 */
export function createInitialState<T = unknown>(): RequestState<T> {
    return {
        status: "idle",
        isLoading: false,
        isSuccess: false,
        isError: false,
        isIdle: true,
        isFetching: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
    };
}

/**
 * Helper to create loading state
 */
export function createLoadingState<T = unknown>(
    previousData?: T
): RequestState<T> {
    return {
        status: "loading",
        data: previousData,
        isLoading: true,
        isSuccess: false,
        isError: false,
        isIdle: false,
        isFetching: true,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
    };
}

/**
 * Helper to create success state
 */
export function createSuccessState<T = unknown>(data: T): RequestState<T> {
    return {
        status: "success",
        data,
        isLoading: false,
        isSuccess: true,
        isError: false,
        isIdle: false,
        isFetching: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
    };
}

/**
 * Helper to create error state
 */
export function createErrorState<T = unknown>(
    error: ApiError,
    previousData?: T
): RequestState<T> {
    return {
        status: "error",
        data: previousData,
        error,
        isLoading: false,
        isSuccess: false,
        isError: true,
        isIdle: false,
        isFetching: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
    };
}
