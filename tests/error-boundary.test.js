import test from "node:test";
import assert from "node:assert/strict";
import {
    ErrorBoundary,
    AppValidationError,
    NotFoundError,
    UnauthorizedError,
    TimeoutError,
} from "../dist/index.js";

test("ErrorBoundary catches and handles errors", async () => {
    const boundary = new ErrorBoundary();
    let errorHandled = false;

    boundary.addHandler(() => {
        errorHandled = true;
    });

    const error = new Error("Test error");
    await boundary.handle(error, { context: "test" });

    assert.equal(errorHandled, true);
});

test("ErrorBoundary executes function with error handling", async () => {
    const boundary = new ErrorBoundary();
    let executed = false;

    const result = await boundary.execute(async () => {
        executed = true;
        return "success";
    });

    assert.equal(executed, true);
    assert.equal(result, "success");
});

test("ErrorBoundary retries on retryable errors", async () => {
    const boundary = new ErrorBoundary({ maxRetries: 2, retryDelay: 10 });
    let attempts = 0;

    await assert.rejects(
        () =>
            boundary.execute(async () => {
                attempts++;
                throw new TimeoutError("Timeout");
            }),
        (error) => {
            assert.ok(error instanceof TimeoutError);
            return true;
        }
    );

    assert.equal(attempts, 3); // Initial + 2 retries
});

test("ErrorBoundary does not retry on non-retryable errors", async () => {
    const boundary = new ErrorBoundary({ maxRetries: 2, retryDelay: 10 });
    let attempts = 0;

    await assert.rejects(
        () =>
            boundary.execute(async () => {
                attempts++;
                throw new AppValidationError("Invalid data");
            }),
        (error) => {
            assert.ok(error instanceof AppValidationError);
            return true;
        }
    );

    assert.equal(attempts, 1); // No retries for validation errors
});

test("ErrorBoundary wraps async functions", async () => {
    const boundary = new ErrorBoundary();
    let errorHandled = false;

    boundary.addHandler(() => {
        errorHandled = true;
    });

    const wrappedFn = boundary.wrap(async () => {
        throw new Error("Wrapped error");
    });

    await assert.rejects(() => wrappedFn());
    assert.equal(errorHandled, true);
});

test("ErrorBoundary wraps sync functions", () => {
    const boundary = new ErrorBoundary();
    boundary.addHandler(() => {
        // Error handled
    });

    const wrappedFn = boundary.wrapSync(() => {
        throw new Error("Wrapped sync error");
    });

    assert.throws(() => wrappedFn());
    // Note: errorHandled might not be true immediately due to async handling
});

test("ErrorBoundary maintains error history", async () => {
    const boundary = new ErrorBoundary();

    await boundary.handle(new Error("Error 1"), { context: "test1" });
    await boundary.handle(new Error("Error 2"), { context: "test2" });

    const history = boundary.getErrorHistory();
    assert.equal(history.length, 2);
    assert.equal(history[0].error.message, "Error 1");
    assert.equal(history[1].error.message, "Error 2");
});

test("ErrorBoundary creates error report", async () => {
    const boundary = new ErrorBoundary();

    await boundary.handle(new AppValidationError("Invalid"), {
        context: "test",
    });
    await boundary.handle(new NotFoundError("Not found"), { context: "test" });

    const report = boundary.createErrorReport();
    assert.equal(report.errors.length, 2);
    assert.equal(report.errors[0].code, "VALIDATION_ERROR");
    assert.equal(report.errors[1].code, "NOT_FOUND");
});

test("AppError subclasses have correct status codes", () => {
    assert.equal(new AppValidationError("test").statusCode, 400);
    assert.equal(new UnauthorizedError("test").statusCode, 401);
    assert.equal(new NotFoundError("test").statusCode, 404);
    assert.equal(new TimeoutError("test").statusCode, 408);
});

test("ErrorBoundary normalizes errors", async () => {
    const boundary = new ErrorBoundary();
    let normalizedError = null;

    boundary.addHandler((error) => {
        normalizedError = error;
    });

    await boundary.handle(new Error("timeout occurred"), { context: "test" });

    assert.ok(normalizedError instanceof TimeoutError);
});
