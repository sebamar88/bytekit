import {
    ErrorBoundary,
    AppError,
    NotFoundError,
    RateLimitError,
    AppValidationError,
    TimeoutError,
    getGlobalErrorBoundary,
    resetGlobalErrorBoundary,
} from "../src/utils/core/ErrorBoundary";

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
    // @ts-expect-error - Test type override
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

    // @ts-expect-error - Test type override
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
    // @ts-expect-error (protected/private handle normally, but we use it via history)
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
        // @ts-expect-error - Test type override
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
// ─── Coverage gap tests ───────────────────────────────────────────────────────

import {
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
} from "../src/utils/core/ErrorBoundary";

test("UnauthorizedError, ForbiddenError, ConflictError classes are correct", () => {
    const unauthorized = new UnauthorizedError("Not signed in");
    assert.equal(unauthorized.name, "UnauthorizedError");
    assert.equal(unauthorized.statusCode, 401);
    assert.equal(unauthorized.code, "UNAUTHORIZED");

    const forbidden = new ForbiddenError("No access");
    assert.equal(forbidden.name, "ForbiddenError");
    assert.equal(forbidden.statusCode, 403);
    assert.equal(forbidden.code, "FORBIDDEN");

    const conflict = new ConflictError("Already exists");
    assert.equal(conflict.name, "ConflictError");
    assert.equal(conflict.statusCode, 409);
    assert.equal(conflict.code, "CONFLICT");
});

test("RateLimitError without retryAfter uses context as-is (false branch)", () => {
    // retryAfter is undefined → contextWithRetry = context = undefined
    const rateLimit = new RateLimitError("Too many requests");
    assert.equal(rateLimit.statusCode, 429);
    assert.equal(rateLimit.context, undefined);
});

test("ErrorBoundary.wrapSync wraps sync error and rethrows", () => {
    const eb = new ErrorBoundary();
    const wrapped = eb.wrapSync(() => {
        throw new Error("sync wrapped error");
    });
    assert.throws(() => wrapped(), /sync wrapped error/);
    // Error is added to history asynchronously (fire-and-forget), so we just verify it throws
});

test("ErrorBoundary maxStackSize exceeded — oldest entry is shifted", async () => {
    const eb = new ErrorBoundary();
    // Force the errorStack to maxStackSize (100) then add one more
    // Access private property via any cast
    const stack = (eb as unknown as { errorStack: unknown[] }).errorStack;
    // Fill stack to maxStackSize
    for (let i = 0; i < 100; i++) {
        stack.push({
            error: new Error(`err${i}`),
            context: {},
            timestamp: Date.now(),
        });
    }
    assert.equal(stack.length, 100);
    // Trigger handle to push one more → shift should fire
    await eb.handle(new Error("overflow"), {});
    assert.equal(stack.length, 100); // after shift + push, still 100
});

test("ErrorBoundary.createErrorReport with non-AppError in stack uses 'UNKNOWN' code", async () => {
    const eb = new ErrorBoundary();
    // Push a plain Error (not AppError) directly to errorStack
    const stack = (
        eb as unknown as {
            errorStack: Array<{
                error: Error;
                context: object;
                timestamp: number;
            }>;
        }
    ).errorStack;
    stack.push({
        error: new Error("plain error"),
        context: {},
        timestamp: Date.now(),
    });

    const report = eb.createErrorReport();
    const unknownEntry = report.errors.find((e) => e.code === "UNKNOWN");
    assert.ok(unknownEntry);
    assert.equal(unknownEntry?.statusCode, 500);
    assert.equal(unknownEntry?.message, "plain error");
});

test("ErrorBoundary.setupGlobalHandlers registers unhandledrejection when addEventListener is available", async () => {
    const listeners: Record<string, (e: unknown) => void> = {};
    const addEventSpy = vi.fn((type: string, listener) => {
        listeners[type] = listener;
    });

    vi.stubGlobal("addEventListener", addEventSpy);

    // Create a new ErrorBoundary — setupGlobalHandlers will run
    const eb = new ErrorBoundary();

    assert.ok(
        addEventSpy.mock.calls.some(([type]) => type === "unhandledrejection")
    );

    // Trigger the listener with a plain reason (non-Error)
    await listeners["unhandledrejection"]?.({ reason: "string rejection" });

    assert.equal(eb.getErrorHistory().length, 1);
    assert.match(eb.getErrorHistory()[0].error.message, /string rejection/);

    vi.unstubAllGlobals();
});

test("unhandledrejection with Error reason uses the Error directly (line 131 TRUE branch)", async () => {
    // event.reason instanceof Error → true → the Error is used as-is (not wrapped with String())
    const listeners: Record<string, (e: unknown) => void> = {};
    vi.stubGlobal(
        "addEventListener",
        vi.fn((type: string, listener) => {
            listeners[type] = listener;
        })
    );

    const eb = new ErrorBoundary();
    const originalError = new Error("original rejection error");

    // Trigger with an actual Error instance — covers line 131 TRUE branch
    await listeners["unhandledrejection"]?.({ reason: originalError });

    assert.equal(eb.getErrorHistory().length, 1);
    // normalizeError wraps it as AppError but message is preserved
    assert.match(
        eb.getErrorHistory()[0].error.message,
        /original rejection error/
    );

    vi.unstubAllGlobals();
});

test("ErrorBoundary.handle: onError throws non-Error → wrapped and logged", async () => {
    let loggedErrors = 0;
    const mockLogger = {
        error: () => {
            loggedErrors++;
        },
        warn: () => {},
        info: () => {},
        debug: () => {},
    };
    const eb = new ErrorBoundary({
        // @ts-expect-error - Test type override
        logger: mockLogger,
        onError: () => {
            throw "non-Error onError throw";
        },
    });
    await eb.handle(new Error("test"), {});
    // Should log: 1 for the error itself, 1 for the failed onError handler
    assert.ok(loggedErrors >= 2);
});

test("ErrorBoundary.execute: non-Error thrown is converted to Error", async () => {
    const eb = new ErrorBoundary({ maxRetries: 0, retryDelay: 10 });
    await assert.rejects(
        () =>
            eb.execute(async () => {
                throw "string error";
            }),
        (err) => {
            assert.ok(err instanceof Error);
            return true;
        }
    );
});

test("ErrorBoundary.setupGlobalHandlers patches globalThis.onerror when available (lines 143-165)", async () => {
    // Stub onerror as a function so the code path inside setupGlobalHandlers fires
    const originalOnError = vi.fn((..._args: unknown[]) => false);
    vi.stubGlobal("onerror", originalOnError);

    // Create a new ErrorBoundary — setupGlobalHandlers will wrap globalThis.onerror
    const eb = new ErrorBoundary();

    // The wrapped onerror should be different from the original
    // @ts-expect-error - globalThis.onerror is the patched version
    assert.notEqual(globalThis.onerror, originalOnError);

    // Call the wrapped onerror with an Error object
    // @ts-expect-error - globalThis.onerror is the patched version
    globalThis.onerror(
        "Error message",
        "file.js",
        10,
        5,
        new Error("global error")
    );

    // Wait for handle to process
    await new Promise((r) => setTimeout(r, 10));

    assert.equal(eb.getErrorHistory().length, 1);
    assert.match(eb.getErrorHistory()[0].error.message, /global error/);

    vi.unstubAllGlobals();
});

test("ErrorBoundary.setupGlobalHandlers onerror wraps non-Error message as Error (lines 143-165)", async () => {
    const originalOnError = vi.fn((..._args: unknown[]) => false);
    vi.stubGlobal("onerror", originalOnError);

    const eb = new ErrorBoundary();

    // Call wrapped onerror WITHOUT an Error object (just a message string)
    // @ts-expect-error - globalThis.onerror is the patched version
    globalThis.onerror("Something went wrong", "file.js", 42, 0, undefined);

    await new Promise((r) => setTimeout(r, 10));

    assert.equal(eb.getErrorHistory().length, 1);
    assert.match(eb.getErrorHistory()[0].error.message, /Something went wrong/);

    vi.unstubAllGlobals();
});
