import test from "node:test";
import assert from "node:assert/strict";
import { Profiler } from "../dist/utils/core/Profiler.js";

test("Profiler records duration for labeled blocks", () => {
    const profiler = new Profiler();
    profiler.start("load");
    profiler.end("load");

    const summary = profiler.summary();
    assert.ok(typeof summary.load === "number");
    assert.ok(summary.load >= 0);
});

test("Profiler ignores end calls without matching label", () => {
    const profiler = new Profiler();
    profiler.end("missing");

    const summary = profiler.summary();
    assert.deepEqual(summary, {});
});

test("Profiler uses most recent matching label", () => {
    const profiler = new Profiler();
    profiler.start("task");
    profiler.start("task");
    profiler.end("task");

    const summary = profiler.summary();
    assert.ok(typeof summary.task === "number");
});
