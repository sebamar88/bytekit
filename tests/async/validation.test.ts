import { describe, it } from "node:test";
import * as assert from "node:assert";
import { timeout, withTimeout } from "../../src/utils/async/timeout";
import { allSettled } from "../../src/utils/async/allSettled";

describe("Async Utils Input Validation", () => {
    describe("timeout validation", () => {
        it("should throw TypeError for non-Promise first argument", () => {
            assert.throws(
                () => {
                    // @ts-expect-error - Testing invalid input
                    timeout("not a promise", 1000);
                },
                {
                    name: "TypeError",
                    message: /First argument must be a Promise/,
                }
            );
        });

        it("should throw TypeError for negative timeout duration", () => {
            assert.throws(
                () => {
                    timeout(Promise.resolve(), -100);
                },
                {
                    name: "TypeError",
                    message: /Timeout duration must be a non-negative number/,
                }
            );
        });

        it("should throw TypeError for non-numeric timeout duration", () => {
            assert.throws(
                () => {
                    // @ts-expect-error - Testing invalid input
                    timeout(Promise.resolve(), "not a number");
                },
                {
                    name: "TypeError",
                    message: /Timeout duration must be a non-negative number/,
                }
            );
        });
    });

    describe("withTimeout validation", () => {
        it("should throw TypeError for non-function first argument", () => {
            assert.throws(
                () => {
                    // @ts-expect-error - Testing invalid input
                    withTimeout("not a function", 1000);
                },
                {
                    name: "TypeError",
                    message: /First argument must be a function/,
                }
            );
        });

        it("should throw TypeError for negative timeout duration", () => {
            assert.throws(
                () => {
                    withTimeout(async () => {}, -100);
                },
                {
                    name: "TypeError",
                    message: /Timeout duration must be a non-negative number/,
                }
            );
        });
    });

    describe("allSettled validation", () => {
        it("should throw TypeError for non-array input", async () => {
            await assert.rejects(
                async () => {
                    // @ts-expect-error - Testing invalid input
                    await allSettled("not an array");
                },
                {
                    name: "TypeError",
                    message: /Expected an array of promises/,
                }
            );
        });

        it("should accept empty array", async () => {
            const result = await allSettled([]);
            assert.deepStrictEqual(result, {
                fulfilled: [],
                rejected: [],
            });
        });
    });
});
