import { describe, it, expect, beforeEach, vi } from "vitest";
import { debounceAsync } from "../../src/utils/async/debounce";

describe("debounceAsync function", () => {
    beforeEach(() => {
        vi.clearAllTimers();
    });

    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should execute function after delay", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 100);

                const promise = debounced(5);

                // Function should not execute immediately
                expect(fn).not.toHaveBeenCalled();

                // Wait for debounce delay
                await new Promise((resolve) => setTimeout(resolve, 150));

                const result = await promise;
                expect(result).toBe(10);
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(5);
            });

            it("should cancel previous calls when called multiple times", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 100);

                // Make multiple rapid calls
                const promise1 = debounced(1);
                const promise2 = debounced(2);
                const promise3 = debounced(3);

                // Attach silent catch to prevent unhandled rejection warnings
                promise1.catch(() => {});
                promise2.catch(() => {});

                // Wait for debounce delay
                await new Promise((resolve) => setTimeout(resolve, 150));

                // Only the last call should execute
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(3);

                // First two promises should be rejected
                await expect(promise1).rejects.toThrow(
                    "Debounced call cancelled"
                );
                await expect(promise2).rejects.toThrow(
                    "Debounced call cancelled"
                );

                // Last promise should resolve
                const result = await promise3;
                expect(result).toBe(6);
            });

            it("should return promise that resolves with function result", async () => {
                const fn = async (x: number) => x * 2;
                const debounced = debounceAsync(fn, 50);

                const promise = debounced(10);

                await new Promise((resolve) => setTimeout(resolve, 100));

                const result = await promise;
                expect(result).toBe(20);
            });

            it("should handle async function errors", async () => {
                const error = new Error("Test error");
                const fn = async () => {
                    throw error;
                };
                const debounced = debounceAsync(fn, 50);

                const promise = debounced();
                promise.catch(() => {}); // Handle globally

                await new Promise((resolve) => setTimeout(resolve, 100));

                await expect(promise).rejects.toThrow("Test error");
            });
        });

        describe("cancel method", () => {
            it("should cancel pending execution", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 100);

                const promise = debounced(5);
                promise.catch(() => {}); // Handle globally

                // Cancel before execution
                debounced.cancel();

                // Wait to ensure it doesn't execute
                await new Promise((resolve) => setTimeout(resolve, 150));

                expect(fn).not.toHaveBeenCalled();
                await expect(promise).rejects.toThrow(
                    "Debounced call cancelled"
                );
            });

            it("should reject pending promises on cancel", async () => {
                const fn = async (x: number) => x * 2;
                const debounced = debounceAsync(fn, 100);

                const promise = debounced(5);
                promise.catch(() => {}); // Handle globally
                debounced.cancel();

                await expect(promise).rejects.toThrow(
                    "Debounced call cancelled"
                );
            });

            it("should allow new calls after cancel", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 50);

                const promise1 = debounced(5);
                promise1.catch(() => {}); // Handle globally
                debounced.cancel();

                const promise2 = debounced(10);
                await new Promise((resolve) => setTimeout(resolve, 100));

                await expect(promise1).rejects.toThrow(
                    "Debounced call cancelled"
                );
                const result = await promise2;
                expect(result).toBe(20);
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(10);
            });
        });

        describe("flush method", () => {
            it("should immediately execute pending call", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 100);

                const promise = debounced(5);

                // Flush immediately
                await debounced.flush();

                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(5);

                const result = await promise;
                expect(result).toBe(10);
            });

            it("should return undefined when no pending call", async () => {
                const fn = async (x: number) => x * 2;
                const debounced = debounceAsync(fn, 100);

                const result = await debounced.flush();
                expect(result).toBeUndefined();
            });

            it("should execute immediately without waiting for delay", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 1000);

                const promise = debounced(5);

                const start = Date.now();
                await debounced.flush();
                const elapsed = Date.now() - start;

                // Should execute much faster than the 1000ms delay
                expect(elapsed).toBeLessThan(100);
                expect(fn).toHaveBeenCalledTimes(1);

                const result = await promise;
                expect(result).toBe(10);
            });
        });

        describe("leading option", () => {
            it("should execute immediately on first call with leading=true", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 100, { leading: true });

                const promise = debounced(5);

                // Should execute immediately
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(5);

                const result = await promise;
                expect(result).toBe(10);
            });

            it("should not execute trailing call with leading=true", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 100, { leading: true });

                // First call executes immediately
                const promise1 = debounced(5);
                await new Promise((resolve) => setTimeout(resolve, 10));

                // Second call within delay should be cancelled
                const promise2 = debounced(10);
                promise2.catch(() => {});

                await new Promise((resolve) => setTimeout(resolve, 150));

                // Only first call should execute
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(5);

                const result1 = await promise1;
                expect(result1).toBe(10);

                await expect(promise2).rejects.toThrow(
                    "Debounced call cancelled"
                );
            });

            it("should allow new leading execution after delay", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 100, { leading: true });

                // First call
                const promise1 = debounced(5);
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(fn).toHaveBeenCalledTimes(1);

                // Wait for delay to pass
                await new Promise((resolve) => setTimeout(resolve, 150));

                // Second call should execute immediately again
                const promise2 = debounced(10);
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(fn).toHaveBeenCalledTimes(2);

                const result1 = await promise1;
                const result2 = await promise2;
                expect(result1).toBe(10);
                expect(result2).toBe(20);
            });
        });

        describe("input validation", () => {
            it("should throw TypeError for non-function first argument", () => {
                expect(() => debounceAsync(null as any, 100)).toThrow(
                    TypeError
                );
                expect(() => debounceAsync(null as any, 100)).toThrow(
                    "First argument must be a function"
                );
            });

            it("should throw TypeError for negative delay", () => {
                const fn = async () => {};
                expect(() => debounceAsync(fn, -100)).toThrow(TypeError);
                expect(() => debounceAsync(fn, -100)).toThrow(
                    "Delay must be a non-negative number"
                );
            });

            it("should throw TypeError for non-number delay", () => {
                const fn = async () => {};
                expect(() => debounceAsync(fn, "100" as any)).toThrow(
                    TypeError
                );
            });
        });

        describe("edge cases", () => {
            it("should handle zero delay", async () => {
                const fn = vi.fn(async (x: number) => x * 2);
                const debounced = debounceAsync(fn, 0);

                const promise = debounced(5);

                // Even with zero delay, should use setTimeout
                await new Promise((resolve) => setTimeout(resolve, 10));

                expect(fn).toHaveBeenCalledTimes(1);
                const result = await promise;
                expect(result).toBe(10);
            });

            it("should handle multiple arguments", async () => {
                const fn = vi.fn(
                    async (a: number, b: number, c: number) => a + b + c
                );
                const debounced = debounceAsync(fn, 50);

                const promise = debounced(1, 2, 3);
                await new Promise((resolve) => setTimeout(resolve, 100));

                expect(fn).toHaveBeenCalledWith(1, 2, 3);
                const result = await promise;
                expect(result).toBe(6);
            });

            it("should handle no arguments", async () => {
                const fn = vi.fn(async () => "result");
                const debounced = debounceAsync(fn, 50);

                const promise = debounced();
                await new Promise((resolve) => setTimeout(resolve, 100));

                expect(fn).toHaveBeenCalledTimes(1);
                const result = await promise;
                expect(result).toBe("result");
            });
        });
    });
});
