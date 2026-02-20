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
    // eslint-disable-next-line no-console
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

    // eslint-disable-next-line no-console
    console.log = originalLog;
});

test("consoleTransportBrowser formats correctly (mocked environment)", () => {
    // Mock browser
    globalThis.window = {};
    globalThis.document = {};

    const originalLog = console.log;
    let output = "";
    // eslint-disable-next-line no-console
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

    // eslint-disable-next-line no-console
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
