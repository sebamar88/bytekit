import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generateFromSwagger } from "../src/cli/swagger-generator";

describe("swagger-generator", () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "swagger-test-"));
        originalCwd = process.cwd();
        process.chdir(tempDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it("should generate types from a direct JSON Swagger spec", async () => {
        const spec = {
            components: {
                schemas: {
                    User: {
                        type: "object",
                        properties: {
                            id: { type: "integer" },
                            name: { type: "string" }
                        },
                        required: ["id"]
                    }
                }
            }
        };

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => spec
        });

        const output = "api-types.ts";
        await generateFromSwagger({
            url: "https://api.example.com/swagger.json",
            output: output
        });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("export interface User");
        expect(content).toContain("id: number;");
    });

    it("should attempt to find spec JSON if URL returns HTML", async () => {
        const htmlRes = {
            ok: true,
            headers: new Headers({ "content-type": "text/html" }),
            text: async () => "<html>Swagger UI</html>"
        };

        const specRes = {
            ok: true,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
                definitions: {
                    Product: { type: "object", properties: { price: { type: "number" } } }
                }
            })
        };

        globalThis.fetch = vi.fn()
            .mockResolvedValueOnce(htmlRes)
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce(specRes);

        const output = "product-types.ts";
        await generateFromSwagger({
            url: "https://api.example.com/docs",
            output: output
        });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("export interface Product");
    });

    it("should handle enum types", async () => {
        const spec = {
            components: {
                schemas: {
                    Status: {
                        type: "string",
                        enum: ["active", "inactive"]
                    }
                }
            }
        };

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => spec
        });

        const output = "enums.ts";
        await generateFromSwagger({ url: "http://api.com/json", output });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("export type Status = 'active' | 'inactive'");
    });

    it("should warn if no schemas are found", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ components: {} })
        });
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
        await generateFromSwagger({ url: "http://api.com/empty" });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining("No schemas"));
    });

    it("should handle complex types like oneOf, allOf and additionalProperties", async () => {
        const spec = {
            components: {
                schemas: {
                    Union: { oneOf: [{ type: "string" }, { type: "number" }] },
                    Intersection: { allOf: [{ $ref: "#/components/schemas/A" }] },
                    Map: { type: "object", additionalProperties: { type: "string" } }
                }
            }
        };

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => spec
        });

        const output = "complex.ts";
        await generateFromSwagger({ url: "http://api.com/json", output });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("type Union = (string | number)");
        expect(content).toContain("type Map = Record<string, string>");
    });

    it("should handle fetch errors", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
        
        await expect(generateFromSwagger({ url: "http://api.com/fail" })).rejects.toThrow();
        expect(spy).toHaveBeenCalled();
        exitSpy.mockRestore();
    });
});
