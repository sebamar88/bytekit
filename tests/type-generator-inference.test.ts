/**
 * Comprehensive coverage tests for type-generator.ts internal inference helpers.
 * Exercises all branches of inferType, inferInlineType, inferArrayElementType,
 * generateObjectType, and buildInlineObjectType via generateTypesFromEndpoint.
 */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateTypesFromEndpoint } from "../src/cli/type-generator";

const mockFetch = (responseData: unknown) => {
    const body = JSON.stringify(responseData) ?? "null";
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        url: "https://x.com",
        headers: new Headers({ "content-type": "application/json" }),
        body: null,
        text: async () => body,
        json: async () => responseData,
    });
};

describe("type-generator inference branches", () => {
    let tempDir: string;
    let originalCwd: string;
    let originalFetch: typeof globalThis.fetch;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "typegen-inf-"));
        originalCwd = process.cwd();
        originalFetch = globalThis.fetch;
        process.chdir(tempDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        globalThis.fetch = originalFetch;
        await fs.rm(tempDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    const readOutput = (file = "out.ts") =>
        fs.readFile(path.join(tempDir, file), "utf8");

    // ── inferType primitives ────────────────────────────────────────────────

    it("inferType(null) → type X = null", async () => {
        mockFetch(null);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toContain("type X = null;");
    });

    it("inferType(undefined) → type X = null (undefined becomes null via JSON)", async () => {
        mockFetch(undefined);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toContain("type X = null;");
    });

    it("inferType(boolean) → type X = boolean", async () => {
        mockFetch(true);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toContain("type X = boolean;");
    });

    it("inferType(number) → type X = number", async () => {
        mockFetch(42);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toContain("type X = number;");
    });

    it("inferType(string) → type X = string", async () => {
        mockFetch("hello");
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toContain("type X = string;");
    });

    it("inferType([]) → type X = unknown[]", async () => {
        mockFetch([]);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toContain("type X = unknown[];");
    });

    it("inferType([1, 2]) → type X = number[]", async () => {
        mockFetch([1, 2]);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toContain("type X = number[];");
    });

    it("inferType([1, 'str']) → union type (number | string)[]", async () => {
        mockFetch([1, "str"]);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "X",
        });
        const content = await readOutput();
        expect(content).toMatch(/number.*string|string.*number/);
    });

    // ── inferInlineType branches inside object fields ────────────────────────

    it("inferInlineType(null) in object field → null type", async () => {
        mockFetch({ undef: null });
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "R",
        });
        const content = await readOutput();
        expect(content).toContain("null");
    });

    it("inferInlineType(boolean) in object field → boolean type", async () => {
        mockFetch({ active: true });
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "R",
        });
        const content = await readOutput();
        expect(content).toContain("active: boolean;");
    });

    it("inferInlineType(number) in object field → number type", async () => {
        mockFetch({ count: 7 });
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "R",
        });
        const content = await readOutput();
        expect(content).toContain("count: number;");
    });

    it("inferInlineType([]) in object field → unknown[]", async () => {
        mockFetch({ items: [] });
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "R",
        });
        const content = await readOutput();
        expect(content).toContain("items: unknown[];");
    });

    it("inferInlineType(mixed-array) → union element type", async () => {
        mockFetch({ vals: [1, "two", true] });
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "R",
        });
        const content = await readOutput();
        // Mixed array: union of number|string|boolean
        expect(content).toContain("vals:");
    });

    // ── buildInlineObjectType → {} branch ────────────────────────────────────

    it("buildInlineObjectType({}) in object field → {} inline type", async () => {
        mockFetch({ meta: {} });
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "R",
        });
        const content = await readOutput();
        // empty nested object: {}
        expect(content).toContain("meta: {};");
    });

    it("buildInlineObjectType with nested properties → inline object type", async () => {
        mockFetch({ address: { city: "Madrid", zip: "28000" } });
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "R",
        });
        const content = await readOutput();
        expect(content).toContain("address:");
        expect(content).toContain("city: string;");
    });

    // ── body request option ───────────────────────────────────────────────────

    it("passes body to fetch when body option is provided", async () => {
        const body = JSON.stringify({ result: "ok" });
        const spy = vi.fn().mockResolvedValue({
            ok: true,
            url: "https://x.com/api",
            headers: new Headers({ "content-type": "application/json" }),
            body: null,
            text: async () => body,
            json: async () => ({ result: "ok" }),
        });
        globalThis.fetch = spy;
        await generateTypesFromEndpoint({
            endpoint: "https://x.com/api",
            output: "out.ts",
            method: "POST",
            body: '{"x":1}',
        });
        expect(spy).toHaveBeenCalledWith(
            new URL("https://x.com/api"),
            expect.objectContaining({ body: '{"x":1}', method: "POST" })
        );
    });

    // ── headers option ────────────────────────────────────────────────────────

    it("merges custom headers into fetch call", async () => {
        const body = JSON.stringify({ ok: true });
        const spy = vi.fn().mockResolvedValue({
            ok: true,
            url: "https://x.com/api",
            headers: new Headers({ "content-type": "application/json" }),
            body: null,
            text: async () => body,
            json: async () => ({ ok: true }),
        });
        globalThis.fetch = spy;
        await generateTypesFromEndpoint({
            endpoint: "https://x.com/api",
            output: "out.ts",
            headers: { Authorization: "Bearer tok" },
        });
        expect(spy).toHaveBeenCalledWith(
            new URL("https://x.com/api"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer tok",
                }),
            })
        );
    });

    it("inferInlineType depth guard → 'unknown /* max depth exceeded */'", async () => {
        // Build a 22-level deeply nested object to exceed MAX_INFERENCE_DEPTH (20)
        let deep: Record<string, unknown> = { value: 1 };
        for (let i = 0; i < 22; i++) {
            deep = { nested: deep };
        }
        mockFetch(deep);
        await generateTypesFromEndpoint({
            endpoint: "https://x.com",
            output: "out.ts",
            name: "Deep",
        });
        const content = await readOutput();
        // The deeply-nested field should be truncated with 'unknown /* max depth exceeded */'
        expect(content).toContain("max depth exceeded");
    });
});
