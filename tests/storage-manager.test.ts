import { StorageManager } from "../src/index";

class MemoryStorage {
    store = new Map();

    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }

    setItem(key, value) {
        this.store.set(key, String(value));
    }

    removeItem(key) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }
}

test("StorageManager persists and retrieves JSON payloads", () => {
    const storage = new StorageManager(new MemoryStorage());
    storage.set("profile", { id: "123", name: "Juan" });

    const snapshot = storage.get("profile");
    assert.deepEqual(snapshot, { id: "123", name: "Juan" });
});

test("StorageManager respects TTL and cleans expired entries", async () => {
    const storage = new StorageManager(new MemoryStorage());
    storage.set("session", { token: "abc" }, 10);

    const live = storage.get("session");
    assert.equal(live?.token, "abc");

    await new Promise((resolve) => setTimeout(resolve, 15));
    const expired = storage.get("session");
    assert.equal(expired, null);
});

test("StorageManager remove deletes a key", () => {
    const storage = new StorageManager(new MemoryStorage());
    storage.set("temp", { ok: true });

    storage.remove("temp");
    assert.equal(storage.get("temp"), null);
});

test("StorageManager clear removes all keys", () => {
    const storage = new StorageManager(new MemoryStorage());
    storage.set("a", { id: 1 });
    storage.set("b", { id: 2 });

    storage.clear();
    assert.equal(storage.get("a"), null);
    assert.equal(storage.get("b"), null);
});

test("StorageManager returns null for invalid JSON", () => {
    const memory = new MemoryStorage();
    memory.setItem("bad", "not-json");

    const storage = new StorageManager(memory);
    assert.equal(storage.get("bad"), null);
});
