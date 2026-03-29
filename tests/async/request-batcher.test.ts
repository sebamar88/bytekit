import { describe, it, expect, vi, afterEach } from "vitest";
import { RequestBatcher } from "../../src/utils/async/request-batcher";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFetcher<T>(result: T) {
    return vi.fn((_url: string, _init: RequestInit) => Promise.resolve(result));
}

function makeFailingFetcher(error: Error) {
    return vi.fn(
        (_url: string, _init: RequestInit) =>
            Promise.reject(error) as Promise<never>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

describe("RequestBatcher", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe("US3 — Batching", () => {
        it("T022: 5 same-key requests → fetcher called exactly once, all resolve to same value", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher({ data: "result" });
            const batcher = new RequestBatcher({ windowMs: 100 });

            const promises = Array.from({ length: 5 }, () =>
                batcher.add("/api", { method: "GET" }, fetcher)
            );

            await vi.advanceTimersByTimeAsync(100);

            expect(fetcher).toHaveBeenCalledTimes(1);
            const results = await Promise.all(promises);
            expect(results).toEqual(Array(5).fill({ data: "result" }));
        });

        it("T023: windowMs elapsed → batch auto-dispatches without explicit flush()", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("ok");
            const batcher = new RequestBatcher({ windowMs: 200 });

            const p = batcher.add("/api", { method: "GET" }, fetcher);

            expect(fetcher).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(200);

            expect(fetcher).toHaveBeenCalledTimes(1);
            await expect(p).resolves.toBe("ok");
        });

        it("T024: maxSize reached → flushes early before windowMs expires", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("early");
            const batcher = new RequestBatcher({ windowMs: 5000, maxSize: 3 });

            const promises = Array.from({ length: 3 }, () =>
                batcher.add("/api", { method: "GET" }, fetcher)
            );

            // Advance microtasks only (no timer needed — maxSize triggered early flush)
            await vi.advanceTimersByTimeAsync(0);

            expect(fetcher).toHaveBeenCalledTimes(1);
            await expect(Promise.all(promises)).resolves.toEqual([
                "early",
                "early",
                "early",
            ]);
        });

        it("T025: sliding=true resets the timer on each new request", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("slid");
            const batcher = new RequestBatcher({
                windowMs: 200,
                sliding: true,
            });

            const p1 = batcher.add("/api", { method: "GET" }, fetcher);
            // 150ms in — timer hasn't fired yet
            await vi.advanceTimersByTimeAsync(150);
            expect(fetcher).not.toHaveBeenCalled();

            // New request resets the timer
            const p2 = batcher.add("/api", { method: "GET" }, fetcher);
            await vi.advanceTimersByTimeAsync(150); // only 150ms from last request
            expect(fetcher).not.toHaveBeenCalled();

            // Now 200ms from last request → fires
            await vi.advanceTimersByTimeAsync(50);
            expect(fetcher).toHaveBeenCalledTimes(1);
            await expect(Promise.all([p1, p2])).resolves.toEqual([
                "slid",
                "slid",
            ]);
        });

        it("T026: requests with different keys dispatch as independent buckets", async () => {
            vi.useFakeTimers();
            const fetcherA = makeFetcher("a");
            const fetcherB = makeFetcher("b");
            const batcher = new RequestBatcher({ windowMs: 100 });

            const pA = batcher.add("/api/a", { method: "GET" }, fetcherA);
            const pB = batcher.add("/api/b", { method: "GET" }, fetcherB);

            await vi.advanceTimersByTimeAsync(100);

            // Each key dispatches its own fetcher
            expect(fetcherA).toHaveBeenCalledTimes(1);
            expect(fetcherB).toHaveBeenCalledTimes(1);
            await expect(pA).resolves.toBe("a");
            await expect(pB).resolves.toBe("b");
        });

        it("T027: custom keyFn groups requests by custom logic regardless of URL", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("grouped");
            // keyFn always returns the same key → all requests share one bucket
            const batcher = new RequestBatcher({
                windowMs: 100,
                keyFn: () => "always-same",
            });

            const p1 = batcher.add("/api/a", { method: "GET" }, fetcher);
            const p2 = batcher.add("/api/b", { method: "POST" }, fetcher);

            await vi.advanceTimersByTimeAsync(100);

            expect(fetcher).toHaveBeenCalledTimes(1);
            await expect(Promise.all([p1, p2])).resolves.toEqual([
                "grouped",
                "grouped",
            ]);
        });

        it("T028: flush() dispatches all pending batches immediately and resolves when all settle", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("flushed");
            const batcher = new RequestBatcher({ windowMs: 5000 });

            const p1 = batcher.add("/api/x", { method: "GET" }, fetcher);
            const p2 = batcher.add("/api/y", { method: "GET" }, fetcher);

            // Timer hasn't fired (5000ms window); manually flush
            await batcher.flush();

            // Two different keys → fetcher called twice
            expect(fetcher).toHaveBeenCalledTimes(2);
            await expect(p1).resolves.toBe("flushed");
            await expect(p2).resolves.toBe("flushed");
        });

        it("T029: pendingCount returns correct total across all buckets", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("x");
            const batcher = new RequestBatcher({ windowMs: 1000 });

            expect(batcher.pendingCount).toBe(0);

            batcher.add("/api/a", { method: "GET" }, fetcher);
            batcher.add("/api/a", { method: "GET" }, fetcher);
            batcher.add("/api/b", { method: "GET" }, fetcher);

            expect(batcher.pendingCount).toBe(3);

            await batcher.flush();
            expect(batcher.pendingCount).toBe(0);
        });

        it("T030: windowMs <= 0 throws TypeError; maxSize < 1 throws TypeError", () => {
            expect(() => new RequestBatcher({ windowMs: 0 })).toThrow(
                TypeError
            );
            expect(() => new RequestBatcher({ windowMs: -1 })).toThrow(
                TypeError
            );
            expect(
                () => new RequestBatcher({ windowMs: 100, maxSize: 0 })
            ).toThrow(TypeError);
            expect(
                () => new RequestBatcher({ windowMs: 100, maxSize: -5 })
            ).toThrow(TypeError);
            // Valid configurations should not throw
            expect(() => new RequestBatcher({ windowMs: 1 })).not.toThrow();
            expect(
                () => new RequestBatcher({ windowMs: 100, maxSize: 1 })
            ).not.toThrow();
        });

        it("failed fetcher rejects all same-key callers with the same error", async () => {
            vi.useFakeTimers();
            const err = new Error("fetch failed");
            const batcher = new RequestBatcher({ windowMs: 100 });

            const p1 = batcher.add(
                "/api",
                { method: "GET" },
                makeFailingFetcher(err)
            );
            const p2 = batcher.add(
                "/api",
                { method: "GET" },
                makeFailingFetcher(err)
            );

            // Attach handlers before timer fires so rejections are never unhandled
            const settlement = Promise.allSettled([p1, p2]);
            await vi.advanceTimersByTimeAsync(100);
            const [r1, r2] = await settlement;

            expect(r1.status).toBe("rejected");
            expect(r2.status).toBe("rejected");
            expect((r1 as PromiseRejectedResult).reason).toBe(err);
            expect((r2 as PromiseRejectedResult).reason).toBe(err);
        });

        it("requests with different bodies get different keys and dispatch independently", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("ok");
            const batcher = new RequestBatcher({ windowMs: 100 });

            const p1 = batcher.add(
                "/api",
                { method: "POST", body: '{"a":1}' },
                fetcher
            );
            const p2 = batcher.add(
                "/api",
                { method: "POST", body: '{"b":2}' },
                fetcher
            );

            await vi.advanceTimersByTimeAsync(100);

            // Different bodies → different keys → fetcher called twice
            expect(fetcher).toHaveBeenCalledTimes(2);
            await expect(p1).resolves.toBe("ok");
            await expect(p2).resolves.toBe("ok");
        });

        it("stableSerialize: number body produces distinct key (covers number/boolean branch)", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("num");
            // Pass a number as body (unconventional but exercises the stableSerialize number branch)
            const batcher = new RequestBatcher({ windowMs: 100 });

            const p1 = batcher.add(
                "/api",
                { method: "POST", body: 42 as unknown as BodyInit },
                fetcher
            );
            const p2 = batcher.add(
                "/api",
                { method: "POST", body: 42 as unknown as BodyInit },
                fetcher
            );
            // Same numeric body → same key → coalesced
            await vi.advanceTimersByTimeAsync(100);
            expect(fetcher).toHaveBeenCalledTimes(1);
            await expect(Promise.all([p1, p2])).resolves.toEqual([
                "num",
                "num",
            ]);
        });

        it("stableSerialize: boolean body produces distinct key (covers boolean branch)", async () => {
            vi.useFakeTimers();
            const fetcherT = makeFetcher("true-result");
            const fetcherF = makeFetcher("false-result");
            const batcher = new RequestBatcher({ windowMs: 100 });

            const p1 = batcher.add(
                "/api",
                { method: "POST", body: true as unknown as BodyInit },
                fetcherT
            );
            const p2 = batcher.add(
                "/api",
                { method: "POST", body: false as unknown as BodyInit },
                fetcherF
            );
            // true vs false → different keys → dispatch independently
            await vi.advanceTimersByTimeAsync(100);
            expect(fetcherT).toHaveBeenCalledTimes(1);
            expect(fetcherF).toHaveBeenCalledTimes(1);
            await expect(p1).resolves.toBe("true-result");
            await expect(p2).resolves.toBe("false-result");
        });

        it("omitting init.method defaults to GET in the deduplication key", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("default-method");
            const batcher = new RequestBatcher({ windowMs: 100 });

            // Both requests omit method — both should share the same key (GET:/api:)
            const p1 = batcher.add("/api", {}, fetcher); // no method field
            const p2 = batcher.add("/api", {}, fetcher);

            await vi.advanceTimersByTimeAsync(100);
            expect(fetcher).toHaveBeenCalledTimes(1); // coalesced under same key
            await expect(Promise.all([p1, p2])).resolves.toEqual([
                "default-method",
                "default-method",
            ]);
        });

        it("stableSerialize: circular object body falls back to String() (covers JSON.stringify catch)", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("circular");
            const batcher = new RequestBatcher({ windowMs: 100 });

            // Circular reference causes JSON.stringify to throw → fallback to String()
            const circular: Record<string, unknown> = {};
            circular.self = circular;

            const p = batcher.add(
                "/api",
                { method: "POST", body: circular as unknown as BodyInit },
                fetcher
            );
            await vi.advanceTimersByTimeAsync(100);
            await expect(p).resolves.toBe("circular");
        });

        it("flush() on a batcher with no pending requests is a no-op (line 166 guard)", async () => {
            vi.useFakeTimers();
            const fetcher = makeFetcher("noop");
            const batcher = new RequestBatcher({ windowMs: 100 });

            // flush() with empty buckets must not throw and returns immediately
            await expect(batcher.flush()).resolves.toBeUndefined();
            expect(fetcher).not.toHaveBeenCalled();
        });
    });
});
