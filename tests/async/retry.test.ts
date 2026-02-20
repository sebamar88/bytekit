import { describe, it, expect, vi } from "vitest";
import { retry } from "../../src/utils/async/retry";
import { AbortError, RetryError } from "../../src/utils/async/errors";

describe("retry function", () => {
    describe("Unit Tests", () => {
        describe("basic functionality", () => {
            it("should return result on first successful attempt", async () => {
                const fn = vi.fn().mockResolvedValue("success");

                const result = await retry(fn);

                expect(result).toBe("success");
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it("should retry on failure and succeed", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("fail 1"))
                    .mockRejectedValueOnce(new Error("fail 2"))
                    .mockResolvedValue("success");

                const result = await retry(fn);

                expect(result).toBe("success");
                expect(fn).toHaveBeenCalledTimes(3);
            });

            it("should throw RetryError after all attempts fail", async () => {
                const error = new Error("persistent failure");
                const fn = vi.fn().mockRejectedValue(error);

                const promise = retry(fn, { maxAttempts: 3, baseDelay: 10 });
                await expect(promise).rejects.toThrow(RetryError);
                await expect(promise).rejects.toThrow("Failed after 3 attempts");

                expect(fn).toHaveBeenCalledTimes(3);
            });

            it("should include last error in RetryError", async () => {
                const lastError = new Error("last failure");
                const fn = vi.fn().mockRejectedValue(lastError);

                try {
                    await retry(fn, { maxAttempts: 2, baseDelay: 10 });
                    expect.fail("Should have thrown");
                } catch (error) {
                    expect(error).toBeInstanceOf(RetryError);
                    if (error instanceof RetryError) {
                        expect(error.lastError).toBe(lastError);
                        expect(error.attempts).toBe(2);
                    }
                }
            });

            it("should throw TypeError for non-function argument", async () => {
                const promise = retry("not a function" as unknown as () => Promise<string>);
                await expect(promise).rejects.toThrow(TypeError);
                await expect(promise).rejects.toThrow("must be a function");
            });
        });

        describe("backoff strategies", () => {
            it("should use exponential backoff by default", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("fail 1"))
                    .mockRejectedValueOnce(new Error("fail 2"))
                    .mockResolvedValue("success");

                const start = Date.now();
                await retry(fn, { baseDelay: 100 });
                const elapsed = Date.now() - start;

                // First delay: 100ms, second delay: 200ms = ~300ms total
                expect(elapsed).toBeGreaterThanOrEqual(250);
                expect(elapsed).toBeLessThan(400);
            });

            it("should use linear backoff when specified", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("fail 1"))
                    .mockRejectedValueOnce(new Error("fail 2"))
                    .mockResolvedValue("success");

                const start = Date.now();
                await retry(fn, { baseDelay: 100, backoff: "linear" });
                const elapsed = Date.now() - start;

                // First delay: 100ms, second delay: 200ms = ~300ms total
                expect(elapsed).toBeGreaterThanOrEqual(250);
                expect(elapsed).toBeLessThan(400);
            });

            it("should use custom backoff function", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("fail 1"))
                    .mockRejectedValueOnce(new Error("fail 2"))
                    .mockResolvedValue("success");

                const customBackoff = vi.fn((attempt: number) => attempt * 50);

                const start = Date.now();
                await retry(fn, { backoff: customBackoff });
                const elapsed = Date.now() - start;

                expect(customBackoff).toHaveBeenCalledWith(1);
                expect(customBackoff).toHaveBeenCalledWith(2);
                // First delay: 50ms, second delay: 100ms = ~150ms total
                expect(elapsed).toBeGreaterThanOrEqual(100);
                expect(elapsed).toBeLessThan(250);
            });

            it("should apply maxDelay cap", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("fail 1"))
                    .mockResolvedValue("success");

                const start = Date.now();
                await retry(fn, {
                    baseDelay: 1000,
                    maxDelay: 50,
                    backoff: "exponential",
                });
                const elapsed = Date.now() - start;

                // Delay should be capped at 50ms
                expect(elapsed).toBeLessThan(150);
            });
        });

        describe("shouldRetry predicate", () => {
            it("should retry when shouldRetry returns true", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("retryable"))
                    .mockResolvedValue("success");

                const shouldRetry = vi.fn(() => true);

                const result = await retry(fn, { shouldRetry, baseDelay: 10 });

                expect(result).toBe("success");
                expect(shouldRetry).toHaveBeenCalled();
                expect(fn).toHaveBeenCalledTimes(2);
            });

            it("should not retry when shouldRetry returns false", async () => {
                const error = new Error("non-retryable");
                const fn = vi.fn().mockRejectedValue(error);

                const shouldRetry = vi.fn(() => false);

                await expect(retry(fn, { shouldRetry })).rejects.toThrow(error);
                expect(shouldRetry).toHaveBeenCalledWith(error);
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it("should pass error to shouldRetry predicate", async () => {
                const error1 = new Error("error 1");
                const error2 = new Error("error 2");
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(error1)
                    .mockRejectedValueOnce(error2)
                    .mockResolvedValue("success");

                const shouldRetry = vi.fn(() => true);

                await retry(fn, { shouldRetry, baseDelay: 10 });

                expect(shouldRetry).toHaveBeenCalledWith(error1);
                expect(shouldRetry).toHaveBeenCalledWith(error2);
            });
        });

        describe("AbortSignal support", () => {
            it("should abort during retry delay", async () => {
                const fn = vi.fn().mockRejectedValue(new Error("fail"));
                const controller = new AbortController();

                // Abort after 50ms
                setTimeout(() => controller.abort(), 50);

                await expect(
                    retry(fn, {
                        maxAttempts: 5,
                        baseDelay: 200,
                        signal: controller.signal,
                    })
                ).rejects.toThrow(AbortError);

                // Should have attempted once, then aborted during delay
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it("should reject immediately if signal is already aborted", async () => {
                const fn = vi.fn().mockResolvedValue("success");
                const controller = new AbortController();
                controller.abort();

                await expect(
                    retry(fn, { signal: controller.signal })
                ).rejects.toThrow(AbortError);
                await expect(
                    retry(fn, { signal: controller.signal })
                ).rejects.toThrow("aborted before starting");

                expect(fn).not.toHaveBeenCalled();
            });

            it("should complete normally if not aborted", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("fail"))
                    .mockResolvedValue("success");
                const controller = new AbortController();

                const result = await retry(fn, {
                    baseDelay: 50,
                    signal: controller.signal,
                });

                expect(result).toBe("success");
                expect(fn).toHaveBeenCalledTimes(2);
            });
        });

        describe("options validation", () => {
            it("should throw TypeError for maxAttempts < 1", async () => {
                const fn = vi.fn().mockResolvedValue("success");

                await expect(retry(fn, { maxAttempts: 0 })).rejects.toThrow(
                    TypeError
                );
                await expect(retry(fn, { maxAttempts: 0 })).rejects.toThrow(
                    "at least 1"
                );
            });

            it("should throw TypeError for negative baseDelay", async () => {
                const fn = vi.fn().mockResolvedValue("success");

                await expect(retry(fn, { baseDelay: -100 })).rejects.toThrow(
                    TypeError
                );
                await expect(retry(fn, { baseDelay: -100 })).rejects.toThrow(
                    "non-negative"
                );
            });

            it("should throw TypeError for negative maxDelay", async () => {
                const fn = vi.fn().mockResolvedValue("success");

                await expect(retry(fn, { maxDelay: -100 })).rejects.toThrow(
                    TypeError
                );
                await expect(retry(fn, { maxDelay: -100 })).rejects.toThrow(
                    "non-negative"
                );
            });
        });

        describe("edge cases", () => {
            it("should handle maxAttempts = 1", async () => {
                const fn = vi.fn().mockRejectedValue(new Error("fail"));

                await expect(retry(fn, { maxAttempts: 1 })).rejects.toThrow(
                    RetryError
                );
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it("should handle baseDelay = 0", async () => {
                const fn = vi
                    .fn()
                    .mockRejectedValueOnce(new Error("fail"))
                    .mockResolvedValue("success");

                const start = Date.now();
                const result = await retry(fn, { baseDelay: 0 });
                const elapsed = Date.now() - start;

                expect(result).toBe("success");
                expect(elapsed).toBeLessThan(50);
            });

            it("should not delay after last attempt", async () => {
                const fn = vi.fn().mockRejectedValue(new Error("fail"));

                const start = Date.now();
                await expect(
                    retry(fn, { maxAttempts: 2, baseDelay: 1000 })
                ).rejects.toThrow(RetryError);
                const elapsed = Date.now() - start;

                // Should only have one delay (after first attempt)
                expect(elapsed).toBeGreaterThanOrEqual(950);
                expect(elapsed).toBeLessThan(1500);
            });

            it("should handle synchronous errors", async () => {
                const fn = vi.fn(() => {
                    throw new Error("sync error");
                });

                await expect(
                    retry(fn, { maxAttempts: 2, baseDelay: 10 })
                ).rejects.toThrow(RetryError);
                expect(fn).toHaveBeenCalledTimes(2);
            });
        });
    });
});
