import test from "node:test";
import assert from "node:assert/strict";
import {
    PollingHelper,
    createPoller,
} from "../dist/utils/helpers/PollingHelper.js";

test("PollingHelper succeeds when stopCondition is met", async () => {
    let _attempts = 0;
    const poller = new PollingHelper(
        async () => {
            _attempts++;
            return { status: "done" };
        },
        {
            interval: 1,
            maxAttempts: 3,
            stopCondition: (result) => result.status === "done",
        }
    );

    const result = await poller.start();

    assert.equal(result.success, true);
    assert.equal(result.attempts, 1);
    assert.deepEqual(result.result, { status: "done" });
    assert.ok(result.metrics);
});

test("PollingHelper stops on error when retryOnError is false", async () => {
    const poller = new PollingHelper(
        async () => {
            throw new Error("boom");
        },
        {
            interval: 1,
            maxAttempts: 3,
            retryOnError: false,
        }
    );

    const result = await poller.start();

    assert.equal(result.success, false);
    assert.match(result.error?.message || "", /boom/);
    assert.equal(result.attempts, 1);
});

test("PollingHelper respects attempt timeout", async () => {
    const poller = new PollingHelper(
        async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return "late";
        },
        {
            interval: 1,
            maxAttempts: 1,
            attemptTimeout: 5,
        }
    );

    const result = await poller.start();

    assert.equal(result.success, false);
    assert.match(result.error?.message || "", /Attempt timeout exceeded/);
});

test("PollingHelper abort stops polling", async () => {
    let attempts = 0;
    const poller = new PollingHelper(
        async () => {
            attempts++;
            return "pending";
        },
        {
            interval: 10,
            maxAttempts: 3,
            stopCondition: () => false,
        }
    );

    const run = poller.startWithAbort();
    setTimeout(() => poller.abort(), 5);

    const result = await run;

    assert.equal(result.success, false);
    assert.match(result.error?.message || "", /Polling aborted/);
    assert.ok(attempts >= 1);
});

test("PollingHelper validates options", () => {
    assert.throws(() => new PollingHelper(async () => "ok", { interval: 0 }));
    assert.throws(
        () => new PollingHelper(async () => "ok", { maxAttempts: 0 })
    );
    assert.throws(
        () => new PollingHelper(async () => "ok", { maxDuration: 0 })
    );
    assert.throws(
        () => new PollingHelper(async () => "ok", { backoffMultiplier: 0.5 })
    );
    assert.throws(
        () =>
            new PollingHelper(async () => "ok", {
                maxBackoffInterval: 1,
                interval: 10,
            })
    );
    assert.throws(() => new PollingHelper(async () => "ok", { jitter: 200 }));
    assert.throws(
        () => new PollingHelper(async () => "ok", { attemptTimeout: 0 })
    );
    assert.throws(
        () => new PollingHelper(async () => "ok", { exponentialBase: 0 })
    );
});

test("createPoller returns a PollingHelper instance", () => {
    const poller = createPoller(async () => "ok");
    assert.ok(poller instanceof PollingHelper);
});
