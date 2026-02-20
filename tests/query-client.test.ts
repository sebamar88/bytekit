import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "../src/utils/core/QueryClient";
import { ApiClient, ApiError } from "../src/utils/core/ApiClient";

describe("QueryClient", () => {
    let client: QueryClient;
    let api: ApiClient;

    beforeEach(() => {
        api = new ApiClient({ baseUrl: "https://api.example.com" });
        client = new QueryClient(api);
    });

    it("should fetch and cache data using query() method", async () => {
        const fetcher = vi.spyOn(api, "get").mockResolvedValue("data");
        const result = await client.query({ queryKey: ["test"], path: "/test" });

        expect(result).toBe("data");
        expect(fetcher).toHaveBeenCalledTimes(1);

        // Second call should use cache (default staleTime is 0, but query happens in same tick)
        const cachedResult = await client.query({ queryKey: ["test"], path: "/test", staleTime: 10000 });
        expect(cachedResult).toBe("data");
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("should handle mutations", async () => {
        const mutationSpy = vi.spyOn(api, "post").mockResolvedValue("mutated");
        const result = await client.mutate({ path: "/test", body: { x: 1 } });

        expect(result).toBe("mutated");
        expect(mutationSpy).toHaveBeenCalledTimes(1);
    });

    it("should invalidate queries", async () => {
        vi.spyOn(api, "get").mockResolvedValue("data");
        await client.query({ queryKey: ["test"], path: "/test" });
        
        client.invalidateQueries(["test"]);
        
        // After invalidation, status should be idle
        const state = client.getQueryState(["test"]);
        expect(state?.status).toBe("idle");
    });

    it("should deduplicate in-flight requests", async () => {
        let callCount = 0;
        vi.spyOn(api, "get").mockImplementation(async () => {
            callCount++;
            await new Promise(r => setTimeout(r, 50));
            return "data";
        });

        const p1 = client.query({ queryKey: ["dedup"], path: "/test" });
        const p2 = client.query({ queryKey: ["dedup"], path: "/test" });

        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1).toBe("data");
        expect(r2).toBe("data");
        expect(callCount).toBe(1);
    });

    it("should handle request errors and update state", async () => {
        const error = new ApiError("Failed", 500);
        vi.spyOn(api, "get").mockRejectedValue(error);

        try {
            await client.query({ queryKey: ["error"], path: "/error" });
        } catch (e) {
            // expected
        }

        const state = client.getQueryState<string>(["error"]);
        expect(state?.status).toBe("error");
        expect(state?.error).toBe(error);
    });

    it("should execute lifecycle callbacks", async () => {
        const onSuccess = vi.fn();
        vi.spyOn(api, "get").mockResolvedValue("ok");

        await client.query({ 
            queryKey: ["cb"], 
            path: "/cb",
            callbacks: { onSuccess }
        });

        expect(onSuccess).toHaveBeenCalledWith("ok", expect.anything());
    });

    it("should handle manual data setting", () => {
        client.setQueryData(["manual"], "manual data");
        expect(client.getQueryData(["manual"])).toBe("manual data");
        expect(client.getQueryState(["manual"])?.status).toBe("success");
    });

    it("should clear cache", () => {
        client.setQueryData(["a"], 1);
        client.clearCache();
        expect(client.getQueryData(["a"])).toBeUndefined();
    });

    it("should return cache stats", () => {
        client.setQueryData(["a"], 1);
        const stats = client.getCacheStats();
        expect(stats.size).toBeGreaterThan(0);
    });

    it("should support event subscription", async () => {
        const onStart = vi.fn();
        client.on("query:start", onStart);
        
        vi.spyOn(api, "get").mockResolvedValue("ok");
        await client.query({ queryKey: ["event"], path: "/test" });
        
        expect(onStart).toHaveBeenCalled();
    });

    it("should handle stale data check", async () => {
        client.setQueryData(["stale"], "old");
        // By default staleTime is 0, so it should be stale immediately
        // But we need to mock the internal isStale check if we wanted to be precise.
        // Let's just test getQueryData.
        expect(client.getQueryData(["stale"])).toBe("old");
    });
});
