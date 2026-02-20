import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorBoundary, AppError, TimeoutError, AppValidationError, NotFoundError } from "../src/utils/core/ErrorBoundary";
import { Logger } from "../src/utils/core/Logger";

describe("ErrorBoundary Exhaustive", () => {
    let logger: Logger;
    let boundary: ErrorBoundary;

    beforeEach(() => {
        logger = new Logger({ level: "silent" });
        boundary = new ErrorBoundary({ logger });
    });

    it("should normalize timeout errors", async () => {
        const error = new Error("Connection timeout occurred");
        // @ts-expect-error - testing private method for coverage
        const normalized = boundary.normalizeError(error);
        expect(normalized).toBeInstanceOf(TimeoutError);
    });

    it("should normalize validation errors", async () => {
        const error = new Error("Validation failed for field email");
        // @ts-expect-error - testing private method for coverage
        const normalized = boundary.normalizeError(error);
        expect(normalized).toBeInstanceOf(AppValidationError);
    });

    it("should normalize not found errors", async () => {
        const error = new Error("Resource not found on server");
        // @ts-expect-error - testing private method for coverage
        const normalized = boundary.normalizeError(error);
        expect(normalized).toBeInstanceOf(NotFoundError);
    });

    it("should identify retryable errors", async () => {
        const timeout = new TimeoutError("timeout");
        // @ts-expect-error - testing private method for coverage
        expect(boundary.isRetryable(timeout)).toBe(true);

        const internal = new AppError("SERVER_ERROR", "msg", 500);
        // @ts-expect-error - testing private method for coverage
        expect(boundary.isRetryable(internal)).toBe(true);

        const validation = new AppValidationError("msg");
        // @ts-expect-error - testing private method for coverage
        expect(boundary.isRetryable(validation)).toBe(false);
    });

    it("should handle wrapSync and catch errors", () => {
        const spy = vi.spyOn(boundary, "handle");
        const fn = () => { throw new Error("sync error"); };
        const wrapped = boundary.wrapSync(fn);
        
        expect(() => wrapped()).toThrow("sync error");
        expect(spy).toHaveBeenCalled();
    });

    it("should manage error stack size", async () => {
        const smallBoundary = new ErrorBoundary();
        // @ts-expect-error - setting small limit for test
        smallBoundary.maxStackSize = 2;
        
        await smallBoundary.handle(new Error("1"));
        await smallBoundary.handle(new Error("2"));
        await smallBoundary.handle(new Error("3"));
        
        expect(smallBoundary.getErrorHistory().length).toBe(2);
    });

    it("should clear error history", async () => {
        await boundary.handle(new Error("err"));
        boundary.clearErrorHistory();
        expect(boundary.getErrorHistory().length).toBe(0);
    });
});
