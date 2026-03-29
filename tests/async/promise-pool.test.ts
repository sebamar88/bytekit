import { describe, it, expect, vi, afterEach } from "vitest";
import {
    PromisePool,
    PoolTimeoutError,
} from "../../src/utils/async/promise-pool";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Task that resolves with `value` after `ms` milliseconds. */
function delayed<T>(value: T, ms: number): () => Promise<T> {
    return () =>
        new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
}

/** Task that rejects with `error` after `ms` milliseconds (default: 0). */
function failing(error: Error, ms = 0): () => Promise<never> {
    return () =>
        new Promise<never>((_, reject) => setTimeout(() => reject(error), ms));
}

/** Task that throws synchronously before returning a Promise. */
function syncThrowing(error: Error): () => Promise<never> {
    return () => {
        throw error;
    };
}

/** Task that never resolves (use with fake timers). */
function hanging(): () => Promise<never> {
    return () =>
        new Promise<never>(() => {
            /* intentionally hangs */
        });
}

/**
 * Wraps tasks with a concurrency counter.
 * `peak()` returns the maximum number of tasks that ran simultaneously.
 */
function withConcurrencyTracker<T>(tasks: Array<() => Promise<T>>) {
    let running = 0;
    let peak = 0;
    const wrapped = tasks.map((task) => async () => {
        running++;
        peak = Math.max(peak, running);
        try {
            return await task();
        } finally {
            running--;
        }
    });
    return { tasks: wrapped, peak: () => peak };
}

/**
 * A countdown latch: resolves after `n` calls to `tick()`.
 *
 * Use this to wait for N asynchronous side-effects (e.g. onError calls)
 * even after the main promise has already settled.
 * Combine with Promise.allSettled to avoid test races.
 */
function countdownLatch(n: number) {
    let remaining = n;
    let resolve!: () => void;
    const latch = new Promise<void>((r) => {
        resolve = r;
    });
    const tick = () => {
        if (--remaining <= 0) resolve();
    };
    return { latch, tick };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("PromisePool", () => {
    // =========================================================================
    // 1. Constructor validation
    // =========================================================================

    describe("constructor", () => {
        it("accepts concurrency = 1 (minimum valid)", () => {
            expect(() => new PromisePool({ concurrency: 1 })).not.toThrow();
        });

        it("accepts large concurrency values", () => {
            expect(() => new PromisePool({ concurrency: 1_000 })).not.toThrow();
        });

        it("throws TypeError when concurrency = 0", () => {
            expect(() => new PromisePool({ concurrency: 0 })).toThrow(
                TypeError
            );
        });

        it("throws TypeError when concurrency is negative", () => {
            expect(() => new PromisePool({ concurrency: -1 })).toThrow(
                TypeError
            );
            expect(() => new PromisePool({ concurrency: -999 })).toThrow(
                TypeError
            );
        });

        it("accepts timeout = Infinity (valid: Infinity > 0)", () => {
            expect(
                () => new PromisePool({ concurrency: 1, timeout: Infinity })
            ).not.toThrow();
        });

        it("throws TypeError when timeout = 0", () => {
            expect(
                () => new PromisePool({ concurrency: 1, timeout: 0 })
            ).toThrow(TypeError);
        });

        it("throws TypeError when timeout is negative", () => {
            expect(
                () => new PromisePool({ concurrency: 1, timeout: -1 })
            ).toThrow(TypeError);
            expect(
                () => new PromisePool({ concurrency: 1, timeout: -100 })
            ).toThrow(TypeError);
        });

        it("onError is optional — omitting it does not throw", () => {
            expect(() => new PromisePool({ concurrency: 2 })).not.toThrow();
        });

        it("isolates options — mutating the original object does not affect the pool", async () => {
            const opts = { concurrency: 2 };
            const pool = new PromisePool(opts);
            (opts as { concurrency: number }).concurrency = 99; // mutate after construction

            const { tasks, peak } = withConcurrencyTracker(
                Array.from({ length: 6 }, () => delayed(null, 20))
            );
            await pool.run(tasks);
            // If options were not cloned, peak would be 6 (all at once)
            expect(peak()).toBeLessThanOrEqual(2);
        });
    });

    // =========================================================================
    // 2. run() input validation
    // =========================================================================

    describe("run() input validation", () => {
        const pool = new PromisePool({ concurrency: 2 });

        it("resolves to [] for an empty array", async () => {
            await expect(pool.run([])).resolves.toEqual([]);
        });

        it("throws TypeError for a string input", async () => {
            await expect(pool.run("not-array" as never)).rejects.toThrow(
                TypeError
            );
        });

        it("throws TypeError for null input", async () => {
            await expect(pool.run(null as never)).rejects.toThrow(TypeError);
        });

        it("throws TypeError for undefined input", async () => {
            await expect(pool.run(undefined as never)).rejects.toThrow(
                TypeError
            );
        });

        it("throws TypeError when a number appears at index 0", async () => {
            await expect(pool.run([42 as never])).rejects.toThrow(TypeError);
        });

        it("throws TypeError when a non-function appears at a non-zero index", async () => {
            await expect(
                pool.run([delayed(1, 0), "bad" as never])
            ).rejects.toThrow(TypeError);
        });

        it("TypeError message includes the offending element's index", async () => {
            await expect(
                pool.run([delayed(1, 0), null as never])
            ).rejects.toThrow(/index 1/i);
        });
    });

    // =========================================================================
    // 3. Concurrency mechanics
    // =========================================================================

    describe("concurrency mechanics", () => {
        // T007
        it("T007 — never exceeds configured concurrency (6 tasks / limit 2)", async () => {
            const pool = new PromisePool({ concurrency: 2 });
            const { tasks, peak } = withConcurrencyTracker(
                Array.from({ length: 6 }, (_, i) => delayed(i, 20))
            );
            await pool.run(tasks);
            expect(peak()).toBeLessThanOrEqual(2);
        });

        // T010
        it("T010 — concurrency=1 executes tasks strictly one at a time", async () => {
            const order: number[] = [];
            const pool = new PromisePool({ concurrency: 1 });

            await pool.run([
                async () => {
                    order.push(0);
                    await new Promise<void>((r) => setTimeout(r, 20));
                },
                async () => {
                    order.push(1);
                },
                async () => {
                    order.push(2);
                },
            ]);

            expect(order).toEqual([0, 1, 2]);
        });

        // T011
        it("T011 — concurrency >= tasks.length starts all tasks simultaneously", async () => {
            const pool = new PromisePool({ concurrency: 10 });
            const { tasks, peak } = withConcurrencyTracker(
                Array.from({ length: 5 }, () => delayed(null, 20))
            );
            await pool.run(tasks);
            expect(peak()).toBe(5);
        });

        it("stress — 50 tasks / concurrency 5: peak never exceeds limit", async () => {
            const pool = new PromisePool({ concurrency: 5 });
            const { tasks, peak } = withConcurrencyTracker(
                Array.from({ length: 50 }, (_, i) => delayed(i, 10))
            );
            await pool.run(tasks);
            expect(peak()).toBeLessThanOrEqual(5);
        });

        it("stress — 50 tasks / concurrency 5: slots fill completely (peak === 5)", async () => {
            const pool = new PromisePool({ concurrency: 5 });
            const { tasks, peak } = withConcurrencyTracker(
                Array.from({ length: 50 }, () => delayed(null, 30))
            );
            await pool.run(tasks);
            expect(peak()).toBe(5);
        });

        it("a freed slot is filled immediately by the next queued task", async () => {
            const starts: number[] = [];
            const pool = new PromisePool({ concurrency: 1 });

            await pool.run([
                async () => {
                    starts.push(0);
                    await new Promise<void>((r) => setTimeout(r, 20));
                },
                async () => {
                    starts.push(1);
                    await new Promise<void>((r) => setTimeout(r, 20));
                },
                async () => {
                    starts.push(2);
                },
            ]);

            expect(starts).toEqual([0, 1, 2]);
        });

        it("alternating slow/fast tasks still respect the concurrency limit", async () => {
            const pool = new PromisePool({ concurrency: 2 });
            const { tasks, peak } = withConcurrencyTracker([
                delayed(0, 50),
                delayed(1, 5),
                delayed(2, 50),
                delayed(3, 5),
                delayed(4, 50),
            ]);
            await pool.run(tasks);
            expect(peak()).toBeLessThanOrEqual(2);
        });
    });

    // =========================================================================
    // 4. Result ordering and values
    // =========================================================================

    describe("result ordering and values", () => {
        // T008
        it("T008 — results are in original input order, even when the fastest task is last", async () => {
            const pool = new PromisePool({ concurrency: 3 });
            const results = await pool.run([
                delayed(0, 60),
                delayed(1, 30),
                delayed(2, 5),
            ]);
            expect(results).toEqual([0, 1, 2]);
        });

        it("single task — returns an array of one result", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            const results = await pool.run([delayed("only", 10)]);
            expect(results).toEqual(["only"]);
        });

        it("preserves null values in results", async () => {
            const pool = new PromisePool({ concurrency: 2 });
            const results = await pool.run([
                delayed(null, 10),
                delayed("valid", 10),
                delayed(null, 10),
            ]);
            expect(results).toEqual([null, "valid", null]);
        });

        it("preserves falsy primitive values: 0, false, empty string", async () => {
            const pool = new PromisePool({ concurrency: 3 });
            const results = await pool.run([
                delayed(0, 5),
                delayed(false as unknown as number, 5),
                delayed("", 5),
            ]);
            expect(results).toStrictEqual([0, false, ""]);
        });

        it("preserves undefined as a result value", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            const results = await pool.run([
                async () => undefined as unknown as string,
            ]);
            expect(results).toEqual([undefined]);
        });

        it("preserves object and array reference identity", async () => {
            const obj = { id: 1 };
            const arr = [1, 2, 3];
            const pool = new PromisePool({ concurrency: 2 });
            const results = await pool.run([async () => obj, async () => arr]);
            expect(results[0]).toBe(obj);
            expect(results[1]).toBe(arr);
        });

        it("100-task ordering — result[i] === i for every index", async () => {
            const pool = new PromisePool({ concurrency: 10 });
            const tasks = Array.from({ length: 100 }, (_, i) =>
                delayed(i, Math.floor(Math.random() * 10))
            );
            const results = await pool.run(tasks);
            expect(results).toEqual(Array.from({ length: 100 }, (_, i) => i));
        });
    });

    // =========================================================================
    // 5. Error propagation — no onError configured
    // =========================================================================

    describe("error propagation (no onError)", () => {
        it("run() rejects with the task's error object", async () => {
            const pool = new PromisePool({ concurrency: 2 });
            const err = new Error("task error");
            await expect(pool.run([failing(err)])).rejects.toBe(err);
        });

        it("error identity is preserved — not wrapped or re-thrown", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            const original = new TypeError("original");
            let caught: unknown;
            try {
                await pool.run([failing(original)]);
            } catch (e) {
                caught = e;
            }
            expect(caught).toBe(original);
        });

        it("synchronously throwing task causes run() to reject with that error", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            const err = new RangeError("sync boom");
            await expect(pool.run([syncThrowing(err)])).rejects.toBe(err);
        });

        it("synchronously throwing task preserves the error type", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            await expect(
                pool.run([syncThrowing(new RangeError("out of range"))])
            ).rejects.toBeInstanceOf(RangeError);
        });

        it("non-Error rejection value (string) propagates as-is", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            await expect(
                pool.run([() => Promise.reject("string-rejection")])
            ).rejects.toBe("string-rejection");
        });
    });

    // =========================================================================
    // 6. Error propagation — with onError configured
    // =========================================================================

    describe("error propagation (with onError)", () => {
        // T017
        it("T017 — onError is called with the correct (error, taskIndex) arguments", async () => {
            const calls: Array<{ error: Error; index: number }> = [];
            const pool = new PromisePool({
                concurrency: 2,
                onError: (error, index) => calls.push({ error, index }),
            });
            const err = new Error("boom");
            await pool
                .run([async () => "ok", failing(err), async () => "ok"])
                .catch(() => {});
            expect(calls).toHaveLength(1);
            expect(calls[0].error).toBe(err);
            expect(calls[0].index).toBe(1);
        });

        // T018
        it("T018 — pool continues executing remaining tasks after onError fires", async () => {
            const completed: number[] = [];
            const pool = new PromisePool({ concurrency: 1, onError: () => {} });
            await pool
                .run([
                    async () => {
                        completed.push(0);
                    },
                    failing(new Error("fail")),
                    async () => {
                        completed.push(2);
                    },
                ])
                .catch(() => {});
            expect(completed).toContain(0);
            expect(completed).toContain(2);
        });

        // T020
        it("T020 — onError receives the original error reference (not a wrapper)", async () => {
            const original = new TypeError("original");
            const received: Error[] = [];
            const pool = new PromisePool({
                concurrency: 2,
                onError: (err) => received.push(err),
            });
            await pool.run([failing(original)]).catch(() => {});
            expect(received[0]).toBe(original);
            expect(received[0]).toBeInstanceOf(TypeError);
        });

        it("run() STILL rejects even when onError is configured", async () => {
            const pool = new PromisePool({ concurrency: 1, onError: () => {} });
            const err = new Error("fail");
            await expect(pool.run([failing(err)])).rejects.toBe(err);
        });

        it("onError is NOT called for successful tasks", async () => {
            let callCount = 0;
            const pool = new PromisePool({
                concurrency: 3,
                onError: () => callCount++,
            });
            await pool.run([
                delayed("a", 10),
                delayed("b", 10),
                delayed("c", 10),
            ]);
            expect(callCount).toBe(0);
        });

        it("onError index matches original array position, not execution order", async () => {
            const indices: number[] = [];
            const pool = new PromisePool({
                concurrency: 3,
                onError: (_, i) => indices.push(i),
            });
            await pool
                .run([
                    delayed("slow", 50),
                    delayed("medium", 25),
                    failing(new Error("fast fail"), 0), // index 2, but fails first
                ])
                .catch(() => {});
            expect(indices).toContain(2);
        });

        it("multiple concurrent failures — onError called once per failing task", async () => {
            const N = 3;
            const erroredIndices: number[] = [];
            // Countdown latch waits for all N onError calls even after run() rejects
            const { latch, tick } = countdownLatch(N);

            const pool = new PromisePool({
                concurrency: N, // all tasks start simultaneously
                onError: (_, i) => {
                    erroredIndices.push(i);
                    tick();
                },
            });

            await Promise.allSettled([
                pool.run([
                    failing(new Error("e0"), 10),
                    failing(new Error("e1"), 10),
                    failing(new Error("e2"), 10),
                ]),
                latch,
            ]);

            expect(erroredIndices.sort((a, b) => a - b)).toEqual([0, 1, 2]);
        });

        it("all tasks succeed — onError never called, run() resolves", async () => {
            let callCount = 0;
            const pool = new PromisePool({
                concurrency: 5,
                onError: () => callCount++,
            });
            const results = await pool.run([
                delayed(1, 5),
                delayed(2, 10),
                delayed(3, 5),
            ]);
            expect(callCount).toBe(0);
            expect(results).toEqual([1, 2, 3]);
        });

        it("synchronously throwing task also triggers onError", async () => {
            const errors: Error[] = [];
            const pool = new PromisePool({
                concurrency: 2,
                onError: (err) => errors.push(err),
            });
            const syncErr = new Error("sync");
            await pool.run([syncThrowing(syncErr)]).catch(() => {});
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBe(syncErr);
        });
    });

    // =========================================================================
    // 7. Timeout mechanics
    // =========================================================================

    describe("timeout mechanics", () => {
        afterEach(() => vi.useRealTimers());

        // T015
        it("T015 — task exceeding timeout rejects with PoolTimeoutError", async () => {
            const pool = new PromisePool({ concurrency: 1, timeout: 50 });
            await expect(
                pool.run([delayed("slow", 500)])
            ).rejects.toBeInstanceOf(PoolTimeoutError);
        });

        it("PoolTimeoutError.name === 'PoolTimeoutError'", async () => {
            const pool = new PromisePool({ concurrency: 1, timeout: 50 });
            let name = "";
            try {
                await pool.run([delayed("slow", 500)]);
            } catch (err) {
                name = (err as Error).name;
            }
            expect(name).toBe("PoolTimeoutError");
        });

        it("PoolTimeoutError is an instance of Error", async () => {
            const pool = new PromisePool({ concurrency: 1, timeout: 50 });
            let caught: unknown;
            try {
                await pool.run([delayed("slow", 500)]);
            } catch (err) {
                caught = err;
            }
            expect(caught).toBeInstanceOf(Error);
            expect(caught).toBeInstanceOf(PoolTimeoutError);
        });

        it("PoolTimeoutError.message contains the configured timeout value", async () => {
            const pool = new PromisePool({ concurrency: 1, timeout: 123 });
            let message = "";
            try {
                await pool.run([delayed("slow", 500)]);
            } catch (err) {
                message = (err as Error).message;
            }
            expect(message).toContain("123");
        });

        it("PoolTimeoutError can be instantiated directly (standalone usage)", () => {
            const err = new PoolTimeoutError(5000);
            expect(err).toBeInstanceOf(PoolTimeoutError);
            expect(err).toBeInstanceOf(Error);
            expect(err.name).toBe("PoolTimeoutError");
            expect(err.message).toContain("5000");
        });

        it("task completing before timeout resolves normally", async () => {
            const pool = new PromisePool({ concurrency: 1, timeout: 500 });
            const results = await pool.run([delayed("fast", 10)]);
            expect(results).toEqual(["fast"]);
        });

        // T016
        it("T016 — pool continues executing after a task times out (with onError)", async () => {
            const completed: number[] = [];
            const pool = new PromisePool({
                concurrency: 2,
                timeout: 50,
                onError: () => {},
            });
            await pool
                .run([
                    async () => {
                        await new Promise<void>((r) => setTimeout(r, 500));
                        completed.push(0);
                    },
                    async () => {
                        completed.push(1);
                    },
                    async () => {
                        completed.push(2);
                    },
                ])
                .catch(() => {});
            expect(completed).toContain(1);
            expect(completed).toContain(2);
        });

        // T019
        it("T019 — clearTimeout is called when task resolves before timeout (no timer leak)", async () => {
            const spy = vi.spyOn(globalThis, "clearTimeout");
            const pool = new PromisePool({ concurrency: 1, timeout: 500 });
            await pool.run([delayed("fast", 10)]);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("US2 guard — timeout=0 throws TypeError in constructor", () => {
            expect(
                () => new PromisePool({ concurrency: 1, timeout: 0 })
            ).toThrow(TypeError);
        });

        it("US2 guard — timeout=-1 throws TypeError in constructor", () => {
            expect(
                () => new PromisePool({ concurrency: 1, timeout: -1 })
            ).toThrow(TypeError);
        });

        it("[fake timers] never-resolving task times out at exactly the configured ms", async () => {
            vi.useFakeTimers();
            const pool = new PromisePool({ concurrency: 1, timeout: 1000 });
            const runPromise = pool.run([hanging()]);
            // Attach the handler BEFORE advancing time — otherwise the rejection
            // fires during advanceTimersByTimeAsync with no handler yet attached.
            const settled = runPromise.catch((e: unknown) => e);
            await vi.advanceTimersByTimeAsync(1001);
            await expect(settled).resolves.toBeInstanceOf(PoolTimeoutError);
        });

        it("[fake timers] task resolving before the deadline succeeds normally", async () => {
            vi.useFakeTimers();
            const pool = new PromisePool({ concurrency: 1, timeout: 1000 });
            const runPromise = pool.run([delayed("ok", 500)]);
            await vi.advanceTimersByTimeAsync(600);
            await expect(runPromise).resolves.toEqual(["ok"]);
        });
    });

    // =========================================================================
    // 8. Pool reusability
    // =========================================================================

    describe("pool reusability", () => {
        // T014
        it("T014 — same pool used for two consecutive batches returns correct results", async () => {
            const pool = new PromisePool({ concurrency: 2 });
            const r1 = await pool.run([delayed("a", 10), delayed("b", 10)]);
            const r2 = await pool.run([delayed("c", 10), delayed("d", 10)]);
            expect(r1).toEqual(["a", "b"]);
            expect(r2).toEqual(["c", "d"]);
        });

        it("pool used for 5 consecutive batches — all results correct", async () => {
            const pool = new PromisePool({ concurrency: 3 });
            for (let batch = 0; batch < 5; batch++) {
                const expected = [0, 1, 2].map((i) => batch * 10 + i);
                const results = await pool.run(
                    expected.map((v) => delayed(v, 5))
                );
                expect(results).toEqual(expected);
            }
        });

        it("pool is reusable after a run with an empty array", async () => {
            const pool = new PromisePool({ concurrency: 2 });
            await pool.run([]);
            const results = await pool.run([delayed("ok", 10)]);
            expect(results).toEqual(["ok"]);
        });

        it("pool is reusable after a single-task failure", async () => {
            const pool = new PromisePool({ concurrency: 2, onError: () => {} });
            await pool.run([failing(new Error("fail"))]).catch(() => {});
            // Allow the event loop to drain any background tasks from the failed run
            await new Promise<void>((r) => setTimeout(r, 30));
            const results = await pool.run([delayed("recovered", 10)]);
            expect(results).toEqual(["recovered"]);
        });

        it("concurrency limit applies independently to each run() call", async () => {
            const pool = new PromisePool({ concurrency: 2 });
            for (let i = 0; i < 3; i++) {
                const { tasks, peak } = withConcurrencyTracker(
                    Array.from({ length: 6 }, () => delayed(null, 15))
                );
                await pool.run(tasks);
                expect(peak()).toBeLessThanOrEqual(2);
            }
        });
    });

    // =========================================================================
    // 9. Edge cases
    // =========================================================================

    describe("edge cases", () => {
        it("single task resolving immediately with Promise.resolve()", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            await expect(
                pool.run([() => Promise.resolve(42)])
            ).resolves.toEqual([42]);
        });

        it("single task rejecting immediately with Promise.reject()", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            const err = new Error("immediate reject");
            await expect(pool.run([() => Promise.reject(err)])).rejects.toBe(
                err
            );
        });

        it("concurrency=100 with 100 tasks — all start simultaneously, results ordered", async () => {
            const pool = new PromisePool({ concurrency: 100 });
            const { tasks, peak } = withConcurrencyTracker(
                Array.from({ length: 100 }, (_, i) => delayed(i, 20))
            );
            const results = await pool.run(tasks);
            expect(peak()).toBe(100);
            expect(results[0]).toBe(0);
            expect(results[99]).toBe(99);
        });

        it("mixed task types: sync throw, async reject, and successes in one run", async () => {
            const successIndices: number[] = [];
            const { latch, tick } = countdownLatch(2); // 2 errors expected
            const errorIndices: number[] = [];

            const pool = new PromisePool({
                concurrency: 4,
                onError: (_, i) => {
                    errorIndices.push(i);
                    tick();
                },
            });

            await Promise.allSettled([
                pool.run([
                    async () => {
                        successIndices.push(0);
                        return "ok";
                    }, // success
                    failing(new Error("async reject"), 5), // index 1: async fail
                    syncThrowing(new Error("sync throw")), // index 2: sync fail
                    async () => {
                        successIndices.push(3);
                        return "also ok";
                    }, // success
                ]),
                latch,
            ]);

            expect(successIndices.sort()).toEqual([0, 3]);
            expect(errorIndices.sort()).toEqual([1, 2]);
        });

        it("tasks returning the same value produce separate result slots (no aliasing)", async () => {
            const pool = new PromisePool({ concurrency: 3 });
            const results = await pool.run([
                async () => "same",
                async () => "same",
                async () => "same",
            ]);
            expect(results).toEqual(["same", "same", "same"]);
            expect(results).toHaveLength(3);
        });

        it("concurrency=1 with 100 queued tasks — results in correct order", async () => {
            const pool = new PromisePool({ concurrency: 1 });
            const tasks = Array.from({ length: 100 }, (_, i) => async () => i);
            const results = await pool.run(tasks);
            expect(results).toEqual(Array.from({ length: 100 }, (_, i) => i));
        });
    });
});
