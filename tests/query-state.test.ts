import { describe, it, expect } from "vitest";
import {
    createInitialState,
    createLoadingState,
    createSuccessState,
    createErrorState,
} from "../src/utils/core/QueryState";
import { ApiError } from "../src/utils/core/ApiClient";

describe("QueryState Helpers", () => {
    it("should create initial state", () => {
        const state = createInitialState();
        expect(state.status).toBe("idle");
        expect(state.isIdle).toBe(true);
    });

    it("should create loading state", () => {
        const state = createLoadingState("old data");
        expect(state.status).toBe("loading");
        expect(state.data).toBe("old data");
        expect(state.isLoading).toBe(true);
    });

    it("should create success state", () => {
        const state = createSuccessState("new data");
        expect(state.status).toBe("success");
        expect(state.data).toBe("new data");
        expect(state.isSuccess).toBe(true);
    });

    it("should create error state", () => {
        const error = new ApiError("fail", 500);
        const state = createErrorState(error, "previous data");
        expect(state.status).toBe("error");
        expect(state.error).toBe(error);
        expect(state.data).toBe("previous data");
        expect(state.isError).toBe(true);
    });
});
