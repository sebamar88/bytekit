import { test } from "node:test";
import assert from "node:assert";
import {
    BatchRequest,
    createBatchRequest,
} from "../dist/utils/core/BatchRequest.js";

test("BatchRequest executes requests in parallel", async () => {
    const batch = new BatchRequest();
    // erased _results

    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "result1";
    });

    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "result2";
    });

    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "result3";
    });

    const startTime = Date.now();
    const result = await batch.execute();
    const duration = Date.now() - startTime;

    assert.deepStrictEqual(result, ["result1", "result2", "result3"]);
    assert(duration < 50, "Should execute in parallel");
});

test("BatchRequest executes requests sequentially", async () => {
    const batch = new BatchRequest();
    const order = [];

    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push(1);
        return "result1";
    });

    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push(2);
        return "result2";
    });

    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push(3);
        return "result3";
    });

    const result = await batch.executeSequential();

    assert.deepStrictEqual(result, ["result1", "result2", "result3"]);
    assert.deepStrictEqual(order, [1, 2, 3]);
});

test("BatchRequest handles errors with fallback", async () => {
    const batch = new BatchRequest();

    batch.add(async () => "result1");
    batch.add(async () => {
        throw new Error("Request failed");
    });
    batch.add(async () => "result3");

    const result = await batch.executeWithFallback();

    assert.strictEqual(result[0], "result1");
    assert.strictEqual(result[1], null);
    assert.strictEqual(result[2], "result3");
});

test("BatchRequest aborts on error when configured", async () => {
    const batch = new BatchRequest({ abortOnError: true });

    batch.add(async () => "result1");
    batch.add(async () => {
        throw new Error("Request failed");
    });
    batch.add(async () => "result3");

    try {
        await batch.execute();
        assert.fail("Should have thrown error");
    } catch (error) {
        assert.strictEqual(error.message, "Request failed");
    }
});

test("BatchRequest executeAsObject returns labeled results", async () => {
    const batch = new BatchRequest();

    batch.add(async () => ({ id: 1, name: "User 1" }), "users");
    batch.add(async () => ({ id: 1, title: "Post 1" }), "posts");
    batch.add(async () => ({ id: 1, content: "Comment 1" }), "comments");

    const result = await batch.executeAsObject();

    assert.deepStrictEqual(result.users, { id: 1, name: "User 1" });
    assert.deepStrictEqual(result.posts, { id: 1, title: "Post 1" });
    assert.deepStrictEqual(result.comments, { id: 1, content: "Comment 1" });
});

test("BatchRequest executeSequentialAsObject returns labeled results", async () => {
    const batch = new BatchRequest();

    batch.add(async () => "result1", "first");
    batch.add(async () => "result2", "second");
    batch.add(async () => "result3", "third");

    const result = await batch.executeSequentialAsObject();

    assert.strictEqual(result.first, "result1");
    assert.strictEqual(result.second, "result2");
    assert.strictEqual(result.third, "result3");
});

test("BatchRequest size returns number of requests", () => {
    const batch = new BatchRequest();

    assert.strictEqual(batch.size(), 0);

    batch.add(async () => "result1");
    assert.strictEqual(batch.size(), 1);

    batch.add(async () => "result2");
    assert.strictEqual(batch.size(), 2);
});

test("BatchRequest clear removes all requests", async () => {
    const batch = new BatchRequest();

    batch.add(async () => "result1");
    batch.add(async () => "result2");

    assert.strictEqual(batch.size(), 2);

    batch.clear();
    assert.strictEqual(batch.size(), 0);

    const result = await batch.execute();
    assert.deepStrictEqual(result, []);
});

test("BatchRequest clone creates independent copy", async () => {
    const original = new BatchRequest();
    original.add(async () => "result1");
    original.add(async () => "result2");

    const cloned = original.clone();
    cloned.add(async () => "result3");

    assert.strictEqual(original.size(), 2);
    assert.strictEqual(cloned.size(), 3);
});

test("BatchRequest timeout rejects on timeout", async () => {
    const batch = new BatchRequest({ timeout: 50 });

    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "result";
    });

    try {
        await batch.execute();
        assert.fail("Should have timed out");
    } catch (error) {
        assert(error.message.includes("timed out"));
    }
});

test("BatchRequest handles mixed success and timeout", async () => {
    const batch = new BatchRequest({ timeout: 50 });

    batch.add(async () => "result1");
    batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "result2";
    });
    batch.add(async () => "result3");

    const result = await batch.executeWithFallback();

    assert.strictEqual(result[0], "result1");
    assert.strictEqual(result[1], null);
    assert.strictEqual(result[2], "result3");
});

test("createBatchRequest factory function works", async () => {
    const batch = createBatchRequest();

    batch.add(async () => "result1");
    batch.add(async () => "result2");

    const result = await batch.execute();
    assert.deepStrictEqual(result, ["result1", "result2"]);
});

test("BatchRequest handles empty batch", async () => {
    const batch = new BatchRequest();
    const result = await batch.execute();
    assert.deepStrictEqual(result, []);
});
