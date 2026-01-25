import test from "node:test";
import assert from "node:assert/strict";
import { NumberUtils } from "../dist/utils/helpers/NumberUtils.js";

// ============================================================================
// NumberUtils Tests
// ============================================================================

test("NumberUtils.format and currency", () => {
    const val = 1234.56;
    assert.ok(NumberUtils.format(val, "en-US").includes("1,234.56"));
    assert.ok(NumberUtils.currency(val, "USD", "en-US").includes("$1,234.56"));
});

test("NumberUtils.percentage", () => {
    assert.ok(NumberUtils.percentage(0.456, { locale: "en-US" }).includes("45.6%"));
});

test("NumberUtils.ordinal", () => {
    assert.equal(NumberUtils.ordinal(1, "en"), "1st");
    assert.equal(NumberUtils.ordinal(1, "es"), "1°");
});

test("Math helpers: clamp, round, floor, ceil", () => {
    assert.equal(NumberUtils.clamp(150, 0, 100), 100);
    assert.equal(NumberUtils.round(3.14159, 2), 3.14);
    assert.equal(NumberUtils.round(1234.5, -2), 1200);
    assert.equal(NumberUtils.floor(3.999, 2), 3.99);
    assert.equal(NumberUtils.ceil(3.001, 2), 3.01);
});

test("NumberUtils.range", () => {
    assert.deepEqual(NumberUtils.range(1, 3), [1, 2, 3]);
    assert.throws(() => NumberUtils.range(1, 5, 0), /Step cannot be zero/);
});

test("NumberUtils.random", () => {
    const r = NumberUtils.random(1, 10);
    assert.ok(r >= 1 && r <= 10);
});

test("Boolean checks", () => {
    assert.equal(NumberUtils.isEven(2), true);
    assert.equal(NumberUtils.isPositive(1), true);
});

test("NumberUtils.toWords (English)", () => {
    assert.equal(NumberUtils.toWords(13), "thirteen");
    assert.equal(NumberUtils.toWords(1000000), "one million");
    assert.equal(NumberUtils.toWords(-42), "negative forty-two");
});

test("NumberUtils.toWords (Spanish)", () => {
    assert.equal(NumberUtils.toWords(1, "es"), "uno");
    assert.equal(NumberUtils.toWords(1000000, "es"), "un millón");
});

test("NumberUtils.formatBytes", () => {
    assert.equal(NumberUtils.formatBytes(1024), "1 KB");
});

test("NumberUtils.parse with separators", () => {
    // These should now work reliably with the split/join fix
    assert.equal(NumberUtils.parse("1,234.56", "en"), 1234.56);
    assert.equal(NumberUtils.parse("1.234,56", "es"), 1234.56);
    assert.equal(NumberUtils.parse("$1,234.56", "en"), 1234.56);
});

test("NumberUtils.pad", () => {
    assert.equal(NumberUtils.pad(5, 3), "005");
});

test("Statistics helpers", () => {
    const data = [1, 2, 2, 3, 4];
    assert.equal(NumberUtils.sum(data), 12);
    assert.equal(NumberUtils.average(data), 2.4);
    assert.equal(NumberUtils.median(data), 2);
    assert.equal(NumberUtils.mode(data), 2);
    assert.equal(NumberUtils.min(data), 1);
    assert.equal(NumberUtils.max(data), 4);
    assert.ok(NumberUtils.standardDeviation(data) > 0);
    assert.ok(NumberUtils.variance(data) > 0);
    assert.equal(NumberUtils.percentile(data, 50), 2);
});
