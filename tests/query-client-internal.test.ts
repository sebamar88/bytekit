import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "../src/utils/core/QueryClient";
import { ApiClient } from "../src/utils/core/ApiClient";

describe("QueryClient Internal Logic", () => {
    let client: QueryClient;
    let api: ApiClient;

    beforeEach(() => {
        api = new ApiClient({ baseUrl: "https://api.example.com" });
        client = new QueryClient(api);
    });

    it("should correctly identify stale data", async () => {
        client.setQueryData(["test"], "data");
        const cacheKey = JSON.stringify(["test"]);
        const cached = (client as any).cache.get(cacheKey);
        
        // Manipulate cachedAt to the past
        cached.cachedAt = Date.now() - 1000;
        
        // staleTime = 500 means it IS stale
        expect((client as any).isStale(cached, 500)).toBe(true);
        // staleTime = Infinity means never stale
        expect((client as any).isStale(cached, Infinity)).toBe(false);
    });

    it("should handle mixed lifecycle callbacks", async () => {
        const onStart = vi.fn();
        const onSettled = vi.fn();
        
        vi.spyOn(api, "get").mockResolvedValue("ok");
        
        await client.query({ 
            queryKey: ["cb"], 
            path: "/cb",
            callbacks: { onStart, onSettled }
        });

        expect(onStart).toHaveBeenCalled();
        expect(onSettled).toHaveBeenCalled();
    });

    it("should handle placeholder data", async () => {
        vi.spyOn(api, "get").mockImplementation(() => new Promise(r => setTimeout(() => r("real"), 10)));
        
        const promise = client.query({ 
            queryKey: ["placeholder"], 
            path: "/test",
            placeholderData: "placeholder"
        });
        
        const state = client.getQueryState(["placeholder"]);
        // Data should be placeholder initially
        expect(state?.data).toBe("placeholder");
        
        await promise;
    });
});
