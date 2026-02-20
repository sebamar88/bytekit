

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
                return err.name === "RetryError" || err.message === "Network Error";
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
});
