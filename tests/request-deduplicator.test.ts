import { RequestDeduplicator } from "../src/index";

test("RequestDeduplicator executes request once for multiple calls", async () => {
    const dedup = new RequestDeduplicator();
    let callCount = 0;

    const fn = async () => {
        callCount++;
        return { id: 1 };
    };

    const [result1, result2] = await Promise.all([
        dedup.execute("/users/1", fn),
        dedup.execute("/users/1", fn),
    ]);

    assert.equal(callCount, 1);
    assert.deepEqual(result1, { id: 1 });
    assert.deepEqual(result2, { id: 1 });
});

test("RequestDeduplicator executes different requests separately", async () => {
    const dedup = new RequestDeduplicator();
    let callCount = 0;

    const fn = async () => {
        callCount++;
        return { id: callCount };
    };

    const [result1, result2] = await Promise.all([
        dedup.execute("/users/1", fn),
        dedup.execute("/users/2", fn),
    ]);

    assert.equal(callCount, 2);
    assert.deepEqual(result1, { id: 1 });
    assert.deepEqual(result2, { id: 2 });
});

test("RequestDeduplicator shares errors", async () => {
    const dedup = new RequestDeduplicator();
    let callCount = 0;

    const fn = async () => {
        callCount++;
        throw new Error("Request failed");
    };

    const promises = [
        dedup.execute("/users/1", fn),
        dedup.execute("/users/1", fn),
    ];

    await Promise.all(
        promises.map((p) =>
            p.catch((e) => {
                assert.equal(e.message, "Request failed");
            })
        )
    );

    assert.equal(callCount, 1);
});

test("RequestDeduplicator tracks statistics", async () => {
    const dedup = new RequestDeduplicator();

    const fn = async () => ({ id: 1 });

    await Promise.all([
        dedup.execute("/users/1", fn),
        dedup.execute("/users/1", fn),
        dedup.execute("/users/2", fn),
    ]);

    const stats = dedup.getStats();
    assert.equal(stats.total, 3);
    assert.equal(stats.deduplicated, 1);
    assert.equal(stats.deduplicationRate, 1 / 3);
});

test("RequestDeduplicator clears in-flight requests", async () => {
    const dedup = new RequestDeduplicator();

    const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { id: 1 };
    };

    const promise = dedup.execute("/users/1", fn);
    assert.equal(dedup.getInFlightCount(), 1);

    await promise;
    assert.equal(dedup.getInFlightCount(), 0);
});

test("RequestDeduplicator supports custom key generator", async () => {
    const dedup = new RequestDeduplicator({
        keyGenerator: (url, _options) => url,
    });

    let callCount = 0;
    const fn = async () => {
        callCount++;
        return { id: callCount };
    };

    const [result1, result2] = await Promise.all([
        dedup.execute("/users", fn, { page: 1 }),
        dedup.execute("/users", fn, { page: 2 }),
    ]);

    assert.equal(callCount, 1);
    assert.deepEqual(result1, { id: 1 });
    assert.deepEqual(result2, { id: 1 });
});

test("RequestDeduplicator can reset statistics", async () => {
    const dedup = new RequestDeduplicator();

    const fn = async () => ({ id: 1 });

    await Promise.all([
        dedup.execute("/users/1", fn),
        dedup.execute("/users/1", fn),
    ]);

    let stats = dedup.getStats();
    assert.equal(stats.deduplicated, 1);

    dedup.resetStats();
    stats = dedup.getStats();
    assert.equal(stats.deduplicated, 0);
    assert.equal(stats.total, 0);
});

test("RequestDeduplicator clear resets in-flight and stats", async () => {
    const dedup = new RequestDeduplicator();

    const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { id: 1 };
    };

    const promise = dedup.execute("/users/1", fn);
    assert.equal(dedup.getInFlightCount(), 1);

    dedup.clear();
    assert.equal(dedup.getInFlightCount(), 0);
    assert.equal(dedup.getStats().total, 0);

    await promise;
});

test("RequestDeduplicator default key generator sorts options", async () => {
    const dedup = new RequestDeduplicator();
    let callCount = 0;

    const fn = async () => {
        callCount++;
        return { ok: true };
    };

    const [result1, result2] = await Promise.all([
        dedup.execute("/users", fn, { b: 2, a: 1 }),
        dedup.execute("/users", fn, { a: 1, b: 2 }),
    ]);

    assert.equal(callCount, 1);
    assert.deepEqual(result1, { ok: true });
    assert.deepEqual(result2, { ok: true });
});
