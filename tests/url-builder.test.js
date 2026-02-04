import { test } from "node:test";
import assert from "node:assert";
import {
    UrlBuilder,
    createUrlBuilder,
} from "../dist/utils/helpers/UrlBuilder.js";

test("UrlBuilder builds basic URL", () => {
    const url = new UrlBuilder("https://api.example.com").build();
    assert.strictEqual(url, "https://api.example.com/");
});

test("UrlBuilder adds path segments", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/users")
        .build();
    assert.strictEqual(url, "https://api.example.com/users");
});

test("UrlBuilder chains multiple path segments", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/users")
        .path("123")
        .path("posts")
        .build();
    assert.strictEqual(url, "https://api.example.com/users/123/posts");
});

test("UrlBuilder handles path segments with slashes", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/users/")
        .path("/123/")
        .build();
    assert.strictEqual(url, "https://api.example.com/users/123");
});

test("UrlBuilder adds query parameters", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/users")
        .query({ page: 1, limit: 10 })
        .build();
    assert(url.includes("page=1"));
    assert(url.includes("limit=10"));
});

test("UrlBuilder chains multiple query calls", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/users")
        .query({ page: 1 })
        .query({ limit: 10 })
        .query({ sort: "name" })
        .build();
    assert(url.includes("page=1"));
    assert(url.includes("limit=10"));
    assert(url.includes("sort=name"));
});

test("UrlBuilder ignores undefined and null query values", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/users")
        .query({ page: 1, limit: undefined, sort: null })
        .build();
    assert(url.includes("page=1"));
    assert(!url.includes("limit"));
    assert(!url.includes("sort"));
});

test("UrlBuilder adds array query parameters", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/search")
        .queryArray({ tags: ["javascript", "typescript"] })
        .build();
    assert(url.includes("tags=javascript"));
    assert(url.includes("tags=typescript"));
});

test("UrlBuilder adds hash/fragment", () => {
    const url = new UrlBuilder("https://example.com")
        .path("/docs")
        .hash("section-1")
        .build();
    assert(url.includes("#section-1"));
});

test("UrlBuilder converts boolean and number query params", () => {
    const url = new UrlBuilder("https://api.example.com")
        .query({ active: true, count: 42 })
        .build();
    assert(url.includes("active=true"));
    assert(url.includes("count=42"));
});

test("UrlBuilder getPathname returns pathname only", () => {
    const builder = new UrlBuilder("https://api.example.com")
        .path("/users")
        .path("123");
    assert.strictEqual(builder.getPathname(), "/users/123");
});

test("UrlBuilder getSearch returns query string", () => {
    const builder = new UrlBuilder("https://api.example.com").query({
        page: 1,
        limit: 10,
    });
    const search = builder.getSearch();
    assert(search.includes("page=1"));
    assert(search.includes("limit=10"));
});

test("UrlBuilder getHash returns fragment", () => {
    const builder = new UrlBuilder("https://example.com").hash("section-1");
    assert.strictEqual(builder.getHash(), "#section-1");
});

test("UrlBuilder clone creates independent copy", () => {
    const original = new UrlBuilder("https://api.example.com")
        .path("/users")
        .query({ page: 1 });

    const cloned = original.clone();
    cloned.path("123").query({ limit: 10 });

    const originalUrl = original.build();
    const clonedUrl = cloned.build();

    assert(originalUrl.includes("page=1"));
    assert(!originalUrl.includes("limit=10"));
    assert(clonedUrl.includes("page=1"));
    assert(clonedUrl.includes("limit=10"));
});

test("UrlBuilder toURL returns URL object", () => {
    const builder = new UrlBuilder("https://api.example.com")
        .path("/users")
        .query({ page: 1 });

    const urlObj = builder.toURL();
    assert(urlObj instanceof URL);
    assert.strictEqual(urlObj.pathname, "/users");
    assert(urlObj.search.includes("page=1"));
});

test("createUrlBuilder factory function works", () => {
    const url = createUrlBuilder("https://api.example.com")
        .path("/users")
        .query({ page: 1 })
        .build();

    assert(url.includes("https://api.example.com/users"));
    assert(url.includes("page=1"));
});

test("UrlBuilder handles complex URL building", () => {
    const url = new UrlBuilder("https://api.example.com")
        .path("/api/v1")
        .path("/users")
        .path("123")
        .path("posts")
        .query({ page: 1, limit: 20 })
        .queryArray({ tags: ["javascript", "typescript"] })
        .hash("comments")
        .build();

    assert(url.includes("https://api.example.com/api/v1/users/123/posts"));
    assert(url.includes("page=1"));
    assert(url.includes("limit=20"));
    assert(url.includes("tags=javascript"));
    assert(url.includes("tags=typescript"));
    assert(url.includes("#comments"));
});
