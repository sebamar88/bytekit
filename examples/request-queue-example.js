/**
 * RequestQueue & RequestBatcher — JavaScript (CJS/ESM) usage examples
 * Feature: 004-batching-system
 *
 * ESM: run with  node examples/request-queue-example.js
 * CJS: change the imports to require("bytekit/async")
 */

// ESM imports (Node.js 18+ with "type":"module")
import { RequestQueue, RequestBatcher, QueueAbortError } from "bytekit/async";

// ── CommonJS equivalent ──
// const { RequestQueue, RequestBatcher, QueueAbortError } = require("bytekit/async");

// ---------------------------------------------------------------------------
// Example 1: Concurrency-limited queue
// ---------------------------------------------------------------------------
async function example1_concurrencyLimit() {
    const queue = new RequestQueue({ concurrency: 3 });

    const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
            queue.add(() => Promise.resolve({ id: i + 1, status: "done" }))
        )
    );

    console.log(`Processed ${results.length} items with max 3 concurrent`);
}

// ---------------------------------------------------------------------------
// Example 2: Priority lanes (high → normal → low)
// ---------------------------------------------------------------------------
async function example2_priorityLanes() {
    const queue = new RequestQueue({ concurrency: 1 });
    const order = [];

    let release;
    const blocker = queue.add(() => new Promise((r) => { release = r; }));

    queue.add(() => Promise.resolve(order.push("low")), { priority: "low" });
    queue.add(() => Promise.resolve(order.push("normal")), { priority: "normal" });
    queue.add(() => Promise.resolve(order.push("high")), { priority: "high" });

    release();
    await blocker;
    await queue.flush();

    console.log("Priority order:", order); // → ["high", "normal", "low"]
}

// ---------------------------------------------------------------------------
// Example 3: Cancellation via AbortSignal
// ---------------------------------------------------------------------------
async function example3_cancellation() {
    const queue = new RequestQueue({ concurrency: 1 });
    let release;
    queue.add(() => new Promise((r) => { release = r; })); // blocker

    const controller = new AbortController();
    const cancelledPromise = queue
        .add(() => fetch("/api/data"), { signal: controller.signal })
        .catch((err) => {
            if (err instanceof QueueAbortError) {
                console.log("Request cancelled before it started");
            }
        });

    controller.abort(); // cancel before blocker releases
    release();
    await cancelledPromise;
}

// ---------------------------------------------------------------------------
// Example 4: RequestBatcher — deduplication
// ---------------------------------------------------------------------------
async function example4_batcher() {
    const batcher = new RequestBatcher({ windowMs: 50, maxSize: 10 });
    let calls = 0;

    const fetcher = () => {
        calls++;
        return Promise.resolve({ data: [1, 2, 3] });
    };

    const results = await Promise.all([
        batcher.add("/api/items", { method: "GET" }, fetcher),
        batcher.add("/api/items", { method: "GET" }, fetcher),
        batcher.add("/api/items", { method: "GET" }, fetcher),
    ]);

    await batcher.flush();
    console.log(`Fetcher calls: ${calls} (expected 1)`);
    console.log(`All ${results.length} callers received same data`);
}

// ---------------------------------------------------------------------------
// Run all examples
// ---------------------------------------------------------------------------
await example1_concurrencyLimit();
await example2_priorityLanes();
await example3_cancellation();
await example4_batcher();

console.log("✅ JS examples done.");
