import test from "node:test";
import assert from "node:assert/strict";
import {
    Logger,
    createLogger,
    consoleTransportNode,
    consoleTransportBrowser,
} from "../dist/utils/core/Logger.js";

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
