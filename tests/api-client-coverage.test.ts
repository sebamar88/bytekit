import { ApiClient, ApiError } from "../src/index";

describe("ApiClient Coverage", () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        try {
            mock.reset();
        } catch {
            // Ignore reset errors
        }
    });

    it("should handle request timeout correctly", async () => {
        const mockFetch = vi.fn(
            () =>
                new Promise((resolve) => {
                    setTimeout(
                        () =>
                            resolve({
                                ok: true,
                                json: async () => ({}),
                            }),
                        200
                    );
                })
        );

        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            timeoutMs: 100,
            fetchImpl: (...args) => mockFetch(...args),
            retryPolicy: { maxAttempts: 1 }, // Solo 1 intento para el test
        });

        await assert.rejects(
            async () => {
                await client.get("/timeout");
            },
            (err) => {
                return (
                    err.name === "RetryError" ||
                    err instanceof ApiError ||
                    err.message.includes("timeout") ||
                    err.code === 408
                );
            }
        );
    });

    it("should merge default headers with request headers", async () => {
        let capturedHeaders;
        const mockFetch = vi.fn((url, options) => {
            capturedHeaders = options.headers;
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ "content-type": "application/json" }),
                json: async () => ({ success: true }),
            });
        });

        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            defaultHeaders: { "X-Test": "true" },
            fetchImpl: (...args) => mockFetch(...args),
        });

        await client.get("/headers", {
            headers: { "X-Custom": "value" },
        });

        // Headers check...
        if (capturedHeaders && typeof capturedHeaders.get === "function") {
            assert.equal(capturedHeaders.get("x-test"), "true");
            assert.equal(capturedHeaders.get("x-custom"), "value");
        } else {
            // Fallback if plain object
            assert.ok(capturedHeaders["X-Test"] || capturedHeaders["x-test"]);
        }
    });

    it("should handle network errors (fetch throws)", async () => {
        const mockFetch = vi.fn(() =>
            Promise.reject(new Error("Network Error"))
        );

        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            fetchImpl: (...args) => mockFetch(...args),
            retryPolicy: { maxAttempts: 1 }, // Solo 1 intento para el test
        });

        await assert.rejects(
            async () => {
                await client.get("/network-error");
            },
            (err) => {
                return (
                    err.name === "RetryError" || err.message === "Network Error"
                );
            }
        );
    });

    it("should handle non-JSON responses gracefully", async () => {
        const mockFetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ "content-type": "text/plain" }),
                text: async () => "Simple text response",
                json: async () => {
                    throw new Error("Invalid JSON");
                },
            })
        );

        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            fetchImpl: (...args) => mockFetch(...args),
        });

        const response = await client.get("/text");
        assert.equal(response, "Simple text response");
    });

    it("body is null when JSON parse fails in toApiError catch block (lines 878-881)", async () => {
        const mockFetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
                headers: new Headers({ "content-type": "application/json" }),
                json: () => Promise.reject(new Error("parse error")),
                text: () => Promise.reject(new Error("parse error")),
            })
        );
        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            fetchImpl: (...args) => mockFetch(...args),
            retryPolicy: { maxAttempts: 1, shouldRetry: () => false },
        });
        await assert.rejects(
            () => client.get("/boom"),
            (err) => {
                return err instanceof ApiError && err.body === null;
            }
        );
    });

    it("createApiClient factory returns a working ApiClient instance (line 926)", async () => {
        const { createApiClient } =
            await import("../src/utils/core/ApiClient.js");
        const client = createApiClient({ baseUrl: "https://api.example.com" });
        assert.ok(client instanceof ApiClient);
    });
});
