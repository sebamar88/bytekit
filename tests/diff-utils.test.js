import test from "node:test";
import assert from "node:assert/strict";
import { DiffUtils } from "../dist/utils/helpers/DiffUtils.js";

// ============================================================================
// DiffUtils Tests
// ============================================================================

test("DiffUtils.deepEqual compares various types", () => {
    assert.equal(DiffUtils.deepEqual(1, 1), true);
    assert.equal(DiffUtils.deepEqual(1, "1"), false);
    assert.equal(DiffUtils.deepEqual(true, true), true);
    assert.equal(DiffUtils.deepEqual(null, null), true);
    assert.equal(DiffUtils.deepEqual(undefined, null), false);

    assert.equal(DiffUtils.deepEqual({ a: 1 }, { a: 1 }), true);
    assert.equal(DiffUtils.deepEqual({ a: 1 }, { a: 2 }), false);
    assert.equal(DiffUtils.deepEqual({ a: 1 }, { b: 1 }), false);
    assert.equal(DiffUtils.deepEqual({ a: 1, b: 2 }, { a: 1 }), false);
});

test("DiffUtils.diff detects added, removed and changed keys", () => {
    const oldObj = { a: 1, b: 2, c: 3 };
    const newObj = { a: 1, b: 20, d: 4 };

    const result = DiffUtils.diff(oldObj, newObj);
    assert.deepEqual(result.changed, ["b"]);
    assert.deepEqual(result.added, ["d"]);
    assert.deepEqual(result.removed, ["c"]);
});

test("DiffUtils.createPatch and applyPatch", () => {
    const oldObj = { name: "John", age: 30 };
    const newObj = { name: "John", age: 31, city: "NY" };

    const patches = DiffUtils.createPatch(oldObj, newObj);
    assert.equal(patches.length, 2);

    const result = DiffUtils.applyPatch(oldObj, patches);
    assert.deepEqual(result, newObj);
});

test("DiffUtils.reversePatch undoes changes", () => {
    const oldObj = { a: 1 };
    const newObj = { a: 2, b: 3 };

    const patches = DiffUtils.createPatch(oldObj, newObj);
    const reversePatches = DiffUtils.reversePatch(patches);

    const applied = DiffUtils.applyPatch(oldObj, patches);
    const reversed = DiffUtils.applyPatch(applied, reversePatches);

    assert.deepEqual(reversed, oldObj);
});

test("DiffUtils.deepDiff handles nested objects", () => {
    const oldObj = { user: { name: "John", settings: { theme: "dark" } } };
    const newObj = {
        user: { name: "John", settings: { theme: "light" } },
        other: 1,
    };

    const result = DiffUtils.deepDiff(oldObj, newObj);
    assert.deepEqual(result.changed, ["user.settings.theme"]);
    assert.deepEqual(result.added, ["other"]);
});

test("DiffUtils.deepDiff handles non-object values at root", () => {
    const result = DiffUtils.deepDiff(1, 2);
    assert.deepEqual(result.changed, ["root"]);
});

test("DiffUtils.merge with different strategies", () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { b: { c: 3, d: 4 }, e: 5 };

    assert.deepEqual(DiffUtils.merge(obj1, obj2, "first"), obj1);
    assert.deepEqual(DiffUtils.merge(obj1, obj2, "second"), obj2);

    const merged = DiffUtils.merge(obj1, obj2, "merge");
    assert.equal(merged.a, 1);
    assert.equal(merged.e, 5);
    // @ts-expect-error - merged.b is unknown
    assert.equal(merged.b.c, 3);
    // @ts-expect-error - merged.b is unknown
    assert.equal(merged.b.d, 4);
});

test("DiffUtils.getSummary returns human readable summary", () => {
    const diff = { changed: ["a", "b"], added: ["c"], removed: [] };
    assert.equal(DiffUtils.getSummary(diff), "2 changed, 1 added");

    assert.equal(
        DiffUtils.getSummary({ changed: [], added: [], removed: [] }),
        "no changes"
    );
});

test("Testing private nested value helpers (via any cast)", () => {
    const obj = { a: { b: { c: 1 } } };
    // @ts-expect-error - Testing private method
    assert.equal(DiffUtils.getNestedValue(obj, "a.b.c"), 1);
    // @ts-expect-error - Testing private method
    assert.equal(DiffUtils.getNestedValue(obj, "a.x"), undefined);

    const target = {};
    // @ts-expect-error - Testing private method
    DiffUtils.setNestedValue(target, "user.name", "John");
    // @ts-expect-error - Testing private method
    assert.deepEqual(target, { user: { name: "John" } });
});
