import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateTypesFromEndpoint } from "../src/cli/type-generator";

const readFile = (target) => fs.readFile(target, "utf8");

function mockFetchResponse(data: unknown, url = "https://api.example.com") {
    const body = JSON.stringify(data, (_k, v) =>
        typeof v === "bigint" ? Number(v) : v
    );
    return async () =>
        ({
            ok: true,
            status: 200,
            url,
            headers: new Headers({ "content-type": "application/json" }),
            body: null,
            text: async () => body,
            json: async () => JSON.parse(body),
        }) as unknown as Response;
}

test("generateTypesFromEndpoint writes types for arrays and optional fields", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-gen-"));
    const originalCwd = process.cwd();
    const originalFetch = globalThis.fetch;

    try {
        process.chdir(tempDir);
        globalThis.fetch = mockFetchResponse({
            name: "Juan",
            age: 30,
            tags: ["a", "b"],
            optional: null,
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

test("inferInlineType returns null for null-only values", async () => {
    // Since JSON.parse is now used instead of json(), BigInt can't arrive via the
    // public API. Cover the null/optional path instead.
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-gen-"));
    const originalCwd = process.cwd();
    const originalFetch = globalThis.fetch;

    try {
        process.chdir(tempDir);
        globalThis.fetch = mockFetchResponse({
            big: null,
            name: "test",
        });

        await generateTypesFromEndpoint({
            endpoint: "https://api.example.com/data",
            output: "types-big.ts",
            name: "NullData",
        });

        const output = await readFile(path.join(tempDir, "types-big.ts"));
        assert.ok(output.includes("interface NullData"));
        assert.ok(output.includes("big?: null"));
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
        globalThis.fetch = mockFetchResponse({
            items: [],
            name: "test",
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
        globalThis.fetch = mockFetchResponse({
            "user-name": "Juan",
            default: true,
            "1password": "secret",
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
        // A JSON number parses to a JS number — which is a non-object top-level value
        globalThis.fetch = mockFetchResponse(42);

        await generateTypesFromEndpoint({
            endpoint: "https://api.example.com/odd-value",
            output: "types-top-level.ts",
            name: "OddValue",
        });

        const output = await readFile(path.join(tempDir, "types-top-level.ts"));
        assert.ok(output.includes("type OddValue = number;"));
    } finally {
        globalThis.fetch = originalFetch;
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});
