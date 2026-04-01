import { StreamingHelper } from "../src/utils/helpers/StreamingHelper";
import type { SSEEvent } from "../src/utils/helpers/StreamingHelper";

// Mocking global objects for Node.js environment
const originalFetch = globalThis.fetch;

// Helper to create a readable stream from an array of strings
function createMockStream(chunks) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
                // Add a small delay to simulate network streaming
                await new Promise((r) => setTimeout(r, 10));
            }
            controller.close();
        },
    });
}

// ============================================================================
// StreamingHelper Tests
// ============================================================================

test("StreamingHelper.streamJsonLines processes JSON chunks correctly", async () => {
    const chunks = [
        '{"id": 1, "name": "Item 1"}\n',
        '{"id": 2, "name": "Item 2"}\n{"id": 3',
        ', "name": "Item 3"}\n',
    ];

    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        body: createMockStream(chunks),
    });

    const onChunkCalls = [];
    const result = await StreamingHelper.streamJsonLines(
        "https://api.example.com/stream",
        {
            onChunk: (chunk) => onChunkCalls.push(chunk),
        }
    );

    assert.equal(result.complete, true);
    assert.equal(result.data.length, 3);
    assert.equal(result.data[0].id, 1);
    assert.equal(result.data[2].name, "Item 3");
    assert.equal(onChunkCalls.length, 3);

    globalThis.fetch = originalFetch;
});

test("StreamingHelper.streamJsonLines handles fetch errors", async () => {
    globalThis.fetch = async () => ({
        ok: false,
        status: 404,
    });

    let errorCaught = null;
    const result = await StreamingHelper.streamJsonLines(
        "https://api.example.com/stream",
        {
            onError: (e) => {
                errorCaught = e;
            },
        }
    );

    assert.equal(result.complete, false);
    assert.ok(result.error);
    assert.match(result.error.message, /status 404/);
    assert.equal(errorCaught, result.error);

    globalThis.fetch = originalFetch;
});

test("StreamingHelper.streamJsonLines aborts when timeout elapses", async () => {
    vi.useFakeTimers();

    try {
        globalThis.fetch = vi.fn((_url: string, init: RequestInit) => {
            return new Promise((_resolve, reject) => {
                init.signal?.addEventListener("abort", () => {
                    reject(new Error("ndjson timeout"));
                });
            });
        });

        let captured: Error | null = null;
        const pending = StreamingHelper.streamJsonLines(
            "https://api.example.com/stream",
            {
                timeout: 5,
                onError: (error) => {
                    captured = error;
                },
            }
        );

        await vi.advanceTimersByTimeAsync(10);
        const result = await pending;

        assert.equal(result.complete, false);
        assert.equal(result.error?.message, "ndjson timeout");
        assert.equal(captured?.message, "ndjson timeout");
    } finally {
        vi.useRealTimers();
        globalThis.fetch = originalFetch;
    }
});

test("StreamingHelper.downloadStream tracks progress", async () => {
    const data = "a".repeat(1024); // 1KB
    const chunks = [data.slice(0, 512), data.slice(512)];

    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ "content-length": "1024" }),
        body: createMockStream(chunks),
    });

    const progressUpdates = [];
    const blob = await StreamingHelper.downloadStream(
        "https://api.example.com/download",
        {
            onProgress: (p) => progressUpdates.push(p),
        }
    );

    assert.ok(blob instanceof Blob);
    assert.equal(blob.size, 1024);
    assert.ok(progressUpdates.length > 0);
    assert.equal(progressUpdates[progressUpdates.length - 1], 100);

    globalThis.fetch = originalFetch;
});

test("StreamingHelper.streamSSE sets up connection", async () => {
    // Mock EventSource
    class MockEventSource {
        constructor(url) {
            this.url = url;
            this.listeners = {};
            setTimeout(() => this.simulateEvent(), 10);
        }
        addEventListener(type, callback) {
            this.listeners[type] = callback;
        }
        simulateEvent() {
            if (this.listeners["message"]) {
                this.listeners["message"]({
                    data: JSON.stringify({ event: "hello" }),
                });
            }
        }
        close() {
            // Intentionally empty - test stub
        }
    }

    globalThis.EventSource = MockEventSource;

    const received = [];
    const stream = StreamingHelper.streamSSE("https://api.example.com/sse");
    const unsubscribe = stream.subscribe((data) => received.push(data));

    // Wait for event
    await new Promise((r) => setTimeout(r, 50));

    assert.equal(received.length, 1);
    assert.equal(received[0].event, "hello");

    unsubscribe();
    stream.close();

    delete globalThis.EventSource;
});

test("StreamingHelper.streamJsonLines handles empty body", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        body: null,
    });

    let errorCaught = null;
    const result = await StreamingHelper.streamJsonLines(
        "https://api.example.com/stream",
        {
            onError: (e) => {
                errorCaught = e;
            },
        }
    );

    assert.equal(result.complete, false);
    assert.ok(result.error);
    assert.match(result.error.message, /Response body is empty/);
    assert.equal(errorCaught, result.error);

    globalThis.fetch = originalFetch;
});

test("StreamingHelper.streamJsonLines calls onComplete and parses final buffer", async () => {
    const chunks = ['{"id":1}\n{"id":2}'];

    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        body: createMockStream(chunks),
    });

    let completed = false;
    const result = await StreamingHelper.streamJsonLines(
        "https://api.example.com/stream",
        {
            onComplete: () => {
                completed = true;
            },
        }
    );

    assert.equal(result.complete, true);
    assert.equal(result.data.length, 2);
    assert.equal(completed, true);

    globalThis.fetch = originalFetch;
});

test("StreamingHelper.streamJsonLines logs warning on invalid line", async () => {
    const originalWarn = console.warn;
    let warned = false;
    console.warn = () => {
        warned = true;
    };

    const chunks = ['{bad-json}\n{"id":1}\n'];

    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        body: createMockStream(chunks),
    });

    const result = await StreamingHelper.streamJsonLines(
        "https://api.example.com/stream"
    );
    assert.equal(result.data.length, 1);
    assert.equal(warned, true);

    console.warn = originalWarn;
    globalThis.fetch = originalFetch;
});

test("StreamingHelper.downloadStream throws on non-ok response", async () => {
    globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        headers: new Headers(),
        body: createMockStream([]),
    });

    let errorCaught = null;
    await assert.rejects(
        () =>
            StreamingHelper.downloadStream("https://api.example.com/download", {
                onError: (e) => {
                    errorCaught = e;
                },
            }),
        /status 500/
    );

    assert.ok(errorCaught);
    globalThis.fetch = originalFetch;
});

test("StreamingHelper.downloadStream calls onComplete", async () => {
    const data = "a".repeat(10);
    const chunks = [data];

    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ "content-length": "10" }),
        body: createMockStream(chunks),
    });

    let completed = false;
    const blob = await StreamingHelper.downloadStream(
        "https://api.example.com/download",
        {
            onComplete: () => {
                completed = true;
            },
        }
    );

    assert.equal(blob.size, 10);
    assert.equal(completed, true);

    globalThis.fetch = originalFetch;
});

test("StreamingHelper.downloadStream handles empty body", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ "content-length": "0" }),
        body: null,
    });

    let errorCalled = false;
    await assert.rejects(
        () =>
            StreamingHelper.downloadStream("https://api.example.com/download", {
                onError: () => {
                    errorCalled = true;
                },
            }),
        /Response body is empty/
    );

    assert.equal(errorCalled, true);
    globalThis.fetch = originalFetch;
});

test("StreamingHelper.downloadStream aborts when timeout elapses", async () => {
    vi.useFakeTimers();

    try {
        globalThis.fetch = vi.fn((_url: string, init: RequestInit) => {
            return new Promise((_resolve, reject) => {
                init.signal?.addEventListener("abort", () => {
                    reject(new Error("download timeout"));
                });
            });
        });

        let captured: Error | null = null;
        const pending = assert.rejects(
            () =>
                StreamingHelper.downloadStream(
                    "https://api.example.com/download",
                    {
                        timeout: 5,
                        onError: (error) => {
                            captured = error;
                        },
                    }
                ),
            /download timeout/
        );

        await vi.advanceTimersByTimeAsync(10);
        await pending;
        assert.equal(captured?.message, "download timeout");
    } finally {
        vi.useRealTimers();
        globalThis.fetch = originalFetch;
    }
});

test("StreamingHelper.streamSSE warns on parse error", async () => {
    class BadEventSource {
        constructor(_url) {
            this.listeners = {};
            setTimeout(() => this._emit(), 10);
        }
        addEventListener(type, callback) {
            this.listeners[type] = callback;
        }
        _emit() {
            if (this.listeners["message"]) {
                this.listeners["message"]({ data: "not-json" });
            }
        }
        close() {
            // Intentionally empty - test stub
        }
    }

    const originalWarn = console.warn;
    let warned = false;
    console.warn = () => {
        warned = true;
    };

    globalThis.EventSource = BadEventSource;

    const stream = StreamingHelper.streamSSE("https://api.example.com/sse");
    await new Promise((r) => setTimeout(r, 30));

    assert.equal(warned, true);
    stream.close();

    console.warn = originalWarn;
    delete globalThis.EventSource;
});

test("StreamingHelper.streamSSE calls onError and onComplete on error", async () => {
    class ErrorEventSource {
        constructor(_url) {
            this.listeners = {};
            setTimeout(() => this._error(), 10);
        }
        addEventListener(type, callback) {
            this.listeners[type] = callback;
        }
        _error() {
            if (this.listeners["error"]) {
                this.listeners["error"]();
            }
        }
        close() {
            // Intentionally empty - test stub
        }
    }

    globalThis.EventSource = ErrorEventSource;

    let errorCalled = false;
    let completeCalled = false;

    const stream = StreamingHelper.streamSSE("https://api.example.com/sse", {
        onError: () => {
            errorCalled = true;
        },
        onComplete: () => {
            completeCalled = true;
        },
    });

    await new Promise((r) => setTimeout(r, 30));

    assert.equal(errorCalled, true);
    assert.equal(completeCalled, true);

    stream.close();
    delete globalThis.EventSource;
});

// ============================================================================
// fetchSSE Tests — fetch-based SSE with POST, AbortSignal, multi-event, async generator
// ============================================================================

/** Build a mock ReadableStream that emits the given SSE text chunks. */
function createSSEStream(chunks: string[]) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
                await new Promise((r) => setTimeout(r, 5));
            }
            controller.close();
        },
    });
}

test("fetchSSE: basic GET with default event type ('message')", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: createSSEStream([
            'data: {"token":"hello"}\n\n',
            'data: {"token":" world"}\n\n',
        ]),
    });

    const events: SSEEvent<{ token: string }>[] = [];
    for await (const ev of StreamingHelper.fetchSSE<{ token: string }>(
        "https://api.example.com/stream"
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 2);
    assert.equal(events[0].event, "message");
    assert.deepStrictEqual(events[0].data, { token: "hello" });
    assert.deepStrictEqual(events[1].data, { token: " world" });

    globalThis.fetch = originalFetch;
});

test("fetchSSE: POST with JSON body", async () => {
    let capturedInit: any = null;

    globalThis.fetch = async (_url: string, init: any) => {
        capturedInit = init;
        return {
            ok: true,
            status: 200,
            statusText: "OK",
            body: createSSEStream(['data: {"ok":true}\n\n']),
        };
    };

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "/bff/ai/orchestrator-stream",
        {
            method: "POST",
            body: { prompt: "Explain DDD", model: "gpt-4o" },
        }
    )) {
        events.push(ev);
    }

    assert.equal(capturedInit.method, "POST");
    assert.equal(
        capturedInit.body,
        JSON.stringify({ prompt: "Explain DDD", model: "gpt-4o" })
    );
    assert.equal(capturedInit.headers["Content-Type"], "application/json");
    assert.equal(capturedInit.headers["Accept"], "text/event-stream");
    assert.equal(events.length, 1);
    assert.deepStrictEqual(events[0].data, { ok: true });

    globalThis.fetch = originalFetch;
});

test("fetchSSE: AbortSignal cancels the stream", async () => {
    const ac = new AbortController();
    let chunkCount = 0;

    globalThis.fetch = async (_url: string, init: any) => {
        return {
            ok: true,
            status: 200,
            statusText: "OK",
            body: new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    for (let i = 0; i < 100; i++) {
                        if (init.signal?.aborted) {
                            controller.close();
                            return;
                        }
                        controller.enqueue(
                            encoder.encode(`data: {"i":${i}}\n\n`)
                        );
                        await new Promise((r) => setTimeout(r, 5));
                    }
                    controller.close();
                },
            }),
        };
    };

    const events: SSEEvent[] = [];
    try {
        for await (const ev of StreamingHelper.fetchSSE(
            "https://api.example.com/stream",
            { signal: ac.signal }
        )) {
            events.push(ev);
            chunkCount++;
            if (chunkCount >= 3) {
                ac.abort();
            }
        }
    } catch (err) {
        // AbortError is expected
        assert.ok(
            err instanceof Error &&
                (err.name === "AbortError" || err.message.includes("abort")),
            "Expected AbortError"
        );
    }

    // We should have received some events but far fewer than 100
    assert.ok(events.length >= 1 && events.length < 100);

    globalThis.fetch = originalFetch;
});

test("fetchSSE: multiple event types (data, log, heartbeat)", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: createSSEStream([
            'event: data\ndata: {"token":"hi"}\n\n',
            'event: log\ndata: {"level":"info"}\n\n',
            "event: heartbeat\ndata: {}\n\n",
            'event: data\ndata: {"token":"bye"}\n\n',
        ]),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream"
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 4);
    assert.equal(events[0].event, "data");
    assert.equal(events[1].event, "log");
    assert.equal(events[2].event, "heartbeat");
    assert.equal(events[3].event, "data");

    globalThis.fetch = originalFetch;
});

test("fetchSSE: eventTypes filter restricts yielded events", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: createSSEStream([
            'event: data\ndata: {"token":"hi"}\n\n',
            'event: log\ndata: {"msg":"debug info"}\n\n',
            "event: heartbeat\ndata: {}\n\n",
            'event: data\ndata: {"token":"bye"}\n\n',
        ]),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream",
        { eventTypes: ["data"] }
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 2);
    assert.ok(events.every((e) => e.event === "data"));

    globalThis.fetch = originalFetch;
});

test("fetchSSE: parses id and retry fields", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: createSSEStream([
            'id: evt-42\nretry: 5000\nevent: update\ndata: {"v":1}\n\n',
        ]),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream"
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 1);
    assert.equal(events[0].id, "evt-42");
    assert.equal(events[0].retry, 5000);
    assert.equal(events[0].event, "update");

    globalThis.fetch = originalFetch;
});

test("fetchSSE: raw mode returns unparsed strings", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: createSSEStream(['data: {"token":"hi"}\n\n']),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream",
        { raw: true }
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 1);
    assert.equal(typeof events[0].data, "string");
    assert.equal(events[0].data, '{"token":"hi"}');

    globalThis.fetch = originalFetch;
});

test("fetchSSE: throws on non-ok response", async () => {
    globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        body: null,
    });

    await assert.rejects(async () => {
        for await (const _ev of StreamingHelper.fetchSSE(
            "https://api.example.com/stream"
        )) {
            // should not reach here
        }
    }, /status 401/);

    globalThis.fetch = originalFetch;
});

test("fetchSSE: throws on empty body", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: null,
    });

    await assert.rejects(async () => {
        for await (const _ev of StreamingHelper.fetchSSE(
            "https://api.example.com/stream"
        )) {
            // should not reach here
        }
    }, /Response body is empty/);

    globalThis.fetch = originalFetch;
});

test("fetchSSE: handles multi-line data fields", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: createSSEStream([
            "data: line one\ndata: line two\ndata: line three\n\n",
        ]),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream",
        { raw: true }
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 1);
    assert.equal(events[0].data, "line one\nline two\nline three");

    globalThis.fetch = originalFetch;
});

test("fetchSSE: skips SSE comment lines (starting with ':')", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        body: createSSEStream([
            ": this is a keep-alive comment\n",
            'data: {"ok":true}\n\n',
        ]),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream"
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 1);
    assert.deepStrictEqual(events[0].data, { ok: true });

    globalThis.fetch = originalFetch;
});

test("fetchSSE: string body is sent as-is without Content-Type override", async () => {
    let capturedInit: any = null;

    globalThis.fetch = async (_url: string, init: any) => {
        capturedInit = init;
        return {
            ok: true,
            status: 200,
            statusText: "OK",
            body: createSSEStream(["data: ok\n\n"]),
        };
    };

    for await (const _ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream",
        {
            method: "POST",
            body: "raw-body-text",
        }
    )) {
        // consume
    }

    assert.equal(capturedInit.body, "raw-body-text");
    // Should NOT have auto-set Content-Type for string bodies
    assert.equal(capturedInit.headers["Content-Type"], undefined);

    globalThis.fetch = originalFetch;
});

test("fetchSSE: strips trailing \\r from CRLF line endings (line 411)", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        // CRLF line endings: each line ends with \r\n
        body: createSSEStream(['data: {"v":1}\r\n\r\n']),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream"
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 1);
    assert.deepStrictEqual(events[0].data, { v: 1 });

    globalThis.fetch = originalFetch;
});

test("fetchSSE: handles field line with no colon (field name only, lines 422-423)", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        // 'data' with no colon — field = 'data', val = ''
        body: createSSEStream(['data\ndata: {"ok":true}\n\n']),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream",
        { raw: true }
    )) {
        events.push(ev);
    }

    // Both lines go into currentData: ['', '{"ok":true}']
    assert.equal(events.length, 1);

    globalThis.fetch = originalFetch;
});

test("fetchSSE: parses value immediately after colon with no leading space (line 430)", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        // No space after colon: 'data:{"v":2}'
        body: createSSEStream(['data:{"v":2}\n\n']),
    });

    const events: SSEEvent[] = [];
    for await (const ev of StreamingHelper.fetchSSE(
        "https://api.example.com/stream"
    )) {
        events.push(ev);
    }

    assert.equal(events.length, 1);
    assert.deepStrictEqual(events[0].data, { v: 2 });

    globalThis.fetch = originalFetch;
});

// ─── Coverage gap tests ───────────────────────────────────────────────────────

test("processRemainingBuffer warns on invalid JSON in final buffer without newline (lines 79-80)", async () => {
    // Stream ends with data that has NO trailing newline → stays in buffer until done=true
    // buffer.trim() is non-empty, JSON.parse throws → console.warn fires
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const encoder = new TextEncoder();

    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        body: new ReadableStream({
            start(controller) {
                // Invalid JSON, no newline → never processed as a line, stays in buffer
                controller.enqueue(encoder.encode("not-valid-{json}"));
                controller.close();
            },
        }),
    });

    const result = await StreamingHelper.streamJsonLines(
        "http://example.com/stream"
    );

    expect(warnSpy).toHaveBeenCalledWith(
        "Failed to parse final buffer:",
        "not-valid-{json}"
    );
    expect(result.complete).toBe(true);
    expect(result.data).toHaveLength(0);

    warnSpy.mockRestore();
    globalThis.fetch = originalFetch;
});

test("streamSSE.connect() catch: EventSource constructor throws an Error calls onError (lines 242-244)", async () => {
    class ThrowingEventSource {
        constructor(_url: string) {
            throw new Error("EventSource construction failed");
        }
        addEventListener() {}
        close() {}
    }

    // @ts-expect-error – test override
    globalThis.EventSource = ThrowingEventSource;

    let capturedError: Error | null = null;
    const stream = StreamingHelper.streamSSE("https://api.example.com/sse", {
        onError: (err) => {
            capturedError = err;
        },
    });

    // connect() is synchronous (the constructor throws synchronously)
    assert.ok(capturedError instanceof Error);
    assert.match(capturedError!.message, /EventSource construction failed/);

    stream.close();
    delete (globalThis as Record<string, unknown>).EventSource;
});

test("streamSSE.connect() catch: EventSource constructor throws non-Error wraps it (lines 242-244)", async () => {
    class ThrowingNonErrorEventSource {
        constructor(_url: string) {
            throw "plain string error from EventSource";
        }
        addEventListener() {}
        close() {}
    }

    // @ts-expect-error – test override
    globalThis.EventSource = ThrowingNonErrorEventSource;

    let capturedError: Error | null = null;
    StreamingHelper.streamSSE("https://api.example.com/sse", {
        onError: (err) => {
            capturedError = err;
        },
    });

    assert.ok(capturedError instanceof Error);
    assert.equal(capturedError!.message, "plain string error from EventSource");

    delete (globalThis as Record<string, unknown>).EventSource;
});

test("downloadStream: response without content-length header — total=0 (line 539 FALSE)", async () => {
    // No Content-Length header → contentLength is null → total = 0 (FALSE branch of ternary)
    const encoder = new TextEncoder();
    const chunks = [encoder.encode("hello")];
    let chunkIdx = 0;
    const mockReader = {
        async read() {
            if (chunkIdx < chunks.length)
                return { done: false, value: chunks[chunkIdx++]! };
            return { done: true, value: undefined };
        },
        releaseLock() {},
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null }, // No content-length header
        body: { getReader: () => mockReader },
    });

    const blob = await StreamingHelper.downloadStream(
        "https://example.com/file.bin"
    );
    assert.ok(blob instanceof Blob);
    // Cleanup
    delete (globalThis as any).fetch;
});

test("downloadStream: fetch error without onError handler — throws directly (line 566 FALSE)", async () => {
    // When the request fails and no onError is provided, onError?.() is undefined → no call
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network failure"));

    await assert.rejects(
        () => StreamingHelper.downloadStream("https://example.com/fail.bin"),
        /network failure/
    );
    delete (globalThis as any).fetch;
});

test("downloadStream: non-Error failures are wrapped before onError and rethrow", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue("raw failure");

    let captured: Error | null = null;
    await assert.rejects(
        () =>
            StreamingHelper.downloadStream("https://example.com/raw-fail.bin", {
                onError: (error) => {
                    captured = error;
                },
            }),
        /raw failure/
    );

    assert.ok(captured instanceof Error);
    assert.equal(captured?.message, "raw failure");

    delete (globalThis as any).fetch;
});

test("fetchSSE: stream ends with no pending event — flushed is null, no yield (line 378 FALSE)", async () => {
    // SSE stream: a complete event is dispatched on the blank line,
    // then stream ends with empty currentData. flushSSEEvent returns null → if (flushed) is FALSE
    const encoder = new TextEncoder();
    const chunks = [encoder.encode('data: {"msg":"hello"}\n\n')];
    let idx = 0;
    const mockReader = {
        async read() {
            if (idx < chunks.length)
                return { done: false as const, value: chunks[idx++]! };
            return { done: true as const, value: undefined };
        },
        releaseLock() {},
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        body: { getReader: () => mockReader },
    });

    const events: unknown[] = [];
    for await (const evt of StreamingHelper.fetchSSE(
        "https://api.example.com/sse"
    )) {
        events.push(evt);
    }

    // Event was dispatched when blank line was encountered, so flushed at stream-end=null
    assert.equal(events.length, 1);
    assert.deepEqual((events[0] as any).data, { msg: "hello" });

    delete (globalThis as any).fetch;
});
