import { describe, it, expect } from "vitest";
import { timeout, withTimeout } from "../../src/utils/async/timeout";
import { allSettled } from "../../src/utils/async/allSettled";

describe("Async Utils Input Validation", () => {
    describe("timeout validation", () => {
        it("should throw TypeError for non-Promise first argument", () => {
            expect(
                () => {
                    // @ts-expect-error - Testing invalid input
                    timeout("not a promise" as any, 1000);
                }
            ).toThrow(TypeError);
        });

        it("should throw TypeError for negative timeout duration", () => {
            expect(
                () => {
                    timeout(Promise.resolve(), -100);
                }
            ).toThrow(TypeError);
        });

        it("should throw TypeError for non-numeric timeout duration", () => {
            expect(
                () => {
                    // @ts-expect-error - Testing invalid input
                    timeout(Promise.resolve(), "not a number" as any);
                }
            ).toThrow(TypeError);
        });
    });

    describe("withTimeout validation", () => {
        it("should throw TypeError for non-function first argument", () => {
            expect(
                () => {
                    // @ts-expect-error - Testing invalid input
                    withTimeout("not a function" as any, 1000);
                }
            ).toThrow(TypeError);
        });

        it("should throw TypeError for negative timeout duration", () => {
            expect(
                () => {
                    withTimeout(async () => {}, -100);
                }
            ).toThrow(TypeError);
        });
    });

    describe("allSettled validation", () => {
        it("should throw TypeError for non-array input", async () => {
            await expect(
                async () => {
                    // @ts-expect-error - Testing invalid input
                    await allSettled("not an array" as any);
                }
            ).rejects.toThrow(TypeError);
        });

        it("should accept empty array", async () => {
            const result = await allSettled([]);
            expect(result).toEqual({
                fulfilled: [],
                rejected: [],
            });
        });
    });
});
