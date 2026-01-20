import crossFetch from "cross-fetch";
import { Logger } from "#core/Logger.js";
import { StringUtils } from "#helpers/StringUtils.js";
import {
    RetryPolicy,
    CircuitBreaker,
    RetryConfig,
    CircuitBreakerConfig,
} from "#core/RetryPolicy.js";
import {
    ResponseValidator,
    ValidationSchema,
} from "#core/ResponseValidator.js";

export type QueryParamValue = string | number | boolean | null | undefined;
export type QueryParam =
    | QueryParamValue
    | QueryParamValue[]
    | Record<string, unknown>;
export type Locale = "en" | "es";

export interface ApiClientInterceptors {
    request?: (
        url: string,
        init: RequestInit
    ) => Promise<[string, RequestInit]> | [string, RequestInit];
    response?: (response: Response) => Promise<Response> | Response;
}

export interface ApiClientConfig {
    baseUrl: string;
    defaultHeaders?: HeadersInit;
    fetchImpl?: typeof fetch;
    locale?: Locale;
    errorMessages?: Partial<Record<Locale, Partial<Record<number, string>>>>;
    timeoutMs?: number;
    interceptors?: ApiClientInterceptors;
    logger?: Logger;
    retryPolicy?: RetryConfig;
    circuitBreaker?: CircuitBreakerConfig;
}

export interface RequestOptions<TBody = unknown>
    extends Omit<RequestInit, "body"> {
    searchParams?: Record<string, QueryParam>;
    body?: FormData | string | Blob | ArrayBuffer | Record<string, unknown>;
    errorLocale?: Locale;
    timeoutMs?: number;
    validateResponse?: ValidationSchema;
    skipRetry?: boolean;
}

export interface SortParams {
    field?: string;
    order?: "asc" | "desc";
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}

export interface FilterParams {
    [key: string]: QueryParam;
}

export interface ListOptions<TFilter extends FilterParams = FilterParams>
    extends Omit<RequestOptions, "searchParams"> {
    pagination?: PaginationParams;
    sort?: SortParams;
    filters?: TFilter;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        message: string,
        public readonly body?: unknown,
        public readonly isTimeout = false
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ------------------------------------
// Default error messages & localization
// ------------------------------------
const DEFAULT_ERROR_MESSAGES: Record<Locale, Record<number, string>> = {
    es: {
        400: "La solicitud es inválida. Verifica los datos enviados.",
        401: "Necesitas iniciar sesión para continuar.",
        403: "No tienes permisos para realizar esta acción.",
        404: "El recurso solicitado no fue encontrado.",
        408: "La solicitud tardó demasiado en responder.",
        429: "Demasiadas solicitudes. Intenta nuevamente más tarde.",
        500: "Ocurrió un error interno en el servidor.",
        502: "Puerta de enlace inválida.",
        503: "Servicio no disponible temporalmente.",
        504: "Tiempo de espera agotado.",
    },
    en: {
        400: "Invalid request. Please check your data.",
        401: "You must be signed in to continue.",
        403: "You don't have permission for this action.",
        404: "Resource not found.",
        408: "Request timeout.",
        429: "Too many requests. Try again later.",
        500: "Internal server error.",
        502: "Bad gateway.",
        503: "Service unavailable.",
        504: "Gateway timeout.",
    },
};

const GENERIC_ERROR_MESSAGE: Record<
    Locale,
    (status: number, text: string) => string
> = {
    es: (status, text) => `Error de red (${status} ${text})`.trim(),
    en: (status, text) => `Network error (${status} ${text})`.trim(),
};

// ------------------------------------
// Main API client
// ------------------------------------
export class ApiClient {
    private readonly baseUrl: URL;
    private readonly headers: HeadersInit;
    private readonly fetchImpl: typeof fetch;
    private readonly locale: Locale;
    private readonly timeoutMs: number;
    private readonly interceptors?: ApiClientInterceptors;
    private readonly logger?: Logger;
    private readonly errorMessages: Partial<
        Record<Locale, Partial<Record<number, string>>>
    >;
    private readonly retryPolicy: RetryPolicy;
    private readonly circuitBreaker: CircuitBreaker;

    constructor({
        baseUrl,
        defaultHeaders,
        fetchImpl,
        locale = "es",
        errorMessages,
        timeoutMs = 15000,
        interceptors,
        logger,
        retryPolicy,
        circuitBreaker,
    }: ApiClientConfig) {
        this.baseUrl = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
        this.headers = defaultHeaders ?? {};
        this.fetchImpl =
            fetchImpl ??
            (typeof globalThis.fetch === "function"
                ? globalThis.fetch.bind(globalThis)
                : (crossFetch as any));
        this.locale = locale;
        this.errorMessages = errorMessages ?? {};
        this.timeoutMs = timeoutMs;
        this.interceptors = interceptors;
        this.logger = logger;
        this.retryPolicy = new RetryPolicy(retryPolicy);
        this.circuitBreaker = new CircuitBreaker(circuitBreaker);
    }

    // -------------------------
    // Core request shortcuts
    // -------------------------
    async get<T>(path: string, options?: RequestOptions) {
        return this.request<T>(path, { ...options, method: "GET" });
    }

    async post<T>(path: string, options?: RequestOptions) {
        return this.request<T>(path, { ...options, method: "POST" });
    }

    async put<T>(path: string, options?: RequestOptions) {
        return this.request<T>(path, { ...options, method: "PUT" });
    }

    async patch<T>(path: string, options?: RequestOptions) {
        return this.request<T>(path, { ...options, method: "PATCH" });
    }

    async delete<T>(path: string, options?: RequestOptions) {
        return this.request<T>(path, { ...options, method: "DELETE" });
    }

    // -------------------------
    // Paginated list requests
    // -------------------------
    async getList<T, TFilter extends FilterParams = FilterParams>(
        path: string,
        options?: ListOptions<TFilter>
    ): Promise<PaginatedResponse<T>> {
        const searchParams: Record<string, QueryParam> = {};

        // Add pagination params
        if (options?.pagination) {
            if (options.pagination.page !== undefined) {
                searchParams.page = options.pagination.page;
            }
            if (options.pagination.limit !== undefined) {
                searchParams.limit = options.pagination.limit;
            }
            if (options.pagination.offset !== undefined) {
                searchParams.offset = options.pagination.offset;
            }
        }

        // Add sort params
        if (options?.sort) {
            if (options.sort.field !== undefined) {
                searchParams.sort = options.sort.field;
            }
            if (options.sort.order !== undefined) {
                searchParams.order = options.sort.order;
            }
        }

        // Add filter params
        if (options?.filters) {
            Object.assign(searchParams, options.filters);
        }

        const { pagination, sort, filters, ...requestOptions } = options ?? {};

        return this.request<PaginatedResponse<T>>(path, {
            ...requestOptions,
            method: "GET",
            searchParams,
        });
    }
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
        const { validateResponse, skipRetry, ...requestOptions } = options;

        const executeRequest = async (): Promise<T> => {
            return this.circuitBreaker.execute(async () => {
                let url = this.buildUrl(path, requestOptions.searchParams);
                const {
                    headers: overrideHeaders,
                    body,
                    timeoutMs,
                    errorLocale,
                    ...rest
                } = requestOptions;

                const headers = this.mergeHeaders(overrideHeaders);
                const preparedBody = this.prepareBody(body);

                if (preparedBody && !(body instanceof FormData)) {
                    headers.set("Content-Type", "application/json");
                }

                const controller = new AbortController();
                const signal = controller.signal;
                const timeout = timeoutMs ?? this.timeoutMs;

                let init: RequestInit = {
                    ...rest,
                    headers,
                    body: preparedBody,
                    signal,
                };

                // Request interceptor
                if (this.interceptors?.request)
                    [url, init] = await this.interceptors.request(url, init);

                this.logger?.debug("HTTP Request", {
                    method: rest.method,
                    url,
                    body,
                });

                try {
                    const response = await this.withTimeout(
                        this.fetchImpl(url, init),
                        timeout,
                        controller
                    );

                    // Response interceptor
                    const finalResponse = this.interceptors?.response
                        ? await this.interceptors.response(response)
                        : response;

                    if (!finalResponse.ok) {
                        throw await this.toApiError(finalResponse, errorLocale);
                    }

                    if (finalResponse.status === 204) {
                        return undefined as T;
                    }

                    const contentType =
                        finalResponse.headers.get("content-type") || "";
                    let data: T;

                    if (/json/i.test(contentType)) {
                        data = (await finalResponse.json()) as T;
                    } else {
                        data = (await finalResponse.text()) as unknown as T;
                    }

                    // Validate response if schema provided
                    if (validateResponse) {
                        const errors = ResponseValidator.validate(
                            data,
                            validateResponse
                        );
                        if (errors.length > 0) {
                            throw new Error(
                                `Response validation failed: ${errors
                                    .map((e) => e.message)
                                    .join(", ")}`
                            );
                        }
                    }

                    this.logger?.debug("HTTP Response", {
                        status: finalResponse.status,
                        url,
                        data,
                    });

                    return data;
                } catch (err: any) {
                    if (err.name === "AbortError") {
                        throw new ApiError(
                            408,
                            "Timeout",
                            "Request timeout",
                            null,
                            true
                        );
                    }
                    this.logger?.error(
                        "Request failed",
                        { path, method: rest.method },
                        err
                    );
                    throw err;
                }
            });
        };

        // Use retry policy unless explicitly skipped
        if (skipRetry) {
            return executeRequest();
        }

        return this.retryPolicy.execute(executeRequest);
    }

    // -------------------------
    // Helpers
    // -------------------------
    private mergeHeaders(overrides?: HeadersInit) {
        const headers = new Headers(this.headers);
        if (overrides)
            new Headers(overrides).forEach((v, k) => headers.set(k, v));
        return headers;
    }

    private prepareBody(body?: RequestOptions["body"]) {
        if (!body) return undefined;
        if (
            body instanceof FormData ||
            typeof body === "string" ||
            body instanceof Blob ||
            body instanceof ArrayBuffer
        )
            return body;
        return JSON.stringify(body);
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        ms: number,
        controller: AbortController
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(
                () => {
                    controller.abort();
                    reject(
                        new ApiError(
                            408,
                            "Timeout",
                            "Request timeout",
                            null,
                            true
                        )
                    );
                },
                ms
            );
            promise
                .then((res) => {
                    clearTimeout(timer);
                    resolve(res);
                })
                .catch((err) => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    private buildUrl(
        path: string,
        params?: Record<string, QueryParam>
    ): string {
        const normalized = path.startsWith("/") ? path.slice(1) : path;
        const url = new URL(normalized, this.baseUrl);

        if (params) {
            const queryString = StringUtils.toQueryString(
                params as Record<string, unknown>
            );
            if (queryString) {
                url.search = url.search
                    ? `${url.search}&${queryString}`
                    : `?${queryString}`;
            }
        }

        return url.toString();
    }

    private async toApiError(response: Response, locale?: Locale) {
        let body: unknown;
        try {
            const type = response.headers.get("content-type") ?? "";
            body = type.includes("json")
                ? await response.json()
                : await response.text();
        } catch {
            body = null;
        }

        const message = this.resolveErrorMessage(
            response.status,
            response.statusText,
            locale
        );
        return new ApiError(
            response.status,
            response.statusText,
            message,
            body
        );
    }

    private resolveErrorMessage(
        status: number,
        statusText: string,
        overrideLocale?: Locale
    ): string {
        const locales = this.getLocalePreference(overrideLocale);
        for (const loc of locales) {
            const dict = {
                ...DEFAULT_ERROR_MESSAGES[loc],
                ...(this.errorMessages[loc] ?? {}),
            };
            if (dict[status]) return dict[status]!;
        }
        return (GENERIC_ERROR_MESSAGE[this.locale] ?? GENERIC_ERROR_MESSAGE.es)(
            status,
            statusText
        );
    }

    private getLocalePreference(override?: Locale): Locale[] {
        return Array.from(
            new Set([override, this.locale, "es", "en"].filter(Boolean))
        ) as Locale[];
    }
}

// -------------------------
// Factory (optional)
// -------------------------
export const createApiClient = (config: ApiClientConfig) =>
    new ApiClient(config);
