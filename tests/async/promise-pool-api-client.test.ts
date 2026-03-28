import { describe, it, expect } from "vitest";
import { ApiClient } from "../../src/utils/core/ApiClient";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a mock `fetch` implementation with concurrency tracking.
 * - `delayMs`: how long each "request" takes before resolving.
 * - `getMaxConcurrent()`: peak number of simultaneous in-flight calls.
 * - `getTotalCalls()`: total number of fetch invocations.
 */
function makeMockFetch(delayMs = 20, body: unknown = { ok: true }) {
    let concurrent = 0;
    let maxConcurrent = 0;
    let totalCalls = 0;

    const fetchImpl: typeof fetch = () => {
        concurrent++;
        totalCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);

        return new Promise<Response>((resolve) =>
            setTimeout(() => {
                concurrent--;
                resolve(
                    new Response(JSON.stringify(body), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    })
                );
            }, delayMs)
        );
    };

    return {
        fetchImpl,
        getMaxConcurrent: () => maxConcurrent,
        getTotalCalls: () => totalCalls,
    };
}

/**
 * Creates a mock `fetch` that returns a non-ok response for specific paths.
 */
function makeFetchWithErrors(
    delayMs = 10,
    errorPaths: Set<string> = new Set(),
    errorStatus = 500
) {
    const fetchImpl: typeof fetch = (input) => {
        const url = typeof input === "string" ? input : (input as Request).url;
        const path = new URL(url).pathname;

        return new Promise<Response>((resolve) =>
            setTimeout(() => {
                if (errorPaths.has(path)) {
                    resolve(
                        new Response(JSON.stringify({ error: "server error" }), {
                            status: errorStatus,
                            headers: { "Content-Type": "application/json" },
                        })
                    );
                } else {
                    resolve(
                        new Response(JSON.stringify({ ok: true }), {
                            status: 200,
                            headers: { "Content-Type": "application/json" },
                        })
                    );
                }
            }, delayMs)
        );
    };
    return { fetchImpl };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("ApiClient — PromisePool integration (US3)", () => {

    // T022 — pool limits concurrent in-flight fetch calls
    it("T022 — limits concurrent requests when pool option is configured", async () => {
        const { fetchImpl, getMaxConcurrent } = makeMockFetch(30);
        const client = new ApiClient({
            baseUrl: "http://example.com",
            fetchImpl,
            retryPolicy: { maxAttempts: 1 },
            pool: { concurrency: 2 },
        });

        await Promise.all(
            Array.from({ length: 6 }, (_, i) => client.get(`/path/${i}`))
        );

        expect(getMaxConcurrent()).toBeLessThanOrEqual(2);
    });

    // T023 — no pool option = no restriction (regression guard)
    it("T023 — ApiClient without pool option works as before (no regression)", async () => {
        const { fetchImpl, getTotalCalls, getMaxConcurrent } = makeMockFetch(10);
        const client = new ApiClient({
            baseUrl: "http://example.com",
            fetchImpl,
            retryPolicy: { maxAttempts: 1 },
            // intentionally no pool option
        });

        await Promise.all(
            Array.from({ length: 4 }, (_, i) => client.get(`/path/${i}`))
        );

        expect(getTotalCalls()).toBe(4);
        expect(getMaxConcurrent()).toBe(4); // all 4 start simultaneously
    });

    // pool: { concurrency: 1 } — fully sequential
    it("pool concurrency=1 — all requests run sequentially (maxConcurrent === 1)", async () => {
        const { fetchImpl, getMaxConcurrent, getTotalCalls } = makeMockFetch(20);
        const client = new ApiClient({
            baseUrl: "http://example.com",
            fetchImpl,
            retryPolicy: { maxAttempts: 1 },
            pool: { concurrency: 1 },
        });

        await Promise.all(
            Array.from({ length: 5 }, (_, i) => client.get(`/path/${i}`))
        );

        expect(getMaxConcurrent()).toBe(1);
        expect(getTotalCalls()).toBe(5);
    });

    // Large batch: 10 requests with concurrency=3
    it("pool concurrency=3 — 10 concurrent requests never exceed limit of 3", async () => {
        const { fetchImpl, getMaxConcurrent } = makeMockFetch(30);
        const client = new ApiClient({
            baseUrl: "http://example.com",
            fetchImpl,
            retryPolicy: { maxAttempts: 1 },
            pool: { concurrency: 3 },
        });

        await Promise.all(
            Array.from({ length: 10 }, (_, i) => client.get(`/item/${i}`))
        );

        expect(getMaxConcurrent()).toBeLessThanOrEqual(3);
    });

    // Correct response values are returned through the pool
    it("pool — correct response body is returned for each request", async () => {
        const body = { message: "hello" };
        const { fetchImpl } = makeMockFetch(10, body);
        const client = new ApiClient({
            baseUrl: "http://example.com",
            fetchImpl,
            retryPolicy: { maxAttempts: 1 },
            pool: { concurrency: 2 },
        });

        const results = await Promise.all([
            client.get<{ message: string }>("/a"),
            client.get<{ message: string }>("/b"),
        ]);

        expect(results[0].message).toBe("hello");
        expect(results[1].message).toBe("hello");
    });

    // HTTP errors propagate through the pool
    it("pool — HTTP error response propagates as a rejected promise", async () => {
        const { fetchImpl } = makeFetchWithErrors(10, new Set(["/fail"]), 503);
        const client = new ApiClient({
            baseUrl: "http://example.com",
            fetchImpl,
            retryPolicy: { maxAttempts: 1 },
            pool: { concurrency: 2 },
        });

        await expect(client.get("/fail")).rejects.toThrow();
    });

    // Successful requests alongside pool errors complete correctly
    it("pool — successful requests complete even when others fail", async () => {
        const { fetchImpl } = makeFetchWithErrors(10, new Set(["/bad"]), 400);
        const client = new ApiClient({
            baseUrl: "http://example.com",
            fetchImpl,
            retryPolicy: { maxAttempts: 1 },
            pool: { concurrency: 2 },
        });

        const [goodResult] = await Promise.allSettled([
            client.get<{ ok: boolean }>("/good"),
            client.get("/bad"),
        ]);

        expect(goodResult.status).toBe("fulfilled");
        expect((goodResult as PromiseFulfilledResult<{ ok: boolean }>).value.ok).toBe(true);
    });
});
