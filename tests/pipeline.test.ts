import { Pipeline, pipe, map, filter, reduce } from "../src/utils/async/pipeline";
import { ApiClient } from "../src/utils/core/ApiClient";

// ============================================================================
// US1: Compose Transformations (sync)
// ============================================================================

// T009: map — sync, order preserved, (item, index) received
test("US1 map transforms each element and preserves order", async () => {
    const indexArgs: number[] = [];
    const result = await pipe(
        map<number, string>((n, i) => {
            indexArgs.push(i);
            return String(n * 2);
        })
    ).process([1, 2, 3]);

    assert.deepEqual(result, ["2", "4", "6"]);
    assert.deepEqual(indexArgs, [0, 1, 2]);
});

// T010: filter — sync, retains matches in order; empty array → []
test("US1 filter retains matching items in original order", async () => {
    const result = await pipe(
        filter<number>((n) => n % 2 === 0)
    ).process([1, 2, 3, 4, 5]);

    assert.deepEqual(result, [2, 4]);
});

test("US1 filter on empty array returns []", async () => {
    const result = await pipe(
        filter<number>((n) => n > 0)
    ).process([]);

    assert.deepEqual(result, []);
});

// T011: reduce — sync, accumulates correctly; empty array → initial
test("US1 reduce accumulates to correct value", async () => {
    const result = await pipe(
        reduce<number, number>((acc, n) => acc + n, 0)
    ).process([1, 2, 3, 4, 5]);

    assert.equal(result, 15);
});

test("US1 reduce on empty array returns initial", async () => {
    const result = await pipe(
        reduce<number, number>((acc, n) => acc + n, 99)
    ).process([]);

    assert.equal(result, 99);
});

// T012: 3-op pipeline; Pipeline immutability
test("US1 3-op pipeline filter→map→reduce produces correct output", async () => {
    const result = await pipe(
        filter<number>((n) => n > 0),
        map<number, number>((n) => n * 2),
        reduce<number, number>((acc, n) => acc + n, 0)
    ).process([1, -2, 3, -4, 5]);

    // positives: [1, 3, 5] → doubled: [2, 6, 10] → sum: 18
    assert.equal(result, 18);
});

test("US1 Pipeline is immutable — .pipe() does not mutate original", async () => {
    const base = pipe(filter<number>((n) => n > 0));
    const extended = base.pipe(map<number, number>((n) => n * 10));

    const baseResult = await base.process([1, -2, 3]);
    const extResult = await extended.process([1, -2, 3]);

    assert.deepEqual(baseResult, [1, 3]);       // base unchanged
    assert.deepEqual(extResult, [10, 30]);       // extended works independently
});

// T013: empty Pipeline returns input unchanged
test("US1 empty Pipeline returns input unchanged", async () => {
    const p = new Pipeline<number[], number[]>([]);
    const result = await p.process([1, 2, 3]);
    assert.deepEqual(result, [1, 2, 3]);
});

// T014: escape-hatch variadic overload
test("US1 escape-hatch variadic pipe() builds and executes correctly", async () => {
    const ops = [
        filter<number>((n) => n > 0),
        map<number, number>((n) => n * 3),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = pipe<number[]>(...(ops as any[]));
    const result = await p.process([2, -1, 4]);
    assert.deepEqual(result, [6, 12]);
});

// ============================================================================
// US2: Async Support
// ============================================================================

// T015: map with async fn — order preserved, concurrent execution
test("US2 map with async fn processes all items and preserves order", async () => {
    const calls: number[] = [];

    const result = await pipe(
        map<number, number>(async (n) => {
            calls.push(n);
            await Promise.resolve(); // yield
            return n * 2;
        })
    ).process([1, 2, 3]);

    assert.deepEqual(result, [2, 4, 6]);
    assert.equal(calls.length, 3);
});

test("US2 map is concurrent — delayed items still return in order", async () => {
    const order: number[] = [];

    const result = await pipe(
        map<number, string>(async (n) => {
            // item 0 resolves last
            await new Promise<void>((res) => setTimeout(res, n === 1 ? 20 : 0));
            order.push(n);
            return String(n);
        })
    ).process([1, 2, 3]);

    // order of resolution may differ, but result order must be preserved
    assert.deepEqual(result, ["1", "2", "3"]);
    assert.equal(order.length, 3);
});

// T016: filter with async predicate — concurrent, original order in output
test("US2 filter with async predicate filters correctly", async () => {
    const calls: number[] = [];

    const result = await pipe(
        filter<number>(async (n) => {
            calls.push(n);
            await Promise.resolve();
            return n % 2 === 0;
        })
    ).process([1, 2, 3, 4]);

    assert.deepEqual(result, [2, 4]);
    assert.equal(calls.length, 4); // all items evaluated
});

// T017: reduce with async reducer — sequential
test("US2 reduce with async reducer accumulates sequentially", async () => {
    const callOrder: number[] = [];

    const result = await pipe(
        reduce<number, number>(async (acc, n, i) => {
            callOrder.push(i);
            await Promise.resolve();
            return acc + n;
        }, 0)
    ).process([10, 20, 30]);

    assert.equal(result, 60);
    assert.deepEqual(callOrder, [0, 1, 2]); // strictly sequential
});

// T018: mixed sync and async ops
test("US2 mixed sync and async ops execute correctly end-to-end", async () => {
    const result = await pipe(
        filter<number>((n) => n > 0),                          // sync
        map<number, string>(async (n) => String(n)),           // async
        reduce<string, string>(async (acc, s) => acc + s, "") // async
    ).process([1, -2, 3, -4, 5]);

    assert.equal(result, "135");
});

// T019: error propagation — map and reduce
test("US2 error in map fn rejects process() with the original error", async () => {
    const boom = new RangeError("negative not allowed");

    await assert.rejects(
        () =>
            pipe(
                map<number, number>((n) => {
                    if (n < 0) throw boom;
                    return n;
                })
            ).process([1, -1, 2]),
        (err: unknown) => err === boom
    );
});

test("US2 error in reduce fn rejects process() with the original error", async () => {
    const boom = new Error("reduce fail");

    await assert.rejects(
        () =>
            pipe(
                reduce<number, number>((acc, n) => {
                    if (n === 2) throw boom;
                    return acc + n;
                }, 0)
            ).process([1, 2, 3]),
        (err: unknown) => err === boom
    );
});

// T020: .pipe(op) builder — chains, returns new instance, original unaffected
test("US2 .pipe(op) builder chains additional op and returns new instance", async () => {
    const base = pipe(
        map<number, number>((n) => n * 2)
    );
    const chained = base.pipe(map<number, string>((n) => `${n}!`));

    assert.notStrictEqual(base, chained); // different instances

    const baseResult = await base.process([1, 2, 3]);
    const chainResult = await chained.process([1, 2, 3]);

    assert.deepEqual(baseResult, [2, 4, 6]);
    assert.deepEqual(chainResult, ["2!", "4!", "6!"]);
});

// ============================================================================
// US3: ApiClient Integration
// ============================================================================

function makeMockClient(responseBody: unknown): ApiClient {
    return new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl: async () =>
            new Response(JSON.stringify(responseBody), {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
    });
}

// T023: GET with pipeline — transforms response
test("US3 GET with pipeline transforms the response body", async () => {
    const client = makeMockClient([1, 2, 3]);

    const result = await client.get<number[]>("/items", {
        pipeline: pipe(
            map<number, string>((n) => String(n))
        ),
    });

    assert.deepEqual(result, ["1", "2", "3"]);
});

// T024: GET without pipeline — existing behaviour unchanged
test("US3 GET without pipeline returns raw response unchanged", async () => {
    const client = makeMockClient([1, 2, 3]);

    const result = await client.get<number[]>("/items");

    assert.deepEqual(result, [1, 2, 3]);
});

// T025: pipeline error propagation
test("US3 pipeline error propagates from ApiClient method", async () => {
    const client = makeMockClient([1, 2, 3]);
    const boom = new Error("pipeline failure");

    await assert.rejects(
        () =>
            client.get<number[]>("/items", {
                pipeline: {
                    process: async () => {
                        throw boom;
                    },
                },
            }),
        (err: unknown) => err === boom
    );
});
