import { ApiClient } from "../src/index";

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

test("ApiClient should convert Headers object to plain object before passing to fetch", async () => {
    let capturedInit;
    const fetchImpl = async (url, init) => {
        capturedInit = init;
        return jsonResponse({ success: true });
    };

    const client = new ApiClient({
        baseURL: "https://api.example.com",
        defaultHeaders: {
            Authorization: "Bearer test-token",
            "X-Custom-Header": "custom-value",
        },
        fetchImpl,
    });

    await client.get("/test");

    // Headers should be a plain object, not a Headers instance
    assert.strictEqual(typeof capturedInit.headers, "object");
    assert.strictEqual(capturedInit.headers instanceof Headers, false);

    // Should have all the headers (normalized to lowercase)
    assert.deepStrictEqual(capturedInit.headers, {
        authorization: "Bearer test-token",
        "x-custom-header": "custom-value",
    });
});

test("ApiClient should preserve Authorization header in POST requests", async () => {
    let capturedInit;
    const fetchImpl = async (url, init) => {
        capturedInit = init;
        return jsonResponse({ success: true });
    };

    const client = new ApiClient({
        baseURL: "https://api.example.com",
        defaultHeaders: {
            Authorization: "Bearer test-token",
        },
        fetchImpl,
    });

    await client.post("/chat", { message: "hello" });

    assert.deepStrictEqual(capturedInit.headers, {
        authorization: "Bearer test-token",
        "content-type": "application/json",
    });
});

test("ApiClient should not override Content-Type if already set", async () => {
    let capturedInit;
    const fetchImpl = async (url, init) => {
        capturedInit = init;
        return jsonResponse({ success: true });
    };

    const client = new ApiClient({
        baseURL: "https://api.example.com",
        defaultHeaders: {
            "Content-Type": "text/plain",
        },
        fetchImpl,
    });

    await client.post("/data", { text: "hello" });

    // Should keep the original Content-Type
    assert.strictEqual(capturedInit.headers["content-type"], "text/plain");
});

test("ApiClient should auto-set Content-Type only if not present", async () => {
    let capturedInit;
    const fetchImpl = async (url, init) => {
        capturedInit = init;
        return jsonResponse({ success: true });
    };

    const client = new ApiClient({
        baseURL: "https://api.example.com",
        defaultHeaders: {
            Authorization: "Bearer token",
        },
        fetchImpl,
    });

    await client.post("/data", { text: "hello" });

    // Should auto-set Content-Type to application/json
    assert.strictEqual(
        capturedInit.headers["content-type"],
        "application/json"
    );
});

test("ApiClient should merge request headers with default headers", async () => {
    let capturedInit;
    const fetchImpl = async (url, init) => {
        capturedInit = init;
        return jsonResponse({ success: true });
    };

    const client = new ApiClient({
        baseURL: "https://api.example.com",
        defaultHeaders: {
            Authorization: "Bearer token",
            "X-Default": "default",
        },
        fetchImpl,
    });

    await client.get("/test", {
        headers: {
            "X-Request": "request",
        },
    });

    assert.deepStrictEqual(capturedInit.headers, {
        authorization: "Bearer token",
        "x-default": "default",
        "x-request": "request",
    });
});

test("ApiClient should allow overriding default headers in request", async () => {
    let capturedInit;
    const fetchImpl = async (url, init) => {
        capturedInit = init;
        return jsonResponse({ success: true });
    };

    const client = new ApiClient({
        baseURL: "https://api.example.com",
        defaultHeaders: {
            Authorization: "Bearer default-token",
        },
        fetchImpl,
    });

    await client.get("/test", {
        headers: {
            Authorization: "Bearer override-token",
        },
    });

    assert.strictEqual(
        capturedInit.headers["authorization"],
        "Bearer override-token"
    );
});
