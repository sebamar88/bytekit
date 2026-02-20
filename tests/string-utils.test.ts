import { StringUtils } from "../src/index";

test("StringUtils.slugify removes diacritics and normalizes separators", () => {
    const result = StringUtils.slugify("Crème brûlée -- Especial", {
        separator: "_",
    });
    assert.equal(result, "creme_brulee_especial");
});

test("StringUtils.truncate respects ellipsis and word boundaries", () => {
    const result = StringUtils.truncate(
        "Los pagos quedaron registrados correctamente",
        20,
        { ellipsis: "...", respectWordBoundaries: true }
    );
    assert.equal(result, "Los pagos...");
});

test("StringUtils.mask hides the middle section", () => {
    const masked = StringUtils.mask("4242424242424242", {
        visibleStart: 4,
        visibleEnd: 4,
    });
    assert.equal(masked, "4242••••••••4242");
});

test("StringUtils.interpolate replaces placeholders with nesting support", () => {
    const template = "Hola {{ user.name }}, tienes {{ stats.unread }} mensajes";
    const output = StringUtils.interpolate(template, {
        user: { name: "Juan" },
        stats: { unread: 5 },
    });
    assert.equal(output, "Hola Juan, tienes 5 mensajes");
});

test("StringUtils.toQueryString serializes arrays and nested objects", () => {
    const qs = StringUtils.toQueryString({
        page: 2,
        tags: ["lab", "team"],
        filters: { status: "active" },
    });
    assert.equal(qs, "filters%5Bstatus%5D=active&page=2&tags=lab&tags=team");
});
