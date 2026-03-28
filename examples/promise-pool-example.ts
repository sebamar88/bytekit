import { PromisePool, PoolTimeoutError } from "bytekit/async";

// ---------------------------------------------------------------------------
// Example 1: Concurrency-limited batch processing
//
// Process a large batch of items with at most 3 concurrent operations.
// Results are returned in the same order as the input array.
// ---------------------------------------------------------------------------
async function example1_concurrencyLimit() {
    const ids = Array.from({ length: 10 }, (_, i) => i + 1);
    const pool = new PromisePool({ concurrency: 3 });

    const results = await pool.run(
        ids.map((id) => async () => {
            // Simulate variable-length work
            await new Promise((r) => setTimeout(r, Math.random() * 100));
            return { id, status: "done" };
        })
    );

    console.log("Processed:", results);
    // → [{ id: 1, status: "done" }, { id: 2, status: "done" }, ...]
}

// ---------------------------------------------------------------------------
// Example 2: Per-task timeouts with graceful error handling
//
// Each task gets its own independent timeout. When a task times out or throws,
// `onError` is called and the pool continues running the remaining tasks.
// ---------------------------------------------------------------------------
async function example2_timeoutAndOnError() {
    const endpoints = [
        "https://jsonplaceholder.typicode.com/todos/1",
        "https://jsonplaceholder.typicode.com/todos/2",
        "https://jsonplaceholder.typicode.com/todos/3",
    ];

    const errors: Array<{ index: number; message: string }> = [];

    const pool = new PromisePool({
        concurrency: 2,
        timeout: 5000, // 5s per task
        onError(error, taskIndex) {
            if (error instanceof PoolTimeoutError) {
                errors.push({ index: taskIndex, message: `Timed out: ${error.message}` });
            } else {
                errors.push({ index: taskIndex, message: error.message });
            }
        },
    });

    const results = await pool.run(
        endpoints.map((url) => () => fetch(url).then((r) => r.json()))
    );

    console.log("Results:", results);
    if (errors.length > 0) {
        console.warn("Errors encountered:", errors);
    }
}

// ---------------------------------------------------------------------------
// Example 3: Pool reuse across multiple batches
//
// PromisePool is stateful and can be reused. The concurrency limit applies
// per `run()` call — useful when tasks arrive in chunks.
// ---------------------------------------------------------------------------
async function example3_poolReuse() {
    const pool = new PromisePool({ concurrency: 5 });

    async function fetchItem(id: number) {
        const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`);
        return res.json() as Promise<{ id: number; title: string }>;
    }

    // First batch
    const batch1 = await pool.run([1, 2, 3].map((id) => () => fetchItem(id)));

    // Pool is fully reusable — second batch starts fresh
    const batch2 = await pool.run([4, 5, 6].map((id) => () => fetchItem(id)));

    console.log("All items:", [...batch1, ...batch2]);
}

// ---------------------------------------------------------------------------
// Example 4: ApiClient integration (pool option)
//
// When `pool` is set in ApiClientConfig, every `request()` call is
// automatically routed through the pool, limiting concurrent HTTP calls.
// ---------------------------------------------------------------------------
async function example4_apiClientIntegration() {
    // Uncomment after importing ApiClient:
    //
    // import { ApiClient } from "bytekit";
    //
    // const api = new ApiClient({
    //   baseUrl: "https://api.example.com",
    //   pool: { concurrency: 2, timeout: 5000 },
    // });
    //
    // // Up to 2 of these requests run at a time, even though we fire all 4
    // const [users, posts, comments, tags] = await Promise.all([
    //   api.request<User[]>("/users"),
    //   api.request<Post[]>("/posts"),
    //   api.request<Comment[]>("/comments"),
    //   api.request<Tag[]>("/tags"),
    // ]);

    console.log("ApiClient + PromisePool: see comment above for usage.");
}

// ---------------------------------------------------------------------------
// Example 5: PromisePool vs parallel() — when to use each
//
// Use `parallel()` for one-shot lists.
// Use `PromisePool` when you need reuse, per-task timeouts, or onError hooks.
// ---------------------------------------------------------------------------
async function example5_vsParallel() {
    // parallel() — simple, functional, one-shot:
    // const results = await parallel(tasks, { concurrency: 3 });

    // PromisePool — class-based, reusable, richer options:
    const pool = new PromisePool({
        concurrency: 3,
        timeout: 2000,
        onError: (err, idx) => console.warn(`Task ${idx} failed:`, err.message),
    });

    const tasks = [1, 2, 3, 4, 5].map((n) => async () => n * 2);
    const results = await pool.run(tasks);
    console.log("PromisePool results:", results); // [2, 4, 6, 8, 10]

    // Pool is ready to run another batch immediately
    const moreResults = await pool.run([6, 7, 8].map((n) => async () => n * 2));
    console.log("Second batch:", moreResults); // [12, 14, 16]
}

// ---------------------------------------------------------------------------
// Run all examples
// ---------------------------------------------------------------------------
(async () => {
    console.log("=== Example 1: Concurrency Limit ===");
    await example1_concurrencyLimit();

    console.log("\n=== Example 2: Timeout + onError ===");
    await example2_timeoutAndOnError();

    console.log("\n=== Example 3: Pool Reuse ===");
    await example3_poolReuse();

    console.log("\n=== Example 4: ApiClient Integration ===");
    await example4_apiClientIntegration();

    console.log("\n=== Example 5: PromisePool vs parallel() ===");
    await example5_vsParallel();
})().catch(console.error);
