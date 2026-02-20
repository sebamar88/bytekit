import { describe, it, expect, beforeEach, vi } from "vitest";
import { throttleAsync } from "../../src/utils/async/throttle";

describe("throttleAsync function", () => {
    beforeEach(() => {
        vi.clearAllTimers();
    });

    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should execute first call immediately", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100);

                const promise = throttled(5);

                // Function should execute immediately
                const result = await promise;
                expect(result).toBe(10);
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(5);
            });

            it("should queue second call for trailing execution", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100);

                // First call executes immediately
                const promise1 = throttled(5);
                await promise1;
                expect(fn).toHaveBeenCalledTimes(1);

                // Second call within interval should be queued
                const promise2 = throttled(10);

                // Should not execute immediately
                expect(fn).toHaveBeenCalledTimes(1);

                // Wait for interval to pass
                await new Promise((resolve) => setTimeout(resolve, 150));

                const result2 = await promise2;
                expect(result2).toBe(20);
                expect(fn).toHaveBeenCalledTimes(2);
                expect(fn).toHaveBeenCalledWith(10);
            });

            it("should enforce minimum interval between executions", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100);

                const start = Date.now();

                // First call
                await throttled(1);
                const time1 = Date.now() - start;

                // Second call (queued)
                const promise2 = throttled(2);
                await new Promise((resolve) => setTimeout(resolve, 150));
                await promise2;
                const time2 = Date.now() - start;

                // Second execution should be at least 100ms after first
                expect(time2 - time1).toBeGreaterThanOrEqual(90); // Allow some tolerance
                expect(fn).toHaveBeenCalledTimes(2);
            });

            it("should cancel previous queued call when new call arrives", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100);

                // First call executes immediately
                await throttled(1);

                // Queue multiple calls
                const promise2 = throttled(2);
                const promise3 = throttled(3);
                
                // Attach silent catch to prevent unhandled rejection warnings
                promise2.catch(() => {});

                // Wait for trailing execution
                await new Promise((resolve) => setTimeout(resolve, 150));

                // Only the last queued call should execute
                expect(fn).toHaveBeenCalledTimes(2);
                expect(fn).toHaveBeenNthCalledWith(2, 3);

                // Second promise should be rejected
                await expect(promise2).rejects.toThrow(
                    "Throttled call cancelled"
                );

                // Third promise should resolve
                const result3 = await promise3;
                expect(result3).toBe(6);
            });

            it("should return promise that resolves with function result", async () => {
                const fn = async (x: number) => x * 2;
                const throttled = throttleAsync(fn, 50);

                const result = await throttled(10);
                expect(result).toBe(20);
            });

            it("should handle async function errors", async () => {
                const error = new Error("Test error");
                const fn = async () => {
                    throw error;
                };
                const throttled = throttleAsync(fn, 50);

                const promise = throttled();
                promise.catch(() => {});
                await expect(promise).rejects.toThrow("Test error");
            });
        });

        describe("cancel method", () => {
            it("should cancel queued execution", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100);

                // First call executes immediately
                await throttled(5);
                expect(fn).toHaveBeenCalledTimes(1);

                // Queue second call
                const promise = throttled(10);
                promise.catch(() => {});

                // Cancel before trailing execution
                throttled.cancel();

                // Wait to ensure it doesn't execute
                await new Promise((resolve) => setTimeout(resolve, 150));

                expect(fn).toHaveBeenCalledTimes(1);
                await expect(promise).rejects.toThrow(
                    "Throttled call cancelled"
                );
            });

            it("should reject pending promises on cancel", async () => {
                const fn = async (x: number) => x * 2;
                const throttled = throttleAsync(fn, 100);

                await throttled(5);
                const promise = throttled(10);
                promise.catch(() => {});
                throttled.cancel();

                await expect(promise).rejects.toThrow(
                    "Throttled call cancelled"
                );
            });

            it("should allow new calls after cancel", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 50);

                await throttled(5);
                const promise1 = throttled(10);
                promise1.catch(() => {});
                throttled.cancel();

                // Wait for interval to pass
                await new Promise((resolve) => setTimeout(resolve, 100));

                // New call should execute immediately
                const result = await throttled(15);
                expect(result).toBe(30);
                expect(fn).toHaveBeenCalledTimes(2);
                expect(fn).toHaveBeenCalledWith(15);

                await expect(promise1).rejects.toThrow(
                    "Throttled call cancelled"
                );
            });
        });

        describe("trailing option", () => {
            it("should execute trailing call by default", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100);

                await throttled(5);
                const promise = throttled(10);

                await new Promise((resolve) => setTimeout(resolve, 150));

                expect(fn).toHaveBeenCalledTimes(2);
                const result = await promise;
                expect(result).toBe(20);
            });

            it("should not execute trailing call with trailing=false", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100, { trailing: false });

                await throttled(5);
                expect(fn).toHaveBeenCalledTimes(1);

                // Second call within interval should be rejected
                const promise = throttled(10);
                promise.catch(() => {});

                await expect(promise).rejects.toThrow(
                    "Throttled call rejected (trailing disabled)"
                );
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it("should allow execution after interval with trailing=false", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100, { trailing: false });

                await throttled(5);
                expect(fn).toHaveBeenCalledTimes(1);

                // Wait for interval to pass
                await new Promise((resolve) => setTimeout(resolve, 150));

                // Next call should execute immediately
                const result = await throttled(10);
                expect(result).toBe(20);
                expect(fn).toHaveBeenCalledTimes(2);
            });
        });

        describe("input validation", () => {
            it("should throw TypeError for non-function first argument", () => {
                expect(() => throttleAsync(null as any, 100)).toThrow(
                    TypeError
                );
                expect(() => throttleAsync(null as any, 100)).toThrow(
                    "First argument must be a function"
                );
            });

            it("should throw TypeError for negative interval", () => {
                const fn = async () => {};
                expect(() => throttleAsync(fn, -100)).toThrow(TypeError);
                expect(() => throttleAsync(fn, -100)).toThrow(
                    "Interval must be a non-negative number"
                );
            });

            it("should throw TypeError for non-number interval", () => {
                const fn = async () => {};
                expect(() => throttleAsync(fn, "100" as any)).toThrow(
                    TypeError
                );
            });
        });

        describe("edge cases", () => {
            it("should handle zero interval", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 0);

                // All calls should execute immediately
                await throttled(1);
                await throttled(2);
                await throttled(3);

                expect(fn).toHaveBeenCalledTimes(3);
            });

            it("should handle multiple arguments", async () => {
                const fn = vi.fn(
                    async (a: number, b: number, c: number) => a + b + c
                );
                const throttled = throttleAsync(fn, 50);

                const result = await throttled(1, 2, 3);
                expect(fn).toHaveBeenCalledWith(1, 2, 3);
                expect(result).toBe(6);
            });

            it("should handle no arguments", async () => {
                const fn = vi.fn(async () => "result");
                const throttled = throttleAsync(fn, 50);

                const result = await throttled();
                expect(fn).toHaveBeenCalledTimes(1);
                expect(result).toBe("result");
            });

            it("should handle rapid successive calls after interval", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const throttled = throttleAsync(fn, 100);

                // First call
                await throttled(1);
                expect(fn).toHaveBeenCalledTimes(1);

                // Wait for interval
                await new Promise((resolve) => setTimeout(resolve, 150));

                // Second call should execute immediately
                await throttled(2);
                expect(fn).toHaveBeenCalledTimes(2);

                // Wait for interval
                await new Promise((resolve) => setTimeout(resolve, 150));

                // Third call should execute immediately
                await throttled(3);
                expect(fn).toHaveBeenCalledTimes(3);
            });
        });
    });
});
