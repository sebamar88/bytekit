

import { RetryPolicy, CircuitBreaker } from "../src/index";

test("RetryPolicy retries on failure and succeeds", async () => {
    let attempts = 0;
    const policy = new RetryPolicy({ maxAttempts: 3, initialDelayMs: 10 });

    const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 3) {
            throw new Error("Network error");
        }
        return "success";
    });

    assert.equal(result, "success");
    assert.equal(attempts, 3);
});

test("RetryPolicy throws after max attempts", async () => {
    const policy = new RetryPolicy({ maxAttempts: 2, initialDelayMs: 10 });

    await assert.rejects(
        () =>
            policy.execute(async () => {
                throw new Error("Network error");
            }),
        (error) => {
            assert.equal(error.message, "Network error");
            return true;
        }
    );
});

test("CircuitBreaker opens after failure threshold", async () => {
    const breaker = new CircuitBreaker({
        failureThreshold: 2,
        timeoutMs: 100,
    });

    // First two failures
    for (let i = 0; i < 2; i++) {
        await assert.rejects(() =>
            breaker.execute(async () => {
                throw new Error("Failed");
            })
        );
    }

    assert.equal(breaker.getState(), "open");

    // Should reject immediately when open
    await assert.rejects(
        () => breaker.execute(async () => "success"),
        (error) => {
            assert.match(error.message, /Circuit breaker is open/);
            return true;
        }
    );
});

test("CircuitBreaker closes after successful recovery", async () => {
    const breaker = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 1,
        timeoutMs: 50,
    });

    // Trigger failure
    await assert.rejects(() =>
        breaker.execute(async () => {
            throw new Error("Failed");
        })
    );

    assert.equal(breaker.getState(), "open");

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should transition to half-open and succeed
    const result = await breaker.execute(async () => "recovered");
    assert.equal(result, "recovered");
    assert.equal(breaker.getState(), "closed");
});
