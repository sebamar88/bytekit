import { ApiClient } from "../src/index";
import { RateLimiter } from "../src/utils/core/RateLimiter";

test("ApiClient - integrated rate limiting", async () => {
    let callCount = 0;
    const fetchImpl = async () => {
        callCount++;
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };

    // Limit to 2 requests per 100ms
    const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100,
    });

    const api = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        rateLimiter: limiter,
    });

    const start = Date.now();

    // First 2 should be immediate
    await api.get("/1");
    await api.get("/2");

    assert.equal(callCount, 2);

    // Third one should wait
    await api.get("/3");
    const end = Date.now();

    assert.equal(callCount, 3);
    assert.ok(
        end - start >= 100,
        `Should have waited at least 100ms, but took ${end - start}ms`
    );
});

test("ApiClient - supports rateLimiter config object in constructor", async () => {
    let callCount = 0;
    const fetchImpl = async () => {
        callCount++;
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };

    const api = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        rateLimiter: {
            maxRequests: 1,
            windowMs: 50,
        },
    });

    const start = Date.now();
    await api.get("/1");
    await api.get("/2");
    const end = Date.now();

    assert.equal(callCount, 2);
    assert.ok(
        end - start >= 50,
        "Should have respected rate limit config object"
    );
});

test("ApiClient - rate limiting wait can be aborted", async () => {
    const fetchImpl = async () => new Response("ok");

    const api = new ApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
        rateLimiter: {
            maxRequests: 1,
            windowMs: 1000, // Long wait
        },
    });

    // First request consumes the token
    await api.get("/1");

    const controller = new AbortController();
    const start = Date.now();

    // Second request should wait
    const promise = api.get("/2", { signal: controller.signal });

    // Abort after 50ms
    setTimeout(() => controller.abort(), 50);

    try {
        await promise;
        assert.fail("Should have thrown AbortError");
    } catch (err: any) {
        // Depending on environment/implementation, it might be AbortError or the reason
        assert.ok(controller.signal.aborted);
    }

    const end = Date.now();
    assert.ok(
        end - start < 500,
        "Should have aborted quickly, not waited full window"
    );
});
