import test from "node:test";
import assert from "node:assert/strict";
import { WebSocketHelper } from "../dist/utils/helpers/WebSocketHelper.js";

// ============================================================================
// Mock WebSocket
// ============================================================================

class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.CONNECTING;
        setTimeout(() => this._open(), 10);
    }

    _open() {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) this.onopen();
    }

    send(data) {
        this.lastSent = data;
        // Mock server response for 'ping'
        const msg = JSON.parse(data);
        if (msg.type === "ping") {
            // No response needed for ping in this mock usually
        }
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) this.onclose();
    }

    // Server-side simulation helpers
    _receive(data) {
        if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
    }

    _error() {
        if (this.onerror) this.onerror();
    }
}

// @ts-ignore
globalThis.WebSocket = MockWebSocket;

// ============================================================================
// WebSocketHelper Tests
// ============================================================================

test("WebSocketHelper connects and sends heartbeat", async () => {
    const wsh = new WebSocketHelper("ws://localhost", {
        heartbeatIntervalMs: 50,
    });
    await wsh.connect();

    assert.equal(wsh.isConnected(), true);
    assert.equal(wsh.getState(), MockWebSocket.OPEN);

    // Wait for heartbeat
    await new Promise((r) => setTimeout(r, 70));
    // @ts-ignore
    assert.match(wsh.ws.lastSent, /"type":"ping"/);

    wsh.close();
});

test("WebSocketHelper receives messages and notifies subscribers", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    let receivedData = null;
    wsh.on("chat", (data) => {
        receivedData = data;
    });

    // Simulate server message
    // @ts-ignore
    wsh.ws._receive({ type: "chat", data: { text: "hello" } });

    assert.deepEqual(receivedData, { text: "hello" });
    wsh.close();
});

test("WebSocketHelper.request handles send and response", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    const promise = wsh.request("get_user", { id: 1 });

    // Simulate server response after a short delay
    setTimeout(() => {
        // @ts-ignore
        wsh.ws._receive({ type: "get_user:response", data: { name: "John" } });
    }, 20);

    const response = await promise;
    assert.deepEqual(response, { name: "John" });
    wsh.close();
});

test("WebSocketHelper handles reconnection", async () => {
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        reconnectDelayMs: 10,
        maxReconnectAttempts: 2,
    });
    await wsh.connect();

    let errorCalled = false;
    wsh.onError(() => {
        errorCalled = true;
    });

    // Simulate unexpected close
    // @ts-ignore
    wsh.ws.close();

    // Wait for reconnect attempt
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(wsh.isConnected(), true);

    wsh.close();
});

test("WebSocketHelper stops reconnecting after max attempts", async () => {
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        reconnectDelayMs: 10,
        maxReconnectAttempts: 1,
    });

    let maxAttemptsReached = false;
    wsh.onError((err) => {
        if (err.message === "Max reconnection attempts reached") {
            maxAttemptsReached = true;
        }
    });

    await wsh.connect();

    // Force fail on next connect attempt by making the'ws' constructor throw?
    // Or just mock the connect failure.
    const originalConnect = MockWebSocket.prototype._open;
    MockWebSocket.prototype._open = function () {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onerror) this.onerror();
        if (this.onclose) this.onclose();
    };

    // @ts-ignore (force close)
    wsh.ws.close();

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(maxAttemptsReached, true);

    MockWebSocket.prototype._open = originalConnect;
});

test("WebSocketHelper throws if sending while disconnected", () => {
    const wsh = new WebSocketHelper("ws://localhost");
    assert.throws(() => wsh.send("test", {}), /WebSocket is not connected/);
});

test("WebSocketHelper handles invalid message JSON", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    let errorCaught = false;
    wsh.onError(() => {
        errorCaught = true;
    });

    // @ts-ignore
    wsh.ws.onmessage({ data: "invalid json" });

    assert.equal(errorCaught, true);
    wsh.close();
});

test("WebSocketHelper unsubscribe stops receiving messages", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    let received = 0;
    const unsubscribe = wsh.on("notice", () => {
        received++;
    });
    unsubscribe();

    // @ts-ignore
    wsh.ws._receive({ type: "notice", data: { ok: true } });

    assert.equal(received, 0);
    wsh.close();
});

test("WebSocketHelper request times out when no response", async () => {
    const wsh = new WebSocketHelper("ws://localhost", { messageTimeout: 20 });
    await wsh.connect();

    await assert.rejects(
        () => wsh.request("slow", { id: 1 }),
        /Request timeout/
    );
    wsh.close();
});

test("WebSocketHelper notifies error when handler throws", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    let errorNotified = false;
    wsh.onError(() => {
        errorNotified = true;
    });
    wsh.on("boom", () => {
        throw new Error("Handler failed");
    });

    // @ts-ignore
    wsh.ws._receive({ type: "boom", data: { ok: true } });

    assert.equal(errorNotified, true);
    wsh.close();
});

test("WebSocketHelper connect rejects on constructor error", async () => {
    const OriginalWebSocket = globalThis.WebSocket;

    class FailingWebSocket {
        constructor() {
            throw new Error("Constructor failed");
        }
    }

    // @ts-ignore
    globalThis.WebSocket = FailingWebSocket;

    const wsh = new WebSocketHelper("ws://localhost");
    await assert.rejects(() => wsh.connect(), /Constructor failed/);

    globalThis.WebSocket = OriginalWebSocket;
});

test("WebSocketHelper request supports custom responseType", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    const promise = wsh.request("get_user", { id: 1 }, "user:loaded");

    setTimeout(() => {
        // @ts-ignore
        wsh.ws._receive({ type: "user:loaded", data: { id: 1 } });
    }, 10);

    const response = await promise;
    assert.deepEqual(response, { id: 1 });
    wsh.close();
});

test("WebSocketHelper notifyError ignores handler exceptions", async () => {
    const originalError = console.error;
    let logged = false;
    console.error = () => {
        logged = true;
    };

    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    wsh.onError(() => {
        throw new Error("handler failed");
    });

    // @ts-ignore
    wsh.ws._error();

    await new Promise((r) => setTimeout(r, 10));
    assert.equal(logged, true);

    wsh.close();
    console.error = originalError;
});
