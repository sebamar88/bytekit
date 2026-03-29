import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiClient } from "../src/utils/core/ApiClient";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a mock fetch with concurrency tracking.
 * @param delayMs How long each request takes before resolving.
 * @param body    JSON-serialisable body of the mock response.
 */
function makeMockFetch(delayMs = 20, body: unknown = { ok: true }) {
    let concurrent = 0;
    let maxConcurrent = 0;
    let totalCalls = 0;

    const fetchImpl: typeof fetch = () => {
        concurrent++;
        totalCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);

        return new Promise<Response>((resolve) => {
            setTimeout(() => {
                concurrent--;
                resolve(
                    new Response(JSON.stringify(body), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    })
                );
            }, delayMs);
        });
    };

    return {
        fetchImpl,
        getMaxConcurrent: () => maxConcurrent,
        getTotalCalls: () => totalCalls,
    };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("ApiClient — RequestQueue & RequestBatcher integration (US4)", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("T037: queue: { concurrency } limits concurrent in-flight fetch calls", async () => {
        const mock = makeMockFetch(20, { id: 1 });
        const client = new ApiClient({
            baseUrl: "http://api.test",
            fetchImpl: mock.fetchImpl,
            queue: { concurrency: 3 },
        });

        // Fire 10 concurrent requests
        await Promise.all(
            Array.from({ length: 10 }, () => client.get<{ id: number }>("/items"))
        );

        expect(mock.getMaxConcurrent()).toBeLessThanOrEqual(3);
        expect(mock.getTotalCalls()).toBe(10);
    });

    it("T038: batch: { windowMs } coalesces same-URL GET requests into a single fetch", async () => {
        vi.useFakeTimers();
        let fetchCount = 0;

        const client = new ApiClient({
            baseUrl: "http://api.test",
            fetchImpl: () => {
                fetchCount++;
                return Promise.resolve(
                    new Response(JSON.stringify({ value: 42 }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    })
                );
            },
            batch: { windowMs: 100 },
        });

        const p1 = client.get<{ value: number }>("/data");
        const p2 = client.get<{ value: number }>("/data");
        const p3 = client.get<{ value: number }>("/data");

        await vi.advanceTimersByTimeAsync(100);

        const results = await Promise.all([p1, p2, p3]);
        expect(fetchCount).toBe(1); // Only one actual fetch
        expect(results).toEqual(Array(3).fill({ value: 42 }));
    });

    it("T039: ApiClient without queue or batch behaves exactly as before (no regression)", async () => {
        const mock = makeMockFetch(5, { id: 99 });
        const client = new ApiClient({
            baseUrl: "http://api.test",
            fetchImpl: mock.fetchImpl,
        });

        const results = await Promise.all([
            client.get<{ id: number }>("/item/1"),
            client.get<{ id: number }>("/item/2"),
            client.get<{ id: number }>("/item/3"),
        ]);

        // All responses match the mock body
        expect(results).toEqual(Array(3).fill({ id: 99 }));
        // All 3 fetches fired
        expect(mock.getTotalCalls()).toBe(3);
        // No concurrency limit → all 3 run in parallel
        expect(mock.getMaxConcurrent()).toBe(3);
    });

    it("queue and pool co-exist: queue takes priority over legacy pool option", async () => {
        const mock = makeMockFetch(10, { ok: true });
        const client = new ApiClient({
            baseUrl: "http://api.test",
            fetchImpl: mock.fetchImpl,
            // Both configured; queue should win (concurrency=2)
            queue: { concurrency: 2 },
            pool: { concurrency: 10 }, // would allow 10 if active
        });

        await Promise.all(
            Array.from({ length: 6 }, () => client.get<{ ok: boolean }>("/ping"))
        );

        expect(mock.getMaxConcurrent()).toBeLessThanOrEqual(2);
        expect(mock.getTotalCalls()).toBe(6);
    });
});
