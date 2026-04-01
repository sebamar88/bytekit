import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateTypesFromEndpoint } from "../src/cli/type-generator";

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

test("inferInlineType returns 'unknown' for BigInt values (lines 169-170)", async () => {
    // BigInt is typeof 'bigint' — not handled by any inferInlineType branch → return "unknown"
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-gen-"));
    const originalCwd = process.cwd();
    const originalFetch = globalThis.fetch;

    try {
        process.chdir(tempDir);
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                big: BigInt(42),
                name: "test",
            }),
        });

        await generateTypesFromEndpoint({
            endpoint: "https://api.example.com/data",
            output: "types-big.ts",
            name: "BigIntData",
        });

        const output = await readFile(path.join(tempDir, "types-big.ts"));
        assert.ok(output.includes("interface BigIntData"));
        // BigInt falls through to return "unknown"
        assert.ok(
            output.includes("big?: unknown") || output.includes("big: unknown")
        );
    } finally {
        globalThis.fetch = originalFetch;
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test("inferArrayElementType returns 'unknown' for empty array (lines 176-177)", async () => {
    // Empty array → types = [] → uniqueTypes = [] → length === 0 → return "unknown"
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-gen-"));
    const originalCwd = process.cwd();
    const originalFetch = globalThis.fetch;

    try {
        process.chdir(tempDir);
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                items: [],
                name: "test",
            }),
        });

        await generateTypesFromEndpoint({
            endpoint: "https://api.example.com/data",
            output: "types-empty.ts",
            name: "EmptyData",
        });

        const output = await readFile(path.join(tempDir, "types-empty.ts"));
        assert.ok(output.includes("interface EmptyData"));
        // Empty array → "unknown[]"
        assert.ok(
            output.includes("items?: unknown[]") ||
                output.includes("items: unknown[]")
        );
    } finally {
        globalThis.fetch = originalFetch;
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test("generateTypesFromEndpoint sanitizes unsafe property names", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-gen-"));
    const originalCwd = process.cwd();
    const originalFetch = globalThis.fetch;

    try {
        process.chdir(tempDir);
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                "user-name": "Juan",
                default: true,
                "1password": "secret",
            }),
        });

        await generateTypesFromEndpoint({
            endpoint: "https://api.example.com/user",
            output: "types.ts",
            name: "Unsafe User",
        });

        const output = await readFile(path.join(tempDir, "types.ts"));
        assert.ok(output.includes("export interface UnsafeUser"));
        assert.ok(output.includes('"user-name": string;'));
        assert.ok(output.includes('"default": boolean;'));
        assert.ok(output.includes('"1password": string;'));
    } finally {
        globalThis.fetch = originalFetch;
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test("generateTypesFromEndpoint falls back to unknown for unsupported top-level values", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-gen-"));
    const originalCwd = process.cwd();
    const originalFetch = globalThis.fetch;

    try {
        process.chdir(tempDir);
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => BigInt(42),
        });

        await generateTypesFromEndpoint({
            endpoint: "https://api.example.com/odd-value",
            output: "types-top-level.ts",
            name: "OddValue",
        });

        const output = await readFile(path.join(tempDir, "types-top-level.ts"));
        assert.ok(output.includes("type OddValue = unknown;"));
    } finally {
        globalThis.fetch = originalFetch;
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});
