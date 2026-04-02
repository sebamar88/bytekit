import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generateFromSwagger } from "../src/cli/swagger-generator";

/** Creates a mock Response with the minimum properties that readResponseWithLimit and assertResponseUrl need. */
function jsonResponse(
    data: unknown,
    opts: { ok?: boolean; status?: number; contentType?: string; url?: string } = {}
) {
    const {
        ok = true,
        status = 200,
        contentType = "application/json",
        url = "https://api.example.com",
    } = opts;
    const body = JSON.stringify(data);
    const headers = new Headers();
    if (contentType) headers.set("content-type", contentType);
    return {
        ok,
        status,
        url,
        headers,
        body: null,
        text: async () => body,
        json: async () => JSON.parse(body),
    };
}

function htmlResponse(url = "https://api.example.com") {
    return {
        ok: true,
        url,
        headers: new Headers({ "content-type": "text/html" }),
        body: null,
        text: async () => "<html>Swagger UI</html>",
    };
}

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
                            name: { type: "string" },
                        },
                        required: ["id"],
                    },
                },
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(spec));

        const output = "api-types.ts";
        await generateFromSwagger({
            url: "https://api.example.com/swagger.json",
            output: output,
        });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("export interface User");
        expect(content).toContain("id: number;");
    });

    it("should attempt to find spec JSON if URL returns HTML", async () => {
        const specData = {
            definitions: {
                Product: {
                    type: "object",
                    properties: { price: { type: "number" } },
                },
            },
        };

        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(htmlResponse("https://api.example.com/docs"))
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce(jsonResponse(specData));

        const output = "product-types.ts";
        await generateFromSwagger({
            url: "https://api.example.com/docs",
            output: output,
        });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("export interface Product");
    });

    it("skips HTML fallback candidates that return non-JSON content-types", async () => {
        const nonJsonRes = {
            ok: true,
            url: "https://api.example.com",
            headers: new Headers({ "content-type": "text/html" }),
            body: null,
            text: async () => "<html></html>",
        };

        const specData = {
            components: {
                schemas: {
                    AuditLog: {
                        type: "object",
                        properties: { id: { type: "string" } },
                    },
                },
            },
        };

        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(htmlResponse("https://api.example.com/docs"))
            .mockResolvedValueOnce(nonJsonRes)
            .mockResolvedValueOnce(jsonResponse(specData));

        await generateFromSwagger({
            url: "https://api.example.com/docs",
            output: "audit-log.ts",
        });

        const content = await fs.readFile(
            path.join(tempDir, "audit-log.ts"),
            "utf8"
        );
        expect(content).toContain("export interface AuditLog");
    });

    it("covers HTML fallback candidates whose content-type header is missing", async () => {
        const missingContentTypeRes = {
            ok: true,
            url: "https://api.example.com",
            headers: { get: () => null },
            body: null,
            text: async () => "",
        };

        const specData = {
            components: {
                schemas: {
                    MissingHeaderSpec: {
                        type: "object",
                        properties: { ok: { type: "boolean" } },
                    },
                },
            },
        };

        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(htmlResponse("https://api.example.com/docs"))
            .mockResolvedValueOnce(missingContentTypeRes)
            .mockResolvedValueOnce(jsonResponse(specData));

        await generateFromSwagger({
            url: "https://api.example.com/docs",
            output: "missing-header.ts",
        });

        const content = await fs.readFile(
            path.join(tempDir, "missing-header.ts"),
            "utf8"
        );
        expect(content).toContain("export interface MissingHeaderSpec");
    });

    it("covers trailing-slash baseUrl branch in HTML path (line 53 true branch)", async () => {
        // When baseUrl ends with '/', the tryUrl uses p.slice(1) instead of plain concatenation
        const specData = {
            components: {
                schemas: {
                    Item: {
                        type: "object",
                        properties: { id: { type: "integer" } },
                    },
                },
            },
        };

        // URL "https://api.example.com/v1/" — trailing slash not matching /docs or /swagger-ui
        // so baseUrl stays as "https://api.example.com/v1/"
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(htmlResponse("https://api.example.com/v1/"))
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce(jsonResponse(specData));

        const output = "item-types.ts";
        await generateFromSwagger({
            url: "https://api.example.com/v1/",
            output,
        });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("export interface Item");
    });

    it("throws when HTML spec page has no resolvable JSON endpoint (line 69 !found throw)", async () => {
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(htmlResponse("https://api.example.com/docs"))
            .mockRejectedValueOnce(new Error("net"))
            .mockResolvedValue({ ok: false });

        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        await expect(
            generateFromSwagger({ url: "https://api.example.com/docs" })
        ).rejects.toThrow();

        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should handle enum types", async () => {
        const spec = {
            components: {
                schemas: {
                    Status: {
                        type: "string",
                        enum: ["active", "inactive"],
                    },
                },
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(spec));

        const output = "enums.ts";
        await generateFromSwagger({ url: "https://api.com/json", output });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("export type Status = 'active' | 'inactive'");
    });

    it("should warn if no schemas are found", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ components: {} }));
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
        await generateFromSwagger({ url: "https://api.com/empty" });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining("No schemas"));
    });

    it("should handle complex types like oneOf, allOf and additionalProperties", async () => {
        const spec = {
            components: {
                schemas: {
                    Union: { oneOf: [{ type: "string" }, { type: "number" }] },
                    Intersection: {
                        allOf: [{ $ref: "#/components/schemas/A" }],
                    },
                    Map: {
                        type: "object",
                        additionalProperties: { type: "string" },
                    },
                },
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(spec));

        const output = "complex.ts";
        await generateFromSwagger({ url: "https://api.com/json", output });

        const content = await fs.readFile(path.join(tempDir, output), "utf8");
        expect(content).toContain("type Union = (string | number)");
        expect(content).toContain("type Map = Record<string, string>");
    });

    it("should handle fetch errors", async () => {
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue({ ok: false, status: 500, url: "https://api.com/fail" });
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        await expect(
            generateFromSwagger({ url: "https://api.com/fail" })
        ).rejects.toThrow();
        expect(spy).toHaveBeenCalled();
        exitSpy.mockRestore();
    });

    it("covers mapOpenApiToTs case array, case object, and default fallbacks", async () => {
        // Exercises the "array", "object" (with + without additionalProperties),
        // and the default "any" branch in mapOpenApiToTs
        const spec = {
            components: {
                schemas: {
                    Order: {
                        type: "object",
                        properties: {
                            // "array" case: items typed as string
                            tags: { type: "array", items: { type: "string" } },
                            // "object" without additionalProperties → Record<string, any>
                            rawMeta: { type: "object" },
                            // "object" WITH additionalProperties → Record<string, number>
                            counts: {
                                type: "object",
                                additionalProperties: { type: "number" },
                            },
                            // no type, no $ref, no combinations → "any" fallback
                            unknownField: {},
                        },
                        required: ["tags"],
                    },
                    // schema with BOTH properties AND additionalProperties → extends Record<> interface
                    HybridMap: {
                        type: "object",
                        properties: {
                            label: { type: "string" },
                        },
                        additionalProperties: { type: "boolean" },
                    },
                },
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(spec));

        await generateFromSwagger({
            url: "https://api.com/json",
            output: "order.ts",
        });
        const content = await fs.readFile(
            path.join(tempDir, "order.ts"),
            "utf8"
        );

        expect(content).toContain("tags: string[];"); // array case
        expect(content).toContain("rawMeta?: Record<string, any>;"); // object without additionalProperties
        expect(content).toContain("counts?: Record<string, number>;"); // object with additionalProperties
        expect(content).toContain("unknownField?: any;"); // default "any" fallback
        // Hybrid: interface with both properties and additionalProperties → extends Record
        expect(content).toContain("extends Record<string, boolean>");
    });

    it("covers string type with date/date-time format → string | Date", async () => {
        const spec = {
            components: {
                schemas: {
                    Event: {
                        type: "object",
                        properties: {
                            createdAt: { type: "string", format: "date-time" },
                            date: { type: "string", format: "date" },
                        },
                    },
                },
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(spec));

        await generateFromSwagger({
            url: "https://api.com/json",
            output: "event.ts",
        });
        const content = await fs.readFile(
            path.join(tempDir, "event.ts"),
            "utf8"
        );
        expect(content).toContain("string | Date");
    });

    it("covers anyOf schema combinations and null content-type fallback", async () => {
        // anyOf branch in mapOpenApiToTs (schema.oneOf falsy, schema.anyOf truthy)
        // Also: response has no content-type header → || '' fallback at line 31
        const spec = {
            components: {
                schemas: {
                    AnyUnion: {
                        anyOf: [{ type: "string" }, { type: "number" }],
                    },
                },
            },
        };

        const body = JSON.stringify(spec);
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            url: "https://api.com/json",
            headers: new Headers(), // no content-type → null → "" fallback (line 31)
            body: null,
            text: async () => body,
            json: async () => spec,
        });

        await generateFromSwagger({
            url: "https://api.com/json",
            output: "any-union.ts",
        });
        const content = await fs.readFile(
            path.join(tempDir, "any-union.ts"),
            "utf8"
        );
        expect(content).toContain("AnyUnion");
    });

    it("covers enum with non-string values (line 153 FALSE ternary), !schema (line 162 TRUE), and empty refName (line 167 FALSE)", async () => {
        // 1. schema.enum with numeric values → typeof v !== 'string' → v (not wrapped in quotes)
        // 2. Schema with $ref: "" → refName = "" (falsy) → return "any"
        // 3. Array without items → mapOpenApiToTs(undefined) → !schema → return "any"
        const spec = {
            components: {
                schemas: {
                    // Numeric enum — triggers FALSE branch of (typeof v === "string" ? `'${v}'` : v)
                    Priority: { enum: [1, 2, 3] },
                    // Object with $ref property that has empty ref name
                    WithRef: {
                        type: "object",
                        properties: {
                            item: { $ref: "" }, // empty $ref → refName = "" (falsy)
                            arr: { type: "array" }, // array without items → mapOpenApiToTs(undefined)
                        },
                    },
                },
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(spec));

        await generateFromSwagger({
            url: "https://api.com/json",
            output: "edge-cases.ts",
        });
        const content = await fs.readFile(
            path.join(tempDir, "edge-cases.ts"),
            "utf8"
        );

        // Numeric enum: values 1, 2, 3 (not quoted)
        expect(content).toContain("Priority");
        expect(content).toMatch(/1 \| 2 \| 3/);

        // Empty $ref → "any"
        expect(content).toContain("item?: any");

        // Array without items → "any[]"
        expect(content).toContain("arr?:");
    });

    it("covers null content-type header (line 32 || fallback) with plain object headers mock", async () => {
        // Using a plain object mock with get() returning null guarantees the null path
        const spec = { components: { schemas: { Item: { type: "string" } } } };

        const body = JSON.stringify(spec);
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            url: "https://api.com/json",
            headers: { get: (_: string) => null }, // Always returns null → || "" taken
            body: null,
            text: async () => body,
            json: async () => spec,
        });

        await generateFromSwagger({
            url: "https://api.com/json",
            output: "null-ct.ts",
        });
        const content = await fs.readFile(
            path.join(tempDir, "null-ct.ts"),
            "utf8"
        );
        expect(content).toContain("Item");
    });

    it("sanitizes unsafe schema names and property keys", async () => {
        const spec = {
            components: {
                schemas: {
                    "user-profile": {
                        type: "object",
                        properties: {
                            "display-name": { type: "string" },
                            default: { type: "boolean" },
                        },
                    },
                },
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(spec));

        await generateFromSwagger({
            url: "https://api.com/json",
            output: "sanitized.ts",
        });
        const content = await fs.readFile(
            path.join(tempDir, "sanitized.ts"),
            "utf8"
        );

        expect(content).toContain("export interface UserProfile");
        expect(content).toContain('"display-name"?: string;');
        expect(content).toContain('"default"?: boolean;');
    });

    it("rejects insecure remote http swagger urls", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        await expect(
            generateFromSwagger({ url: "http://api.com/json" })
        ).rejects.toThrow(/requires https/i);

        spy.mockRestore();
        exitSpy.mockRestore();
    });
});
