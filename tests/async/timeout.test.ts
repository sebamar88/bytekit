import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { timeout, withTimeout } from "../../src/utils/async/timeout";
import { TimeoutError } from "../../src/utils/async/errors";
import { sleep } from "../../src/utils/async/sleep";

describe("timeout function", () => {
    beforeEach(() => {
        vi.clearAllTimers();
    });

    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should resolve with the promise value if it settles before timeout", async () => {
                const promise = Promise.resolve(42);
                const result = await timeout(promise, 1000);
                expect(result).toBe(42);
            });

            it("should reject with the promise error if it rejects before timeout", async () => {
                const error = new Error("Test error");
                const promise = Promise.reject(error);

                await expect(timeout(promise, 1000)).rejects.toThrow(
                    "Test error"
                );
            });

            it("should reject with TimeoutError if promise takes too long", async () => {
                const promise = sleep(200);

                await expect(timeout(promise, 100)).rejects.toThrow(
                    TimeoutError
                );
            });

            it("should include timeout duration in TimeoutError", async () => {
                const promise = sleep(200);

                try {
                    await timeout(promise, 100);
                    expect.fail("Should have thrown TimeoutError");
                } catch (error) {
                    expect(error).toBeInstanceOf(TimeoutError);
                    expect((error as TimeoutError).timeout).toBe(100);
                }
            });

            it("should use custom error message when provided", async () => {
                const promise = sleep(200);
                const customMessage = "Custom timeout message";

                await expect(
                    timeout(promise, 100, customMessage)
                ).rejects.toThrow(customMessage);
            });

            it("should use default error message when not provided", async () => {
                const promise = sleep(200);

                await expect(timeout(promise, 100)).rejects.toThrow(
                    "Operation timed out after 100 milliseconds"
                );
            });
        });

        describe("edge cases", () => {
            it("should handle zero timeout", async () => {
                const promise = sleep(100);

                await expect(timeout(promise, 0)).rejects.toThrow(TimeoutError);
            });

            it("should handle promise that resolves immediately", async () => {
                const promise = Promise.resolve("instant");
                const result = await timeout(promise, 100);
                expect(result).toBe("instant");
            });

            it("should handle promise that rejects immediately", async () => {
                const error = new Error("Immediate error");
                const promise = Promise.reject(error);

                await expect(timeout(promise, 100)).rejects.toThrow(
                    "Immediate error"
                );
            });

            it("should preserve promise value types", async () => {
                const objectPromise = Promise.resolve({ key: "value" });
                const result = await timeout(objectPromise, 100);
                expect(result).toEqual({ key: "value" });
            });

            it("should handle multiple concurrent timeouts", async () => {
                const promises = [
                    timeout(Promise.resolve(1), 100),
                    timeout(Promise.resolve(2), 100),
                    timeout(Promise.resolve(3), 100),
                ];

                const results = await Promise.all(promises);
                expect(results).toEqual([1, 2, 3]);
            });
        });

        describe("timing behavior", () => {
            it("should timeout exactly when specified", async () => {
                const promise = sleep(200);
                const start = Date.now();

                try {
                    await timeout(promise, 100);
                    expect.fail("Should have timed out");
                } catch (error) {
                    const elapsed = Date.now() - start;
                    expect(error).toBeInstanceOf(TimeoutError);
                    // Should timeout around 100ms (±50ms tolerance)
                    expect(elapsed).toBeGreaterThanOrEqual(95);
                    expect(elapsed).toBeLessThan(150);
                }
            });

            it("should not timeout if promise settles just before timeout", async () => {
                const promise = sleep(90);
                const result = await timeout(promise, 100);
                expect(result).toBeUndefined();
            });
        });
    });

    describe("Property-Based Tests", () => {
        // Feature: async-utils, Property 4: Timeout preserves settled values
        it("Property 4: should preserve resolved values for fast promises", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.anything(),
                    fc.integer({ min: 100, max: 500 }),
                    async (value, timeoutMs) => {
                        const promise = Promise.resolve(value);
                        const result = await timeout(promise, timeoutMs);
                        return result === value;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it("Property 4: should preserve rejection errors for fast promises", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string(),
                    fc.integer({ min: 100, max: 500 }),
                    async (errorMessage, timeoutMs) => {
                        const error = new Error(errorMessage);
                        const promise = Promise.reject(error);

                        try {
                            await timeout(promise, timeoutMs);
                            return false; // Should not reach here
                        } catch (caughtError) {
                            return (
                                caughtError instanceof Error &&
                                caughtError.message === errorMessage
                            );
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: async-utils, Property 5: Timeout triggers on slow promises
        it("Property 5: should reject with TimeoutError for slow promises", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 50, max: 100 }),
                    fc.integer({ min: 150, max: 250 }),
                    async (timeoutMs, promiseDelay) => {
                        const promise = sleep(promiseDelay);

                        try {
                            await timeout(promise, timeoutMs);
                            return false; // Should not reach here
                        } catch (error) {
                            return (
                                error instanceof TimeoutError &&
                                error.timeout === timeoutMs
                            );
                        }
                    }
                ),
                { numRuns: 50 }
            );
        }, 15000);

        it("Property: timeout duration should be included in error", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 10, max: 100 }),
                    async (timeoutMs) => {
                        const promise = sleep(timeoutMs + 100);

                        try {
                            await timeout(promise, timeoutMs);
                            return false;
                        } catch (error) {
                            return (
                                error instanceof TimeoutError &&
                                error.timeout === timeoutMs &&
                                error.message.includes(timeoutMs.toString())
                            );
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it("Property: custom error messages should be preserved", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 10, max: 100 }),
                    async (customMessage, timeoutMs) => {
                        const promise = sleep(timeoutMs + 100);

                        try {
                            await timeout(promise, timeoutMs, customMessage);
                            return false;
                        } catch (error) {
                            return (
                                error instanceof TimeoutError &&
                                error.message === customMessage
                            );
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

describe("withTimeout decorator", () => {
    beforeEach(() => {
        vi.clearAllTimers();
    });

    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should wrap an async function with timeout behavior", async () => {
                const fn = async (x: number) => x * 2;
                const wrapped = withTimeout(fn, 1000);

                const result = await wrapped(5);
                expect(result).toBe(10);
            });

            it("should timeout if wrapped function takes too long", async () => {
                const fn = async () => {
                    await sleep(200);
                    return "done";
                };
                const wrapped = withTimeout(fn, 100);

                await expect(wrapped()).rejects.toThrow(TimeoutError);
            });

            it("should preserve function arguments", async () => {
                const fn = async (a: number, b: string, c: boolean) => ({
                    a,
                    b,
                    c,
                });
                const wrapped = withTimeout(fn, 1000);

                const result = await wrapped(42, "test", true);
                expect(result).toEqual({ a: 42, b: "test", c: true });
            });

            it("should preserve this context", async () => {
                const obj = {
                    value: 42,
                    async getValue(this: { value: number }) {
                        return this.value;
                    },
                };

                const wrapped = withTimeout(obj.getValue, 1000);
                const result = await wrapped.call(obj);
                expect(result).toBe(42);
            });

            it("should support custom error messages", async () => {
                const fn = async () => {
                    await sleep(200);
                    return "done";
                };
                const wrapped = withTimeout(fn, 100, "Custom timeout");

                await expect(wrapped()).rejects.toThrow("Custom timeout");
            });

            it("should handle function that throws synchronously", async () => {
                const fn = async () => {
                    throw new Error("Sync error");
                };
                const wrapped = withTimeout(fn, 1000);

                await expect(wrapped()).rejects.toThrow("Sync error");
            });
        });

        describe("edge cases", () => {
            it("should handle functions with no arguments", async () => {
                const fn = async () => "result";
                const wrapped = withTimeout(fn, 1000);

                const result = await wrapped();
                expect(result).toBe("result");
            });

            it("should handle functions with many arguments", async () => {
                const fn = async (a: number, b: number, c: number, d: number) =>
                    a + b + c + d;
                const wrapped = withTimeout(fn, 1000);

                const result = await wrapped(1, 2, 3, 4);
                expect(result).toBe(10);
            });

            it("should allow multiple calls to wrapped function", async () => {
                const fn = async (x: number) => x * 2;
                const wrapped = withTimeout(fn, 1000);

                const result1 = await wrapped(5);
                const result2 = await wrapped(10);

                expect(result1).toBe(10);
                expect(result2).toBe(20);
            });

            it("should handle concurrent calls to wrapped function", async () => {
                const fn = async (x: number) => {
                    await sleep(50);
                    return x * 2;
                };
                const wrapped = withTimeout(fn, 1000);

                const results = await Promise.all([
                    wrapped(1),
                    wrapped(2),
                    wrapped(3),
                ]);

                expect(results).toEqual([2, 4, 6]);
            });
        });
    });

    describe("Property-Based Tests", () => {
        // Feature: async-utils, Property 23: WithTimeout applies timeout behavior
        it("Property 23: should apply timeout behavior to all invocations", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 50, max: 100 }),
                    fc.integer({ min: 150, max: 250 }),
                    async (timeoutMs, fnDelay) => {
                        const fn = async () => {
                            await sleep(fnDelay);
                            return "done";
                        };
                        const wrapped = withTimeout(fn, timeoutMs);

                        try {
                            await wrapped();
                            return false; // Should timeout
                        } catch (error) {
                            return error instanceof TimeoutError;
                        }
                    }
                ),
                { numRuns: 50 }
            );
        }, 15000);

        // Feature: async-utils, Property 24: WithTimeout preserves fast results
        it("Property 24: should return original result for fast functions", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.anything(),
                    fc.integer({ min: 100, max: 500 }),
                    async (value, timeoutMs) => {
                        const fn = async () => value;
                        const wrapped = withTimeout(fn, timeoutMs);

                        const result = await wrapped();
                        return result === value;
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: async-utils, Property 25: WithTimeout rejects slow functions
        it("Property 25: should reject with TimeoutError for slow functions", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 50, max: 100 }),
                    async (timeoutMs) => {
                        const fn = async () => {
                            await sleep(timeoutMs + 100);
                            return "done";
                        };
                        const wrapped = withTimeout(fn, timeoutMs);

                        try {
                            await wrapped();
                            return false;
                        } catch (error) {
                            return (
                                error instanceof TimeoutError &&
                                error.timeout === timeoutMs
                            );
                        }
                    }
                ),
                { numRuns: 50 }
            );
        }, 15000);

        it("Property: should preserve function arguments across calls", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer(),
                    fc.string(),
                    fc.boolean(),
                    async (num, str, bool) => {
                        const fn = async (
                            a: number,
                            b: string,
                            c: boolean
                        ) => ({ a, b, c });
                        const wrapped = withTimeout(fn, 1000);

                        const result = await wrapped(num, str, bool);
                        return (
                            result.a === num &&
                            result.b === str &&
                            result.c === bool
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
