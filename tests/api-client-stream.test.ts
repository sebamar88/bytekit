import { ApiClient } from "../src/index";
import { SSEEvent } from "../src/utils/helpers/StreamingHelper";

// Mock helper for stream response
const sseResponse = (events: string[], init = {}) => {
    const stream = new ReadableStream({
        async start(controller) {
            for (const event of events) {
                controller.enqueue(new TextEncoder().encode(event));
                // Give a chance for the async loop to catch the event and abort
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        status: 200,
        ...init,
        headers: {
            "content-type": "text/event-stream",
            ...init.headers,
        },
    });
};

test("ApiClient.stream() - handles basic GET stream", async () => {
    let capturedUrl = "";
    const fetchImpl = async (url) => {
        capturedUrl = url;
        return sseResponse([
            "data: {\"msg\": \"hello\"}\n\n",
            "event: update\ndata: {\"val\": 42}\n\n"
        ]);
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });

    const events: SSEEvent[] = [];
    for await (const event of client.stream("/events")) {
        events.push(event);
    }

    assert.equal(events.length, 2);
    assert.deepEqual(events[0], { event: "message", data: { msg: "hello" } });
    assert.deepEqual(events[1], { event: "update", data: { val: 42 } });
    assert.equal(capturedUrl, "https://api.example.com/events");
});

test("ApiClient.stream() - handles POST with body and authorization", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    
    const fetchImpl = async (url, init) => {
        capturedUrl = url;
        capturedInit = init;
        return sseResponse(["data: \"ok\"\n\n"]);
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        interceptors: {
            request: (url, init) => {
                const headers = new Headers(init.headers);
                headers.set("Authorization", "Bearer token123");
                return [url, { ...init, headers: Object.fromEntries(headers.entries()) }];
            }
        }
    });

    const body = { filter: "active" };
    const gen = client.stream("/search", {
        method: "POST",
        body
    });

    const event = (await gen.next()).value;
    assert.equal(event?.data, "ok");

    assert.equal(capturedInit?.method, "POST");
    assert.equal(capturedInit?.body, JSON.stringify(body));
    const headers = new Headers(capturedInit?.headers);
    assert.equal(headers.get("Authorization"), "Bearer token123");
    assert.equal(headers.get("Accept"), "text/event-stream");
    assert.equal(headers.get("Content-Type"), "application/json");
});

test("ApiClient.stream() - supports AbortController cancellation", async () => {
    const controller = new AbortController();
    
    const fetchImpl = async (url, init) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode("data: \"first\"\n\n"));
                controller.enqueue(new TextEncoder().encode("data: \"second\"\n\n"));
                controller.close();
            },
        });
        return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
    });

    const events: any[] = [];
    const stream = client.stream("/events", { signal: controller.signal });

    for await (const event of stream) {
        events.push(event);
        if (event.data === "first") {
            controller.abort();
            break; // Stop consuming
        }
    }

    assert.equal(events.length, 1);
    assert.equal(events[0].data, "first");
});

test("ApiClient.stream() - signature normalization (direct body)", async () => {
    let capturedInit: RequestInit | undefined;
    const fetchImpl = async (_url, init) => {
        capturedInit = init;
        return sseResponse(["data: \"ok\"\n\n"]);
    };

    const client = new ApiClient({ baseUrl: "https://api.example.com", fetchImpl });
    
    // Direct body instead of { body: ... }
    const body = { foo: "bar" };
    const gen = client.stream("/events", body);
    await gen.next();

    // Should be treated as POST with the object as body
    assert.equal(capturedInit?.method, "POST");
    assert.equal(capturedInit?.body, JSON.stringify(body));
});

test("ApiClient.streamJsonLines() - handles NDJSON stream with auth", async () => {
    let capturedInit: RequestInit | undefined;
    const fetchImpl = async (_url, init) => {
        capturedInit = init;
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode("{\"id\": 1}\n{\"id\": 2}\n"));
                controller.close();
            },
        });
        return new Response(stream, { status: 200, headers: { "content-type": "application/x-ndjson" } });
    };

    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        defaultHeaders: { Authorization: "Bearer secret" }
    });

    const items = [];
    for await (const item of client.streamJsonLines("/export")) {
        items.push(item);
    }

    assert.equal(items.length, 2);
    assert.deepEqual(items[0], { id: 1 });
    assert.deepEqual(items[1], { id: 2 });
    assert.equal(new Headers(capturedInit?.headers).get("Authorization"), "Bearer secret");
    assert.equal(new Headers(capturedInit?.headers).get("Accept"), "application/x-ndjson");
});

test("ApiClient.stream() - cleanups timeout controller", async () => {
    const fetchImpl = async () => sseResponse(["data: \"hi\"\n\n"]);
    const client = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        timeoutMs: 100 // short timeout
    });

    const events = [];
    for await (const event of client.stream("/events")) {
        events.push(event);
    }
    assert.equal(events.length, 1);
    // No error should be thrown after finishing even with a short timeout
});
