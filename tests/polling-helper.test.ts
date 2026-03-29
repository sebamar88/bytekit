import {
    PollingHelper,
    createPoller,
} from "../src/utils/helpers/PollingHelper";

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

test("PollingHelper.poll static method successfully polls and resolves (T025 static)", async () => {
    const result = await PollingHelper.poll(async () => "done", {
        interval: 1,
        maxAttempts: 3,
        stopCondition: (r) => r === "done",
    });
    assert.equal(result.success, true);
    assert.equal(result.result, "done");
});

test("PollingHelper.pollWithBackoff static method works (T025 backoff)", async () => {
    const result = await PollingHelper.pollWithBackoff(async () => "ok", {
        interval: 1,
        maxAttempts: 3,
        stopCondition: (r) => r === "ok",
    });
    assert.equal(result.success, true);
});

test("PollingHelper.pollWithLinearBackoff static method works (T025 linear)", async () => {
    const result = await PollingHelper.pollWithLinearBackoff(async () => "ok", {
        interval: 1,
        maxAttempts: 3,
        stopCondition: (r) => r === "ok",
    });
    assert.equal(result.success, true);
});

test("PollingHelper applies numeric jitter on retries (lines ~293-310)", async () => {
    let attempt = 0;
    const result = await PollingHelper.poll(
        async () => {
            attempt++;
            return attempt >= 2 ? "done" : "pending";
        },
        {
            interval: 5,
            maxAttempts: 3,
            stopCondition: (r) => r === "done",
            jitter: 10, // numeric jitter — exercises applyJitter body
        }
    );
    assert.equal(result.success, true);
    assert.equal(result.result, "done");
    assert.equal(result.attempts, 2);
});

test("PollingHelper normalises non-Error throw into Error (line 126)", async () => {
    const poller = new PollingHelper(
        async () => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw "raw string error";
        },
        { interval: 1, maxAttempts: 1, retryOnError: false }
    );
    const result = await poller.start();
    assert.equal(result.success, false);
    assert.ok(result.error instanceof Error);
    assert.equal(result.error.message, "raw string error");
});
