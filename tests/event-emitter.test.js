import test from "node:test";
import assert from "node:assert/strict";
import {
    EventEmitter,
    createEventEmitter,
} from "../dist/utils/helpers/EventEmitter.js";

// ============================================================================
// EventEmitter Tests
// ============================================================================

test("EventEmitter basic on and emit", async () => {
    const ee = new EventEmitter();
    let received = null;
    ee.on("test", (data) => {
        received = data;
    });

    const handled = await ee.emit("test", "hello");
    assert.equal(handled, true);
    assert.equal(received, "hello");

    assert.equal(await ee.emit("other", "no-one"), false);
});

test("EventEmitter once listeners are removed after call", async () => {
    const ee = new EventEmitter();
    let calls = 0;
    ee.once("test", () => {
        calls++;
    });

    await ee.emit("test", {});
    await ee.emit("test", {});

    assert.equal(calls, 1);
    assert.equal(ee.listenerCount("test"), 0);
});

test("EventEmitter off removes regular and once listeners", () => {
    const ee = new EventEmitter();
    const handler = () => {};

    ee.on("test", handler);
    assert.equal(ee.listenerCount("test"), 1);
    ee.off("test", handler);
    assert.equal(ee.listenerCount("test"), 0);

    ee.once("test", handler);
    assert.equal(ee.listenerCount("test"), 1);
    ee.off("test", handler);
    assert.equal(ee.listenerCount("test"), 0);
});

test("EventEmitter removeAllListeners", () => {
    const ee = new EventEmitter();
    ee.on("a", () => {});
    ee.on("b", () => {});

    ee.removeAllListeners("a");
    assert.equal(ee.listenerCount("a"), 0);
    assert.equal(ee.listenerCount("b"), 1);

    ee.removeAllListeners();
    assert.equal(ee.listenerCount("b"), 0);
});

test("EventEmitter captureRejections handles async errors", async () => {
    const ee = new EventEmitter({ captureRejections: true });
    let caughtError = null;
    let caughtData = null;

    ee.on("test", async () => {
        throw new Error("Async failure");
    });

    ee.onError((data, err) => {
        caughtData = data;
        caughtError = err;
    });

    await ee.emit("test", { x: 1 });

    assert.ok(caughtError);
    assert.equal(caughtError.message, "Async failure");
    assert.deepEqual(caughtData, { x: 1 });
});

test("EventEmitter emitSync handles synchronous errors", () => {
    const ee = new EventEmitter({ captureRejections: true });
    let caughtError = null;

    ee.on("test", () => {
        throw new Error("Sync failure");
    });

    ee.onError((_, err) => {
        caughtError = err;
    });

    ee.emitSync("test", {});
    assert.equal(caughtError.message, "Sync failure");
});

test("EventEmitter maxListeners warning", () => {
    const ee = new EventEmitter({ maxListeners: 1 });
    const originalWarn = console.warn;
    let warning = null;
    console.warn = (msg) => {
        warning = msg;
    };

    ee.on("test", () => {});
    ee.on("test", () => {}); // Should trigger warning

    assert.ok(warning);
    assert.match(warning, /MaxListenersExceededWarning/);

    console.warn = originalWarn;
});

test("EventEmitter getListeners and eventNames", () => {
    const ee = new EventEmitter();
    const h1 = () => {};
    const h2 = () => {};

    ee.on("a", h1);
    ee.on("b", h2);

    assert.deepEqual(ee.eventNames(), ["a", "b"]);
    assert.deepEqual(ee.getListeners("a"), [h1]);
    assert.equal(ee.getMaxListeners(), 10);

    ee.setMaxListeners(20);
    assert.equal(ee.getMaxListeners(), 20);
});

test("createEventEmitter factory works", () => {
    const ee = createEventEmitter();
    assert.ok(ee instanceof EventEmitter);
});

test("EventEmitter propagates errors when captureRejections is false", async () => {
    const ee = new EventEmitter();
    ee.on("boom", () => {
        throw new Error("boom");
    });

    await assert.rejects(() => ee.emit("boom", {}), /boom/);
});

test("EventEmitter ignores errors in error handlers", async () => {
    const ee = new EventEmitter({ captureRejections: true });
    ee.on("boom", async () => {
        throw new Error("fail");
    });

    let errorCount = 0;
    ee.onError(() => {
        errorCount++;
        throw new Error("handler error");
    });

    await ee.emit("boom", { id: 1 });

    assert.equal(errorCount, 1);
});
