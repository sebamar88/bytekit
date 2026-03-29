/* eslint-disable @typescript-eslint/no-explicit-any */
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

test("CircuitBreaker uses custom error message formatter", async () => {
    const breaker = new CircuitBreaker({
        failureThreshold: 1,
        errorMessageFormatter: (ms: number) => `Wait ${ms / 1000}s`,
    });

    // Trigger failure
    await assert.rejects(() =>
        breaker.execute(async () => {
            throw new Error("Failed");
        })
    );

    assert.equal(breaker.getState(), "open");

    // Should use custom formatter
    await assert.rejects(
        () => breaker.execute(async () => "success"),
        (error: any) => {
            assert.match(error.message, /Wait \d+(\.\d+)?s/);
            return true;
        }
    );
});

test("CircuitBreaker.reset() returns circuit to closed state and allows execution (lines 105-109)", async () => {
    const breaker = new CircuitBreaker({
        failureThreshold: 1,
        timeoutMs: 60000,
    });
    await assert.rejects(() =>
        breaker.execute(async () => {
            throw new Error("fail");
        })
    );
    assert.equal(breaker.getState(), "open");
    breaker.reset();
    assert.equal(breaker.getState(), "closed");
    const result = await breaker.execute(async () => "recovered");
    assert.equal(result, "recovered");
});

test("CircuitBreaker falls back to default message when errorMessageFormatter throws (line 48)", async () => {
    const breaker = new CircuitBreaker({
        failureThreshold: 1,
        timeoutMs: 60000,
        errorMessageFormatter: () => {
            throw new Error("formatter crash");
        },
    });
    await assert.rejects(() =>
        breaker.execute(async () => {
            throw new Error("fail");
        })
    );
    await assert.rejects(
        () => breaker.execute(async () => "ok"),
        (err: any) => {
            assert.match(err.message, /Circuit breaker is open/);
            return true;
        }
    );
});

test("RetryPolicy with maxAttempts 0 throws fallback error (line 150)", async () => {
    const policy = new RetryPolicy({ maxAttempts: 0, initialDelayMs: 0 });
    await assert.rejects(
        () => policy.execute(async () => "never"),
        (err: any) => {
            assert.equal(err.message, "Retry policy failed");
            return true;
        }
    );
});

test("RetryPolicy converts non-Error throw to Error (line 136 false branch)", async () => {
    // When fn() throws a non-Error value (e.g., a string), it wraps with new Error(String(value))
    const policy = new RetryPolicy({ maxAttempts: 1, initialDelayMs: 0 });
    await assert.rejects(
        () =>
            policy.execute(async () => {
                throw "plain string error";
            }),
        (err: any) => {
            assert.equal(err.message, "plain string error");
            return true;
        }
    );
});
