import { describe, it, expect } from "vitest";
import * as MainExport from "../src/index";
import * as HelpersExport from "../src/utils/helpers/index";

describe("Main Entry Points", () => {
    it("should export core utilities from main index", () => {
        expect(MainExport.ApiClient).toBeDefined();
        expect(MainExport.DateUtils).toBeDefined();
        expect(MainExport.StringUtils).toBeDefined();
    });

    it("should export helper utilities from helpers index", () => {
        expect(HelpersExport.ArrayUtils).toBeDefined();
        expect(HelpersExport.ObjectUtils).toBeDefined();
    });
});
