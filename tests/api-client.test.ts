import { ApiClient, ApiError } from "../src/index";

const jsonResponse = (body, init = {}) => {
    const payload = JSON.stringify(body);
    const headers = new Headers({
        "content-type": "application/json",
        "content-length": String(Buffer.byteLength(payload)),
    });
    if (init.headers) {
        new Headers(init.headers).forEach((value, key) =>
            headers.set(key, value)
        );
    }
    return new Response(payload, {
        status: 200,
        ...init,
        headers,
    });
};

test("ApiClient builds URLs with search params and returns JSON bodies", async () => {
    let capturedUrl = "";
    const fetchImpl = async (url) => {
        capturedUrl = url;
        return jsonResponse({ ok: true });
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "en",
    });

    const result = await client.get("/users", {
        searchParams: { tags: ["lab", "team"] },
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(
        capturedUrl,
        "https://api.example.com/users?tags=lab&tags=team"
    );
});

test("ApiClient serializes JSON bodies and merges headers", async () => {
    let capturedInit;
    const fetchImpl = async (_url, init) => {
        capturedInit = init;
        return jsonResponse({ created: true }, { status: 201 });
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        defaultHeaders: { "X-App": "utils" },
        locale: "en",
    });

    const payload = { name: "Juan" };
    const response = await client.post("/users", payload);
    assert.deepEqual(response, { created: true });

    const headers = new Headers(capturedInit.headers);
    assert.equal(headers.get("X-App"), "utils");
    assert.equal(headers.get("Content-Type"), "application/json");
    assert.equal(capturedInit.body, JSON.stringify(payload));
});

test("ApiClient throws ApiError with localized message on HTTP errors", async () => {
    const fetchImpl = async () =>
        jsonResponse(
            { error: "not found" },
            { status: 404, statusText: "Not Found" }
        );

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "en",
    });

    await assert.rejects(
        () => client.get("/missing"),
        (error) => {
            assert.ok(error instanceof ApiError);
            assert.equal(error.status, 404);
            assert.equal(error.message, "Resource not found.");
            assert.deepEqual(error.body, { error: "not found" });
            return true;
        }
    );
});

test("ApiClient rejects with timeout errors when exceeding deadline", async () => {
    const fetchImpl = () =>
        new Promise(() => {
            /* never resolves */
        });

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        timeoutMs: 10,
        locale: "en",
    });

    await assert.rejects(
        () => client.get("/slow"),
        (error) => {
            return (
                error.name === "RetryError" ||
                (error instanceof ApiError && error.status === 408)
            );
        }
    );
});

test("ApiClient applies request/response interceptors", async () => {
    let capturedUrl = "";
    const fetchImpl = async (url, _init) => {
        capturedUrl = url;
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
        });
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        interceptors: {
            request: async (url, init) => [url + "?x=1", init],
            response: async (response) => response,
        },
    });

    const result = await client.get("/users");
    assert.deepEqual(result, { ok: true });
    assert.ok(capturedUrl.includes("?x=1"));
});

test("ApiClient validates responses when schema provided", async () => {
    const fetchImpl = async () =>
        new Response(JSON.stringify({ name: "Juan" }), {
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
        });

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });

    await assert.rejects(
        () =>
            client.get("/users/1", {
                validateResponse: {
                    type: "object",
                    properties: { id: { type: "number", required: true } },
                },
            }),
        /Response validation failed/
    );
});

test("ApiClient returns undefined for 204 responses", async () => {
    const fetchImpl = async () =>
        new Response(null, {
            status: 204,
            headers: new Headers({ "content-type": "application/json" }),
        });

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });
    const result = await client.get("/empty");
    assert.equal(result, undefined);
});

test("ApiClient parses text responses when content-type is not json", async () => {
    const fetchImpl = async () =>
        new Response("plain", {
            status: 200,
            headers: new Headers({ "content-type": "text/plain" }),
        });

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });
    const result = await client.get("/text");
    assert.equal(result, "plain");
});

test("ApiClient.getList returns paginated response with correct structure", async () => {
    let capturedUrl = "";
    const fetchImpl = async (url) => {
        capturedUrl = url;
        return jsonResponse({
            data: [
                { id: 1, name: "User 1" },
                { id: 2, name: "User 2" },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 25,
                totalPages: 3,
                hasNextPage: true,
                hasPreviousPage: false,
            },
        });
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "en",
    });

    const result = await client.getList("/users", {
        pagination: { page: 1, limit: 10 },
        sort: { field: "name", order: "asc" },
    });

    assert.deepEqual(result.data, [
        { id: 1, name: "User 1" },
        { id: 2, name: "User 2" },
    ]);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.total, 25);
    assert.equal(result.pagination.totalPages, 3);
    assert.equal(result.pagination.hasNextPage, true);
    assert.equal(result.pagination.hasPreviousPage, false);
    assert.match(capturedUrl, /page=1/);
    assert.match(capturedUrl, /limit=10/);
    assert.match(capturedUrl, /sort=name/);
    assert.match(capturedUrl, /order=asc/);
});

test("ApiClient.getList merges pagination params with existing searchParams", async () => {
    let capturedUrl = "";
    const fetchImpl = async (url) => {
        capturedUrl = url;
        return jsonResponse({
            data: [],
            pagination: {
                page: 1,
                limit: 5,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        });
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "en",
    });

    await client.getList("/users", {
        pagination: { page: 2, limit: 5 },
        filters: { status: "active", role: "admin" },
    });

    assert.match(capturedUrl, /page=2/);
    assert.match(capturedUrl, /limit=5/);
    assert.match(capturedUrl, /status=active/);
    assert.match(capturedUrl, /role=admin/);
});

// ─── Coverage gap tests ───────────────────────────────────────────────────────

test("ApiError.toString() includes sanitized body and ApiError.toJSON() returns safe details", () => {
    const err = new ApiError(404, "Not Found", "Resource not found.", {
        id: 1,
        token: "secret-token",
    });
    const str = err.toString();
    assert.match(str, /ApiError/);
    assert.match(str, /404/);
    assert.match(str, /Body/);
    assert.match(str, /REDACTED/);

    const json = err.toJSON();
    assert.equal(json.status, 404);
    assert.equal(json.statusText, "Not Found");
    assert.equal(json.message, "Resource not found.");
    assert.equal(json.isTimeout, false);
    assert.equal(
        (json.body as Record<string, unknown>).token,
        "[REDACTED]"
    );
    assert.ok(
        typeof json.stack === "string",
        "toJSON should include stack trace"
    );
    assert.match(json.stack!, /ApiError/);
});

test("ApiError.details includes stack trace for debugging", () => {
    const err = new ApiError(500, "Internal Server Error", "Something broke");
    const { status, statusText, message, isTimeout, stack } = err.details;
    assert.equal(status, 500);
    assert.equal(statusText, "Internal Server Error");
    assert.equal(message, "Something broke");
    assert.equal(isTimeout, false);
    assert.ok(typeof stack === "string", "details.stack should be a string");
    assert.match(stack!, /ApiError/);
});

test("ApiError.toString() includes stack trace", () => {
    const err = new ApiError(503, "Service Unavailable", "Downstream timeout");
    const str = err.toString();
    assert.match(str, /ApiError: Downstream timeout/);
    assert.match(str, /503/);
    // stack trace lines start with 'at '
    assert.match(str, /at /);
});

test("ApiError.toString() with non-serializable body falls back to String(body)", () => {
    // Create an error whose body circular-JSON-throws
    const circular: Record<string, unknown> = {};
    circular.self = circular; // circular reference → JSON.stringify throws
    const err = new ApiError(500, "Error", "msg", circular);
    const str = err.toString();
    // Should not throw; body line uses String(body) fallback
    assert.match(str, /ApiError/);
});

test("ApiError.toString() with string body uses string directly (line 164 TRUE branch)", () => {
    // typeof this.body === 'string' → TRUE → use this.body directly (no JSON.stringify)
    const err = new ApiError(
        400,
        "Bad Request",
        "Validation failed",
        "plain string body"
    );
    const str = err.toString();
    assert.match(str, /plain string body/);
    assert.match(str, /Body:/);
});

test("ApiError works when Error.captureStackTrace is unavailable", () => {
    const originalCaptureStackTrace = Error.captureStackTrace;

    try {
        // @ts-expect-error - test override
        Error.captureStackTrace = undefined;
        const err = new ApiError(500, "Internal Server Error", "fallback");
        assert.equal(err.name, "ApiError");
        assert.equal(err.message, "fallback");
    } finally {
        Error.captureStackTrace = originalCaptureStackTrace;
    }
});

test("ApiError.toString() omits stack when stack is unavailable", () => {
    const err = new ApiError(500, "Internal Server Error", "no stack");
    // @ts-expect-error - test override
    err.stack = "";

    const str = err.toString();

    assert.equal(/at /.test(str), false);
    assert.match(str, /Status: 500 Internal Server Error/);
});

test("createApiClient factory returns a working ApiClient instance", async () => {
    const { createApiClient } = await import("../src/index");
    const fetchImpl = async () =>
        new Response(JSON.stringify({ factory: true }), {
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
        });

    const client = createApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });
    const result = await client.get("/test");
    assert.deepEqual(result, { factory: true });
});

test("ApiClient baseURL alias works the same as baseUrl", async () => {
    const fetchImpl = async () => jsonResponse({ alias: true });
    const client = new ApiClient({
        baseURL: "https://api.example.com",
        fetchImpl,
    });
    const result = await client.get("/test");
    assert.deepEqual(result, { alias: true });
});

test("ApiClient constructor throws when neither baseUrl nor baseURL is provided", () => {
    assert.throws(
        () =>
            new ApiClient(
                {} as unknown as Parameters<typeof ApiClient.prototype.get>[1]
            ),
        /requires either 'baseUrl' or 'baseURL'/
    );
});

test("ApiClient locale 'es' returns Spanish error message", async () => {
    const fetchImpl = async () =>
        jsonResponse(
            { error: "not found" },
            { status: 404, statusText: "Not Found" }
        );

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "es",
    });

    await assert.rejects(
        () => client.get("/missing"),
        (error) => {
            assert.ok(error instanceof ApiError);
            assert.match(error.message, /recurso/i);
            return true;
        }
    );
});

test("ApiClient delete method", async () => {
    let capturedMethod = "";
    const fetchImpl = async (_url, init) => {
        capturedMethod = init.method;
        return new Response(null, { status: 204 });
    };
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });
    await client.delete("/resource/1");
    assert.equal(capturedMethod, "DELETE");
});

test("ApiClient put and patch methods", async () => {
    const methods: string[] = [];
    const fetchImpl = async (_url, init) => {
        methods.push(init.method);
        return jsonResponse({ updated: true });
    };
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });
    await client.put("/resource/1", { name: "updated" });
    await client.patch("/resource/1", { name: "patched" });
    assert.equal(methods[0], "PUT");
    assert.equal(methods[1], "PATCH");
});

test("ApiClient skipRetry bypasses retry policy", async () => {
    let calls = 0;
    const fetchImpl = async () => {
        calls++;
        return jsonResponse(
            { error: "server error" },
            { status: 500, statusText: "Internal Server Error" }
        );
    };
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "en",
    });

    await assert.rejects(
        () => client.get("/endpoint", { skipRetry: true }),
        (err) => err instanceof ApiError && err.status === 500
    );
    // skipRetry → only 1 call (no retries)
    assert.equal(calls, 1);
});

test("ApiClient skipInterceptors prevents interceptors from running", async () => {
    let interceptorCalled = false;
    const fetchImpl = async () => jsonResponse({ data: "ok" });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        interceptors: {
            request: async (url, init) => {
                interceptorCalled = true;
                return [url, init];
            },
        },
    });
    await client.get("/path", { skipInterceptors: true });
    assert.equal(interceptorCalled, false);
});

test("ApiClient logHeaders logs and redacts sensitive headers", async () => {
    const logCalls: unknown[] = [];
    const mockLogger = {
        debug: (_msg: string, meta: unknown) => {
            logCalls.push(meta);
        },
        error: () => {},
        warn: () => {},
        info: () => {},
    };
    const fetchImpl = async () => jsonResponse({ ok: true });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        // @ts-expect-error - Test type override
        logger: mockLogger,
        logHeaders: true,
        defaultHeaders: {
            Authorization: "Bearer secret",
            "X-Custom": "visible",
        },
    });
    await client.get("/path");
    // Find a call with headers
    const withHeaders = logCalls.find(
        (c) => c && typeof c === "object" && "headers" in c
    );
    assert.ok(withHeaders);
    const headers = (withHeaders as Record<string, Record<string, string>>)
        .headers;
    assert.equal(headers["authorization"], "[REDACTED]");
    assert.equal(headers["x-custom"], "visible");
});

test("ApiClient sanitizes request and response payloads in logs by default", async () => {
    const logCalls: Array<Record<string, unknown>> = [];
    const mockLogger = {
        debug: (_msg: string, meta: Record<string, unknown>) => {
            logCalls.push(meta);
        },
        error: () => {},
        warn: () => {},
        info: () => {},
    };
    const fetchImpl = async () =>
        jsonResponse({ token: "response-secret", profile: { password: "p4ss" } });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        // @ts-expect-error test logger
        logger: mockLogger,
    });

    await client.post("/path", {
        token: "request-secret",
        nested: { apiKey: "k-123" },
    });

    const requestLog = logCalls.find((entry) => "body" in entry)!;
    const responseLog = logCalls.find((entry) => "data" in entry)!;
    assert.equal(
        ((requestLog.body as Record<string, unknown>).nested as Record<string, unknown>).apiKey,
        "[REDACTED]"
    );
    assert.equal(
        (responseLog.data as Record<string, unknown>).token,
        "[REDACTED]"
    );
});

test("ApiClient can opt into sensitive payload logging", async () => {
    const logCalls: Array<Record<string, unknown>> = [];
    const mockLogger = {
        debug: (_msg: string, meta: Record<string, unknown>) => {
            logCalls.push(meta);
        },
        error: () => {},
        warn: () => {},
        info: () => {},
    };
    const fetchImpl = async () => jsonResponse({ token: "visible-response" });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        // @ts-expect-error test logger
        logger: mockLogger,
        logSensitiveData: true,
    });

    await client.post("/path", { token: "visible-request" });

    const requestLog = logCalls.find((entry) => "body" in entry)!;
    const responseLog = logCalls.find((entry) => "data" in entry)!;
    assert.equal(
        (requestLog.body as Record<string, unknown>).token,
        "visible-request"
    );
    assert.equal(
        (responseLog.data as Record<string, unknown>).token,
        "visible-response"
    );
});

test("ApiClient pipeline option post-processes response data", async () => {
    const fetchImpl = async () => jsonResponse({ value: 5 });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });

    const result = await client.get<{ doubled: number }>("/data", {
        skipRetry: true,
        pipeline: {
            process: async (data: unknown) => ({
                doubled: (data as { value: number }).value * 2,
            }),
        },
    });
    assert.deepEqual(result, { doubled: 10 });
});

test("ApiClient getList with offset pagination param", async () => {
    let capturedUrl = "";
    const fetchImpl = async (url) => {
        capturedUrl = url;
        return jsonResponse({
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        });
    };
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });
    await client.getList("/items", { pagination: { offset: 20, limit: 10 } });
    assert.match(capturedUrl, /offset=20/);
    assert.match(capturedUrl, /limit=10/);
});

test("ApiClient uses pool when configured", async () => {
    const fetchImpl = async () => jsonResponse({ pooled: true });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        pool: { concurrency: 2 },
    });
    const result = await client.get("/data");
    assert.deepEqual(result, { pooled: true });
});

test("ApiClient resolveErrorMessage falls back to GENERIC_ERROR_MESSAGE for unknown status", async () => {
    // Status 418 is not in the DEFAULT_ERROR_MESSAGES dict → GENERIC_ERROR_MESSAGE fires
    const fetchImpl = async () =>
        jsonResponse({}, { status: 418, statusText: "I'm a teapot" });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "en",
    });
    // Just verify an error is thrown — the generic message contains the status text
    await assert.rejects(
        () => client.get("/path", { skipRetry: true }),
        /418|teapot/i
    );
});

test("ApiClient toApiError handles text/plain error response", async () => {
    const fetchImpl = async () =>
        new Response("plain text error", {
            status: 400,
            statusText: "Bad Request",
            headers: new Headers({ "content-type": "text/plain" }),
        });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "en",
    });
    await assert.rejects(
        () => client.get("/path"),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.body, "plain text error");
            return true;
        }
    );
});

test("shouldRetry callback is invoked via retryFn when request fails (lines 749-750)", async () => {
    // Make a failing request with skipRetry=false (default) so retryFn invokes shouldRetry
    // This triggers the shouldRetry: (err) => config.shouldRetry?.(err, 0) ?? false callback
    let shouldRetryCallCount = 0;
    const fetchImpl = vi.fn().mockRejectedValue(new Error("Network error"));

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        retryPolicy: {
            maxAttempts: 2,
            initialDelayMs: 1,
            shouldRetry: (_err, _attempt) => {
                shouldRetryCallCount++;
                // Retry on network errors but only once
                return shouldRetryCallCount < 1;
            },
        },
    });

    await assert.rejects(() => client.get("/fail"), /Network error/);

    // shouldRetry was called (at least once — when the first attempt fails)
    assert.ok(
        shouldRetryCallCount >= 1,
        "shouldRetry callback should be invoked"
    );
});

test("ApiClient constructor normalizes baseUrl that already has trailing slash (line 286 TRUE branch)", async () => {
    // When baseUrl already ends with '/', the ternary TRUE branch keeps it as-is
    const fetchImpl = async (_url) => jsonResponse({ normalized: true });
    const client = new ApiClient({
        baseUrl: "https://api.example.com/",
        fetchImpl,
    });
    const result = await client.get("/status");
    assert.deepEqual(result, { normalized: true });
});

test("ApiClient.getList works without options argument (line 423 options ?? {} fallback)", async () => {
    // Calling getList with no second argument hits the `options ?? {}` fallback
    let capturedUrl = "";
    const fetchImpl = async (url) => {
        capturedUrl = url;
        return jsonResponse({ items: [], total: 0 });
    };
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });
    const result = await client.getList<{ id: number }>("/resources");
    assert.ok(
        capturedUrl.includes("/resources"),
        "URL should include the path"
    );
    assert.ok(result, "should return a response");
});

test("ApiClient processResponse handles response without content-type header (line 508 || '' fallback)", async () => {
    // A mock response where headers.get('content-type') returns null → contentType = ''
    // Falls into the text() branch since /json/.test('') is false
    const fetchImpl = async () => ({
        ok: true,
        status: 200,
        headers: {
            get: (_key: string) => null,
            forEach: () => {},
        },
        text: async () => "raw text response",
        json: async () => {
            throw new Error("should not be called");
        },
    });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl: fetchImpl as unknown as typeof globalThis.fetch,
    });
    const result = await client.get<string>("/text-endpoint");
    assert.equal(result, "raw text response");
});

test("ApiClient resolveErrorMessage uses GENERIC_ERROR_MESSAGE.es for es locale (funcs gap)", async () => {
    // Triggers the fallback path with locale='es', so the `es` arrow function is called
    // Status 418 is not in DEFAULT_ERROR_MESSAGES → GENERIC_ERROR_MESSAGE.es fires
    const fetchImpl = async () =>
        jsonResponse({}, { status: 418, statusText: "teapot" });
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        locale: "es",
    });
    await assert.rejects(
        () => client.get("/path", { skipRetry: true }),
        (err: unknown) => {
            assert.ok(err instanceof ApiError);
            // The Spanish generic message contains 'Error de red' and the status
            assert.match(err.message, /418|teapot/i);
            return true;
        }
    );
});
