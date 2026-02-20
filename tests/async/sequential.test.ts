import { describe, it, expect } from "vitest";
import { sequential } from "../../src/utils/async/sequential";
import { sleep } from "../../src/utils/async/sleep";

describe("sequential function", () => {
    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should execute all tasks and return results in order", async () => {
                const tasks = [async () => 1, async () => 2, async () => 3];

                const results = await sequential(tasks);

                expect(results).toEqual([1, 2, 3]);
            });

            it("should handle empty array", async () => {
                const results = await sequential([]);
                expect(results).toEqual([]);
            });

            it("should handle single task", async () => {
                const tasks = [async () => 42];
                const results = await sequential(tasks);
                expect(results).toEqual([42]);
            });

            it("should execute tasks one after another (timing-based)", async () => {
                const executionOrder: number[] = [];

                const tasks = [
                    async () => {
                        executionOrder.push(1);
                        await sleep(50);
                        return 1;
                    },
                    async () => {
                        executionOrder.push(2);
                        await sleep(50);
                        return 2;
                    },
                    async () => {
                        executionOrder.push(3);
                        await sleep(50);
                        return 3;
                    },
                ];

                const start = Date.now();
                const results = await sequential(tasks);
                const elapsed = Date.now() - start;

                expect(results).toEqual([1, 2, 3]);
                expect(executionOrder).toEqual([1, 2, 3]);
                // Should take at least 150ms (3 * 50ms)
                expect(elapsed).toBeGreaterThanOrEqual(145);
            });

            it("should fail fast on first error by default", async () => {
                const executionOrder: number[] = [];

                const tasks = [
                    async () => {
                        executionOrder.push(1);
                        return 1;
                    },
                    async () => {
                        executionOrder.push(2);
                        throw new Error("Task 2 failed");
                    },
                    async () => {
                        executionOrder.push(3);
                        return 3;
                    },
                ];

                await expect(sequential(tasks)).rejects.toThrow(
                    "Task 2 failed"
                );

                // Only tasks 1 and 2 should have executed
                expect(executionOrder).toEqual([1, 2]);
            });
        });

        describe("result chaining", () => {
            it("should pass previous result to next task", async () => {
                const tasks = [
                    async () => 10,
                    async (prev: number) => prev * 2,
                    async (prev: number) => prev + 5,
                ];

                const results = await sequential(tasks);

                expect(results).toEqual([10, 20, 25]);
            });

            it("should pass undefined to first task", async () => {
                let receivedValue: any = "not-set";

                const tasks = [
                    async (prev: any) => {
                        receivedValue = prev;
                        return 1;
                    },
                ];

                await sequential(tasks);

                expect(receivedValue).toBeUndefined();
            });

            it("should chain complex objects", async () => {
                const tasks = [
                    async () => ({ count: 1 }),
                    async (prev: any) => ({ ...prev, count: prev.count + 1 }),
                    async (prev: any) => ({ ...prev, count: prev.count * 2 }),
                ];

                const results = await sequential(tasks);

                expect(results).toEqual([
                    { count: 1 },
                    { count: 2 },
                    { count: 4 },
                ]);
            });
        });

        describe("continueOnError option", () => {
            it("should continue executing tasks after error when continueOnError is true", async () => {
                const executionOrder: number[] = [];

                const tasks = [
                    async () => {
                        executionOrder.push(1);
                        return 1;
                    },
                    async () => {
                        executionOrder.push(2);
                        throw new Error("Task 2 failed");
                    },
                    async () => {
                        executionOrder.push(3);
                        return 3;
                    },
                ];

                const results = await sequential(tasks, {
                    continueOnError: true,
                });

                // All tasks should have executed
                expect(executionOrder).toEqual([1, 2, 3]);
                // Results should include the error
                expect(results[0]).toBe(1);
                expect(results[1]).toBeInstanceOf(Error);
                expect((results[1] as unknown as Error).message).toBe(
                    "Task 2 failed"
                );
                expect(results[2]).toBe(3);
            });

            it("should pass error as previous result when continueOnError is true", async () => {
                const receivedValues: any[] = [];

                const tasks = [
                    async () => {
                        return 1;
                    },
                    async (prev: any) => {
                        receivedValues.push(prev);
                        throw new Error("Task 2 failed");
                    },
                    async (prev: any) => {
                        receivedValues.push(prev);
                        return 3;
                    },
                ];

                await sequential(tasks, { continueOnError: true });

                expect(receivedValues[0]).toBe(1);
                expect(receivedValues[1]).toBeInstanceOf(Error);
            });

            it("should handle multiple errors with continueOnError", async () => {
                const tasks = [
                    async () => {
                        throw new Error("Error 1");
                    },
                    async () => {
                        throw new Error("Error 2");
                    },
                    async () => {
                        return 3;
                    },
                ];

                const results = await sequential(tasks, {
                    continueOnError: true,
                });

                expect(results[0]).toBeInstanceOf(Error);
                expect((results[0] as unknown as Error).message).toBe(
                    "Error 1"
                );
                expect(results[1]).toBeInstanceOf(Error);
                expect((results[1] as unknown as Error).message).toBe(
                    "Error 2"
                );
                expect(results[2]).toBe(3);
            });
        });

        describe("input validation", () => {
            it("should throw TypeError if tasks is not an array", async () => {
                await expect(
                    // @ts-expect-error Testing invalid input
                    sequential("not an array")
                ).rejects.toThrow(TypeError);
                await expect(
                    // @ts-expect-error Testing invalid input
                    sequential("not an array")
                ).rejects.toThrow("tasks must be an array");
            });

            it("should throw TypeError if task is not a function", async () => {
                await expect(
                    sequential([
                        async () => 1,
                        // @ts-expect-error Testing invalid input
                        "not a function",
                        async () => 3,
                    ])
                ).rejects.toThrow(TypeError);
                await expect(
                    sequential([
                        async () => 1,
                        // @ts-expect-error Testing invalid input
                        "not a function",
                        async () => 3,
                    ])
                ).rejects.toThrow("Task at index 1 is not a function");
            });
        });

        describe("edge cases", () => {
            it("should handle tasks that throw synchronously", async () => {
                const tasks = [
                    async () => 1,
                    (() => {
                        throw new Error("Sync error");
                    }) as unknown as () => Promise<number>,
                ];

                await expect(sequential(tasks)).rejects.toThrow("Sync error");
            });

            it("should handle tasks that return immediately", async () => {
                const tasks = [async () => 1, async () => 2, async () => 3];

                const start = Date.now();
                const results = await sequential(tasks);
                const elapsed = Date.now() - start;

                expect(results).toEqual([1, 2, 3]);
                expect(elapsed).toBeLessThan(100);
            });

            it("should handle first task failure", async () => {
                const executionOrder: number[] = [];

                const tasks = [
                    async () => {
                        executionOrder.push(1);
                        throw new Error("First task failed");
                    },
                    async () => {
                        executionOrder.push(2);
                        return 2;
                    },
                ];

                await expect(sequential(tasks)).rejects.toThrow(
                    "First task failed"
                );
                expect(executionOrder).toEqual([1]);
            });

            it("should handle last task failure", async () => {
                const executionOrder: number[] = [];

                const tasks = [
                    async () => {
                        executionOrder.push(1);
                        return 1;
                    },
                    async () => {
                        executionOrder.push(2);
                        return 2;
                    },
                    async () => {
                        executionOrder.push(3);
                        throw new Error("Last task failed");
                    },
                ];

                await expect(sequential(tasks)).rejects.toThrow(
                    "Last task failed"
                );
                expect(executionOrder).toEqual([1, 2, 3]);
            });
        });

        describe("sequential execution verification", () => {
            it("should not start next task until previous completes", async () => {
                const startTimes: number[] = [];
                const endTimes: number[] = [];

                const createTask = (id: number) => async () => {
                    startTimes.push(Date.now());
                    await sleep(50);
                    endTimes.push(Date.now());
                    return id;
                };

                const tasks = [createTask(1), createTask(2), createTask(3)];

                await sequential(tasks);

                // Each task should start after the previous one ends
                for (let i = 1; i < startTimes.length; i++) {
                    expect(startTimes[i]).toBeGreaterThanOrEqual(
                        endTimes[i - 1]
                    );
                }
            });

            it("should execute in strict order even with varying durations", async () => {
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
                        return 2;
                    },
                    async () => {
                        await sleep(50);
                        executionOrder.push(3);
                        return 3;
                    },
                ];

                const results = await sequential(tasks);

                expect(results).toEqual([1, 2, 3]);
                expect(executionOrder).toEqual([1, 2, 3]);
            });
        });
    });
});
