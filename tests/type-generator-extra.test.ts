import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generateTypesFromEndpoint } from "../src/cli/type-generator";

describe("type-generator extra", () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "type-gen-test-"));
        originalCwd = process.cwd();
        process.chdir(tempDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it("should handle HTTP errors in type generator", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: "Not Found",
        });

        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        await expect(
            generateTypesFromEndpoint({
                endpoint: "http://api.com/fail",
                output: "fail.ts",
            })
        ).rejects.toThrow();

        expect(spy).toHaveBeenCalledWith(expect.stringContaining("404"));
        exitSpy.mockRestore();
    });

    it("should handle non-JSON responses", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => {
                throw new Error("parse error");
            },
        });

        vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        await expect(
            generateTypesFromEndpoint({
                endpoint: "http://api.com/bad-json",
                output: "bad.ts",
            })
        ).rejects.toThrow();

        exitSpy.mockRestore();
    });
});
