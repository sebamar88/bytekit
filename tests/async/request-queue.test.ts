import { describe, it, expect, vi, afterEach } from "vitest";
import {
    RequestQueue,
    QueueAbortError,
} from "../../src/utils/async/request-queue";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Task that resolves with `value` after `ms` ms. */
function delayed<T>(value: T, ms: number) {
    return (_signal: AbortSignal): Promise<T> =>
        new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
}

/** Task that rejects after `ms` ms. */
function failing(ms = 0) {
    return (_signal: AbortSignal): Promise<never> =>
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("task failed")), ms)
        );
}

/** Task that resolves immediately. */
function noop() {
    return (_signal: AbortSignal): Promise<void> => Promise.resolve();
}

// ─────────────────────────────────────────────────────────────────────────────

describe("RequestQueue", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    // ─── US1: Concurrency Control ─────────────────────────────────────────────

    describe("US1 — Concurrency Control", () => {
        it("T005: never exceeds concurrency limit (20 tasks / concurrency=3)", async () => {
            const queue = new RequestQueue({ concurrency: 3 });
            let running = 0;
            let maxObserved = 0;

            const tasks = Array.from(
                { length: 20 },
                () =>
                    (_signal: AbortSignal) =>
                        new Promise<void>((resolve) => {
                            running++;
                            maxObserved = Math.max(maxObserved, running);
                            setTimeout(() => {
                                running--;
                                resolve();
                            }, 5);
                        })
            );

            await Promise.all(tasks.map((t) => queue.add(t)));
            expect(maxObserved).toBe(3);
        });

        it("T006: failing task does NOT block the queue; remaining tasks complete", async () => {
            const queue = new RequestQueue({ concurrency: 2 });
            let completed = 0;

            await Promise.allSettled([
                queue.add(failing()),
                queue.add((_s) => Promise.resolve().then(() => { completed++; })),
                queue.add((_s) => Promise.resolve().then(() => { completed++; })),
                queue.add((_s) => Promise.resolve().then(() => { completed++; })),
            ]);

            expect(completed).toBe(3);
        });

        it("T007: flush() resolves only after all queued + running tasks settle", async () => {
            const queue = new RequestQueue({ concurrency: 2 });
            let settled = 0;

            const p1 = queue.add((_s) =>
                new Promise<void>((r) =>
                    setTimeout(() => { settled++; r(); }, 20)
            ));
            const p2 = queue.add((_s) =>
                new Promise<void>((r) =>
                    setTimeout(() => { settled++; r(); }, 10)
            ));
            // Third task queued (concurrency=2, first two are running)
            const p3 = queue.add((_s) =>
                new Promise<void>((_, j) =>
                    setTimeout(() => { settled++; j(new Error("boom")); }, 15)
            ));

            // Attach handlers before tasks settle to prevent unhandled rejection warnings
            const settlement = Promise.allSettled([p1, p2, p3]);
            await queue.flush();
            await settlement;
            expect(settled).toBe(3);
        });

        it("T008: size / running / pending getters reflect correct state", async () => {
            const queue = new RequestQueue({ concurrency: 1 });

            expect(queue.size).toBe(0);
            expect(queue.running).toBe(0);
            expect(queue.pending).toBe(0);

            let resolveTask!: () => void;
            queue.add(
                (_s) => new Promise<void>((r) => { resolveTask = r; })
            );

            // _drain() runs synchronously inside add() → task starts immediately
            expect(queue.running).toBe(1);
            expect(queue.size).toBe(0);
            expect(queue.pending).toBe(1);

            // Second task is queued (concurrency=1 is full)
            queue.add(noop());
            expect(queue.size).toBe(1);
            expect(queue.running).toBe(1);
            expect(queue.pending).toBe(2);

            // Use flush() to wait until _running===0 and size===0.
            // flush() resolves via _notifyFlushWaiters() inside _drain() (the .finally() block),
            // which runs AFTER the public promise resolves — guaranteeing _running is 0 here.
            resolveTask();
            await queue.flush();

            expect(queue.size).toBe(0);
            expect(queue.running).toBe(0);
            expect(queue.pending).toBe(0);
        });

        it("T009: constructor throws TypeError when concurrency < 1", () => {
            expect(() => new RequestQueue({ concurrency: 0 })).toThrow(TypeError);
            expect(() => new RequestQueue({ concurrency: -1 })).toThrow(TypeError);
            expect(() => new RequestQueue({ concurrency: 0.5 })).toThrow(TypeError);
            expect(() => new RequestQueue({ concurrency: 1 })).not.toThrow();
        });

        it("onError callback fires for each failure without stopping the queue", async () => {
            const errors: string[] = [];
            const queue = new RequestQueue({
                concurrency: 1,
                onError: (_err, id) => errors.push(id),
            });

            await Promise.allSettled([queue.add(failing()), queue.add(noop())]);

            expect(errors).toHaveLength(1);
        });

        it("flush() resolves immediately when queue is empty", async () => {
            const queue = new RequestQueue({ concurrency: 3 });
            await expect(queue.flush()).resolves.toBeUndefined();
        });

        it("concurrency=1 executes tasks sequentially", async () => {
            const queue = new RequestQueue({ concurrency: 1 });
            const order: number[] = [];

            await Promise.all([
                queue.add(delayed(null, 20)).then(() => order.push(1)),
                queue.add(delayed(null, 10)).then(() => order.push(2)),
                queue.add(delayed(null, 5)).then(() => order.push(3)),
            ]);

            // Despite different durations, all run sequentially → order preserved
            expect(order).toEqual([1, 2, 3]);
        });
    });

    // ─── US2: Priority & Cancellation ────────────────────────────────────────

    describe("US2 — Priority & Cancellation", () => {
        it("T015: high priority tasks execute before normal and low (concurrency=1)", async () => {
            const queue = new RequestQueue({ concurrency: 1 });
            const order: string[] = [];

            // Block the queue with an initial task
            let releaseBlocker!: () => void;
            const blocker = queue.add(
                (_s) => new Promise<void>((r) => { releaseBlocker = r; })
            );

            // Enqueue out-of-priority order; high should win
            queue.add(
                (_s) => Promise.resolve().then(() => { order.push("low"); }),
                { priority: "low" }
            );
            queue.add(
                (_s) => Promise.resolve().then(() => { order.push("normal"); }),
                { priority: "normal" }
            );
            queue.add(
                (_s) => Promise.resolve().then(() => { order.push("high"); }),
                { priority: "high" }
            );

            releaseBlocker();
            await blocker;
            await queue.flush();

            expect(order).toEqual(["high", "normal", "low"]);
        });

        it("T016: cancel(id) removes queued task and rejects with QueueAbortError", async () => {
            const queue = new RequestQueue({ concurrency: 1 });

            let releaseBlocker!: () => void;
            const blocker = queue.add(
                (_s) => new Promise<void>((r) => { releaseBlocker = r; })
            );

            const taskSpy = vi.fn((_s: AbortSignal) => Promise.resolve());
            const taskPromise = queue.add(taskSpy);

            // Obtain ID via internal helper (task is queued, not running)
            const [queuedId] = queue._queuedIds();
            expect(queuedId).toBeDefined();

            const cancelled = queue.cancel(queuedId);
            expect(cancelled).toBe(true);

            // Task factory must never be called
            expect(taskSpy).not.toHaveBeenCalled();

            await expect(taskPromise).rejects.toThrow(QueueAbortError);

            releaseBlocker();
            await blocker;
        });

        it("T017: cancel(id) on in-flight task fires the internal AbortSignal", async () => {
            const queue = new RequestQueue({ concurrency: 1 });

            let capturedSignal!: AbortSignal;
            let resolveTask!: () => void;

            queue.add((signal) => {
                capturedSignal = signal;
                return new Promise<void>((r) => { resolveTask = r; });
            });

            // Task is running — obtain its ID from the active set
            const [runningId] = queue._runningIds();
            expect(runningId).toBeDefined();

            queue.cancel(runningId);
            expect(capturedSignal.aborted).toBe(true);

            // Clean up: resolve so the test doesn't hang
            resolveTask();
            await queue.flush();
        });

        it("T018: cancel(id) returns false when ID is not found", () => {
            const queue = new RequestQueue({ concurrency: 3 });
            expect(queue.cancel("nonexistent-id")).toBe(false);
        });

        it("T019: external signal cancels queued task with QueueAbortError (public consumer path)", async () => {
            const queue = new RequestQueue({ concurrency: 1 });

            // Block the queue so the second task is queued
            let releaseBlocker!: () => void;
            const blocker = queue.add(
                (_s) => new Promise<void>((r) => { releaseBlocker = r; })
            );

            const controller = new AbortController();
            const taskSpy = vi.fn((_s: AbortSignal) => Promise.resolve());
            const taskPromise = queue.add(taskSpy, { signal: controller.signal });

            // Abort via external signal before task starts
            controller.abort();

            await expect(taskPromise).rejects.toThrow(QueueAbortError);
            expect(taskSpy).not.toHaveBeenCalled();

            releaseBlocker();
            await blocker;
        });

        it("external signal already aborted on add() → immediate QueueAbortError", async () => {
            const queue = new RequestQueue({ concurrency: 3 });
            const controller = new AbortController();
            controller.abort();

            await expect(
                queue.add(noop(), { signal: controller.signal })
            ).rejects.toThrow(QueueAbortError);
        });

        it("cancel returns true for in-flight tasks", async () => {
            const queue = new RequestQueue({ concurrency: 1 });

            let resolveTask!: () => void;
            queue.add((_s) => new Promise<void>((r) => { resolveTask = r; }));

            const [runningId] = queue._runningIds();
            expect(queue.cancel(runningId)).toBe(true);

            resolveTask();
            await queue.flush();
        });
    });
});
