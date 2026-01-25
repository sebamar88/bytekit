import test from "node:test";
import assert from "node:assert/strict";
import { StringUtils } from "../dist/utils/helpers/StringUtils.js";

// ============================================================================
// StringUtils Tests
// ============================================================================

test("StringUtils.removeDiacritics", () => {
    assert.equal(StringUtils.removeDiacritics("crème brûlée"), "creme brulee");
    assert.equal(StringUtils.removeDiacritics(null), "");
});

test("StringUtils.slugify with various options", () => {
    assert.equal(StringUtils.slugify("Hello World!"), "hello-world");
    assert.equal(StringUtils.slugify("Hello World!", { separator: "_" }), "hello_world");
    assert.equal(StringUtils.slugify("Hello", { lowercase: false }), "Hello");
    assert.equal(StringUtils.slugify("---hello---world---"), "hello-world");
});

test("StringUtils.compactWhitespace", () => {
    assert.equal(StringUtils.compactWhitespace("  hello   world  "), "hello world");
});

test("StringUtils.capitalize and capitalizeWords", () => {
    assert.equal(StringUtils.capitalize("hello world"), "Hello world");
    assert.equal(StringUtils.capitalizeWords("hello world"), "Hello World");
    assert.equal(StringUtils.capitalize(""), "");
});

test("StringUtils.truncate with options", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    assert.equal(StringUtils.truncate(text, 10), "The…");
    assert.equal(StringUtils.truncate(text, 10, { respectWordBoundaries: false }), "The quick…");
    assert.equal(StringUtils.truncate("Short", 10), "Short");
});

test("StringUtils.mask", () => {
    assert.equal(StringUtils.mask("1234567890", { visibleStart: 2, visibleEnd: 2 }), "12••••••90");
    assert.equal(StringUtils.mask("123", { visibleStart: 2, visibleEnd: 2 }), "123");
    assert.equal(StringUtils.mask(null), "");
});

test("StringUtils.interpolate with nested paths", () => {
    const template = "Hello {{ user.name }}, welcome to {{ user.settings.theme }} mode!";
    const params = { user: { name: "John", settings: { theme: "dark" } } };
    const result = StringUtils.interpolate(template, params);
    assert.equal(result, "Hello John, welcome to dark mode!");
});

test("StringUtils.interpolate edge cases", () => {
    const template = "{{ missing }} and {{ nullVal }}";
    const params = { nullVal: null };
    
    assert.equal(StringUtils.interpolate(template, params), " and ");
    assert.throws(() => StringUtils.interpolate(template, params, { strict: true }), /Missing value for key "missing"/);
    
    assert.equal(StringUtils.interpolate("{{ a }}", { a: 1 }, { transform: (v) => String(v * 2) }), "2");
});

test("StringUtils.initials", () => {
    assert.equal(StringUtils.initials("John Doe"), "JD");
    assert.equal(StringUtils.initials("john doe", { uppercase: false }), "jd");
    assert.equal(StringUtils.initials("John Fitzgerald Kennedy", { limit: 3 }), "JFK");
});

test("StringUtils.toQueryString complex scenarios", () => {
    const params = {
        a: 1,
        b: [2, 3],
        c: { d: 4 },
        e: null,
        f: ""
    };
    
    // Default: repeat, skipNull: true, skipEmptyString: false, sortKeys: true
    const qs = StringUtils.toQueryString(params);
    assert.equal(qs, "a=1&b=2&b=3&c%5Bd%5D=4&f=");
    
    assert.equal(StringUtils.toQueryString(params, { arrayFormat: "bracket" }), "a=1&b%5B%5D=2&b%5B%5D=3&c%5Bd%5D=4&f=");
    assert.equal(StringUtils.toQueryString(params, { arrayFormat: "comma" }), "a=1&b=2%2C3&c%5Bd%5D=4&f=");
    assert.equal(StringUtils.toQueryString(params, { skipEmptyString: true }), "a=1&b=2&b=3&c%5Bd%5D=4");
});

test("StringUtils.toQueryString with no params", () => {
    assert.equal(StringUtils.toQueryString(null), "");
    assert.equal(StringUtils.toQueryString({}), "");
});
