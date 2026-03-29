/**
 * RequestQueue & RequestBatcher — usage examples
 * Feature: 004-batching-system
 *
 * Run with: npx tsx examples/request-queue-example.ts
 */
import {
    RequestQueue,
    RequestBatcher,
    QueueAbortError,
} from "bytekit/async";

// ---------------------------------------------------------------------------
// Example 1: Concurrency-limited queue
//
// Enqueue 10 requests but only allow 3 to run at a time.
// The queue handles backpressure automatically — no external coordination needed.
// ---------------------------------------------------------------------------
async function example1_concurrencyLimit() {
    console.log("\n── Example 1: Concurrency-limited queue ──");

    const queue = new RequestQueue({ concurrency: 3 });
    let inFlight = 0;
    let maxInFlight = 0;

    const fakeRequest = (id: number) =>
        queue.add(async (_signal) => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((r) => setTimeout(r, 20)); // simulate latency
            inFlight--;
            return { id, ok: true };
        });

    const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => fakeRequest(i + 1))
    );

    console.log(`Completed: ${results.length} requests`);
    console.log(`Max concurrent: ${maxInFlight} (limit was 3)`); // always ≤ 3
}

// ---------------------------------------------------------------------------
// Example 2: Priority lanes
//
// High-priority tasks (analytics critical path) jump ahead of low-priority
// tasks (background sync) when concurrency slots open.
// ---------------------------------------------------------------------------
async function example2_priorityLanes() {
    console.log("\n── Example 2: Priority lanes ──");

    const queue = new RequestQueue({ concurrency: 1 });
    const order: string[] = [];

    // Block the queue with an initial task
    let release!: () => void;
    const blocker = queue.add(
        (_s) => new Promise<void>((r) => { release = r; })
    );

    queue.add(
        async (_s) => { order.push("background-sync"); },
        { priority: "low" }
    );
    queue.add(
        async (_s) => { order.push("prefetch"); },
        { priority: "normal" }
    );
    queue.add(
        async (_s) => { order.push("critical-analytics"); },
        { priority: "high" }
    );

    release(); // open the queue
    await blocker;
    await queue.flush();

    console.log("Execution order:", order);
    // → ["critical-analytics", "prefetch", "background-sync"]
}

// ---------------------------------------------------------------------------
// Example 3: Cancellation via AbortSignal (public consumer path)
//
// Pass an AbortSignal when adding a task. If the signal fires before the task
// starts, the task is cancelled immediately with QueueAbortError.
// ---------------------------------------------------------------------------
async function example3_externalAbortSignal() {
    console.log("\n── Example 3: Cancellation via AbortSignal ──");

    const queue = new RequestQueue({ concurrency: 1 });

    // Block the queue so the second task has to wait
    let releaseBlocker!: () => void;
    queue.add((_s) => new Promise<void>((r) => { releaseBlocker = r; }));

    const controller = new AbortController();

    queue
        .add(
            async (signal) => {
                const res = await fetch("/api/data", { signal });
                return res.json();
            },
            { signal: controller.signal } // external cancellation
        )
        .catch((err) => {
            if (err instanceof QueueAbortError) {
                console.log("✓ Task cancelled before it started");
            }
        });

    // Cancel before the blocker releases
    controller.abort();
    releaseBlocker();
    await queue.flush();
}

// ---------------------------------------------------------------------------
// Example 4: Error isolation with onError callback
//
// Individual task failures never block the queue. onError is called with the
// error and task ID so you can log, track, or retry.
// ---------------------------------------------------------------------------
async function example4_errorIsolation() {
    console.log("\n── Example 4: Error isolation ──");

    const failures: { id: string; error: Error }[] = [];
    const queue = new RequestQueue({
        concurrency: 2,
        onError: (error, id) => failures.push({ id, error }),
    });

    await Promise.allSettled([
        queue.add(async (_s) => { throw new Error("Network timeout"); }),
        queue.add(async (_s) => "result-1"),
        queue.add(async (_s) => "result-2"),
        queue.add(async (_s) => { throw new Error("Not found"); }),
    ]);

    console.log(`Failures captured: ${failures.length}`); // 2
    console.log(`Queue continued processing all tasks ✓`);
}

// ---------------------------------------------------------------------------
// Example 5: RequestBatcher — time-window deduplication
//
// Five concurrent GET requests to the same endpoint within 50ms collapse into
// a single network call. All callers receive the same response.
// ---------------------------------------------------------------------------
async function example5_requestBatcher() {
    console.log("\n── Example 5: RequestBatcher deduplication ──");

    const batcher = new RequestBatcher({ windowMs: 50 });
    let networkCalls = 0;

    const mockFetch = async (url: string, init: RequestInit) => {
        networkCalls++;
        // Simulate a real API response
        return { url, method: init.method, data: [1, 2, 3] };
    };

    // Five callers request the same resource simultaneously
    const results = await Promise.all([
        batcher.add("/api/users", { method: "GET" }, mockFetch),
        batcher.add("/api/users", { method: "GET" }, mockFetch),
        batcher.add("/api/users", { method: "GET" }, mockFetch),
        batcher.add("/api/users", { method: "GET" }, mockFetch),
        batcher.add("/api/users", { method: "GET" }, mockFetch),
    ]);

    // Window must elapse for the batch to fire — simulate via flush()
    await batcher.flush();

    console.log(`Network calls made: ${networkCalls} (should be 1)`);
    console.log(`All callers got same data: ${results.every((r) => r.data.length === 3)} ✓`);
}

// ---------------------------------------------------------------------------
// Example 6: maxSize early flush
//
// Force the batch to dispatch as soon as 3 requests accumulate, regardless of
// the time window.
// ---------------------------------------------------------------------------
async function example6_maxSizeFlush() {
    console.log("\n── Example 6: maxSize early flush ──");

    let batchDispatches = 0;
    const batcher = new RequestBatcher({ windowMs: 10_000, maxSize: 3 });

    const fetcher = async (url: string, init: RequestInit) => {
        batchDispatches++;
        return { url, status: 200, method: init.method };
    };

    // Adding a 3rd request triggers immediate dispatch (window is 10s, doesn't wait)
    const results = await Promise.all([
        batcher.add("/api/items", { method: "GET" }, fetcher),
        batcher.add("/api/items", { method: "GET" }, fetcher),
        batcher.add("/api/items", { method: "GET" }, fetcher), // triggers flush
    ]);

    console.log(`Dispatches: ${batchDispatches} (early flush, not waiting 10s) ✓`);
    console.log(`Results: ${results.length} responses received`);
}

// ---------------------------------------------------------------------------
// Example 7: Queue + Batcher with ApiClient (transparent integration)
// ---------------------------------------------------------------------------
async function example7_apiClientIntegration() {
    console.log("\n── Example 7: ApiClient transparent integration ──");

    // Inline import to avoid top-level dependency on ApiClient in the example
    const { ApiClient } = await import("bytekit");

    // Queue limits concurrency across all client.get() calls
    const queuedClient = new ApiClient({
        baseUrl: "https://api.example.com",
        queue: { concurrency: 5 },
    });

    // Batcher deduplicates same-URL GET calls within 100ms windows
    const batchedClient = new ApiClient({
        baseUrl: "https://api.example.com",
        batch: { windowMs: 100 },
    });

    console.log("queuedClient ready — max 5 concurrent requests ✓");
    console.log("batchedClient ready — same-URL requests deduplicated ✓");

    void queuedClient;
    void batchedClient;
}

// ---------------------------------------------------------------------------
// Run all examples
// ---------------------------------------------------------------------------
(async () => {
    await example1_concurrencyLimit();
    await example2_priorityLanes();
    await example3_externalAbortSignal();
    await example4_errorIsolation();
    await example5_requestBatcher();
    await example6_maxSizeFlush();
    await example7_apiClientIntegration();
    console.log("\n✅ All examples completed.");
})();
