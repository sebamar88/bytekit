import { describe, it, expect } from "vitest";
import * as MainExport from "../src/index";

describe("Main Entry Points", () => {
    it("should export core utilities from main index", () => {
        expect(MainExport.ApiClient).toBeDefined();
    });
});
