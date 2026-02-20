import { ObjectUtils } from "../src/utils/helpers/ObjectUtils";

// ============================================================================
// ObjectUtils Tests
// ============================================================================

test("ObjectUtils.isEmpty for various types", () => {
    assert.equal(ObjectUtils.isEmpty(null), true);
    assert.equal(ObjectUtils.isEmpty(new Map()), true);
    assert.equal(ObjectUtils.isEmpty(new Set()), true);
    assert.equal(ObjectUtils.isEmpty({}), true);
    assert.equal(ObjectUtils.isEmpty(""), true);

    assert.equal(ObjectUtils.isEmpty({ a: 1 }), false);
    assert.equal(ObjectUtils.isEmpty(new Set([1])), false);
});

test("ObjectUtils.deepClone handles nested structures and Dates", () => {
    const original = {
        date: new Date(2023, 0, 1),
        arr: [1, { x: 2 }],
        obj: { y: 3 },
    };

    const cloned = ObjectUtils.deepClone(original);
    assert.notEqual(cloned, original);
    assert.notEqual(cloned.date, original.date);
    assert.equal(cloned.date.getTime(), original.date.getTime());
    assert.notEqual(cloned.arr[1], original.arr[1]);
    assert.deepEqual(cloned, original);
});

test("ObjectUtils.deepMerge combines structures", () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { b: { d: 3 }, e: 4 };

    const merged = ObjectUtils.deepMerge(obj1, obj2);
    // @ts-expect-error - Test type override
    assert.deepEqual(merged, { a: 1, b: { c: 2, d: 3 }, e: 4 });
});

test("ObjectUtils.pick and omit", () => {
    const obj = { a: 1, b: 2, c: 3 };
    assert.deepEqual(ObjectUtils.pick(obj, ["a", "c"]), { a: 1, c: 3 });
    assert.deepEqual(ObjectUtils.omit(obj, ["b"]), { a: 1, c: 3 });
});

test("ObjectUtils.get and set with paths", () => {
    const obj = { user: { settings: { theme: "dark" } } };
    assert.equal(ObjectUtils.get(obj, "user.settings.theme"), "dark");
    assert.equal(
        ObjectUtils.get(obj, "user.invalid.path", "default"),
        "default"
    );

    const target = {};
    ObjectUtils.set(target, "a.b.c", 42);
    // @ts-expect-error - Test type override
    assert.equal(target.a.b.c, 42);
});

test("ObjectUtils.flatten and unflatten", () => {
    const obj = { a: 1, b: { c: 2, d: { e: 3 } } };
    const flattened = ObjectUtils.flatten(obj);
    assert.deepEqual(flattened, { a: 1, "b.c": 2, "b.d.e": 3 });

    const unflattened = ObjectUtils.unflatten(flattened);
    assert.deepEqual(unflattened, obj);
});

test("ObjectUtils.filter and mapValues", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const filtered = ObjectUtils.filter(obj, (k, v) => v > 1);
    assert.deepEqual(filtered, { b: 2, c: 3 });

    const mapped = ObjectUtils.mapValues(obj, (v) => v * 2);
    assert.deepEqual(mapped, { a: 2, b: 4, c: 6 });
});

test("ObjectUtils.hasKeys and hasAnyKey", () => {
    const obj = { a: 1, b: 2 };
    assert.equal(ObjectUtils.hasKeys(obj, ["a", "b"]), true);
    assert.equal(ObjectUtils.hasKeys(obj, ["a", "c"]), false);
    assert.equal(ObjectUtils.hasAnyKey(obj, ["c", "b"]), true);
});

test("ObjectUtils.invert", () => {
    assert.deepEqual(ObjectUtils.invert({ a: "1", b: "2" }), {
        1: "a",
        2: "b",
    });
});

test("ObjectUtils.groupBy and indexBy", () => {
    const items = [
        { id: 1, type: "A" },
        { id: 2, type: "B" },
        { id: 3, type: "A" },
    ];

    const grouped = ObjectUtils.groupBy(items, "type");
    assert.equal(grouped.A.length, 2);
    assert.equal(grouped.B.length, 1);

    const indexed = ObjectUtils.indexBy(items, "id");
    assert.equal(indexed["1"].type, "A");
});

test("ObjectUtils.deepEqual", () => {
    assert.equal(ObjectUtils.deepEqual({ a: { b: 1 } }, { a: { b: 1 } }), true);
    assert.equal(ObjectUtils.deepEqual({ a: 1 }, { a: 2 }), false);
    assert.equal(ObjectUtils.deepEqual({ a: 1 }, { b: 1 }), false);
});
