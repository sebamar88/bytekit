
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { execSync } from "node:child_process";

/**
 * Integration tests for the bytekit CLI using subprocess execution
 * to avoid environment pollution and serialization issues.
 */
describe("bytekit CLI Integration", () => {
    let tempDir;
    let originalCwd;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-cli-test-"));
        originalCwd = process.cwd();
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    test("should generate types from an API endpoint", async () => {
        // We use a small inline script to run the CLI with a mocked fetch
        const scriptPath = path.join(tempDir, "run-test.js");
        const script = `
            import { runCli } from "${path.join(originalCwd, "dist/cli/index.js")}";
            globalThis.fetch = async () => ({
                ok: true,
                status: 200,
                headers: new Headers({ "content-type": "application/json" }),
                json: async () => ({ id: 1, name: "ByteKit" }),
            });
            runCli(["--type", "https://api.example.com/info"]).catch(err => {
                console.error(err);
                process.exit(1);
            });
        `;
        await fs.writeFile(scriptPath, script);

        process.chdir(tempDir);
        execSync(`node ${scriptPath}`);

        const typeFile = await fs.readFile(path.join(tempDir, "src", "types", "info.ts"), "utf8");
        assert.ok(typeFile.includes("export interface Info"));
        assert.ok(typeFile.includes("id: number;"));
    });

    test("should generate types from a Swagger specification", async () => {
        const scriptPath = path.join(tempDir, "run-swagger.js");
        const script = `
            import { runCli } from "${path.join(originalCwd, "dist/cli/index.js")}";
            globalThis.fetch = async () => ({
                ok: true,
                status: 200,
                headers: new Headers({ "content-type": "application/json" }),
                json: async () => ({
                    openapi: "3.0.0",
                    components: { 
                        schemas: { 
                            User: { type: "object", properties: { login: { type: "string" } } } 
                        } 
                    }
                }),
            });
            runCli(["--swagger", "https://api.example.com/docs"]).catch(err => {
                console.error(err);
                process.exit(1);
            });
        `;
        await fs.writeFile(scriptPath, script);

        process.chdir(tempDir);
        execSync(`node ${scriptPath}`);

        const swaggerFile = await fs.readFile(path.join(tempDir, "src", "types", "api-docs.ts"), "utf8");
        assert.ok(swaggerFile.includes("export interface User"));
        assert.ok(swaggerFile.includes("login?: string;"));
    });
});
