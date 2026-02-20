import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient } from "../src/utils/core/QueryClient";
import { ApiClient } from "../src/utils/core/ApiClient";

describe("QueryClient Refetch Scenarios", () => {
    let client: QueryClient;
    let api: ApiClient;

    beforeEach(() => {
        api = new ApiClient({ baseUrl: "https://api.example.com" });
        client = new QueryClient(api);
    });

    it("should handle invalidation of multiple queries", () => {
        client.setQueryData(["user", "1"], { name: "A" });
        client.setQueryData(["user", "2"], { name: "B" });

        client.invalidateQueries(["user"]);

        expect(client.getQueryState(["user", "1"])?.status).toBe("idle");
        expect(client.getQueryState(["user", "2"])?.status).toBe("idle");
    });

    it("should support query state transition checks", () => {
        client.setQueryData(["test"], "data");
        const state = client.getQueryState(["test"]);
        expect(state?.isSuccess).toBe(true);
        expect(state?.isFetching).toBe(false);
    });

    it("should handle cache clearing", () => {
        client.setQueryData(["test"], "data");
        client.clearCache();
        expect(client.getQueryData(["test"])).toBeUndefined();
    });
});
