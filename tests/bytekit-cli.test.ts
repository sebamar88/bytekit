import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";
import { expect, test, describe, beforeEach, afterEach } from "vitest";

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
        // Convert to file:// URL for Windows compatibility in ESM imports
        const cliUrl = pathToFileURL(path.join(originalCwd, "dist/cli/index.js")).href;
        
        const script = `
            import { runCli } from "${cliUrl}";
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

        const typeFile = await fs.readFile(
            path.join(tempDir, "src", "types", "info.ts"),
            "utf8"
        );
        expect(typeFile).toContain("export interface Info");
        expect(typeFile).toContain("id: number;");
    });

    test("should generate types from a Swagger specification", async () => {
        const scriptPath = path.join(tempDir, "run-swagger.js");
        const cliUrl = pathToFileURL(path.join(originalCwd, "dist/cli/index.js")).href;

        const script = `
            import { runCli } from "${cliUrl}";
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

        const swaggerFile = await fs.readFile(
            path.join(tempDir, "src", "types", "api-docs.ts"),
            "utf8"
        );
        expect(swaggerFile).toContain("export interface User");
        expect(swaggerFile).toContain("login?: string;");
    });
});
