import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateTypesFromEndpoint } from "../dist/cli/type-generator.js";

const readFile = (target) => fs.readFile(target, "utf8");

test("generateTypesFromEndpoint writes types for arrays and optional fields", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-gen-"));
    const originalCwd = process.cwd();
    const originalFetch = globalThis.fetch;

    try {
        process.chdir(tempDir);
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                name: "Juan",
                age: 30,
                tags: ["a", "b"],
                optional: null,
            }),
        });

        await generateTypesFromEndpoint({
            endpoint: "https://api.example.com/user",
            output: "types.ts",
            name: "User",
        });

        const output = await readFile(path.join(tempDir, "types.ts"));
        assert.ok(output.includes("interface User"));
        assert.ok(output.includes("optional?: null"));
        assert.ok(output.includes("tags: string[]"));
    } finally {
        globalThis.fetch = originalFetch;
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});
