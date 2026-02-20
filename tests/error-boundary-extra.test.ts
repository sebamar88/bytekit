import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary, AppError } from "../src/utils/core/ErrorBoundary";

describe("ErrorBoundary Extra Coverage", () => {
    it("should handle sync execution errors", () => {
        const boundary = new ErrorBoundary();
        expect(() => boundary.executeSync(() => {
            throw new Error("sync fail");
        })).toThrow("sync fail");
        
        expect(boundary.getErrorHistory().length).toBe(1);
    });

    it("should wrap functions and handle their errors", async () => {
        const boundary = new ErrorBoundary();
        const fn = async () => { throw new Error("wrapped fail"); };
        const wrapped = boundary.wrap(fn);
        
        await expect(wrapped()).rejects.toThrow("wrapped fail");
        expect(boundary.getErrorHistory().length).toBe(1);
    });

    it("should allow removing handlers", async () => {
        const boundary = new ErrorBoundary();
        const handler = vi.fn();
        boundary.addHandler(handler);
        boundary.removeHandler(handler);
        
        await boundary.handle(new Error("err"));
        expect(handler).not.toHaveBeenCalled();
    });

    it("should create valid error reports from instance", async () => {
        const boundary = new ErrorBoundary();
        await boundary.handle(new Error("report test"));
        
        const report = boundary.createErrorReport();
        expect(report.errors[0].message).toBe("report test");
        expect(report.timestamp).toBeDefined();
    });
});
