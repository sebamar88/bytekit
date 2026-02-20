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
