import { describe, it, expect } from "vitest";
import { parallel } from "../../src/utils/async/parallel";
import { sleep } from "../../src/utils/async/sleep";

describe("parallel function", () => {
    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should execute all tasks and return results in order", async () => {
                const tasks = [async () => 1, async () => 2, async () => 3];

                const results = await parallel(tasks);

                expect(results).toEqual([1, 2, 3]);
            });

            it("should handle empty array", async () => {
                const results = await parallel([]);
                expect(results).toEqual([]);
            });

            it("should handle single task", async () => {
                const tasks = [async () => 42];
                const results = await parallel(tasks);
                expect(results).toEqual([42]);
            });

            it("should preserve result order regardless of completion order", async () => {
                const tasks = [
                    async () => {
                        await sleep(100);
                        return "slow";
                    },
                    async () => {
                        await sleep(10);
                        return "fast";
                    },
                    async () => {
                        await sleep(50);
                        return "medium";
                    },
                ];

                const results = await parallel(tasks);

                expect(results).toEqual(["slow", "fast", "medium"]);
            });

            it("should fail fast on first error", async () => {
                const executionOrder: number[] = [];

                const tasks = [
                    async () => {
                        await sleep(100);
                        executionOrder.push(1);
                        return 1;
                    },
                    async () => {
                        await sleep(10);
                        executionOrder.push(2);
                        throw new Error("Task 2 failed");
                    },
                    async () => {
                        await sleep(200);
                        executionOrder.push(3);
                        return 3;
                    },
                ];

                await expect(parallel(tasks)).rejects.toThrow("Task 2 failed");

                // Task 2 should have executed and failed
                expect(executionOrder).toContain(2);
            });
        });

        describe("concurrency control", () => {
            it("should respect concurrency limit", async () => {
                let activeCount = 0;
                let maxActive = 0;

                const createTask = (id: number) => async () => {
                    activeCount++;
                    maxActive = Math.max(maxActive, activeCount);
                    await sleep(50);
                    activeCount--;
                    return id;
                };

                const tasks = Array.from({ length: 10 }, (_, i) =>
                    createTask(i)
                );

                const results = await parallel(tasks, { concurrency: 3 });

                expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                expect(maxActive).toBeLessThanOrEqual(3);
            });

            it("should handle concurrency = 1 (sequential execution)", async () => {
                const executionOrder: number[] = [];

                const createTask = (id: number) => async () => {
                    executionOrder.push(id);
                    await sleep(10);
                    return id;
                };

                const tasks = [createTask(1), createTask(2), createTask(3)];

                const results = await parallel(tasks, { concurrency: 1 });

                expect(results).toEqual([1, 2, 3]);
                expect(executionOrder).toEqual([1, 2, 3]);
            });

            it("should handle concurrency greater than task count", async () => {
                const tasks = [async () => 1, async () => 2];

                const results = await parallel(tasks, { concurrency: 10 });

                expect(results).toEqual([1, 2]);
            });

            it("should fail fast with concurrency limit", async () => {
                const executionOrder: number[] = [];

                const tasks = [
                    async () => {
                        executionOrder.push(1);
                        await sleep(50);
                        return 1;
                    },
                    async () => {
                        executionOrder.push(2);
                        await sleep(10);
                        throw new Error("Task 2 failed");
                    },
                    async () => {
                        executionOrder.push(3);
                        await sleep(100);
                        return 3;
                    },
                ];

                await expect(
                    parallel(tasks, { concurrency: 2 })
                ).rejects.toThrow("Task 2 failed");
            });
        });

        describe("input validation", () => {
            it("should throw TypeError if tasks is not an array", async () => {
                await expect(
                    // @ts-expect-error Testing invalid input
                    parallel("not an array")
                ).rejects.toThrow(TypeError);
                await expect(
                    // @ts-expect-error Testing invalid input
                    parallel("not an array")
                ).rejects.toThrow("tasks must be an array");
            });

            it("should throw TypeError if task is not a function", async () => {
                await expect(
                    // @ts-expect-error Testing invalid input
                    parallel([async () => 1, "not a function", async () => 3])
                ).rejects.toThrow(TypeError);
                await expect(
                    // @ts-expect-error Testing invalid input
                    parallel([async () => 1, "not a function", async () => 3])
                ).rejects.toThrow("Task at index 1 is not a function");
            });

            it("should throw TypeError if concurrency is not an integer", async () => {
                await expect(
                    parallel([async () => 1], { concurrency: 2.5 })
                ).rejects.toThrow(TypeError);
                await expect(
                    parallel([async () => 1], { concurrency: 2.5 })
                ).rejects.toThrow("concurrency must be an integer");
            });

            it("should throw TypeError if concurrency is less than 1", async () => {
                await expect(
                    parallel([async () => 1], { concurrency: 0 })
                ).rejects.toThrow(TypeError);
                await expect(
                    parallel([async () => 1], { concurrency: 0 })
                ).rejects.toThrow("concurrency must be at least 1");
            });

            it("should throw TypeError if concurrency is negative", async () => {
                await expect(
                    parallel([async () => 1], { concurrency: -1 })
                ).rejects.toThrow(TypeError);
            });
        });

        describe("edge cases", () => {
            it("should handle tasks that return different types", async () => {
                const tasks = [
                    async () => 1,
                    async () => "string",
                    async () => ({ key: "value" }),
                    async () => [1, 2, 3],
                ];

                const results = await parallel(tasks);

                expect(results).toEqual([
                    1,
                    "string",
                    { key: "value" },
                    [1, 2, 3],
                ]);
            });

            it("should handle tasks that throw synchronously", async () => {
                const tasks = [
                    async () => 1,
                    (() => {
                        throw new Error("Sync error");
                    }) as unknown as () => Promise<number>,
                ];

                await expect(parallel(tasks)).rejects.toThrow("Sync error");
            });

            it("should handle tasks that return immediately", async () => {
                const tasks = [async () => 1, async () => 2, async () => 3];

                const start = Date.now();
                const results = await parallel(tasks);
                const elapsed = Date.now() - start;

                expect(results).toEqual([1, 2, 3]);
                expect(elapsed).toBeLessThan(100);
            });

            it("should handle multiple errors (only first is thrown)", async () => {
                const tasks = [
                    async () => {
                        await sleep(50);
                        throw new Error("Error 1");
                    },
                    async () => {
                        await sleep(10);
                        throw new Error("Error 2");
                    },
                    async () => {
                        await sleep(100);
                        throw new Error("Error 3");
                    },
                ];

                await expect(parallel(tasks)).rejects.toThrow("Error 2");
            });
        });

        describe("concurrent execution verification", () => {
            it("should execute tasks concurrently (timing-based)", async () => {
                const tasks = [
                    async () => {
                        await sleep(100);
                        return 1;
                    },
                    async () => {
                        await sleep(100);
                        return 2;
                    },
                    async () => {
                        await sleep(100);
                        return 3;
                    },
                ];

                const start = Date.now();
                const results = await parallel(tasks);
                const elapsed = Date.now() - start;

                expect(results).toEqual([1, 2, 3]);
                // If executed sequentially, would take ~300ms
                // If executed concurrently, should take ~100ms
                expect(elapsed).toBeLessThan(200);
                expect(elapsed).toBeGreaterThanOrEqual(95);
            });

            it("should execute tasks concurrently without limit", async () => {
                const startTimes: number[] = [];

                const createTask = (id: number) => async () => {
                    startTimes.push(Date.now());
                    await sleep(50);
                    return id;
                };

                const tasks = Array.from({ length: 5 }, (_, i) =>
                    createTask(i)
                );

                await parallel(tasks);

                // All tasks should start within a short time window
                const minStart = Math.min(...startTimes);
                const maxStart = Math.max(...startTimes);
                const startWindow = maxStart - minStart;

                // All should start within 50ms of each other
                expect(startWindow).toBeLessThan(50);
            });
        });
    });
});
