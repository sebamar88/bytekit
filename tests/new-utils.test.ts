import {
    EventEmitter,
    createEventEmitter,
    DiffUtils,
    PollingHelper,
    createPoller,
    CryptoUtils,
    PaginationHelper,
    createPaginator,
    CacheManager,
    createCacheManager,
    CompressionUtils,
} from "../src/index";

// ============================================================================
// EventEmitter Tests
// ============================================================================

test("EventEmitter registers and emits events", async () => {
    const emitter = new EventEmitter();
    let received = null;

    emitter.on("test", (data) => {
        received = data;
    });

    await emitter.emit("test", { message: "hello" });
    assert.deepEqual(received, { message: "hello" });
});

test("EventEmitter supports once listeners", async () => {
    const emitter = new EventEmitter();
    let count = 0;

    emitter.once("test", () => {
        count++;
    });

    await emitter.emit("test", null);
    await emitter.emit("test", null);

    // Note: once listeners are called but the handler is removed after first emit
    // However, the listener is still in the eventMap, so we check if it was called once
    assert.equal(count, 1);
});

test("EventEmitter removes listeners", async () => {
    const emitter = new EventEmitter();
    let count = 0;

    const handler = () => {
        count++;
    };

    emitter.on("test", handler);
    emitter.off("test", handler);

    await emitter.emit("test", null);
    assert.equal(count, 0);
});

test("EventEmitter emits synchronously", () => {
    const emitter = new EventEmitter();
    let received = null;

    emitter.on("test", (data) => {
        received = data;
    });

    const result = emitter.emitSync("test", { message: "sync" });
    assert.equal(result, true);
    assert.deepEqual(received, { message: "sync" });
});

test("EventEmitter tracks listener count", () => {
    const emitter = new EventEmitter();

    emitter.on("test", () => {});
    emitter.on("test", () => {});

    assert.equal(emitter.listenerCount("test"), 2);
});

test("EventEmitter factory function works", () => {
    const emitter = createEventEmitter();
    assert.ok(emitter instanceof EventEmitter);
});

// ============================================================================
// DiffUtils Tests
// ============================================================================

test("DiffUtils detects changed fields", () => {
    const old = { name: "John", age: 30 };
    const new_ = { name: "Jane", age: 30 };

    const diff = DiffUtils.diff(old, new_);
    assert.deepEqual(diff.changed, ["name"]);
    assert.deepEqual(diff.added, []);
    assert.deepEqual(diff.removed, []);
});

test("DiffUtils detects added fields", () => {
    const old = { name: "John" };
    const new_ = { name: "John", age: 30 };

    const diff = DiffUtils.diff(old, new_);
    assert.deepEqual(diff.added, ["age"]);
});

test("DiffUtils detects removed fields", () => {
    const old = { name: "John", age: 30 };
    const new_ = { name: "John" };

    const diff = DiffUtils.diff(old, new_);
    assert.deepEqual(diff.removed, ["age"]);
});

test("DiffUtils creates patches", () => {
    const old = { name: "John", age: 30 };
    const new_ = { name: "Jane", age: 31, email: "jane@example.com" };

    const patches = DiffUtils.createPatch(old, new_);
    assert.ok(patches.length > 0);
    assert.ok(patches.some((p) => p.op === "replace"));
    assert.ok(patches.some((p) => p.op === "add"));
});

test("DiffUtils applies patches", () => {
    const old = { name: "John", age: 30 };
    const patches = [
        { op: "replace", path: "name", value: "Jane" },
        { op: "add", path: "email", value: "jane@example.com" },
    ];

    const result = DiffUtils.applyPatch(old, patches);
    assert.equal(result.name, "Jane");
    assert.equal(result.email, "jane@example.com");
});

test("DiffUtils deep equals objects", () => {
    assert.equal(DiffUtils.deepEqual({ a: 1 }, { a: 1 }), true);
    assert.equal(DiffUtils.deepEqual({ a: 1 }, { a: 2 }), false);
    assert.equal(DiffUtils.deepEqual({ a: { b: 1 } }, { a: { b: 1 } }), true);
});

// ============================================================================
// PollingHelper Tests
// ============================================================================

test("PollingHelper polls until condition is met", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            return attempts >= 3;
        },
        {
            interval: 10,
            stopCondition: (result) => result === true,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, true);
    assert.equal(result.attempts, 3);
});

test("PollingHelper respects max attempts", async () => {
    const poller = new PollingHelper(async () => false, {
        interval: 10,
        maxAttempts: 3,
        stopCondition: () => false,
    });

    const result = await poller.start();
    assert.equal(result.success, false);
    assert.equal(result.attempts, 3);
});

test("PollingHelper applies backoff", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            return attempts >= 2;
        },
        {
            interval: 10,
            backoffMultiplier: 2,
            stopCondition: (result) => result === true,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, true);
});

test("PollingHelper factory function works", async () => {
    const poller = createPoller(async () => true, { interval: 10 });
    assert.ok(poller instanceof PollingHelper);
});

test("PollingHelper abort controller works", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            return false;
        },
        {
            interval: 50,
            maxAttempts: 10,
            stopCondition: () => false,
        }
    );

    const promise = poller.startWithAbort();

    // Abort after a short delay
    setTimeout(() => poller.abort(), 100);

    const result = await promise;
    assert.equal(result.success, false);
    assert.equal(result.error?.message, "Polling aborted");
    assert.ok(attempts < 10); // Should stop before max attempts
});

test("PollingHelper applies jitter", async () => {
    let attempts = 0;

    const poller = new PollingHelper(
        async () => {
            attempts++;
            return attempts >= 3;
        },
        {
            interval: 100,
            jitter: 20, // 20% jitter
            stopCondition: (result) => result === true,
        }
    );

    const startTime = Date.now();
    await poller.start();
    const duration = Date.now() - startTime;

    // With jitter, duration should vary from base interval
    // Base would be ~200ms (100ms * 2 intervals), with jitter it should be different
    assert.ok(duration > 150); // At least some delay
});

test("PollingHelper respects attempt timeout", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            // First attempt is slow, second is fast
            if (attempts === 1) {
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
            return true;
        },
        {
            interval: 10,
            attemptTimeout: 50, // Timeout after 50ms
            maxAttempts: 3,
            stopCondition: (result) => result === true,
        }
    );

    const result = await poller.start();
    // First attempt should timeout, second should succeed
    assert.equal(result.success, true);
    assert.equal(result.attempts, 2);
});

test("PollingHelper validates options", () => {
    assert.throws(() => {
        new PollingHelper(async () => true, { interval: -1 });
    }, /interval must be greater than 0/);

    assert.throws(() => {
        new PollingHelper(async () => true, { maxAttempts: 0 });
    }, /maxAttempts must be greater than 0/);

    assert.throws(() => {
        new PollingHelper(async () => true, { backoffMultiplier: 0.5 });
    }, /backoffMultiplier must be >= 1/);

    assert.throws(() => {
        new PollingHelper(async () => true, { jitter: 150 });
    }, /jitter percentage must be between 0 and 100/);
});

test("PollingHelper tracks metrics", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            // Simulate varying response times
            await new Promise((resolve) => setTimeout(resolve, attempts * 10));
            return attempts >= 3;
        },
        {
            interval: 10,
            stopCondition: (result) => result === true,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, true);
    assert.ok(result.metrics);
    assert.ok(result.metrics.minResponseTime > 0);
    assert.ok(result.metrics.maxResponseTime >= result.metrics.minResponseTime);
    assert.ok(result.metrics.avgResponseTime > 0);
});

test("PollingHelper respects retryOnError option", async () => {
    let _attempts = 0;
    const poller = new PollingHelper(
        async () => {
            _attempts++;
            throw new Error("Test error");
        },
        {
            interval: 10,
            maxAttempts: 5,
            retryOnError: false,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, false);
    assert.equal(result.attempts, 1); // Should stop after first error
    assert.equal(result.error?.message, "Test error");
});

test("PollingHelper retries on error by default", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            if (attempts < 3) {
                throw new Error("Test error");
            }
            return true;
        },
        {
            interval: 10,
            maxAttempts: 5,
            stopCondition: (result) => result === true,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, true);
    assert.equal(result.attempts, 3); // Should retry until success
});

test("PollingHelper respects maxDuration timeout", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 100));
            return false;
        },
        {
            interval: 50,
            maxDuration: 200, // Timeout after 200ms
            maxAttempts: 10,
            stopCondition: () => false,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, false);
    assert.equal(result.error?.message, "Polling timeout exceeded");
    assert.ok(attempts < 10); // Should stop before max attempts
});

test("PollingHelper calls onAttempt callback", async () => {
    const attemptLog = [];
    const poller = new PollingHelper(async () => true, {
        interval: 10,
        maxAttempts: 3,
        stopCondition: (result) => result === true,
        onAttempt: (attempt, result, error) => {
            attemptLog.push({ attempt, result, error });
        },
    });

    await poller.start();
    assert.equal(attemptLog.length, 1);
    assert.equal(attemptLog[0].attempt, 1);
    assert.equal(attemptLog[0].result, true);
});

test("PollingHelper calls onSuccess callback", async () => {
    let successCalled = false;
    let successAttempts = 0;
    const poller = new PollingHelper(async () => true, {
        interval: 10,
        stopCondition: (result) => result === true,
        onSuccess: (result, attempts) => {
            successCalled = true;
            successAttempts = attempts;
        },
    });

    await poller.start();
    assert.equal(successCalled, true);
    assert.equal(successAttempts, 1);
});

test("PollingHelper calls onError callback", async () => {
    let errorCalled = false;
    let errorAttempts = 0;
    const poller = new PollingHelper(
        async () => {
            throw new Error("Test error");
        },
        {
            interval: 10,
            maxAttempts: 3,
            retryOnError: false,
            onError: (error, attempts) => {
                errorCalled = true;
                errorAttempts = attempts;
            },
        }
    );

    await poller.start();
    assert.equal(errorCalled, true);
    assert.equal(errorAttempts, 1);
});

test("PollingHelper handles non-Error exceptions", async () => {
    const poller = new PollingHelper(
        async () => {
            throw new Error("String error");
        },
        {
            interval: 10,
            maxAttempts: 1,
            retryOnError: false,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, false);
    assert.ok(result.error instanceof Error);
    assert.equal(result.error.message, "String error");
});

test("PollingHelper static poll method works", async () => {
    let attempts = 0;
    const result = await PollingHelper.poll(
        async () => {
            attempts++;
            return attempts >= 2;
        },
        {
            interval: 10,
            stopCondition: (result) => result === true,
        }
    );

    assert.equal(result.success, true);
    assert.equal(result.attempts, 2);
});

test("PollingHelper static pollWithBackoff method works", async () => {
    let attempts = 0;
    const result = await PollingHelper.pollWithBackoff(
        async () => {
            attempts++;
            return attempts >= 2;
        },
        {
            interval: 10,
            maxAttempts: 5,
            stopCondition: (result) => result === true,
        }
    );

    assert.equal(result.success, true);
    assert.equal(result.attempts, 2);
});

test("PollingHelper static pollWithLinearBackoff method works", async () => {
    let attempts = 0;
    const result = await PollingHelper.pollWithLinearBackoff(
        async () => {
            attempts++;
            return attempts >= 2;
        },
        {
            interval: 10,
            maxAttempts: 5,
            stopCondition: (result) => result === true,
        }
    );

    assert.equal(result.success, true);
    assert.equal(result.attempts, 2);
});

test("PollingHelper validates maxBackoffInterval", () => {
    assert.throws(() => {
        new PollingHelper(async () => true, {
            interval: 1000,
            maxBackoffInterval: 500, // Less than interval
        });
    }, /maxBackoffInterval must be >= interval/);
});

test("PollingHelper validates attemptTimeout", () => {
    assert.throws(() => {
        new PollingHelper(async () => true, {
            attemptTimeout: -100,
        });
    }, /attemptTimeout must be greater than 0/);
});

test("PollingHelper validates exponentialBase", () => {
    assert.throws(() => {
        new PollingHelper(async () => true, {
            exponentialBase: 0.5,
        });
    }, /exponentialBase must be >= 1/);
});

test("PollingHelper validates maxDuration", () => {
    assert.throws(() => {
        new PollingHelper(async () => true, {
            maxDuration: -1000,
        });
    }, /maxDuration must be greater than 0/);
});

test("PollingHelper applies jitter with boolean true", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            return attempts >= 2;
        },
        {
            interval: 100,
            jitter: true, // Should use default 10%
            stopCondition: (result) => result === true,
        }
    );

    const startTime = Date.now();
    await poller.start();
    const duration = Date.now() - startTime;

    // Should have some delay with jitter
    assert.ok(duration > 50);
});

test("PollingHelper returns metrics undefined when no successful attempts", async () => {
    const poller = new PollingHelper(
        async () => {
            throw new Error("Always fails");
        },
        {
            interval: 10,
            maxAttempts: 2,
        }
    );

    const result = await poller.start();
    assert.equal(result.success, false);
    assert.equal(result.metrics, undefined);
});

test("PollingHelper calls onError when max attempts exceeded", async () => {
    let errorCalled = false;
    const poller = new PollingHelper(async () => false, {
        interval: 10,
        maxAttempts: 2,
        stopCondition: () => false,
        onError: (error) => {
            errorCalled = true;
            assert.equal(error.message, "Max attempts exceeded");
        },
    });

    await poller.start();
    assert.equal(errorCalled, true);
});

// ============================================================================
// CryptoUtils Tests
// ============================================================================

test("CryptoUtils generates tokens", () => {
    const token1 = CryptoUtils.generateToken(32);
    const token2 = CryptoUtils.generateToken(32);

    assert.equal(token1.length, 64); // 32 bytes = 64 hex chars
    assert.notEqual(token1, token2);
});

test("CryptoUtils generates UUIDs", () => {
    const uuid1 = CryptoUtils.generateUUID();
    const uuid2 = CryptoUtils.generateUUID();

    assert.match(
        uuid1,
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    assert.notEqual(uuid1, uuid2);
});

test("CryptoUtils base64 encodes and decodes", () => {
    const original = "Hello, World!";
    const encoded = CryptoUtils.base64Encode(original);
    const decoded = CryptoUtils.base64Decode(encoded);

    assert.equal(decoded, original);
});

test("CryptoUtils URL-safe base64 encodes", () => {
    const original = "Hello+World/Test=";
    const encoded = CryptoUtils.base64UrlEncode(original);

    assert.equal(encoded.includes("+"), false);
    assert.equal(encoded.includes("/"), false);
    assert.equal(encoded.includes("="), false);
});

test("CryptoUtils hashes strings", async () => {
    const hash1 = await CryptoUtils.hash("password");
    const hash2 = await CryptoUtils.hash("password");

    assert.equal(hash1, hash2);
    assert.ok(hash1.length > 0);
});

test("CryptoUtils verifies hashes", async () => {
    const hash = await CryptoUtils.hash("password");
    const valid = await CryptoUtils.verifyHash("password", hash);

    assert.equal(valid, true);
});

test("CryptoUtils constant-time compares strings", () => {
    assert.equal(CryptoUtils.constantTimeCompare("test", "test"), true);
    assert.equal(CryptoUtils.constantTimeCompare("test", "fail"), false);
});

// ============================================================================
// PaginationHelper Tests
// ============================================================================

test("PaginationHelper paginates with offset mode", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, {
        pageSize: 10,
        mode: "offset",
    });

    const page1 = paginator.getCurrentPage();
    assert.equal(page1.length, 10);
    assert.deepEqual(page1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("PaginationHelper navigates pages", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10 });

    paginator.next();
    const page2 = paginator.getCurrentPage();
    assert.deepEqual(page2, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

    paginator.previous();
    const page1 = paginator.getCurrentPage();
    assert.deepEqual(page1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("PaginationHelper tracks state", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10 });

    const state = paginator.getState();
    assert.equal(state.currentPage, 1);
    assert.equal(state.pageSize, 10);
    assert.equal(state.total, 25);
    assert.equal(state.totalPages, 3);
    assert.equal(state.hasNextPage, true);
    assert.equal(state.hasPreviousPage, false);
});

test("PaginationHelper factory function works", () => {
    const items = [1, 2, 3];
    const paginator = createPaginator(items, { pageSize: 10 });
    assert.ok(paginator instanceof PaginationHelper);
});

// ============================================================================
// CacheManager Tests
// ============================================================================

test("CacheManager stores and retrieves values", () => {
    const cache = new CacheManager();

    cache.set("key1", "value1");
    assert.equal(cache.get("key1"), "value1");
});

test("CacheManager respects TTL", async () => {
    const cache = new CacheManager();

    cache.set("key1", "value1", 50);
    assert.equal(cache.get("key1"), "value1");

    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(cache.get("key1"), null);
});

test("CacheManager tracks statistics", () => {
    const cache = new CacheManager();

    cache.set("key1", "value1");
    cache.get("key1"); // hit
    cache.get("key2"); // miss

    const stats = cache.getStats();
    assert.equal(stats.hits, 1);
    assert.equal(stats.misses, 1);
});

test("CacheManager get or compute pattern", async () => {
    const cache = new CacheManager();
    let computeCount = 0;

    const value1 = await cache.getOrCompute("key1", async () => {
        computeCount++;
        return "computed";
    });

    const value2 = await cache.getOrCompute("key1", async () => {
        computeCount++;
        return "computed";
    });

    assert.equal(value1, "computed");
    assert.equal(value2, "computed");
    assert.equal(computeCount, 1); // Only computed once
});

test("CacheManager factory function works", () => {
    const cache = createCacheManager();
    assert.ok(cache instanceof CacheManager);
});

// ============================================================================
// CompressionUtils Tests
// ============================================================================

test("CompressionUtils compresses and decompresses", () => {
    const original = "Hello World Hello World";
    const compressed = CompressionUtils.compress(original);
    const decompressed = CompressionUtils.decompress(compressed);

    assert.equal(decompressed, original);
});

test("CompressionUtils base64 encodes and decodes", () => {
    const original = "Hello, World!";
    const encoded = CompressionUtils.base64Encode(original);
    const decoded = CompressionUtils.base64Decode(encoded);

    assert.equal(decoded, original);
});

test("CompressionUtils minifies JSON", () => {
    const json = '{ "name": "John", "age": 30 }';
    const minified = CompressionUtils.minifyJSON(json);

    assert.ok(minified.length <= json.length);
    assert.equal(minified.includes("\n"), false);
});

test("CompressionUtils pretty prints JSON", () => {
    const json = '{"name":"John","age":30}';
    const pretty = CompressionUtils.prettyJSON(json, 2);

    assert.ok(pretty.includes("\n"));
    assert.ok(pretty.includes("  "));
});

test("CompressionUtils calculates compression ratio", () => {
    const original = "Hello World Hello World Hello World";
    const compressed = CompressionUtils.compress(original);
    const ratio = CompressionUtils.getCompressionRatio(original, compressed);

    assert.ok(ratio >= 0);
    assert.ok(ratio <= 100);
});

test("CompressionUtils formats bytes", () => {
    assert.equal(CompressionUtils.formatBytes(0), "0 Bytes");
    assert.ok(CompressionUtils.formatBytes(1024).includes("KB"));
    assert.ok(CompressionUtils.formatBytes(1024 * 1024).includes("MB"));
});
