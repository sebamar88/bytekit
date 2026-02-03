import test from "node:test";
import assert from "node:assert/strict";
import { TimeUtils } from "../dist/utils/helpers/TimeUtils.js";

// ============================================================================
// TimeUtils Tests
// ============================================================================

test("TimeUtils.debounce logic", async () => {
    let calls = 0;
    const debounced = TimeUtils.debounce(() => {
        calls++;
    }, 50);

    debounced();
    debounced();
    debounced();

    assert.equal(calls, 0);
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(calls, 1);
});

test("TimeUtils.debounce with maxWait", async () => {
    let calls = 0;
    const debounced = TimeUtils.debounce(
        () => {
            calls++;
        },
        100,
        { maxWait: 150 }
    );

    debounced();
    setTimeout(debounced, 40);
    setTimeout(debounced, 80);
    setTimeout(debounced, 120);

    await new Promise((r) => setTimeout(r, 160));
    assert.ok(calls >= 1); // maxWait should have triggered
});

test("TimeUtils.throttle logic", async () => {
    let calls = 0;
    const throttled = TimeUtils.throttle(() => {
        calls++;
    }, 50);

    throttled(); // Immediate (leading: true)
    throttled();
    throttled();

    assert.equal(calls, 1);
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(calls, 2); // Trailing call
});

test("TimeUtils.debounce leading only", async () => {
    let calls = 0;
    const debounced = TimeUtils.debounce(
        () => {
            calls++;
        },
        50,
        { leading: true, trailing: false }
    );

    debounced();
    debounced();
    await new Promise((r) => setTimeout(r, 60));

    assert.equal(calls, 0);
});

test("TimeUtils.throttle with leading false", async () => {
    let calls = 0;
    const throttled = TimeUtils.throttle(
        () => {
            calls++;
        },
        50,
        { leading: false }
    );

    throttled();
    throttled();
    assert.equal(calls, 0);

    await new Promise((r) => setTimeout(r, 60));
    throttled();
    assert.equal(calls, 1);
});

test("TimeUtils.throttle with trailing false", async () => {
    let calls = 0;
    const throttled = TimeUtils.throttle(
        () => {
            calls++;
        },
        50,
        { trailing: false }
    );

    throttled();
    throttled();
    await new Promise((r) => setTimeout(r, 60));

    assert.equal(calls, 1);
});

test("TimeUtils race/all/allSettled helpers", async () => {
    const fast = Promise.resolve("fast");
    const slow = new Promise((resolve) =>
        setTimeout(() => resolve("slow"), 20)
    );

    const race = await TimeUtils.race([slow, fast]);
    assert.equal(race, "fast");

    const all = await TimeUtils.all([Promise.resolve(1), Promise.resolve(2)]);
    assert.deepEqual(all, [1, 2]);

    const settled = await TimeUtils.allSettled([
        Promise.resolve(1),
        Promise.reject(new Error("fail")),
    ]);
    assert.equal(settled.length, 2);
});

test("TimeUtils.sleep and delay", async () => {
    const start = Date.now();
    await TimeUtils.sleep(50);
    const duration = Date.now() - start;
    assert.ok(duration >= 45);

    const res = await TimeUtils.delay(() => "done", 10);
    assert.equal(res, "done");
});

test("TimeUtils.timeout", async () => {
    const p = new Promise((r) => setTimeout(() => r("ok"), 100));
    await assert.rejects(() => TimeUtils.timeout(p, 20), /Operation timed out/);

    const p2 = new Promise((r) => setTimeout(() => r("ok"), 20));
    const res = await TimeUtils.timeout(p2, 100);
    assert.equal(res, "ok");
});

test("TimeUtils.retryAsync backoff logic", async () => {
    let attempts = 0;
    const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return "success";
    };

    const result = await TimeUtils.retryAsync(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
    });

    assert.equal(result, "success");
    assert.equal(attempts, 3);
});

test("TimeUtils.createQueue concurrency", async () => {
    const queue = TimeUtils.createQueue(2);
    let active = 0;
    let maxActive = 0;

    const task = async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 20));
        active--;
    };

    await Promise.all([
        queue.add(task),
        queue.add(task),
        queue.add(task),
        queue.add(task),
    ]);

    assert.equal(maxActive, 2);
});

test("TimeUtils measure helpers", async () => {
    const resSync = TimeUtils.measureSync(() => "done");
    assert.equal(resSync.result, "done");
    assert.ok(resSync.durationMs >= 0);

    const resAsync = await TimeUtils.measureAsync(async () => {
        await TimeUtils.sleep(10);
        return "done";
    });
    assert.equal(resAsync.result, "done");
    assert.ok(resAsync.durationMs >= 0);
});

test("TimeUtils duration format and parse", () => {
    assert.equal(TimeUtils.formatDuration(500), "500ms");
    assert.equal(TimeUtils.formatDuration(1500), "1.50s");
    assert.equal(TimeUtils.formatDuration(90000), "1.50m");

    assert.equal(TimeUtils.parseDuration("1s"), 1000);
    assert.equal(TimeUtils.parseDuration("1m"), 60000);
    assert.equal(TimeUtils.parseDuration("1h"), 3600000);
    assert.equal(TimeUtils.parseDuration("1 d"), 86400000);
});
