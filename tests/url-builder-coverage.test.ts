import { UrlBuilder, createUrlBuilder } from "../src/utils/helpers/UrlBuilder";

// ============================================================================
// UrlBuilder Tests
// ============================================================================

test("UrlBuilder.path handles segments correctly", () => {
    const builder = new UrlBuilder("https://api.com");
    builder.path("/users/", "123", "//profile//");
    assert.equal(builder.build(), "https://api.com/users/123/profile");
    assert.equal(builder.getPathname(), "/users/123/profile");
});

test("UrlBuilder.query handles various types", () => {
    const builder = new UrlBuilder("https://api.com");
    builder.query({
        page: 1,
        active: true,
        name: "John",
        none: null,
        ghost: undefined,
    });
    assert.equal(
        builder.build(),
        "https://api.com/?page=1&active=true&name=John"
    );
});

test("UrlBuilder.queryArray handles repeats", () => {
    const builder = new UrlBuilder("https://api.com");
    builder.queryArray({ tags: ["js", "ts"], ids: [1, 2] });
    const url = builder.build();
    assert.ok(url.includes("tags=js&tags=ts"));
    assert.ok(url.includes("ids=1&ids=2"));
});

test("UrlBuilder.hash", () => {
    const builder = new UrlBuilder("https://api.com");
    builder.hash("section");
    assert.equal(builder.build(), "https://api.com/#section");
    assert.equal(builder.getHash(), "#section");
});

test("UrlBuilder methods: toURL and getSearch", () => {
    const builder = new UrlBuilder("https://api.com/path");
    builder.query({ q: "test" });

    assert.ok(builder.toURL() instanceof URL);
    assert.equal(builder.getSearch(), "?q=test");
});

test("UrlBuilder.clone creates independent copy", () => {
    const original = new UrlBuilder("https://api.com").query({ a: 1 });
    const cloned = original.clone();

    cloned.query({ b: 2 });

    assert.equal(original.build(), "https://api.com/?a=1");
    assert.equal(cloned.build(), "https://api.com/?a=1&b=2");
});

test("createUrlBuilder factory works", () => {
    const builder = createUrlBuilder("https://test.com");
    assert.ok(builder instanceof UrlBuilder);
});

test("UrlBuilder.path with empty segments does nothing", () => {
    const builder = new UrlBuilder("https://api.com/base");
    builder.path("", "/");
    assert.equal(builder.getPathname(), "/base");
});
