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
    let tempDir: string;
    let originalCwd: string;

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
        const cliUrl = pathToFileURL(
            path.join(originalCwd, "dist/cli/index.js")
        ).href;

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
        const cliUrl = pathToFileURL(
            path.join(originalCwd, "dist/cli/index.js")
        ).href;

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

    test("should generate DDD folder structure", async () => {
        const scriptPath = path.join(tempDir, "run-ddd.js");
        const cliUrl = pathToFileURL(
            path.join(originalCwd, "dist/cli/index.js")
        ).href;

        const script = `
            import { runCli } from "${cliUrl}";
            runCli(["--ddd", "--domain=TestContext", "--port=OrderRepository"]).catch(err => {
                console.error(err);
                process.exit(1);
            });
        `;
        await fs.writeFile(scriptPath, script);

        process.chdir(tempDir);
        execSync(`node ${scriptPath}`);

        const outbound = await fs.readFile(
            path.join(
                tempDir,
                "test-context",
                "application",
                "ports",
                "outbound",
                "order-repository.port.ts"
            ),
            "utf8"
        );
        expect(outbound).toContain("export interface OrderRepository");
        await fs.access(
            path.join(tempDir, "test-context", "domain", "entities", ".gitkeep")
        );
    });

    test("should generate entity, repository interface and use cases when --actions is provided", async () => {
        const scriptPath = path.join(tempDir, "run-ddd-actions.js");
        const cliUrl = pathToFileURL(
            path.join(originalCwd, "dist/cli/index.js")
        ).href;

        const script = `
            import { runCli } from "${cliUrl}";
            runCli([
                "--ddd",
                "--domain=Product",
                "--port=ProductRepository",
                "--actions=create,findById,update",
            ]).catch(err => {
                console.error(err);
                process.exit(1);
            });
        `;
        await fs.writeFile(scriptPath, script);

        process.chdir(tempDir);
        execSync(`node ${scriptPath}`);

        // Entity
        const entityFile = await fs.readFile(
            path.join(tempDir, "product", "domain", "entities", "product.entity.ts"),
            "utf8"
        );
        expect(entityFile).toContain("export class ProductEntity");
        expect(entityFile).toContain("export interface ProductEntityProps");
        expect(entityFile).toContain("id: string;");

        // Repository interface
        const repoFile = await fs.readFile(
            path.join(
                tempDir,
                "product",
                "domain",
                "repositories",
                "i-product.repository.ts"
            ),
            "utf8"
        );
        expect(repoFile).toContain("export interface IProductRepository");
        expect(repoFile).toContain("create(");
        expect(repoFile).toContain("findById(");
        expect(repoFile).toContain("update(");

        // Use case: create
        const createUseCase = await fs.readFile(
            path.join(
                tempDir,
                "product",
                "application",
                "use-cases",
                "create-product.use-case.ts"
            ),
            "utf8"
        );
        expect(createUseCase).toContain("export class CreateProductUseCase");
        expect(createUseCase).toContain("async execute(");
        expect(createUseCase).toContain("IProductRepository");

        // Use case: findById
        const findUseCase = await fs.readFile(
            path.join(
                tempDir,
                "product",
                "application",
                "use-cases",
                "find-by-id-product.use-case.ts"
            ),
            "utf8"
        );
        expect(findUseCase).toContain("export class FindByIdProductUseCase");

        // HTTP infrastructure — always uses ApiClient from bytekit
        const httpRepo = await fs.readFile(
            path.join(
                tempDir,
                "product",
                "infrastructure",
                "persistence",
                "http-product.repository.ts"
            ),
            "utf8"
        );
        expect(httpRepo).toContain("export class HttpProductRepository");
        expect(httpRepo).toContain("implements IProductRepository");
        expect(httpRepo).toContain('from "bytekit/api-client"');
        expect(httpRepo).toContain("this.client");
    });

    test("should import ApiClient from bytekit when --bytekit flag is set", async () => {
        const scriptPath = path.join(tempDir, "run-ddd-bytekit.js");
        const cliUrl = pathToFileURL(
            path.join(originalCwd, "dist/cli/index.js")
        ).href;

        const script = `
            import { runCli } from "${cliUrl}";
            runCli([
                "--ddd",
                "--domain=Order",
                "--port=OrderRepository",
                "--actions=create,findAll,delete",
            ]).catch(err => {
                console.error(err);
                process.exit(1);
            });
        `;
        await fs.writeFile(scriptPath, script);

        process.chdir(tempDir);
        execSync(`node ${scriptPath}`);

        const httpRepo = await fs.readFile(
            path.join(
                tempDir,
                "order",
                "infrastructure",
                "persistence",
                "http-order.repository.ts"
            ),
            "utf8"
        );
        expect(httpRepo).toContain('from "bytekit/api-client"');
        expect(httpRepo).toContain("ApiClient");
        expect(httpRepo).toContain("this.client");
        expect(httpRepo).not.toContain("this.baseUrl");

        // findAll returns an array
        const repoFile = await fs.readFile(
            path.join(
                tempDir,
                "order",
                "domain",
                "repositories",
                "i-order.repository.ts"
            ),
            "utf8"
        );
        expect(repoFile).toContain("findAll(): Promise<OrderEntity[]>");
        expect(repoFile).toContain("delete(id: string): Promise<void>");
    });
});
