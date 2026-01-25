import test from "node:test";
import assert from "node:assert/strict";
import { CacheManager, createCacheManager } from "../dist/utils/helpers/CacheManager.js";

// Mock localStorage for Node.js
class MockLocalStorage {
    constructor() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
    clear() { this.store = {}; }
    get length() { return Object.keys(this.store).length; }
    key(i) { return Object.keys(this.store)[i]; }
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
    
    await new Promise(r => setTimeout(r, 20));
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
