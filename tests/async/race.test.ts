import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { race } from "../../src/utils/async/race";
import { sleep } from "../../src/utils/async/sleep";

describe("race function", () => {
    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should resolve with the first resolved promise", async () => {
                const result = await race([
                    sleep(100).then(() => "slow"),
                    sleep(10).then(() => "fast"),
                    sleep(50).then(() => "medium"),
                ]);

                expect(result).toBe("fast");
            });

            it("should resolve if a success follows a faster rejection", async () => {
                const error = new Error("fast error");

                const result = await race([
                    sleep(100).then(() => "slow"),
                    Promise.reject(error),
                    sleep(50).then(() => "medium"),
                ]);

                expect(result).toBe("medium");
            });

            it("should resolve even if some promises reject later", async () => {
                const result = await race([
                    sleep(50).then(() => {
                        throw new Error("slow error");
                    }),
                    sleep(10).then(() => "fast success"),
                ]);

                expect(result).toBe("fast success");
            });
        });

        describe("edge cases", () => {
            it("should reject with TypeError for empty array", () => {
                expect(() => race([])).toThrow(TypeError);
                expect(() => race([])).toThrow(
                    "Cannot race an empty array of promises"
                );
            });

            it("should reject with TypeError for non-array input", () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(() => race(null as any)).toThrow(TypeError);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(() => race(undefined as any)).toThrow(TypeError);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(() => race("not an array" as any)).toThrow(TypeError);
            });

            it("should reject with AggregateError when all promises reject", async () => {
                const error1 = new Error("error 1");
                const error2 = new Error("error 2");
                const error3 = new Error("error 3");

                try {
                    await race([
                        Promise.reject(error1),
                        Promise.reject(error2),
                        Promise.reject(error3),
                    ]);
                    expect.fail("Should have thrown AggregateError");
                } catch (error) {
                    expect(error).toBeInstanceOf(AggregateError);
                    expect((error as AggregateError).errors).toHaveLength(3);
                    expect((error as AggregateError).errors).toContain(error1);
                    expect((error as AggregateError).errors).toContain(error2);
                    expect((error as AggregateError).errors).toContain(error3);
                    expect((error as AggregateError).message).toContain(
                        "All 3 promises rejected"
                    );
                }
            });

            it("should handle single promise", async () => {
                const result = await race([Promise.resolve("single")]);
                expect(result).toBe("single");
            });

            it("should handle single rejected promise", async () => {
                const error = new Error("single error");

                try {
                    await race([Promise.reject(error)]);
                    expect.fail("Should have thrown AggregateError");
                } catch (err) {
                    expect(err).toBeInstanceOf(AggregateError);
                    expect((err as AggregateError).errors).toHaveLength(1);
                    expect((err as AggregateError).errors[0]).toBe(error);
                }
            });

            it("should preserve error order in AggregateError", async () => {
                const errors = [
                    new Error("error 1"),
                    new Error("error 2"),
                    new Error("error 3"),
                ];

                try {
                    await race([
                        sleep(30).then(() => Promise.reject(errors[0])),
                        sleep(10).then(() => Promise.reject(errors[1])),
                        sleep(20).then(() => Promise.reject(errors[2])),
                    ]);
                    expect.fail("Should have thrown AggregateError");
                } catch (error) {
                    expect(error).toBeInstanceOf(AggregateError);
                    const aggregateError = error as AggregateError;
                    // Errors should be in original array order, not settlement order
                    expect(aggregateError.errors[0]).toBe(errors[0]);
                    expect(aggregateError.errors[1]).toBe(errors[1]);
                    expect(aggregateError.errors[2]).toBe(errors[2]);
                }
            });
        });

        describe("timing behavior", () => {
            it("should not wait for slow promises after first resolves", async () => {
                const start = Date.now();

                const result = await race([
                    sleep(1000).then(() => "very slow"),
                    sleep(10).then(() => "fast"),
                ]);

                const elapsed = Date.now() - start;

                expect(result).toBe("fast");
                expect(elapsed).toBeLessThan(100); // Should not wait for 1000ms
            });

            it("should wait for all rejections before creating AggregateError", async () => {
                const start = Date.now();

                try {
                    await race([
                        sleep(50).then(() => Promise.reject("error 1")),
                        sleep(100).then(() => Promise.reject("error 2")),
                    ]);
                    expect.fail("Should have thrown");
                } catch (error) {
                    const elapsed = Date.now() - start;
                    expect(elapsed).toBeGreaterThanOrEqual(95); // Should wait for slowest rejection
                    expect(error).toBeInstanceOf(AggregateError);
                }
            });
        });

        describe("value types", () => {
            it("should handle different value types", async () => {
                const obj = { key: "value" };
                const result = await race<{ key: string } | string>([
                    Promise.resolve(obj),
                    Promise.resolve("string"),
                ]);
                expect(result).toBe(obj);
            });

            it("should handle null and undefined values", async () => {
                const result1 = await race([
                    Promise.resolve(null),
                    sleep(10).then(() => "later"),
                ]);
                expect(result1).toBe(null);

                const result2 = await race([
                    Promise.resolve(undefined),
                    sleep(10).then(() => "later"),
                ]);
                expect(result2).toBe(undefined);
            });

            it("should handle numeric values including zero", async () => {
                const result = await race([
                    Promise.resolve(0),
                    sleep(10).then(() => 100),
                ]);
                expect(result).toBe(0);
            });
        });
    });

    describe("Property-Based Tests", () => {
        // Feature: async-utils, Property 19: Race returns first settled
        it("Property 19: should resolve or reject with the first settled promise", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.integer({ min: 10, max: 100 }), {
                        minLength: 1,
                        maxLength: 5,
                    }),
                    fc.integer({ min: 0, max: 4 }),
                    async (delays, winnerIndex) => {
                        // Ensure winnerIndex is valid
                        const actualWinnerIndex = winnerIndex % delays.length;

                        // Make the winner delay much shorter
                        const adjustedDelays = delays.map((delay, idx) =>
                            idx === actualWinnerIndex ? 10 : delay + 100
                        );

                        const promises = adjustedDelays.map((delay, idx) =>
                            sleep(delay).then(() => idx)
                        );

                        const result = await race(promises);

                        // The result should be the index with the shortest delay
                        return result === actualWinnerIndex;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it("Property: should reject with AggregateError when all promises reject", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
                    async (errorMessages) => {
                        const promises = errorMessages.map((msg) =>
                            Promise.reject(new Error(msg))
                        );

                        try {
                            await race(promises);
                            return false; // Should not reach here
                        } catch (error) {
                            if (!(error instanceof AggregateError)) {
                                return false;
                            }

                            const aggregateError = error as AggregateError;

                            // Should have all errors
                            if (
                                aggregateError.errors.length !==
                                errorMessages.length
                            ) {
                                return false;
                            }

                            // Should preserve error messages
                            return errorMessages.every((msg, idx) => {
                                const err = aggregateError.errors[idx] as Error;
                                return err.message === msg;
                            });
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it("Property: should handle mixed success and failure", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 5 }),
                    fc.integer({ min: 0, max: 4 }),
                    async (count, successIndex) => {
                        const actualSuccessIndex = successIndex % count;

                        const promises = Array.from(
                            { length: count },
                            (_, idx) => {
                                if (idx === actualSuccessIndex) {
                                    return sleep(10).then(() => "success");
                                }
                                return sleep(50).then(() =>
                                    Promise.reject(new Error(`error ${idx}`))
                                );
                            }
                        );

                        const result = await race(promises);
                        return result === "success";
                    }
                ),
                { numRuns: 100 }
            );
        });

        it("Property: should throw TypeError for empty array", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constant([] as Promise<unknown>[]),
                    async (emptyArray) => {
                        try {
                            await race(emptyArray);
                            return false;
                        } catch (error) {
                            return (
                                error instanceof TypeError &&
                                error.message.includes("empty")
                            );
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
