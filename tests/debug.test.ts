

import {
    createStopwatch,
    withTiming,
    measureSync,
    measureAsync,
    captureDebug,
} from "../src/utils/core/debug";

const createMockLogger = () => {
    const calls = [];
    const childCalls = [];
    const logger = {
        debug: (...args) => calls.push(args),
        child: (namespace) => {
            childCalls.push(namespace);
            return logger;
        },
    };
    return { logger, calls, childCalls };
};

test("createStopwatch returns elapsed time and logs on stop when autoLog is enabled", () => {
    const { logger, calls } = createMockLogger();
    const stopwatch = createStopwatch({ label: "op", logger, autoLog: true });

    const elapsedBefore = stopwatch.elapsed();
    const duration = stopwatch.stop();
    const elapsedAfter = stopwatch.elapsed();

    assert.ok(duration >= 0);
    assert.ok(elapsedAfter >= elapsedBefore);
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /op took/);
});

test("createStopwatch log includes context and returns duration", () => {
    const { logger, calls } = createMockLogger();
    const stopwatch = createStopwatch({ label: "work", logger });

    const duration = stopwatch.log({ userId: 123 });

    assert.ok(duration >= 0);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0][1], { userId: 123, duration });
});

test("withTiming returns result and logs duration", async () => {
    const { logger, calls } = createMockLogger();
    const result = await withTiming("task", () => "ok", { logger });

    assert.equal(result, "ok");
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /task took/);
});

test("measureSync returns result and logs duration", () => {
    const { logger, calls } = createMockLogger();
    const result = measureSync("sync", () => 42, { logger });

    assert.equal(result, 42);
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /sync took/);
});

test("measureAsync returns result and duration and logs with namespace", async () => {
    const { logger, calls, childCalls } = createMockLogger();
    const result = await measureAsync("async", async () => "done", {
        logger,
        namespace: "perf",
    });

    assert.equal(result.result, "done");
    assert.ok(result.durationMs >= 0);
    assert.ok(childCalls.length >= 1);
    assert.ok(childCalls.includes("perf"));
    assert.ok(calls.length >= 1);
    assert.match(String(calls[calls.length - 1][0]), /async completed/);
});

test("captureDebug returns result and duration without logger", async () => {
    const result = await captureDebug(() => "value");

    assert.equal(result.result, "value");
    assert.ok(result.durationMs >= 0);
});
