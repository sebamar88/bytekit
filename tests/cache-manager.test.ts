import {
    CacheManager,
    createCacheManager,
} from "../src/utils/helpers/CacheManager";

// Mock localStorage for Node.js
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
    get length() {
        return Object.keys(this.store).length;
    }
    key(i) {
        return Object.keys(this.store)[i];
    }
}

// ============================================================================
// CacheManager Tests
// ============================================================================

test("CacheManager memory cache basic operations", () => {
    const cache = new CacheManager({ maxMemorySize: 2 });

    cache.set("a", 1);
    cache.set("b", 2);

    assert.equal(cache.get("a"), 1);
    assert.equal(cache.get("b"), 2);

    // Test LRU eviction (first in, first out in this specific implementation)
    cache.set("c", 3);
    assert.equal(cache.get("a"), null); // Evicted
    assert.equal(cache.get("c"), 3);
});

test("CacheManager respects MemoryCache TTL", async () => {
    const cache = new CacheManager();
    cache.set("expiring", "value", 10); // 10ms TTL

    assert.equal(cache.get("expiring"), "value");

    await new Promise((r) => setTimeout(r, 20));
    assert.equal(cache.get("expiring"), null);
});

test("CacheManager tracks statistics correctly", () => {
    const cache = new CacheManager();

    cache.set("k1", "v1");
    cache.get("k1"); // hit
    cache.get("k2"); // miss

    const stats = cache.getStats();
    assert.equal(stats.hits, 1);
    assert.equal(stats.misses, 1);
    assert.equal(stats.hitRate, 0.5);
    assert.equal(stats.size, 1);
});

test("CacheManager reports zero hitRate before any lookups", () => {
    const cache = new CacheManager();
    const stats = cache.getStats();

    assert.equal(stats.hits, 0);
    assert.equal(stats.misses, 0);
    assert.equal(stats.hitRate, 0);
});

test("CacheManager LocalStorage support", () => {
    globalThis.localStorage = new MockLocalStorage();
    const cache = new CacheManager({ enableLocalStorage: true });

    cache.set("ls-key", "ls-val");
    assert.equal(cache.get("ls-key"), "ls-val");

    // Manually check localStorage
    assert.ok(globalThis.localStorage.getItem("cache:ls-key"));

    cache.clear();
    assert.equal(cache.get("ls-key"), null);
    assert.equal(globalThis.localStorage.length, 0);

    delete globalThis.localStorage;
});

test("CacheManager localStorage operations tolerate errors", () => {
    globalThis.localStorage = {
        store: {},
        getItem() {
            throw new Error("read error");
        },
        setItem() {
            throw new Error("write error");
        },
        removeItem() {},
        clear() {
            this.store = {};
        },
        get length() {
            return 0;
        },
        key() {
            return null;
        },
    };

    const cache = new CacheManager({ enableLocalStorage: true });
    cache.set("key", "value");
    assert.equal(cache.get("key"), "value");

    const cache2 = new CacheManager({ enableLocalStorage: true });
    assert.equal(cache2.get("key"), null);

    delete globalThis.localStorage;
});

test("CacheManager clears only prefixed localStorage keys", () => {
    globalThis.localStorage = new MockLocalStorage();
    globalThis.localStorage.setItem("cache:one", JSON.stringify({ value: 1 }));
    globalThis.localStorage.setItem("other", "keep");

    const cache = new CacheManager({ enableLocalStorage: true });
    cache.clear();

    assert.equal(globalThis.localStorage.getItem("cache:one"), null);
    assert.equal(globalThis.localStorage.getItem("other"), "keep");

    delete globalThis.localStorage;
});

test("CacheManager restores from LocalStorage to memory", () => {
    globalThis.localStorage = new MockLocalStorage();
    const cache1 = new CacheManager({ enableLocalStorage: true });
    cache1.set("shared", "hello");

    // New manager with same storage
    const cache2 = new CacheManager({ enableLocalStorage: true });

    // Should miss in memory but hit in storage and restore to memory
    assert.equal(cache2.get("shared"), "hello");

    const stats = cache2.getStats();
    assert.equal(stats.size, 1); // Restored to memory

    delete globalThis.localStorage;
});

test("CacheManager.getOrCompute computes and caches", async () => {
    const cache = new CacheManager();
    let computed = 0;
    const compute = async () => {
        computed++;
        return "result";
    };

    const res1 = await cache.getOrCompute("task", compute);
    const res2 = await cache.getOrCompute("task", compute);

    assert.equal(res1, "result");
    assert.equal(res2, "result");
    assert.equal(computed, 1); // Only computed once
});

test("CacheManager delete and has operations", () => {
    const cache = new CacheManager();
    cache.set("key", "val");
    assert.equal(cache.has("key"), true);

    cache.delete("key");
    assert.equal(cache.has("key"), false);
    assert.equal(cache.get("key"), null);
});

test("CacheManager handles zero maxMemorySize", () => {
    const cache = new CacheManager({ maxMemorySize: 0 });
    cache.set("a", 1);

    assert.equal(cache.get("a"), 1);
    assert.equal(cache.has("a"), true);
});

test("CacheManager.clearPattern clears everything currently", async () => {
    const cache = new CacheManager();
    cache.set("a1", 1);
    cache.set("b1", 2);

    await cache.clearPattern("a*");
    assert.equal(cache.get("a1"), null);
    assert.equal(cache.get("b1"), null);
});

test("createCacheManager factory works", () => {
    const cache = createCacheManager();
    assert.ok(cache instanceof CacheManager);
});

test("CacheManager.delete removes key from both memory and storageCache (lines 143-145, 222-223)", () => {
    globalThis.localStorage = new MockLocalStorage();
    const cache = new CacheManager({ enableLocalStorage: true });
    cache.set("del-key", "del-val");
    assert.equal(cache.get("del-key"), "del-val");
    // delete exercises storageCache.delete → LocalStorageCache.delete → localStorage.removeItem
    cache.delete("del-key");
    assert.equal(cache.get("del-key"), null);
    assert.equal(globalThis.localStorage.getItem("cache:del-key"), null);
    delete globalThis.localStorage;
});

test("LocalStorageCache.get removes expired TTL entries (lines 128-130)", async () => {
    // Set a localStorage item that has an expired TTL → get() removes it and returns null
    globalThis.localStorage = new MockLocalStorage();
    const cache = new CacheManager({ enableLocalStorage: true });
    // Set entry with 10ms TTL
    cache.set("ttl-key", "ttl-val", 10);
    assert.equal(cache.get("ttl-key"), "ttl-val"); // not expired yet

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 30));

    // First get: item is expired → localStorage.removeItem called → returns null (lines 128-130)
    assert.equal(cache.get("ttl-key"), null);
    delete globalThis.localStorage;
});

test("MemoryCache.has is reachable via private accessor (lines 70-71)", () => {
    // MemoryCache.has() is a private-class method not exposed through CacheManager.
    // Access via (cache as any).memoryCache to exercise lines 70-71.
    const cache = new CacheManager();
    const mc = (cache as any).memoryCache;
    assert.equal(mc.has("missing"), false);
    mc.set("exists", "val");
    assert.equal(mc.has("exists"), true);
});
test("LocalStorageCache.has is reachable via private storageCache accessor (lines 139-140)", () => {
    globalThis.localStorage = new MockLocalStorage();
    const cache = new CacheManager({ enableLocalStorage: true });
    cache.set("ls-has-key", "ls-has-val");

    // storageCache is the LocalStorageCache instance — call .has() directly
    const sc = (
        cache as unknown as { storageCache: { has: (k: string) => boolean } }
    ).storageCache;
    assert.ok(sc, "storageCache should be defined");
    assert.equal(sc.has("ls-has-key"), true);
    assert.equal(sc.has("nonexistent-key"), false);

    delete (globalThis as Record<string, unknown>).localStorage;
});
