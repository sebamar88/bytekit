/**
 * HTTP Status Code Helpers
 * Utilities for working with HTTP status codes
 */

export const HTTP_STATUS = {
    // 2xx Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    RESET_CONTENT: 205,
    PARTIAL_CONTENT: 206,

    // 3xx Redirection
    MULTIPLE_CHOICES: 300,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    TEMPORARY_REDIRECT: 307,
    PERMANENT_REDIRECT: 308,

    // 4xx Client Error
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    GONE: 410,
    LENGTH_REQUIRED: 411,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    URI_TOO_LONG: 414,
    UNSUPPORTED_MEDIA_TYPE: 415,
    RANGE_NOT_SATISFIABLE: 416,
    EXPECTATION_FAILED: 417,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // 5xx Server Error
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    HTTP_VERSION_NOT_SUPPORTED: 505,
} as const;

/**
 * Check if status code is a success (2xx)
 */
export function isSuccess(status: number): boolean {
    return status >= 200 && status < 300;
}

/**
 * Check if status code is a redirect (3xx)
 */
export function isRedirect(status: number): boolean {
    return status >= 300 && status < 400;
}

/**
 * Check if status code is a client error (4xx)
 */
export function isClientError(status: number): boolean {
    return status >= 400 && status < 500;
}

/**
 * Check if status code is a server error (5xx)
 */
export function isServerError(status: number): boolean {
    return status >= 500 && status < 600;
}

/**
 * Check if status code is an error (4xx or 5xx)
 */
export function isError(status: number): boolean {
    return isClientError(status) || isServerError(status);
}

/**
 * Get human-readable message for status code
 */
export function getStatusMessage(status: number): string {
    const messages: Record<number, string> = {
        // 2xx
        200: "OK",
        201: "Created",
        202: "Accepted",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",

        // 3xx
        300: "Multiple Choices",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        307: "Temporary Redirect",
        308: "Permanent Redirect",

        // 4xx
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Payload Too Large",
        414: "URI Too Long",
        415: "Unsupported Media Type",
        416: "Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        429: "Too Many Requests",

        // 5xx
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported",
    };

    return messages[status] || "Unknown Status";
}

/**
 * Get status category name
 */
export function getStatusCategory(
    status: number
): "success" | "redirect" | "client_error" | "server_error" | "unknown" {
    if (isSuccess(status)) return "success";
    if (isRedirect(status)) return "redirect";
    if (isClientError(status)) return "client_error";
    if (isServerError(status)) return "server_error";
    return "unknown";
}

/**
 * Check if status is retryable
 */
export function isRetryable(status: number): boolean {
    return (
        status === 408 || // Request Timeout
        status === 429 || // Too Many Requests
        status === 500 || // Internal Server Error
        status === 502 || // Bad Gateway
        status === 503 || // Service Unavailable
        status === 504 // Gateway Timeout
    );
}

/**
 * Check if status is cacheable
 */
export function isCacheable(status: number): boolean {
    return (
        status === 200 || // OK
        status === 203 || // Non-Authoritative Information
        status === 204 || // No Content
        status === 206 || // Partial Content
        status === 300 || // Multiple Choices
        status === 301 || // Moved Permanently
        status === 404 || // Not Found
        status === 405 || // Method Not Allowed
        status === 410 || // Gone
        status === 414 || // URI Too Long
        status === 501 // Not Implemented
    );
}
