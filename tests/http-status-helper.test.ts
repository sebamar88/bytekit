
import assert from "node:assert";
import {
    HTTP_STATUS,
    isSuccess,
    isRedirect,
    isClientError,
    isServerError,
    isError,
    getStatusMessage,
    getStatusCategory,
    isRetryable,
    isCacheable,
} from "../src/utils/helpers/HttpStatusHelper";

test("HTTP_STATUS constants are defined", () => {
    assert.strictEqual(HTTP_STATUS.OK, 200);
    assert.strictEqual(HTTP_STATUS.CREATED, 201);
    assert.strictEqual(HTTP_STATUS.BAD_REQUEST, 400);
    assert.strictEqual(HTTP_STATUS.UNAUTHORIZED, 401);
    assert.strictEqual(HTTP_STATUS.NOT_FOUND, 404);
    assert.strictEqual(HTTP_STATUS.INTERNAL_SERVER_ERROR, 500);
});

test("isSuccess identifies 2xx status codes", () => {
    assert.strictEqual(isSuccess(200), true);
    assert.strictEqual(isSuccess(201), true);
    assert.strictEqual(isSuccess(204), true);
    assert.strictEqual(isSuccess(299), true);
    assert.strictEqual(isSuccess(199), false);
    assert.strictEqual(isSuccess(300), false);
});

test("isRedirect identifies 3xx status codes", () => {
    assert.strictEqual(isRedirect(300), true);
    assert.strictEqual(isRedirect(301), true);
    assert.strictEqual(isRedirect(302), true);
    assert.strictEqual(isRedirect(399), true);
    assert.strictEqual(isRedirect(200), false);
    assert.strictEqual(isRedirect(400), false);
});

test("isClientError identifies 4xx status codes", () => {
    assert.strictEqual(isClientError(400), true);
    assert.strictEqual(isClientError(401), true);
    assert.strictEqual(isClientError(404), true);
    assert.strictEqual(isClientError(429), true);
    assert.strictEqual(isClientError(499), true);
    assert.strictEqual(isClientError(200), false);
    assert.strictEqual(isClientError(500), false);
});

test("isServerError identifies 5xx status codes", () => {
    assert.strictEqual(isServerError(500), true);
    assert.strictEqual(isServerError(502), true);
    assert.strictEqual(isServerError(503), true);
    assert.strictEqual(isServerError(599), true);
    assert.strictEqual(isServerError(200), false);
    assert.strictEqual(isServerError(400), false);
});

test("isError identifies 4xx and 5xx status codes", () => {
    assert.strictEqual(isError(400), true);
    assert.strictEqual(isError(404), true);
    assert.strictEqual(isError(500), true);
    assert.strictEqual(isError(503), true);
    assert.strictEqual(isError(200), false);
    assert.strictEqual(isError(301), false);
});

test("getStatusMessage returns correct messages", () => {
    assert.strictEqual(getStatusMessage(200), "OK");
    assert.strictEqual(getStatusMessage(201), "Created");
    assert.strictEqual(getStatusMessage(400), "Bad Request");
    assert.strictEqual(getStatusMessage(401), "Unauthorized");
    assert.strictEqual(getStatusMessage(404), "Not Found");
    assert.strictEqual(getStatusMessage(500), "Internal Server Error");
    assert.strictEqual(getStatusMessage(503), "Service Unavailable");
    assert.strictEqual(getStatusMessage(999), "Unknown Status");
});

test("getStatusCategory returns correct categories", () => {
    assert.strictEqual(getStatusCategory(200), "success");
    assert.strictEqual(getStatusCategory(301), "redirect");
    assert.strictEqual(getStatusCategory(404), "client_error");
    assert.strictEqual(getStatusCategory(500), "server_error");
    assert.strictEqual(getStatusCategory(999), "unknown");
});

test("isRetryable identifies retryable status codes", () => {
    assert.strictEqual(isRetryable(408), true); // Request Timeout
    assert.strictEqual(isRetryable(429), true); // Too Many Requests
    assert.strictEqual(isRetryable(500), true); // Internal Server Error
    assert.strictEqual(isRetryable(502), true); // Bad Gateway
    assert.strictEqual(isRetryable(503), true); // Service Unavailable
    assert.strictEqual(isRetryable(504), true); // Gateway Timeout
    assert.strictEqual(isRetryable(200), false);
    assert.strictEqual(isRetryable(404), false);
});

test("isCacheable identifies cacheable status codes", () => {
    assert.strictEqual(isCacheable(200), true); // OK
    assert.strictEqual(isCacheable(301), true); // Moved Permanently
    assert.strictEqual(isCacheable(404), true); // Not Found
    assert.strictEqual(isCacheable(500), false);
    assert.strictEqual(isCacheable(503), false);
});
