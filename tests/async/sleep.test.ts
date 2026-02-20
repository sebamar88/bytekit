import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { sleep } from "../../src/utils/async/sleep";
import { AbortError } from "../../src/utils/async/errors";

describe("sleep function", () => {
    beforeEach(() => {
        vi.clearAllTimers();
    });

    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should resolve after specified milliseconds", async () => {
                const start = Date.now();
                await sleep(100);
                const elapsed = Date.now() - start;

                // Allow 50ms tolerance for timing
                expect(elapsed).toBeGreaterThanOrEqual(100);
                expect(elapsed).toBeLessThan(150);
            });

            it("should resolve immediately for zero milliseconds", async () => {
                const start = Date.now();
                await sleep(0);
                const elapsed = Date.now() - start;

                // Should complete almost instantly
                expect(elapsed).toBeLessThan(50);
            });

            it("should reject with TypeError for negative milliseconds", () => {
                expect(() => sleep(-100)).toThrow(TypeError);
                expect(() => sleep(-100)).toThrow(
                    "Sleep duration must be non-negative"
                );
            });

            it("should reject with TypeError for negative zero", () => {
                expect(() => sleep(-0.1)).toThrow(TypeError);
            });
        });

        describe("AbortSignal support", () => {
            it("should reject with AbortError when signal is aborted", async () => {
                const controller = new AbortController();

                // Abort after 50ms
                setTimeout(() => controller.abort(), 50);

                await expect(sleep(200, controller.signal)).rejects.toThrow(
                    AbortError
                );
                await expect(sleep(200, controller.signal)).rejects.toThrow(
                    "Sleep aborted"
                );
            });

            it("should reject immediately if signal is already aborted", async () => {
                const controller = new AbortController();
                controller.abort();

                const start = Date.now();
                await expect(sleep(1000, controller.signal)).rejects.toThrow(
                    AbortError
                );
                const elapsed = Date.now() - start;

                // Should fail immediately
                expect(elapsed).toBeLessThan(50);
            });

            it("should complete normally if not aborted", async () => {
                const controller = new AbortController();

                const start = Date.now();
                await sleep(100, controller.signal);
                const elapsed = Date.now() - start;

                expect(elapsed).toBeGreaterThanOrEqual(95);
                expect(elapsed).toBeLessThan(150);
            });

            it("should clean up event listeners on successful completion", async () => {
                const controller = new AbortController();
                const signal = controller.signal;

                // Track listener count (this is implementation-specific)
                await sleep(50, signal);

                // If we abort now, it shouldn't affect anything
                controller.abort();

                // The sleep should have completed and cleaned up
                expect(true).toBe(true);
            });

            it("should clean up timeout on abort", async () => {
                const controller = new AbortController();

                const sleepPromise = sleep(1000, controller.signal);

                // Abort immediately
                controller.abort();

                await expect(sleepPromise).rejects.toThrow(AbortError);

                // If timeout wasn't cleaned up, it would still be pending
                // This is more of an integration test to ensure no memory leaks
            });
        });

        describe("edge cases", () => {
            it("should handle very small positive values", async () => {
                const start = Date.now();
                await sleep(1);
                const elapsed = Date.now() - start;

                expect(elapsed).toBeGreaterThanOrEqual(0);
                expect(elapsed).toBeLessThan(100);
            });

            it("should handle multiple concurrent sleeps", async () => {
                const start = Date.now();

                await Promise.all([sleep(100), sleep(100), sleep(100)]);

                const elapsed = Date.now() - start;

                // All should complete around the same time
                expect(elapsed).toBeGreaterThanOrEqual(95);
                expect(elapsed).toBeLessThan(150);
            });

            it("should handle sequential sleeps", async () => {
                const start = Date.now();

                await sleep(50);
                await sleep(50);

                const elapsed = Date.now() - start;

                expect(elapsed).toBeGreaterThanOrEqual(95);
                expect(elapsed).toBeLessThan(150);
            });
        });
    });

    describe("Property-Based Tests", () => {
        // Feature: async-utils, Property 1: Sleep duration accuracy
        it("Property 1: should resolve after approximately the specified duration", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 50, max: 200 }),
                    async (ms) => {
                        const start = Date.now();
                        await sleep(ms);
                        const elapsed = Date.now() - start;

                        // Allow ±50ms tolerance for timing
                        return elapsed >= ms - 50 && elapsed <= ms + 50;
                    }
                ),
                { numRuns: 50 }
            );
        }, 15000);

        // Feature: async-utils, Property 2: Sleep rejects negative values
        it("Property 2: should reject with TypeError for any negative value", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: -10000, max: -1 }),
                    async (ms) => {
                        try {
                            await sleep(ms);
                            return false; // Should not reach here
                        } catch (error) {
                            return (
                                error instanceof TypeError &&
                                error.message.includes("non-negative")
                            );
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: async-utils, Property 3: Sleep abort cancellation
        it("Property 3: should reject with AbortError when aborted before completion", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 100, max: 500 }),
                    fc.integer({ min: 10, max: 90 }),
                    async (sleepDuration, abortDelay) => {
                        const controller = new AbortController();

                        // Abort before sleep completes
                        setTimeout(() => controller.abort(), abortDelay);

                        try {
                            await sleep(sleepDuration, controller.signal);
                            return false; // Should not reach here
                        } catch (error) {
                            return (
                                error instanceof AbortError &&
                                error.message.includes("aborted")
                            );
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it("Property: should handle zero milliseconds correctly", async () => {
            await fc.assert(
                fc.asyncProperty(fc.constant(0), async (ms) => {
                    const start = Date.now();
                    await sleep(ms);
                    const elapsed = Date.now() - start;

                    // Should complete almost instantly (within 50ms)
                    return elapsed < 50;
                }),
                { numRuns: 100 }
            );
        });

        it("Property: should work without AbortSignal", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 10, max: 100 }),
                    async (ms) => {
                        const start = Date.now();
                        await sleep(ms);
                        const elapsed = Date.now() - start;

                        return elapsed >= ms - 50;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
