import { TimeUtils } from "../src/index";

describe("TimeUtils", () => {
    it("sleep should wait for specified time", async () => {
        const start = Date.now();
        await TimeUtils.sleep(50);
        const duration = Date.now() - start;
        assert.ok(
            duration >= 45,
            `Duration ${duration}ms should be at least 45ms`
        );
    });

    it("delay should execute function after delay", async () => {
        const result = await TimeUtils.delay(() => "done", 50);
        assert.strictEqual(result, "done");
    });

    it("timeout should resolve if promise finishes in time", async () => {
        const promise = Promise.resolve("success");
        const result = await TimeUtils.timeout(promise, 100);
        assert.strictEqual(result, "success");
    });

    it("timeout should reject if promise takes too long", async () => {
        const promise = new Promise((resolve) =>
            setTimeout(() => resolve("late"), 100)
        );
        await assert.rejects(
            () => TimeUtils.timeout(promise, 50, "custom timeout message"),
            {
                name: "Error",
                message: "custom timeout message",
            }
        );
    });

    it("retryAsync should succeed if function succeeds", async () => {
        let attempts = 0;
        const result = await TimeUtils.retryAsync(async () => {
            attempts++;
            return "ok";
        });
        assert.strictEqual(result, "ok");
        assert.strictEqual(attempts, 1);
    });

    it("retryAsync should retry on failure and eventually succeed", async () => {
        let attempts = 0;
        const result = await TimeUtils.retryAsync(
            async () => {
                attempts++;
                if (attempts < 3) throw new Error("fail");
                return "recovered";
            },
            { initialDelayMs: 10, maxAttempts: 5 }
        );
        assert.strictEqual(result, "recovered");
        assert.strictEqual(attempts, 3);
    });

    it("retryAsync should throw after max attempts", async () => {
        let attempts = 0;
        await assert.rejects(
            () =>
                TimeUtils.retryAsync(
                    async () => {
                        attempts++;
                        throw new Error("persistent failure");
                    },
                    { initialDelayMs: 1, maxAttempts: 3 }
                ),
            {
                message: "persistent failure",
            }
        );
        assert.strictEqual(attempts, 3);
    });

    it("measureAsync should return result and duration", async () => {
        const { result, durationMs } = await TimeUtils.measureAsync(
            async () => {
                await TimeUtils.sleep(50);
                return "result";
            }
        );
        assert.strictEqual(result, "result");
        assert.ok(durationMs >= 45);
    });

    it("measureSync should return result and duration", () => {
        const { result, durationMs } = TimeUtils.measureSync(() => {
            let sum = 0;
            for (let i = 0; i < 1000000; i++) sum += i;
            return sum;
        });
        assert.ok(result > 0);
        assert.ok(durationMs >= 0);
    });

    it("formatDuration should format correctly", () => {
        assert.strictEqual(TimeUtils.formatDuration(500), "500ms");
        assert.strictEqual(TimeUtils.formatDuration(1500), "1.50s");
        assert.strictEqual(TimeUtils.formatDuration(90000), "1.50m");
        assert.strictEqual(TimeUtils.formatDuration(5400000), "1.50h");
    });

    it("parseDuration should parse correctly", () => {
        assert.strictEqual(TimeUtils.parseDuration("500ms"), 500);
        assert.strictEqual(TimeUtils.parseDuration("1.5s"), 1500);
        assert.strictEqual(TimeUtils.parseDuration("1m"), 60000);
        assert.strictEqual(TimeUtils.parseDuration("1h"), 3600000);
        assert.strictEqual(TimeUtils.parseDuration("1d"), 86400000);
    });

    it("parseDuration should throw on invalid format", () => {
        assert.throws(
            () => TimeUtils.parseDuration("invalid"),
            /Invalid duration format/
        );
        assert.throws(
            () => TimeUtils.parseDuration("100x"),
            /Invalid duration format/
        );
    });

    it("createQueue should process tasks with concurrency", async () => {
        const queue = TimeUtils.createQueue(2);
        let active = 0;
        let maxActive = 0;

        const createTask = (id) => async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await TimeUtils.sleep(50);
            active--;
            return id;
        };

        const results = await Promise.all([
            queue.add(createTask(1)),
            queue.add(createTask(2)),
            queue.add(createTask(3)),
            queue.add(createTask(4)),
        ]);

        assert.deepStrictEqual(results, [1, 2, 3, 4]);
        assert.strictEqual(maxActive, 2);
    });

    it("debounce should delay execution", async () => {
        let counter = 0;
        const debounced = TimeUtils.debounce(() => counter++, 50);

        debounced();
        debounced();
        debounced();

        assert.strictEqual(counter, 0);
        await TimeUtils.sleep(100);
        assert.strictEqual(counter, 1);
    });

    it("throttle should limit execution frequency", async () => {
        let counter = 0;
        const throttled = TimeUtils.throttle(() => counter++, 50);

        throttled(); // 1st call executes lead if enabled (default true)
        throttled();
        throttled();

        assert.strictEqual(counter, 1);
        await TimeUtils.sleep(100);
        assert.strictEqual(counter, 2); // 2nd execution from trailing if enabled (default true)
    });
});
