import { ObjectUtils } from "../src/index";

test("ObjectUtils.isEmpty detects empty values", () => {
    assert.equal(ObjectUtils.isEmpty(null), true);
    assert.equal(ObjectUtils.isEmpty(undefined), true);
    assert.equal(ObjectUtils.isEmpty(""), true);
    assert.equal(ObjectUtils.isEmpty("  "), true);
    assert.equal(ObjectUtils.isEmpty([]), true);
    assert.equal(ObjectUtils.isEmpty({}), true);
    assert.equal(ObjectUtils.isEmpty(new Map()), true);
    assert.equal(ObjectUtils.isEmpty(new Set()), true);

    assert.equal(ObjectUtils.isEmpty("text"), false);
    assert.equal(ObjectUtils.isEmpty([1]), false);
    assert.equal(ObjectUtils.isEmpty({ a: 1 }), false);
});

test("ObjectUtils.deepClone creates independent copy", () => {
    const original = { a: 1, b: { c: 2 }, d: [3, 4] };
    const cloned = ObjectUtils.deepClone(original);

    cloned.a = 99;
    cloned.b.c = 99;
    cloned.d[0] = 99;

    assert.equal(original.a, 1);
    assert.equal(original.b.c, 2);
    assert.equal(original.d[0], 3);
});

test("ObjectUtils.merge combines objects", () => {
    const result = ObjectUtils.merge(
        { a: 1, b: 2 },
        { b: 3, c: 4 },
        { c: 5, d: 6 }
    );

    assert.deepEqual(result, { a: 1, b: 3, c: 5, d: 6 });
});

test("ObjectUtils.deepMerge recursively merges objects", () => {
    const result = ObjectUtils.deepMerge(
        { a: { b: 1, c: 2 } },
        { a: { c: 3, d: 4 } }
    );

    assert.deepEqual(result, { a: { b: 1, c: 3, d: 4 } });
});

test("ObjectUtils.pick selects specific keys", () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    const result = ObjectUtils.pick(obj, ["a", "c"]);

    assert.deepEqual(result, { a: 1, c: 3 });
});

test("ObjectUtils.omit removes specific keys", () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    const result = ObjectUtils.omit(obj, ["b", "d"]);

    assert.deepEqual(result, { a: 1, c: 3 });
});

test("ObjectUtils.get retrieves nested values", () => {
    const obj = { a: { b: { c: "value" } } };

    assert.equal(ObjectUtils.get(obj, "a.b.c"), "value");
    assert.equal(ObjectUtils.get(obj, "a.b.x", "default"), "default");
});

test("ObjectUtils.set assigns nested values", () => {
    const obj = {};
    ObjectUtils.set(obj, "a.b.c", "value");

    assert.deepEqual(obj, { a: { b: { c: "value" } } });
});

test("ObjectUtils.flatten converts nested to flat", () => {
    const obj = { a: { b: 1, c: { d: 2 } }, e: 3 };
    const result = ObjectUtils.flatten(obj);

    assert.deepEqual(result, { "a.b": 1, "a.c.d": 2, e: 3 });
});

test("ObjectUtils.unflatten converts flat to nested", () => {
    const obj = { "a.b": 1, "a.c.d": 2, e: 3 };
    const result = ObjectUtils.unflatten(obj);

    assert.deepEqual(result, { a: { b: 1, c: { d: 2 } }, e: 3 });
});

test("ObjectUtils.filter selects entries by predicate", () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    const result = ObjectUtils.filter(obj, (_, value) => value > 2);

    assert.deepEqual(result, { c: 3, d: 4 });
});

test("ObjectUtils.mapValues transforms values", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = ObjectUtils.mapValues(obj, (value) => value * 2);

    assert.deepEqual(result, { a: 2, b: 4, c: 6 });
});

test("ObjectUtils.hasKeys checks for all keys", () => {
    const obj = { a: 1, b: 2, c: 3 };

    assert.equal(ObjectUtils.hasKeys(obj, ["a", "b"]), true);
    assert.equal(ObjectUtils.hasKeys(obj, ["a", "x"]), false);
});

test("ObjectUtils.hasAnyKey checks for any key", () => {
    const obj = { a: 1, b: 2, c: 3 };

    assert.equal(ObjectUtils.hasAnyKey(obj, ["a", "x"]), true);
    assert.equal(ObjectUtils.hasAnyKey(obj, ["x", "y"]), false);
});

test("ObjectUtils.invert swaps keys and values", () => {
    const obj = { a: "x", b: "y", c: "z" };
    const result = ObjectUtils.invert(obj);

    assert.deepEqual(result, { x: "a", y: "b", z: "c" });
});

test("ObjectUtils.groupBy groups array by key", () => {
    const arr = [
        { type: "a", value: 1 },
        { type: "b", value: 2 },
        { type: "a", value: 3 },
    ];
    const result = ObjectUtils.groupBy(arr, "type");

    assert.deepEqual(result, {
        a: [
            { type: "a", value: 1 },
            { type: "a", value: 3 },
        ],
        b: [{ type: "b", value: 2 }],
    });
});

test("ObjectUtils.indexBy indexes array by key", () => {
    const arr = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
    ];
    const result = ObjectUtils.indexBy(arr, "id");

    assert.deepEqual(result, {
        1: { id: 1, name: "Alice" },
        2: { id: 2, name: "Bob" },
    });
});

test("ObjectUtils.deepEqual compares objects", () => {
    assert.equal(ObjectUtils.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
    assert.equal(ObjectUtils.deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }), false);
    assert.equal(ObjectUtils.deepEqual({ a: { b: 1 } }, { a: { b: 1 } }), true);
});

test("ObjectUtils.size returns number of keys", () => {
    assert.equal(ObjectUtils.size({ a: 1, b: 2, c: 3 }), 3);
    assert.equal(ObjectUtils.size({}), 0);
});

test("ObjectUtils.entries converts to key-value pairs", () => {
    const obj = { a: 1, b: 2 };
    const result = ObjectUtils.entries(obj);

    assert.deepEqual(result, [
        ["a", 1],
        ["b", 2],
    ]);
});

test("ObjectUtils.fromEntries converts from key-value pairs", () => {
    const entries = [
        ["a", 1],
        ["b", 2],
    ];
    const result = ObjectUtils.fromEntries(entries);

    assert.deepEqual(result, { a: 1, b: 2 });
});

test("ObjectUtils.fromKeys creates object from keys", () => {
    const result = ObjectUtils.fromKeys(["a", "b", "c"], 0);

    assert.deepEqual(result, { a: 0, b: 0, c: 0 });
});
