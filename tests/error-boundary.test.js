import test from "node:test";
import assert from "node:assert/strict";
import {
    ErrorBoundary,
    AppError,
    NotFoundError,
    RateLimitError,
    AppValidationError,
    TimeoutError,
    getGlobalErrorBoundary,
    resetGlobalErrorBoundary,
} from "../dist/utils/core/ErrorBoundary.js";

// ============================================================================
// ErrorBoundary Tests
// ============================================================================

test("Custom error classes work correctly", () => {
    const error = new NotFoundError("Not found");
    assert.equal(error.name, "NotFoundError");
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, "NOT_FOUND");

    const rateLimit = new RateLimitError("Too many requests", 60);
    assert.equal(rateLimit.statusCode, 429);
    // @ts-ignore
    assert.equal(rateLimit.context.metadata.retryAfter, 60);
});

test("ErrorBoundary.handle calls handlers and logs", async () => {
    let handlerCalled = false;
    let logged = false;

    const mockLogger = {
        error: () => {
            logged = true;
        },
        warn: () => {},
        info: () => {},
        debug: () => {},
    };

    // @ts-ignore
    const eb = new ErrorBoundary({
        logger: mockLogger,
        onError: () => {
            /* test onError callback */
        },
    });

    eb.addHandler(() => {
        handlerCalled = true;
    });

    await eb.handle(new Error("Test error"), { component: "Test" });

    assert.equal(handlerCalled, true);
    assert.equal(logged, true);
    assert.equal(eb.getErrorHistory().length, 1);
});

test("ErrorBoundary.execute with retry logic (success on retry)", async () => {
    let calls = 0;
    const fn = async () => {
        calls++;
        if (calls === 1) throw new Error("timeout"); // Retryable
        return "success";
    };

    const eb = new ErrorBoundary({ maxRetries: 2, retryDelay: 10 });
    const result = await eb.execute(fn);

    assert.equal(result, "success");
    assert.equal(calls, 2);
});

test("ErrorBoundary.execute fails after max retries", async () => {
    let calls = 0;
    const fn = async () => {
        calls++;
        throw new Error("timeout");
    };

    const eb = new ErrorBoundary({ maxRetries: 1, retryDelay: 10 });
    await assert.rejects(() => eb.execute(fn), /timeout/);
    assert.equal(calls, 2); // original + 1 retry
});

test("ErrorBoundary.executeSync handles errors", () => {
    const eb = new ErrorBoundary();
    assert.throws(
        () =>
            eb.executeSync(() => {
                throw new Error("sync error");
            }),
        /sync error/
    );
    assert.equal(eb.getErrorHistory().length, 1);
});

test("ErrorBoundary.wrap wraps functions", async () => {
    const eb = new ErrorBoundary();
    const wrapped = eb.wrap(async () => {
        throw new Error("wrapped error");
    });

    await assert.rejects(() => wrapped(), /wrapped error/);
    assert.equal(eb.getErrorHistory().length, 1);
});

test("ErrorBoundary history management", () => {
    const eb = new ErrorBoundary();
    // @ts-ignore (protected/private handle normally, but we use it via history)
    eb.handle(new Error("1"));
    eb.handle(new Error("2"));

    assert.equal(eb.getErrorHistory().length, 2);
    eb.clearErrorHistory();
    assert.equal(eb.getErrorHistory().length, 0);
});

test("ErrorBoundary.createErrorReport returns valid report", async () => {
    const eb = new ErrorBoundary();
    const err = new NotFoundError("Not found");
    await eb.handle(err, { userId: "user1" });

    const report = eb.createErrorReport();
    assert.ok(report.timestamp);
    assert.equal(report.errors.length, 1);
    assert.equal(report.errors[0].code, "NOT_FOUND");
    assert.equal(report.errors[0].context.userId, "user1");
});

test("ErrorBoundary handles errors thrown by onError and handlers", async () => {
    let errorLogged = 0;

    const mockLogger = {
        error: () => {
            errorLogged++;
        },
        warn: () => {},
        info: () => {},
        debug: () => {},
    };

    const handler = () => {
        throw new Error("handler fail");
    };

    const eb = new ErrorBoundary({
        // @ts-ignore
        logger: mockLogger,
        onError: () => {
            throw new Error("onError fail");
        },
        handlers: [handler],
    });

    await eb.handle(new Error("boom"), { context: "test" });

    assert.ok(errorLogged >= 2);
});

test("ErrorBoundary removeHandler and clearHandlers", () => {
    const eb = new ErrorBoundary();
    const handler = () => {};
    eb.addHandler(handler);
    eb.removeHandler(handler);
    eb.clearHandlers();

    assert.equal(eb.getErrorHistory().length, 0);
});

test("ErrorBoundary normalizes errors into AppError subclasses", async () => {
    const eb = new ErrorBoundary();

    await assert.rejects(
        () =>
            eb.execute(async () => {
                throw new Error("timeout");
            }),
        (error) => {
            assert.ok(error instanceof TimeoutError);
            return true;
        }
    );

    await assert.rejects(
        () =>
            eb.execute(async () => {
                throw new Error("validation failed");
            }),
        (error) => {
            assert.ok(error instanceof AppValidationError);
            return true;
        }
    );

    await assert.rejects(
        () =>
            eb.execute(async () => {
                throw new Error("not found");
            }),
        (error) => {
            assert.ok(error instanceof NotFoundError);
            return true;
        }
    );

    await assert.rejects(
        () =>
            eb.execute(async () => {
                throw new Error("unknown");
            }),
        (error) => {
            assert.ok(error instanceof AppError);
            return true;
        }
    );
});

test("Global ErrorBoundary helpers return singleton and reset", () => {
    resetGlobalErrorBoundary();
    const eb1 = getGlobalErrorBoundary();
    const eb2 = getGlobalErrorBoundary();
    assert.equal(eb1, eb2);

    resetGlobalErrorBoundary();
    const eb3 = getGlobalErrorBoundary();
    assert.notEqual(eb1, eb3);
});
