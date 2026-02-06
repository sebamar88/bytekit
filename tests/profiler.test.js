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

test("Profiler supports namespace isolation", () => {
    const profilerA = new Profiler("A");
    const profilerB = new Profiler("B");
    profilerA.start("foo");
    profilerA.end("foo");
    profilerB.start("bar");
    profilerB.end("bar");

    const summaryA = profilerA.summary();
    const summaryB = profilerB.summary();
    assert.ok(summaryA.A && typeof summaryA.A.foo === "number");
    assert.ok(summaryB.B && typeof summaryB.B.bar === "number");
    // Los resultados no deben mezclarse
    assert.ok(!summaryA.B);
    assert.ok(!summaryB.A);
});

test("Profiler with namespace stores multiple measurements", () => {
    const profiler = new Profiler("metrics");
    profiler.start("task1");
    profiler.end("task1");
    profiler.start("task2");
    profiler.end("task2");

    const summary = profiler.summary();
    assert.ok(summary.metrics);
    assert.ok(typeof summary.metrics.task1 === "number");
    assert.ok(typeof summary.metrics.task2 === "number");
    assert.equal(Object.keys(summary.metrics).length, 2);
});

test("Profiler without namespace returns flat results", () => {
    const profiler = new Profiler();
    profiler.start("operation");
    profiler.end("operation");

    const summary = profiler.summary();
    assert.ok(typeof summary.operation === "number");
    assert.ok(!summary._default); // No debe exponer la clave interna
});

test("Profiler with namespace handles nested operations", () => {
    const profiler = new Profiler("nested");
    profiler.start("outer");
    profiler.start("inner");
    profiler.end("inner");
    profiler.end("outer");

    const summary = profiler.summary();
    assert.ok(summary.nested.outer >= summary.nested.inner);
});
