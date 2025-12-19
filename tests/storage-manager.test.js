import test from "node:test";
import assert from "node:assert/strict";
import { StorageManager } from "../dist/index.js";

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
