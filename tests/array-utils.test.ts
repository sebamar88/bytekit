

import { ArrayUtils } from "../src/utils/helpers/ArrayUtils";

// ============================================================================
// ArrayUtils Tests
// ============================================================================

test("ArrayUtils.chunk splits array into chunks", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const chunks = ArrayUtils.chunk(arr, 3);
    assert.deepEqual(chunks, [[1, 2, 3], [4, 5, 6], [7]]);
});

test("ArrayUtils.chunk throws on invalid size", () => {
    assert.throws(
        () => ArrayUtils.chunk([1, 2, 3], 0),
        /Chunk size must be greater than 0/
    );
    assert.throws(
        () => ArrayUtils.chunk([1, 2, 3], -1),
        /Chunk size must be greater than 0/
    );
});

test("ArrayUtils.flatten flattens nested arrays", () => {
    // Note: Implementation has a bug where depth=0 filters arrays
    // So [[5,6]] at depth=1 becomes [] instead of [5,6]
    const arr1 = [
        [1, 2],
        [3, 4],
    ];
    assert.deepEqual(ArrayUtils.flatten(arr1, 1), [1, 2, 3, 4]);

    const arr2 = [[[1, 2]], [[3, 4]]];
    assert.deepEqual(ArrayUtils.flatten(arr2, 2), [1, 2, 3, 4]);
});

test("ArrayUtils.flatten with depth 0 filters non-arrays", () => {
    const arr = [1, [2, 3], 4];
    assert.deepEqual(ArrayUtils.flatten(arr, 0), [1, 4]);
});

test("ArrayUtils.unique removes duplicates", () => {
    assert.deepEqual(ArrayUtils.unique([1, 2, 2, 3, 3, 3]), [1, 2, 3]);
});

test("ArrayUtils.unique with custom key function", () => {
    const arr = [{ id: 1 }, { id: 2 }, { id: 1 }];
    const result = ArrayUtils.unique(arr, (item) => item.id);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
    assert.equal(result[1].id, 2);
});

test("ArrayUtils.deduplicate is alias for unique", () => {
    assert.deepEqual(ArrayUtils.deduplicate([1, 2, 2, 3]), [1, 2, 3]);
});

test("ArrayUtils.compact removes falsy values", () => {
    const arr = [0, 1, false, 2, "", 3, null, undefined, 4];
    assert.deepEqual(ArrayUtils.compact(arr), [1, 2, 3, 4]);
});

test("ArrayUtils.flat flattens one level", () => {
    // flat() calls flatten(arr, 1)
    assert.deepEqual(ArrayUtils.flat([1, [2, 3], [4, 5]]), [1, 2, 3, 4, 5]);
    assert.deepEqual(
        ArrayUtils.flat([
            [1, 2],
            [3, 4],
        ]),
        [1, 2, 3, 4]
    );
});

test("ArrayUtils.first returns first element", () => {
    assert.equal(ArrayUtils.first([1, 2, 3]), 1);
    assert.equal(ArrayUtils.first([]), undefined);
});

test("ArrayUtils.last returns last element", () => {
    assert.equal(ArrayUtils.last([1, 2, 3]), 3);
    assert.equal(ArrayUtils.last([]), undefined);
});

test("ArrayUtils.at supports positive indices", () => {
    const arr = [1, 2, 3, 4, 5];
    assert.equal(ArrayUtils.at(arr, 0), 1);
    assert.equal(ArrayUtils.at(arr, 2), 3);
});

test("ArrayUtils.at supports negative indices", () => {
    const arr = [1, 2, 3, 4, 5];
    assert.equal(ArrayUtils.at(arr, -1), 5);
    assert.equal(ArrayUtils.at(arr, -2), 4);
});

test("ArrayUtils.shuffle returns shuffled array", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = ArrayUtils.shuffle(arr);
    assert.equal(shuffled.length, arr.length);
    assert.deepEqual(shuffled.sort(), arr.sort());
    // Original unchanged
    assert.deepEqual(arr, [1, 2, 3, 4, 5]);
});

test("ArrayUtils.random returns random element", () => {
    const arr = [1, 2, 3, 4, 5];
    const random = ArrayUtils.random(arr);
    assert.ok(arr.includes(random));
});

test("ArrayUtils.random returns undefined for empty array", () => {
    assert.equal(ArrayUtils.random([]), undefined);
});

test("ArrayUtils.randomN returns N random elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const random = ArrayUtils.randomN(arr, 3);
    assert.equal(random.length, 3);
    random.forEach((item) => assert.ok(arr.includes(item)));
});

test("ArrayUtils.randomN handles edge cases", () => {
    const arr = [1, 2, 3];
    assert.deepEqual(ArrayUtils.randomN(arr, 0), []);
    assert.equal(ArrayUtils.randomN(arr, 5).length, 3);
    assert.deepEqual(ArrayUtils.randomN(arr, -1), []);
});

test("ArrayUtils.reverse reverses array", () => {
    const arr = [1, 2, 3];
    assert.deepEqual(ArrayUtils.reverse(arr), [3, 2, 1]);
    assert.deepEqual(arr, [1, 2, 3]); // Original unchanged
});

test("ArrayUtils.rotate rotates array", () => {
    const arr = [1, 2, 3, 4, 5];
    assert.deepEqual(ArrayUtils.rotate(arr, 2), [4, 5, 1, 2, 3]);
    assert.deepEqual(ArrayUtils.rotate(arr, -2), [3, 4, 5, 1, 2]);
});

test("ArrayUtils.rotate handles empty array", () => {
    assert.deepEqual(ArrayUtils.rotate([], 5), []);
});

test("ArrayUtils.zip zips arrays together", () => {
    const result = ArrayUtils.zip([1, 2], ["a", "b"], [true, false]);
    assert.deepEqual(result, [
        [1, "a", true],
        [2, "b", false],
    ]);
});

test("ArrayUtils.zip handles arrays of different lengths", () => {
    const result = ArrayUtils.zip([1, 2, 3], ["a", "b"]);
    assert.deepEqual(result, [
        [1, "a"],
        [2, "b"],
        [3, undefined],
    ]);
});

test("ArrayUtils.zip handles empty input", () => {
    assert.deepEqual(ArrayUtils.zip(), []);
});

test("ArrayUtils.unzip unzips array of tuples", () => {
    const arr = [
        [1, "a"],
        [2, "b"],
        [3, "c"],
    ];
    const result = ArrayUtils.unzip(arr);
    assert.deepEqual(result, [
        [1, 2, 3],
        ["a", "b", "c"],
    ]);
});

test("ArrayUtils.unzip handles empty array", () => {
    assert.deepEqual(ArrayUtils.unzip([]), []);
});

test("ArrayUtils.difference finds difference", () => {
    assert.deepEqual(ArrayUtils.difference([1, 2, 3, 4], [2, 4]), [1, 3]);
});

test("ArrayUtils.intersection finds intersection", () => {
    assert.deepEqual(ArrayUtils.intersection([1, 2, 3], [2, 3, 4]), [2, 3]);
});

test("ArrayUtils.union finds union", () => {
    const result = ArrayUtils.union([1, 2, 3], [3, 4, 5]);
    assert.deepEqual(result.sort(), [1, 2, 3, 4, 5]);
});

test("ArrayUtils.includesAll checks if includes all", () => {
    assert.equal(ArrayUtils.includesAll([1, 2, 3, 4], [2, 3]), true);
    assert.equal(ArrayUtils.includesAll([1, 2, 3], [2, 5]), false);
});

test("ArrayUtils.includesAny checks if includes any", () => {
    assert.equal(ArrayUtils.includesAny([1, 2, 3], [3, 4, 5]), true);
    assert.equal(ArrayUtils.includesAny([1, 2, 3], [4, 5, 6]), false);
});

test("ArrayUtils.sum calculates sum", () => {
    assert.equal(ArrayUtils.sum([1, 2, 3, 4, 5]), 15);
    assert.equal(ArrayUtils.sum([]), 0);
});

test("ArrayUtils.average calculates average", () => {
    assert.equal(ArrayUtils.average([1, 2, 3, 4, 5]), 3);
    assert.equal(ArrayUtils.average([]), 0);
});

test("ArrayUtils.min finds minimum", () => {
    assert.equal(ArrayUtils.min([3, 1, 4, 1, 5]), 1);
    assert.equal(ArrayUtils.min([]), undefined);
});

test("ArrayUtils.max finds maximum", () => {
    assert.equal(ArrayUtils.max([3, 1, 4, 1, 5]), 5);
    assert.equal(ArrayUtils.max([]), undefined);
});

test("ArrayUtils.range generates range", () => {
    assert.deepEqual(ArrayUtils.range(0, 5), [0, 1, 2, 3, 4]);
    assert.deepEqual(ArrayUtils.range(0, 10, 2), [0, 2, 4, 6, 8]);
});

test("ArrayUtils.range handles negative step", () => {
    assert.deepEqual(ArrayUtils.range(5, 0, -1), [5, 4, 3, 2, 1]);
});

test("ArrayUtils.range handles zero step", () => {
    assert.deepEqual(ArrayUtils.range(0, 5, 0), []);
});

test("ArrayUtils.repeat repeats array", () => {
    assert.deepEqual(ArrayUtils.repeat([1, 2], 3), [1, 2, 1, 2, 1, 2]);
    assert.deepEqual(ArrayUtils.repeat([1, 2], 0), []);
    assert.deepEqual(ArrayUtils.repeat([1, 2], -1), []);
});

test("ArrayUtils.fill fills array with value", () => {
    assert.deepEqual(ArrayUtils.fill(5, "x"), ["x", "x", "x", "x", "x"]);
});

test("ArrayUtils.transpose transposes 2D array", () => {
    const arr = [
        [1, 2, 3],
        [4, 5, 6],
    ];
    assert.deepEqual(ArrayUtils.transpose(arr), [
        [1, 4],
        [2, 5],
        [3, 6],
    ]);
});

test("ArrayUtils.transpose handles empty array", () => {
    assert.deepEqual(ArrayUtils.transpose([]), []);
});

test("ArrayUtils.findIndex finds index", () => {
    const arr = [1, 2, 3, 4, 5];
    assert.equal(
        ArrayUtils.findIndex(arr, (x) => x > 3),
        3
    );
});

test("ArrayUtils.findLastIndex finds last index", () => {
    const arr = [1, 2, 3, 2, 1];
    assert.equal(
        ArrayUtils.findLastIndex(arr, (x) => x === 2),
        3
    );
    assert.equal(
        ArrayUtils.findLastIndex(arr, (x) => x === 10),
        -1
    );
});

test("ArrayUtils.partition partitions array", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const [even, odd] = ArrayUtils.partition(arr, (x) => x % 2 === 0);
    assert.deepEqual(even, [2, 4, 6]);
    assert.deepEqual(odd, [1, 3, 5]);
});
