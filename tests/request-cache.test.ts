import { RequestCache } from "../src/index";

test("RequestCache stores and retrieves data", () => {
    const cache = new RequestCache();
    const data = { id: 1, name: "John" };

    cache.set("/users/1", data);
    const cached = cache.get("/users/1");

    assert.deepEqual(cached, data);
});

test("RequestCache returns null for expired entries", async () => {
    const cache = new RequestCache({ ttl: 100, staleWhileRevalidate: 0 });
    const data = { id: 1 };

    cache.set("/users/1", data);
    assert.deepEqual(cache.get("/users/1"), data);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(cache.get("/users/1"), null);
});

test("RequestCache supports stale-while-revalidate", async () => {
    const cache = new RequestCache({ ttl: 100, staleWhileRevalidate: 100 });
    const data = { id: 1 };

    cache.set("/users/1", data);

    // Wait for TTL to expire but within stale window
    await new Promise((resolve) => setTimeout(resolve, 120));
    assert.equal(cache.isStale("/users/1"), true);
    assert.deepEqual(cache.get("/users/1"), data);

    // Wait for stale window to expire
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(cache.get("/users/1"), null);
});

test("RequestCache invalidates entries", () => {
    const cache = new RequestCache();
    cache.set("/users/1", { id: 1 });
    cache.set("/users/2", { id: 2 });

    cache.invalidate("/users/1");
    assert.equal(cache.get("/users/1"), null);
    assert.deepEqual(cache.get("/users/2"), { id: 2 });
});

test("RequestCache invalidates by pattern", () => {
    const cache = new RequestCache();
    cache.set("/users/1", { id: 1 });
    cache.set("/users/2", { id: 2 });
    cache.set("/posts/1", { id: 1 });

    cache.invalidatePattern("/users/*");
    assert.equal(cache.get("/users/1"), null);
    assert.equal(cache.get("/users/2"), null);
    assert.deepEqual(cache.get("/posts/1"), { id: 1 });
});

test("RequestCache tracks statistics", () => {
    const cache = new RequestCache();
    cache.set("/users/1", { id: 1 });

    cache.get("/users/1"); // hit
    cache.get("/users/1"); // hit
    cache.get("/users/2"); // miss

    const stats = cache.getStats();
    assert.equal(stats.hits, 2);
    assert.equal(stats.misses, 1);
    assert.equal(stats.size, 1);
    assert.equal(stats.hitRate, 2 / 3);
});

test("RequestCache prunes expired entries", async () => {
    const cache = new RequestCache({ ttl: 50, staleWhileRevalidate: 50 });
    cache.set("/users/1", { id: 1 });
    cache.set("/users/2", { id: 2 });

    await new Promise((resolve) => setTimeout(resolve, 120));

    const pruned = cache.prune();
    assert.equal(pruned, 2);
    assert.equal(cache.getStats().size, 0);
});

test("RequestCache generates keys with options", () => {
    const cache = new RequestCache();
    cache.set("/users", { page: 1 }, undefined, { page: 1, limit: 10 });
    cache.set("/users", { page: 2 }, undefined, { page: 2, limit: 10 });

    const data1 = cache.get("/users", { page: 1, limit: 10 });
    const data2 = cache.get("/users", { page: 2, limit: 10 });

    assert.deepEqual(data1, { page: 1 });
    assert.deepEqual(data2, { page: 2 });
});

test("RequestCache get increments misses for absent keys", () => {
    const cache = new RequestCache();

    assert.equal(cache.get("/missing"), null);
    assert.equal(cache.getStats().misses, 1);
    assert.equal(cache.getStats().hits, 0);
});

test("RequestCache clear resets stats and size", () => {
    const cache = new RequestCache();
    cache.set("/users/1", { id: 1 });
    cache.get("/users/1");
    cache.get("/users/2");

    cache.clear();

    const stats = cache.getStats();
    assert.equal(stats.hits, 0);
    assert.equal(stats.misses, 0);
    assert.equal(stats.size, 0);
});

test("RequestCache getSize returns approximate bytes", () => {
    const cache = new RequestCache();
    cache.set("/users/1", { id: 1, name: "John" });

    const size = cache.getSize();
    assert.ok(size > 0);
});

test("RequestCache isStale returns false before expiration", () => {
    const cache = new RequestCache({ ttl: 100, staleWhileRevalidate: 100 });
    cache.set("/users/1", { id: 1 });

    assert.equal(cache.isStale("/users/1"), false);
});
