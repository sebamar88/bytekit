import { WebSocketHelper } from "../src/utils/helpers/WebSocketHelper";

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

// @ts-expect-error - Test type override
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
    // @ts-expect-error - Test type override
    assert.match(wsh.ws.lastSent, /"type":"ping"/);

    wsh.close();
});

test("WebSocketHelper handles non-Error objects thrown by handlers", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    let caughtError: Error | null = null;
    wsh.onError((err) => {
        caughtError = err;
    });

    wsh.on("string-error", () => {
        throw "something went wrong";
    });

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "string-error", data: {} });

    assert.ok(caughtError instanceof Error);
    assert.equal(caughtError?.message, "something went wrong");

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
    // @ts-expect-error - Test type override
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
        // @ts-expect-error - Test type override
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

    // Simulate unexpected close
    // @ts-expect-error - Test type override
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
    wsh.onMaxRetriesReached(() => {
        maxAttemptsReached = true;
    });

    await wsh.connect();

    const originalConnect = MockWebSocket.prototype._open;
    MockWebSocket.prototype._open = function () {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onerror) this.onerror();
        if (this.onclose) this.onclose();
    };
    // @ts-expect-error (force close)
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

    // @ts-expect-error - Test type override
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

    // @ts-expect-error - Test type override
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

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "boom", data: { ok: true } });

    assert.equal(errorNotified, true);
    wsh.close();
});

test("WebSocketHelper connect rejects on constructor error", async () => {
    const OriginalWebSocket = globalThis.WebSocket;

    class FailingWebSocket {
        readyState = 0;

        constructor() {
            throw new Error("Constructor failed");
        }
    }

    // @ts-expect-error - Test type override
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
        // @ts-expect-error - Test type override
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

    // @ts-expect-error - Test type override
    wsh.ws._error();

    await new Promise((r) => setTimeout(r, 10));
    assert.equal(logged, true);

    wsh.close();
    console.error = originalError;
});

test("WebSocketHelper continues to next handler if one fails", async () => {
    const wsh = new WebSocketHelper("ws://localhost");
    await wsh.connect();

    let handler2Called = false;
    let errorNotified = false;

    wsh.onError(() => {
        errorNotified = true;
    });

    wsh.on("multi", () => {
        throw new Error("First handler failed");
    });

    wsh.on("multi", () => {
        handler2Called = true;
    });

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "multi", data: { ok: true } });

    assert.equal(errorNotified, true);
    assert.equal(handler2Called, true);

    wsh.close();
});
// ============================================================================
// US1: Backoff Strategies & Reconnect Event Handlers (T009–T015)
// ============================================================================

test("US1 [T009] linear backoff — onReconnect receives correct (attempt, delay) pairs", async () => {
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        reconnectDelayMs: 500,
        backoffStrategy: "linear",
        maxReconnectAttempts: 3,
    });
    const pairs: Array<[number, number]> = [];
    wsh.onReconnect((attempt, delay) => pairs.push([attempt, delay]));

    await wsh.connect();
    // @ts-expect-error - Test type override
    wsh.ws.close(); // fires onReconnect synchronously before setTimeout

    assert.equal(pairs.length, 1);
    assert.equal(pairs[0][0], 1);   // attempt 1
    assert.equal(pairs[0][1], 500); // delay = 500 × 1

    wsh.close();
});

test("US1 [T010] exponential backoff — delay doubles per attempt, capped at maxReconnectDelayMs", async () => {
    // Make reconnects fail so reconnectAttempts accumulates across multiple attempts
    let callCount = 0;
    const originalOpen = MockWebSocket.prototype._open;
    MockWebSocket.prototype._open = function () {
        callCount++;
        if (callCount === 1) {
            // First connect succeeds
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) this.onopen();
        } else {
            // Subsequent reconnects fail immediately → reconnectAttempts keeps growing
            this.readyState = MockWebSocket.CLOSED;
            if (this.onerror) this.onerror();
            if (this.onclose) this.onclose();
        }
    };

    try {
        const wsh = new WebSocketHelper("ws://localhost", {
            reconnect: true,
            reconnectDelayMs: 10,
            backoffStrategy: "exponential",
            maxReconnectDelayMs: 25,
            maxReconnectAttempts: 10,
        });
        const delays: number[] = [];
        wsh.onReconnect((_, delay) => delays.push(delay));

        await wsh.connect();

        // Trigger reconnect cascade: close → attempt1 fail → attempt2 fail → attempt3 fail
        // @ts-expect-error - Test type override
        wsh.ws.close();

        // Each attempt takes ~10ms (delay) + ~10ms (mock open) = ~20ms per cycle
        await new Promise((r) => setTimeout(r, 250));

        // attempt 1: min(25, 10×2^0) = 10
        // attempt 2: min(25, 10×2^1) = 20
        // attempt 3: min(25, 10×2^2) = 25 (capped)
        assert.equal(delays[0], 10);
        assert.equal(delays[1], 20);
        assert.equal(delays[2], 25);

        wsh.close();
    } finally {
        MockWebSocket.prototype._open = originalOpen;
    }
});

test("US1 [T011] exponential + jitter — delay is Math.random() × cap", async () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        reconnectDelayMs: 1000,
        backoffStrategy: "exponential",
        jitter: true,
        maxReconnectAttempts: 2,
    });
    let capturedDelay = -1;
    wsh.onReconnect((_, delay) => {
        capturedDelay = delay;
    });
    await wsh.connect();
    // @ts-expect-error - Test type override
    wsh.ws.close();
    // attempt 1: cap = min(30000, 1000 × 2^0) = 1000; delay = 0.5 × 1000 = 500
    assert.equal(capturedDelay, 500);
    mockRandom.mockRestore();
    wsh.close();
});

test("US1 [T012] custom backoffStrategy function — receives 1-based attempt, return value is delay", async () => {
    const customFn = vi.fn((attempt: number) => attempt * 50);
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        backoffStrategy: customFn,
        maxReconnectAttempts: 3,
    });
    let capturedDelay = -1;
    wsh.onReconnect((_, delay) => {
        capturedDelay = delay;
    });
    await wsh.connect();
    // @ts-expect-error - Test type override
    wsh.ws.close();
    assert.equal(customFn.mock.calls.length, 1);
    assert.equal(customFn.mock.calls[0][0], 1); // 1-based attempt
    assert.equal(capturedDelay, 50);            // 1 × 50
    wsh.close();
});

test("US1 [T013] onMaxRetriesReached fires on exhaustion; onError is NOT called for exhaustion", async () => {
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        maxReconnectAttempts: 0, // immediately exhausted on first close
    });
    let maxRetriesFired = false;
    const errorMessages: string[] = [];
    wsh.onMaxRetriesReached(() => {
        maxRetriesFired = true;
    });
    wsh.onError((err) => {
        errorMessages.push(err.message);
    });
    await wsh.connect();
    // @ts-expect-error - Test type override
    wsh.ws.close();
    assert.equal(maxRetriesFired, true);
    assert.ok(!errorMessages.includes("Max reconnection attempts reached"));
    wsh.close();
});

test("US1 [T014] onReconnect unsubscribe — stops handler from receiving further notifications", async () => {
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        reconnectDelayMs: 10,
        maxReconnectAttempts: 5,
    });
    let count = 0;
    const unsubscribe = wsh.onReconnect(() => count++);
    await wsh.connect();

    // @ts-expect-error - Test type override
    wsh.ws.close();
    assert.equal(count, 1);

    unsubscribe();
    await new Promise((r) => setTimeout(r, 50));

    // @ts-expect-error - Test type override
    wsh.ws.close();
    assert.equal(count, 1); // still 1 — handler was removed

    wsh.close();
});

test("US1 [T015] multiple onReconnect subscribers — all notified; each unsubscribes independently", async () => {
    const wsh = new WebSocketHelper("ws://localhost", {
        reconnect: true,
        reconnectDelayMs: 10,
        maxReconnectAttempts: 5,
    });
    const log: string[] = [];
    const unsub1 = wsh.onReconnect(() => log.push("h1"));
    const unsub2 = wsh.onReconnect(() => log.push("h2"));
    await wsh.connect();

    // @ts-expect-error - Test type override
    wsh.ws.close();
    assert.deepEqual(log, ["h1", "h2"]);

    unsub1();
    await new Promise((r) => setTimeout(r, 50));

    // @ts-expect-error - Test type override
    wsh.ws.close();
    assert.deepEqual(log, ["h1", "h2", "h2"]); // only h2 fires

    wsh.close();
});

// ============================================================================
// US2: Schema Validation (T018–T022)
// ============================================================================

test("US2 [T018] valid message with schema — handler receives parsed/transformed value", async () => {
    const mockSchema = {
        parse: (data: unknown) => ({ ...(data as object), validated: true }),
    };
    const wsh = new WebSocketHelper("ws://localhost", {
        schemas: { order: mockSchema },
    });
    await wsh.connect();

    let received: unknown = null;
    wsh.on("order", (data) => {
        received = data;
    });

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "order", data: { id: 1 } });

    assert.deepEqual(received, { id: 1, validated: true });
    wsh.close();
});

test("US2 [T019] invalid message — onValidationError fires with error and rawMessage", async () => {
    const parseError = new Error("invalid data");
    const mockSchema = {
        parse: () => {
            throw parseError;
        },
    };
    const wsh = new WebSocketHelper("ws://localhost", {
        schemas: { order: mockSchema },
    });
    await wsh.connect();

    let capturedError: Error | null = null;
    let capturedType = "";
    wsh.onValidationError((err, msg) => {
        capturedError = err;
        capturedType = msg.type;
    });

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "order", data: { bad: true } });

    assert.equal(capturedError?.message, "invalid data");
    assert.equal(capturedType, "order");
    wsh.close();
});

test("US2 [T020] invalid message — on() handlers are NOT called (message dropped)", async () => {
    const mockSchema = {
        parse: () => {
            throw new Error("bad");
        },
    };
    const wsh = new WebSocketHelper("ws://localhost", {
        schemas: { order: mockSchema },
    });
    await wsh.connect();

    let handlerCalled = false;
    wsh.on("order", () => {
        handlerCalled = true;
    });

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "order", data: {} });

    assert.equal(handlerCalled, false);
    wsh.close();
});

test("US2 [T021] message type without schema passes through to on() handlers unvalidated", async () => {
    const mockSchema = {
        parse: (data: unknown) => ({ ...(data as object), validated: true }),
    };
    const wsh = new WebSocketHelper("ws://localhost", {
        schemas: { order: mockSchema }, // "chat" has no schema
    });
    await wsh.connect();

    let received: unknown = null;
    wsh.on("chat", (data) => {
        received = data;
    });

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "chat", data: { text: "hello" } });

    assert.deepEqual(received, { text: "hello" }); // raw, unvalidated
    wsh.close();
});

test("US2 [T022] onValidationError unsubscribe — stops handler from firing", async () => {
    const mockSchema = {
        parse: () => {
            throw new Error("bad");
        },
    };
    const wsh = new WebSocketHelper("ws://localhost", {
        schemas: { item: mockSchema },
    });
    await wsh.connect();

    let count = 0;
    const unsubscribe = wsh.onValidationError(() => count++);

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "item", data: {} });
    assert.equal(count, 1);

    unsubscribe();

    // @ts-expect-error - Test type override
    wsh.ws._receive({ type: "item", data: {} });
    assert.equal(count, 1); // still 1

    wsh.close();
});

// ============================================================================
// US3: Heartbeat Pong Detection (T026–T028)
// ============================================================================

test("US3 [T026] message within heartbeatTimeoutMs cancels forced close", async () => {
    vi.useFakeTimers();
    try {
        const wsh = new WebSocketHelper("ws://localhost", {
            heartbeatIntervalMs: 100,
            heartbeatTimeoutMs: 50,
            reconnect: false,
        });

        const connectPromise = wsh.connect();
        await vi.advanceTimersByTimeAsync(15); // MockWebSocket._open fires at 10ms
        await connectPromise;

        // Advance past heartbeat interval → ping sent, pong timer started
        await vi.advanceTimersByTimeAsync(105);

        // Deliver a message BEFORE pong timeout fires (< 50ms elapsed)
        // @ts-expect-error - Test type override
        wsh.ws._receive({ type: "pong", data: {} });

        // Advance past what would have been the pong timeout
        await vi.advanceTimersByTimeAsync(60);

        // Connection should still be open — forced close was cancelled
        assert.equal(wsh.isConnected(), true);

        wsh.close();
    } finally {
        vi.useRealTimers();
    }
});

test("US3 [T027] no message within heartbeatTimeoutMs — ws.close() called, reconnect triggered", async () => {
    vi.useFakeTimers();
    try {
        const wsh = new WebSocketHelper("ws://localhost", {
            heartbeatIntervalMs: 100,
            heartbeatTimeoutMs: 50,
            reconnect: true,
            reconnectDelayMs: 5,
            maxReconnectAttempts: 1,
        });

        let reconnectFired = false;
        wsh.onReconnect(() => {
            reconnectFired = true;
        });

        const connectPromise = wsh.connect();
        await vi.advanceTimersByTimeAsync(15);
        await connectPromise;

        // Advance past heartbeat interval (100ms) + pong timeout (50ms)
        await vi.advanceTimersByTimeAsync(160);

        assert.equal(reconnectFired, true);

        wsh.close();
    } finally {
        vi.useRealTimers();
    }
});

test("US3 [T028] close() clears pong timer — no reconnect after intentional disconnect", async () => {
    vi.useFakeTimers();
    try {
        const wsh = new WebSocketHelper("ws://localhost", {
            heartbeatIntervalMs: 100,
            heartbeatTimeoutMs: 50,
            reconnect: true,
            maxReconnectAttempts: 3,
        });

        let reconnectFired = false;
        wsh.onReconnect(() => {
            reconnectFired = true;
        });

        const connectPromise = wsh.connect();
        await vi.advanceTimersByTimeAsync(15);
        await connectPromise;

        // Advance to trigger heartbeat (ping + pong timer started)
        await vi.advanceTimersByTimeAsync(105);

        // Intentionally close BEFORE pong timer fires (< 50ms elapsed since ping)
        wsh.close();

        // Advance well past pong timeout — should NOT trigger reconnect
        await vi.advanceTimersByTimeAsync(200);

        assert.equal(reconnectFired, false);
    } finally {
        vi.useRealTimers();
    }
});
