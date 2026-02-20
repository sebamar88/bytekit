import { describe, it, expect } from "vitest";
import { allSettled } from "../../src/utils/async/allSettled";
import { sleep } from "../../src/utils/async/sleep";

describe("allSettled function", () => {
    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should wait for all promises to settle", async () => {
                const promises = [
                    Promise.resolve(1),
                    Promise.reject(new Error("failed")),
                    Promise.resolve(3),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled).toHaveLength(2);
                expect(result.rejected).toHaveLength(1);
            });

            it("should separate fulfilled and rejected results", async () => {
                const error = new Error("test error");
                const promises = [
                    Promise.resolve("success1"),
                    Promise.reject(error),
                    Promise.resolve("success2"),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled).toEqual([
                    { value: "success1", index: 0 },
                    { value: "success2", index: 2 },
                ]);

                expect(result.rejected).toEqual([{ reason: error, index: 1 }]);
            });

            it("should preserve original values for fulfilled promises", async () => {
                const obj = { key: "value" };
                const arr = [1, 2, 3];
                const promises: Array<Promise<unknown>> = [
                    Promise.resolve(obj),
                    Promise.resolve(arr),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled[0].value).toBe(obj);
                expect(result.fulfilled[1].value).toBe(arr);
            });

            it("should preserve original errors for rejected promises", async () => {
                const error1 = new Error("error 1");
                const error2 = new TypeError("error 2");
                const promises = [
                    Promise.reject(error1),
                    Promise.reject(error2),
                ];

                const result = await allSettled(promises);

                expect(result.rejected[0].reason).toBe(error1);
                expect(result.rejected[1].reason).toBe(error2);
            });

            it("should include original index for each result", async () => {
                const promises = [
                    Promise.resolve("a"),
                    Promise.reject("error"),
                    Promise.resolve("b"),
                    Promise.reject("error2"),
                    Promise.resolve("c"),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled.map((r) => r.index)).toEqual([0, 2, 4]);
                expect(result.rejected.map((r) => r.index)).toEqual([1, 3]);
            });
        });

        describe("edge cases", () => {
            it("should handle empty array", async () => {
                const result = await allSettled([]);

                expect(result.fulfilled).toEqual([]);
                expect(result.rejected).toEqual([]);
            });

            it("should handle all fulfilled promises", async () => {
                const promises = [
                    Promise.resolve(1),
                    Promise.resolve(2),
                    Promise.resolve(3),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled).toHaveLength(3);
                expect(result.rejected).toHaveLength(0);
                expect(result.fulfilled).toEqual([
                    { value: 1, index: 0 },
                    { value: 2, index: 1 },
                    { value: 3, index: 2 },
                ]);
            });

            it("should handle all rejected promises", async () => {
                const errors = [
                    new Error("error 1"),
                    new Error("error 2"),
                    new Error("error 3"),
                ];
                const promises = errors.map((e) => Promise.reject(e));

                const result = await allSettled(promises);

                expect(result.fulfilled).toHaveLength(0);
                expect(result.rejected).toHaveLength(3);
                expect(result.rejected).toEqual([
                    { reason: errors[0], index: 0 },
                    { reason: errors[1], index: 1 },
                    { reason: errors[2], index: 2 },
                ]);
            });

            it("should handle single promise", async () => {
                const result = await allSettled([Promise.resolve("single")]);

                expect(result.fulfilled).toEqual([
                    { value: "single", index: 0 },
                ]);
                expect(result.rejected).toEqual([]);
            });

            it("should handle single rejected promise", async () => {
                const error = new Error("single error");
                const result = await allSettled([Promise.reject(error)]);

                expect(result.fulfilled).toEqual([]);
                expect(result.rejected).toEqual([{ reason: error, index: 0 }]);
            });
        });

        describe("timing behavior", () => {
            it("should wait for all promises regardless of settlement order", async () => {
                const start = Date.now();

                const promises = [
                    sleep(50).then(() => "fast"),
                    sleep(100).then(() => "slow"),
                    sleep(75).then(() => "medium"),
                ];

                const result = await allSettled(promises);
                const elapsed = Date.now() - start;

                // Should wait for the slowest promise (100ms)
                expect(elapsed).toBeGreaterThanOrEqual(95);
                expect(result.fulfilled).toHaveLength(3);
            });

            it("should not fail fast when a promise rejects", async () => {
                const start = Date.now();

                const promises = [
                    sleep(10).then(() => Promise.reject("fast error")),
                    sleep(100).then(() => "slow success"),
                ];

                const result = await allSettled(promises);
                const elapsed = Date.now() - start;

                // Should wait for all promises, not fail fast
                expect(elapsed).toBeGreaterThanOrEqual(95);
                expect(result.fulfilled).toHaveLength(1);
                expect(result.rejected).toHaveLength(1);
            });
        });

        describe("value types", () => {
            it("should handle different value types", async () => {
                const promises: Array<Promise<unknown>> = [
                    Promise.resolve(42),
                    Promise.resolve("string"),
                    Promise.resolve({ key: "value" }),
                    Promise.resolve([1, 2, 3]),
                    Promise.resolve(true),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled[0].value).toBe(42);
                expect(result.fulfilled[1].value).toBe("string");
                expect(result.fulfilled[2].value).toEqual({ key: "value" });
                expect(result.fulfilled[3].value).toEqual([1, 2, 3]);
                expect(result.fulfilled[4].value).toBe(true);
            });

            it("should handle null and undefined values", async () => {
                const promises = [
                    Promise.resolve(null),
                    Promise.resolve(undefined),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled[0].value).toBe(null);
                expect(result.fulfilled[1].value).toBe(undefined);
            });

            it("should handle numeric values including zero and negative", async () => {
                const promises = [
                    Promise.resolve(0),
                    Promise.resolve(-1),
                    Promise.resolve(3.14),
                ];

                const result = await allSettled(promises);

                expect(result.fulfilled[0].value).toBe(0);
                expect(result.fulfilled[1].value).toBe(-1);
                expect(result.fulfilled[2].value).toBe(3.14);
            });

            it("should handle different error types", async () => {
                const promises: Array<Promise<unknown>> = [
                    Promise.reject(new Error("Error")),
                    Promise.reject(new TypeError("TypeError")),
                    Promise.reject("string error"),
                    Promise.reject(42),
                    Promise.reject(null),
                ];

                const result = await allSettled(promises);

                expect(result.rejected[0].reason).toBeInstanceOf(Error);
                expect(result.rejected[1].reason).toBeInstanceOf(TypeError);
                expect(result.rejected[2].reason).toBe("string error");
                expect(result.rejected[3].reason).toBe(42);
                expect(result.rejected[4].reason).toBe(null);
            });
        });

        describe("index traceability", () => {
            it("should maintain correct indices with mixed results", async () => {
                const promises = [
                    Promise.resolve("a"), // 0
                    Promise.reject("err1"), // 1
                    Promise.resolve("b"), // 2
                    Promise.resolve("c"), // 3
                    Promise.reject("err2"), // 4
                    Promise.reject("err3"), // 5
                    Promise.resolve("d"), // 6
                ];

                const result = await allSettled(promises);

                // Check fulfilled indices
                expect(result.fulfilled).toEqual([
                    { value: "a", index: 0 },
                    { value: "b", index: 2 },
                    { value: "c", index: 3 },
                    { value: "d", index: 6 },
                ]);

                // Check rejected indices
                expect(result.rejected).toEqual([
                    { reason: "err1", index: 1 },
                    { reason: "err2", index: 4 },
                    { reason: "err3", index: 5 },
                ]);
            });

            it("should allow reconstructing original order using indices", async () => {
                const promises = [
                    Promise.resolve(1),
                    Promise.reject("error"),
                    Promise.resolve(3),
                ];

                const result = await allSettled(promises);

                // Reconstruct original array
                const reconstructed = new Array(promises.length);
                result.fulfilled.forEach((r) => {
                    reconstructed[r.index] = {
                        status: "fulfilled",
                        value: r.value,
                    };
                });
                result.rejected.forEach((r) => {
                    reconstructed[r.index] = {
                        status: "rejected",
                        reason: r.reason,
                    };
                });

                expect(reconstructed[0]).toEqual({
                    status: "fulfilled",
                    value: 1,
                });
                expect(reconstructed[1]).toEqual({
                    status: "rejected",
                    reason: "error",
                });
                expect(reconstructed[2]).toEqual({
                    status: "fulfilled",
                    value: 3,
                });
            });
        });
    });
});
