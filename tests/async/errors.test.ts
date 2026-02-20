import { describe, it, expect } from "vitest";
import {
    TimeoutError,
    AbortError,
    RetryError,
} from "../../src/utils/async/errors";

describe("AsyncUtils Error Classes", () => {
    describe("TimeoutError", () => {
        it("should create a TimeoutError with message and timeout", () => {
            const error = new TimeoutError("Operation timed out", 5000);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(TimeoutError);
            expect(error.name).toBe("TimeoutError");
            expect(error.message).toBe("Operation timed out");
            expect(error.timeout).toBe(5000);
            expect(error.stack).toBeDefined();
        });

        it("should preserve stack trace", () => {
            const error = new TimeoutError("Test timeout", 1000);
            expect(error.stack).toContain("TimeoutError");
        });
    });

    describe("AbortError", () => {
        it("should create an AbortError with default message", () => {
            const error = new AbortError();

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AbortError);
            expect(error.name).toBe("AbortError");
            expect(error.message).toBe("Operation aborted");
            expect(error.stack).toBeDefined();
        });

        it("should create an AbortError with custom message", () => {
            const error = new AbortError("Custom abort message");

            expect(error.message).toBe("Custom abort message");
            expect(error.name).toBe("AbortError");
        });

        it("should preserve stack trace", () => {
            const error = new AbortError("Test abort");
            expect(error.stack).toContain("AbortError");
        });
    });

    describe("RetryError", () => {
        it("should create a RetryError with message, attempts, and last error", () => {
            const lastError = new Error("Original error");
            const error = new RetryError("All retries failed", 3, lastError);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RetryError);
            expect(error.name).toBe("RetryError");
            expect(error.message).toBe("All retries failed");
            expect(error.attempts).toBe(3);
            expect(error.lastError).toBe(lastError);
            expect(error.stack).toBeDefined();
        });

        it("should preserve stack trace", () => {
            const error = new RetryError("Test retry", 5, new Error("Test"));
            expect(error.stack).toContain("RetryError");
        });

        it("should handle non-Error lastError values", () => {
            const error = new RetryError("Failed", 2, "string error");
            expect(error.lastError).toBe("string error");
        });
    });

    describe("Error inheritance", () => {
        it("should allow instanceof checks with Error", () => {
            const timeoutError = new TimeoutError("timeout", 1000);
            const abortError = new AbortError();
            const retryError = new RetryError("retry", 3, new Error());

            expect(timeoutError instanceof Error).toBe(true);
            expect(abortError instanceof Error).toBe(true);
            expect(retryError instanceof Error).toBe(true);
        });

        it("should allow type guards", () => {
            const error: Error = new TimeoutError("timeout", 1000);

            if (error instanceof TimeoutError) {
                expect(error.timeout).toBe(1000);
            } else {
                throw new Error("Type guard failed");
            }
        });
    });
});
