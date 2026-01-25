import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { ApiClient, ApiError } from "../dist/index.js";

describe("ApiClient Coverage", () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        try {
            mock.reset();
        } catch {
            // Ignore reset errors
        }
    });

    it("should handle request timeout correctly", async () => {
        const mockFetch = mock.fn(
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
            fetchImpl: (...args) => mockFetch(...args)
        });

        await assert.rejects(
            async () => {
                await client.get("/timeout");
            },
            (err) => {
                return err instanceof ApiError || err.message.includes("timeout") || err.code === 408;
            }
        );
    });

    it("should merge default headers with request headers", async () => {
        let capturedHeaders;
        const mockFetch = mock.fn((url, options) => {
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
            fetchImpl: (...args) => mockFetch(...args)
        });

        await client.get("/headers", {
            headers: { "X-Custom": "value" },
        });

        // Headers check...
        if (capturedHeaders && typeof capturedHeaders.get === 'function') {
             assert.equal(capturedHeaders.get("x-test"), "true");
             assert.equal(capturedHeaders.get("x-custom"), "value");
        } else {
             // Fallback if plain object
             assert.ok(capturedHeaders["X-Test"] || capturedHeaders["x-test"]);
        }
    });

    it("should handle network errors (fetch throws)", async () => {
        const mockFetch = mock.fn(() => Promise.reject(new Error("Network Error")));

        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            fetchImpl: (...args) => mockFetch(...args)
        });

        await assert.rejects(
            async () => {
                await client.get("/network-error");
            },
            {
                message: "Network Error", 
            }
        );
    });

    it("should handle non-JSON responses gracefully", async () => {
        const mockFetch = mock.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ "content-type": "text/plain" }),
                text: async () => "Simple text response",
                json: async () => { throw new Error("Invalid JSON"); }
            })
        );

        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            fetchImpl: (...args) => mockFetch(...args)
        });

        const response = await client.get("/text");
        assert.equal(response, "Simple text response");
    });
});
