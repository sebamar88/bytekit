import { DateUtils } from "../src/index";

test("DateUtils.parse accepts ISO strings and timestamps", () => {
    const isoDate = DateUtils.parse("2024-10-10T12:00:00Z");
    assert.ok(isoDate instanceof Date);
    assert.equal(isoDate?.getUTCFullYear(), 2024);

    const timestampDate = DateUtils.parse(1_600_000_000_000);
    assert.equal(timestampDate?.getTime(), 1_600_000_000_000);

    assert.equal(DateUtils.parse("invalid"), null);
});

test("DateUtils.add combines multiple duration units", () => {
    const base = new Date("2024-01-01T00:00:00Z");
    const result = DateUtils.add(base, {
        days: 1,
        hours: 2,
        minutes: 30,
        seconds: 15,
    });

    assert.equal(result.toISOString(), "2024-01-02T02:30:15.000Z");
});

test("DateUtils.diff respects unit, rounding and absolute options", () => {
    const a = new Date("2024-01-01T00:00:00Z");
    const b = new Date("2024-01-03T12:00:00Z");

    const roundedDown = DateUtils.diff(a, b, {
        unit: "days",
        rounding: "floor",
    });
    assert.equal(roundedDown, 2);

    const roundedUp = DateUtils.diffInDays(a, b);
    assert.equal(roundedUp, 3);

    const absolute = DateUtils.diff(b, a, {
        unit: "hours",
        absolute: true,
    });
    assert.equal(absolute, 60);
});

test("DateUtils.isSameDay ignores time components", () => {
    // Use UTC dates to avoid timezone issues in CI environments
    const morning = new Date("2024-05-05T08:00:00Z");
    const evening = new Date("2024-05-05T22:00:00Z");
    assert.ok(DateUtils.isSameDay(morning, evening));
    assert.ok(DateUtils.isBefore(morning, evening));
    assert.ok(DateUtils.isAfter(evening, morning));
});
