import test from "node:test";
import assert from "node:assert/strict";
import { StreamingHelper } from "../dist/utils/helpers/StreamingHelper.js";

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
                await new Promise(r => setTimeout(r, 10));
            }
            controller.close();
        }
    });
}

// ============================================================================
// StreamingHelper Tests
// ============================================================================

test("StreamingHelper.streamJsonLines processes JSON chunks correctly", async () => {
    const chunks = [
        '{"id": 1, "name": "Item 1"}\n',
        '{"id": 2, "name": "Item 2"}\n{"id": 3',
        ', "name": "Item 3"}\n'
    ];
    
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        body: createMockStream(chunks)
    });
    
    const onChunkCalls = [];
    const result = await StreamingHelper.streamJsonLines("https://api.example.com/stream", {
        onChunk: (chunk) => onChunkCalls.push(chunk)
    });
    
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
        status: 404
    });
    
    let errorCaught = null;
    const result = await StreamingHelper.streamJsonLines("https://api.example.com/stream", {
        onError: (e) => { errorCaught = e; }
    });
    
    assert.equal(result.complete, false);
    assert.ok(result.error);
    assert.match(result.error.message, /status 404/);
    assert.equal(errorCaught, result.error);
    
    globalThis.fetch = originalFetch;
});

test("StreamingHelper.downloadStream tracks progress", async () => {
    const data = "a".repeat(1024); // 1KB
    const chunks = [data.slice(0, 512), data.slice(512)];
    
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ "content-length": "1024" }),
        body: createMockStream(chunks)
    });
    
    const progressUpdates = [];
    const blob = await StreamingHelper.downloadStream("https://api.example.com/download", {
        onProgress: (p) => progressUpdates.push(p)
    });
    
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
            if (this.listeners['message']) {
                this.listeners['message']({ data: JSON.stringify({ event: "hello" }) });
            }
        }
        close() {}
    }
    
    globalThis.EventSource = MockEventSource;
    
    const received = [];
    const stream = StreamingHelper.streamSSE("https://api.example.com/sse");
    const unsubscribe = stream.subscribe((data) => received.push(data));
    
    // Wait for event
    await new Promise(r => setTimeout(r, 50));
    
    assert.equal(received.length, 1);
    assert.equal(received[0].event, "hello");
    
    unsubscribe();
    stream.close();
    
    delete globalThis.EventSource;
});
