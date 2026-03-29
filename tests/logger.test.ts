/* eslint-disable no-console */
import {
    Logger,
    createLogger,
    consoleTransportNode,
    consoleTransportBrowser,
} from "../src/utils/core/Logger";

// ============================================================================
// Logger Tests
// ============================================================================

test("Logger respects log levels and priority", () => {
    let logCount = 0;
    const transport = () => {
        logCount++;
    };

    const logger = new Logger({ level: "info", transports: [transport] });

    logger.error("error"); // log
    logger.warn("warn"); // log
    logger.info("info"); // log
    logger.debug("debug"); // skip

    assert.equal(logCount, 3);
});

test("Logger.silent() suppresses all logs", () => {
    let logCount = 0;
    const transport = () => {
        logCount++;
    };

    const logger = Logger.silent();
    // @ts-expect-error (inject transport for testing)
    logger.transports = [transport];

    logger.error("error");
    assert.equal(logCount, 0);
});

test("Logger.child creates nested namespaces", () => {
    let lastNamespace = "";
    const transport = (entry) => {
        lastNamespace = entry.namespace;
    };

    const parent = new Logger({ namespace: "parent", transports: [transport] });
    const child = parent.child("child");

    child.info("test");
    assert.equal(lastNamespace, "parent:child");
});

test("consoleTransportNode formats correctly", () => {
    const originalLog = console.log;
    let output = "";

    console.log = (msg) => {
        output = msg;
    };

    const transport = consoleTransportNode({ includeTimestamp: false });
    transport({
        level: "info",
        message: "hello",
        namespace: "test",
        timestamp: new Date(),
        context: { user: 1 },
    });

    assert.match(output, /INFO.*\[test\].*hello/);

    console.log = originalLog;
});

test("consoleTransportBrowser formats correctly (mocked environment)", () => {
    // Mock browser
    globalThis.window = {};
    globalThis.document = {};

    const originalLog = console.log;
    let output = "";

    console.log = (msg) => {
        output = msg;
    };

    const transport = consoleTransportBrowser({ includeTimestamp: false });
    transport({
        level: "info",
        message: "hello",
        namespace: "test",
        timestamp: new Date(),
    });

    assert.match(output, /%cINFO.*\[test\].*hello/);

    console.log = originalLog;
    delete globalThis.window;
    delete globalThis.document;
});

test("Logger handles transport failures", async () => {
    const originalError = console.error;
    let errorLogged = false;
    console.error = (msg) => {
        if (
            typeof msg === "string" &&
            msg.includes("[Logger] Transport failure")
        ) {
            errorLogged = true;
        }
    };

    // Using a transport that returns a rejected promise
    const badTransport = () => Promise.reject(new Error("Boom"));
    const logger = new Logger({ transports: [badTransport] });

    logger.info("test");

    // Wait for the async transport failure to be processed and logged
    await new Promise((r) => setTimeout(r, 50));

    assert.equal(errorLogged, true);
    console.error = originalError;
});

test("createLogger factory works", () => {
    const logger = createLogger({ level: "error" });
    assert.ok(logger instanceof Logger);
});

test("Logger.setLevel updates logging behavior", () => {
    let logCount = 0;
    const transport = () => {
        logCount++;
    };

    const logger = new Logger({ level: "error", transports: [transport] });
    logger.info("skip");
    assert.equal(logCount, 0);

    logger.setLevel("info");
    logger.info("now log");
    assert.equal(logCount, 1);
});

test("Logger.error forwards error object to transport", () => {
    let receivedError;
    const transport = (entry) => {
        receivedError = entry.error;
    };

    const logger = new Logger({ level: "error", transports: [transport] });
    const err = new Error("boom");
    logger.error("fail", { ok: false }, err);

    assert.equal(receivedError, err);
});

test("Logger with timestamp in browser transport", () => {
    globalThis.window = {};
    globalThis.document = {};

    const originalLog = console.log;
    let output = "";
    console.log = (msg) => {
        output = msg;
    };

    const transport = consoleTransportBrowser({ includeTimestamp: true });
    transport({
        level: "debug",
        message: "test",
        timestamp: new Date("2026-01-01T00:00:00Z"),
    });

    assert.match(output, /2026-01-01/);
    assert.match(output, /DEBUG/);

    console.log = originalLog;
    delete globalThis.window;
    delete globalThis.document;
});

test("Logger with context and error in node transport", () => {
    const originalError = console.error;
    let args = [];
    console.error = (...capturedArgs) => {
        args = capturedArgs;
    };

    const transport = consoleTransportNode({ includeTimestamp: true });
    const error = new Error("test error");
    transport({
        level: "error",
        message: "failure",
        namespace: "app",
        timestamp: new Date(),
        context: { code: 500 },
        error,
    });

    assert.ok(args[0].includes("ERROR"));
    assert.ok(args[0].includes("[app]"));
    assert.ok(args[0].includes("failure"));
    assert.deepEqual(args[1], { code: 500 });
    assert.equal(args[2], error);

    console.error = originalError;
});

test("Logger warn level uses console.warn", () => {
    const originalWarn = console.warn;
    let warnCalled = false;
    console.warn = () => {
        warnCalled = true;
    };

    const transport = consoleTransportNode();
    transport({
        level: "warn",
        message: "warning",
        timestamp: new Date(),
    });

    assert.ok(warnCalled);
    console.warn = originalWarn;
});

test("Logger without namespace has no namespace brackets", () => {
    let output = "";
    const originalLog = console.log;
    console.log = (msg) => {
        output = msg;
    };

    const transport = consoleTransportNode({ includeTimestamp: false });
    transport({
        level: "info",
        message: "no namespace",
        timestamp: new Date(),
    });

    assert.ok(output.includes("INFO"));
    assert.ok(output.includes("no namespace"));
    // No debe tener [namespace] pero puede tener otros corchetes en colores ANSI
    assert.ok(!output.match(/\[\w+\]/));

    console.log = originalLog;
});

test("Logger with empty context is not logged", () => {
    let args = [];
    const originalLog = console.log;
    console.log = (...capturedArgs) => {
        args = capturedArgs;
    };

    const transport = consoleTransportNode();
    transport({
        level: "info",
        message: "test",
        timestamp: new Date(),
        context: {},
    });

    assert.equal(args.length, 1); // Solo el mensaje, no el context vacío

    console.log = originalLog;
});

test("consoleTransportBrowser uses console.warn for warn level (line 115)", () => {
    globalThis.window = {};
    globalThis.document = {};
    const originalWarn = console.warn;
    let warnCalled = false;
    console.warn = (..._args) => {
        warnCalled = true;
    };

    const transport = consoleTransportBrowser({ includeTimestamp: false });
    transport({
        level: "warn",
        message: "browser warn",
        timestamp: new Date(),
    });

    assert.ok(warnCalled);
    console.warn = originalWarn;
    delete globalThis.window;
    delete globalThis.document;
});

test("consoleTransportBrowser uses console.error for error level (line 112)", () => {
    globalThis.window = {};
    globalThis.document = {};
    const originalError = console.error;
    let errorCalled = false;
    console.error = (..._args) => {
        errorCalled = true;
    };

    const transport = consoleTransportBrowser({ includeTimestamp: false });
    transport({
        level: "error",
        message: "browser error",
        timestamp: new Date(),
    });

    assert.ok(errorCalled);
    console.error = originalError;
    delete globalThis.window;
    delete globalThis.document;
});

test("Logger.child without namespace uses childNamespace = namespace directly (line 158)", () => {
    // Logger without namespace: childNamespace = namespace (false branch of ternary at line 157-158)
    const logger = new Logger({ namespace: undefined }); // no namespace
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const child = logger.child("payments");
    child.info("child message");
    // child namespace should be just "payments" (no parent prefix)
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("payments"));
    spy.mockRestore();
});

test("Logger DEFAULT_LEVEL is 'info' when NODE_ENV=production (line 37)", async () => {
    // Reset modules to re-evaluate module-level constants with production env
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    vi.resetModules();
    const { Logger: ProdLogger } = await import("../src/utils/core/Logger");
    const prodLogger = new ProdLogger();
    // In production, DEFAULT_LEVEL = "info", so debug messages are suppressed
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    prodLogger.debug("should be suppressed");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
});

test("Logger uses consoleTransportBrowser when isBrowser is true (line 146)", async () => {
    // Reset modules after stubbing window/document to trigger isBrowser=true path
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {});
    vi.resetModules();
    const { Logger: BrowserLogger } = await import("../src/utils/core/Logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new BrowserLogger();
    logger.info("browser log");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    vi.unstubAllGlobals();
    vi.resetModules();
});

test("consoleTransportBrowser with includeTimestamp=true includes ISO timestamp (line 97 true branch)", () => {
    // includeTimestamp=true (default) pushes timestamp — covers the TRUE branch at line ~97
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const transport = consoleTransportBrowser({ includeTimestamp: true });
    const now = new Date("2024-01-15T10:00:00.000Z");
    transport({ level: "debug", message: "timestamped", timestamp: now });
    expect(spy).toHaveBeenCalled();
    // Output contains the ISO string
    const callArg = spy.mock.calls[0]?.[0] as string;
    expect(callArg).toContain("2024-01-15");
    spy.mockRestore();
});

test("consoleTransportBrowser uses console.log for info/debug levels (lines 107-108 fallthrough)", () => {
    // For levels that are not error/warn, the ternary falls through to console.log
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const transport = consoleTransportBrowser({ includeTimestamp: false });
    transport({ level: "info", message: "info msg", timestamp: new Date() });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
});

test("consoleTransportNode ?? fallback: COLORS[level] undefined uses empty string (line 60)", () => {
    // Calling the transport with an unknown level exercises the ?? '' fallback
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const transport = consoleTransportNode({ includeTimestamp: false });
    // Pass an unknown level via type assertion to trigger COLORS[level] === undefined
    (transport as any)({
        level: "custom",
        message: "custom level",
        timestamp: new Date(),
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
});

test("consoleTransportBrowser with context object — pushes context to payload (line 107 TRUE)", () => {
    // context with keys → Object.keys(context).length > 0 → payload.push(context)
    const args: unknown[][] = [];
    const originalLog = console.log;
    console.log = (...a) => {
        args.push(a);
    };
    const transport = consoleTransportBrowser({ includeTimestamp: false });
    const ctx = { requestId: "abc-123" };
    transport({
        level: "info",
        message: "with ctx",
        timestamp: new Date(),
        context: ctx,
    });
    assert.ok(args.length > 0, "console.log was called");
    const callArgs = args[0]!;
    assert.ok(callArgs.includes(ctx), "context should be in payload");
    console.log = originalLog;
});

test("consoleTransportBrowser with error object — pushes error to payload (line 108 TRUE)", () => {
    // error provided → if (error) payload.push(error)
    const args: unknown[][] = [];
    const originalError = console.error;
    console.error = (...a) => {
        args.push(a);
    };
    const transport = consoleTransportBrowser({ includeTimestamp: false });
    const err = new Error("browser error object");
    transport({
        level: "error",
        message: "oops",
        timestamp: new Date(),
        error: err,
    });
    assert.ok(args.length > 0, "console.error was called");
    const callArgs = args[0]!;
    assert.ok(callArgs.includes(err), "error should be in payload");
    console.error = originalError;
});
