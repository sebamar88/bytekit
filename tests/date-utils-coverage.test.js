import test from "node:test";
import assert from "node:assert/strict";
import { DateUtils } from "../dist/utils/helpers/DateUtils.js";

// ============================================================================
// DateUtils Tests
// ============================================================================

test("DateUtils.parse and isValid", () => {
    assert.ok(DateUtils.parse("2023-01-01") instanceof Date);
    assert.equal(DateUtils.parse("invalid"), null);
    assert.equal(DateUtils.isValid("2023-01-01"), true);
    assert.equal(DateUtils.isValid("invalid"), false);
});

test("DateUtils formats: toISODate and format", () => {
    const d = new Date(2023, 0, 15);
    assert.equal(DateUtils.toISODate(d), "2023-01-15");
    assert.ok(DateUtils.format(d, "en-US").includes("Jan 15, 2023"));
});

test("DateUtils.startOfDay and endOfDay", () => {
    const d = new Date(2023, 0, 15, 12, 30);
    const start = DateUtils.startOfDay(d);
    assert.equal(start.getHours(), 0);
    assert.equal(start.getMinutes(), 0);

    const end = DateUtils.endOfDay(d);
    assert.equal(end.getHours(), 23);
    assert.equal(end.getMilliseconds(), 999);
});

test("DateUtils.add duration", () => {
    const d = new Date(2023, 0, 1);
    const next = DateUtils.add(d, { days: 1, hours: 2 });
    assert.equal(next.getDate(), 2);
    assert.equal(next.getHours(), 2);
});

test("DateUtils.diff calculation and rounding", () => {
    const d1 = new Date(2023, 0, 1, 12, 0);
    const d2 = new Date(2023, 0, 1, 13, 45);

    // Default is milliseconds
    assert.equal(DateUtils.diff(d1, d2), 3600000 + 45 * 60000);

    // Minutes
    assert.equal(DateUtils.diff(d1, d2, { unit: "minutes" }), 105);
    assert.equal(DateUtils.diff(d2, d1, { unit: "minutes" }), -105);
    assert.equal(
        DateUtils.diff(d2, d1, { unit: "minutes", absolute: true }),
        105
    );

    // Rounding modes
    const d3 = new Date(d1.getTime() + 90 * 1000); // 1.5 minutes
    assert.equal(
        DateUtils.diff(d1, d3, { unit: "minutes", rounding: "floor" }),
        1
    );
    assert.equal(
        DateUtils.diff(d1, d3, { unit: "minutes", rounding: "ceil" }),
        2
    );
    assert.equal(
        DateUtils.diff(d1, d3, { unit: "minutes", rounding: "round" }),
        2
    );
    assert.equal(
        DateUtils.diff(d1, d3, { unit: "minutes", rounding: "trunc" }),
        1
    );
});

test("DateUtils comparisons", () => {
    const d1 = new Date(2023, 0, 1);
    const d2 = new Date(2023, 0, 2);

    assert.equal(DateUtils.isBefore(d1, d2), true);
    assert.equal(DateUtils.isAfter(d2, d1), true);
    assert.equal(DateUtils.isSameDay(d1, new Date(2023, 0, 1, 10)), true);
});

test("DateUtils error handling", () => {
    assert.throws(() => DateUtils.toISODate("invalid"), TypeError);
});
