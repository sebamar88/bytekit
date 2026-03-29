import {
    RateLimiter,
    SlidingWindowRateLimiter,
} from "../src/utils/core/RateLimiter";

// ============================================================================
// RateLimiter Tests
// ============================================================================

test("RateLimiter (Token Bucket) limits requests", () => {
    const rl = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
    const url = "https://api.test.com";

    assert.equal(rl.isAllowed(url), true);
    assert.equal(rl.isAllowed(url), true);
    assert.equal(rl.isAllowed(url), false); // Limit reached
});

test("RateLimiter (Token Bucket) refills over time", async () => {
    const rl = new RateLimiter({ maxRequests: 2, windowMs: 100 });
    const url = "https://api.test.com";

    rl.isAllowed(url);
    rl.isAllowed(url);
    assert.equal(rl.isAllowed(url), false);

    await new Promise((r) => setTimeout(r, 150));
    assert.equal(rl.isAllowed(url), true);
});

test("RateLimiter.getStats returns correct information", () => {
    const rl = new RateLimiter({ maxRequests: 5, windowMs: 60000 });
    const url = "https://api.test.com";

    rl.isAllowed(url);
    const stats = rl.getStats(url);

    assert.equal(stats.limit, 5);
    assert.equal(stats.remaining, 4);
    assert.ok(stats.resetAt > Date.now());
});

test("SlidingWindowRateLimiter limits accurately", () => {
    const rl = new SlidingWindowRateLimiter({ maxRequests: 2, windowMs: 1000 });
    const url = "https://api.test.com";

    assert.equal(rl.isAllowed(url), true);
    assert.equal(rl.isAllowed(url), true);
    assert.equal(rl.isAllowed(url), false);
});

test("RateLimiters can be reset", () => {
    const rl = new RateLimiter({ maxRequests: 1 });
    const swrl = new SlidingWindowRateLimiter({ maxRequests: 1 });
    const url = "https://api.test.com";

    rl.isAllowed(url);
    assert.equal(rl.isAllowed(url), false);
    rl.reset(url);
    assert.equal(rl.isAllowed(url), true);

    swrl.isAllowed(url);
    assert.equal(swrl.isAllowed(url), false);
    swrl.resetAll();
    assert.equal(swrl.isAllowed(url), true);
});

test("RateLimiter.waitForAllowance blocks until allowed", async () => {
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 100 });
    const url = "https://api.test.com";

    rl.isAllowed(url); // Use the only token

    const start = Date.now();
    await rl.waitForAllowance(url);
    const duration = Date.now() - start;

    assert.ok(duration >= 100);
});

test("SlidingWindowRateLimiter.getStats", () => {
    const rl = new SlidingWindowRateLimiter({ maxRequests: 1, windowMs: 1000 });
    const url = "https://api.test.com";
    rl.isAllowed(url);
    const stats = rl.getStats(url);
    assert.equal(stats.remaining, 0);
    assert.ok(stats.retryAfter > 0);
});

test("RateLimiter.getStats returns defaults for unseen URL", () => {
    const rl = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
    const stats = rl.getStats("https://api.unknown.com");

    assert.equal(stats.limit, 3);
    assert.equal(stats.remaining, 3);
    assert.ok(stats.resetAt > Date.now());
    assert.equal(stats.retryAfter, undefined);
});

test("RateLimiter.resetAll clears buckets", () => {
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
    const url = "https://api.test.com";

    rl.isAllowed(url);
    assert.equal(rl.isAllowed(url), false);

    rl.resetAll();
    assert.equal(rl.isAllowed(url), true);
});

test("SlidingWindowRateLimiter.waitForAllowance waits for window", async () => {
    const rl = new SlidingWindowRateLimiter({ maxRequests: 1, windowMs: 50 });
    const url = "https://api.test.com";

    rl.isAllowed(url);
    const start = Date.now();
    await rl.waitForAllowance(url);
    const duration = Date.now() - start;

    assert.ok(duration >= 50);
});

test("SlidingWindowRateLimiter.getStats returns now+windowMs when no requests recorded (line 179 falsy branch)", () => {
    const rl = new SlidingWindowRateLimiter({ maxRequests: 5, windowMs: 1000 });
    const before = Date.now();
    const stats = rl.getStats("https://fresh.test.com/");
    // No isAllowed() calls made yet — validRequests is empty, resetAt = now + windowMs
    assert.ok(stats.resetAt >= before + 1000);
    assert.equal(stats.remaining, 5);
});

test("SlidingWindowRateLimiter.reset(url) clears only the specified URL (lines 194-196)", () => {
    const rl = new SlidingWindowRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
    });
    const url = "https://api.test.com/sliding-reset";
    rl.isAllowed(url);
    assert.equal(rl.isAllowed(url), false);
    rl.reset(url);
    assert.equal(rl.isAllowed(url), true);
});

test("RateLimiter uses defaults when no config provided (covers ?? branches)", () => {
    // new RateLimiter() → config = {} → all ?? right-side branches fire
    const rl = new RateLimiter();
    // Default maxRequests=100, windowMs=60000
    assert.equal(rl.isAllowed("https://api.example.com/"), true);
});

test("RateLimiter.getStats returns retryAfter when remaining=0 and undefined when remaining>0", () => {
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 60000 });
    const url = "https://api.example.com/";

    // Before any request — bucket doesn't exist yet, getStats returns full remaining
    const statsBefore = rl.getStats(url);
    assert.equal(statsBefore.remaining, 1);
    assert.equal(statsBefore.retryAfter, undefined); // remaining > 0

    // Exhaust the limit
    rl.isAllowed(url);
    rl.isAllowed(url); // limit reached

    const statsAfter = rl.getStats(url);
    assert.equal(statsAfter.remaining, 0);
    assert.ok(statsAfter.retryAfter !== undefined); // remaining === 0 → retryAfter is set
});

test("SlidingWindowRateLimiter uses defaults when no config provided (covers ?? branches)", () => {
    const rl = new SlidingWindowRateLimiter();
    // Default maxRequests=100
    assert.equal(rl.isAllowed("https://api.example.com/"), true);
});

test("RateLimiter uses custom keyGenerator option", () => {
    // covers the ?? right side for keyGenerator
    const rl = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        keyGenerator: (url) => url, // custom key fn
    });
    assert.equal(rl.isAllowed("https://a.com"), true);
    assert.equal(rl.isAllowed("https://b.com"), true); // different key, different bucket
});
