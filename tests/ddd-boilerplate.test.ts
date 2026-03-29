import fs from "node:fs/promises";
import { realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    generateDddBoilerplate,
    pascalFromKebabSlug,
    slugifyDomain,
} from "../src/cli/ddd-boilerplate.js";

describe("slugifyDomain", () => {
    it("normaliza espacios y mayúsculas", () => {
        expect(slugifyDomain("User Management")).toBe("user-management");
    });

    it("preserva slugs simples", () => {
        expect(slugifyDomain("orders")).toBe("orders");
    });

    it("inserta guiones en camelCase", () => {
        expect(slugifyDomain("OrderService")).toBe("order-service");
    });
});

describe("pascalFromKebabSlug", () => {
    it("genera PascalCase desde kebab", () => {
        expect(pascalFromKebabSlug("order-repository")).toBe("OrderRepository");
    });
});

describe("generateDddBoilerplate", () => {
    let tmp = "";

    afterEach(async () => {
        if (tmp) {
            await fs.rm(tmp, { recursive: true, force: true });
            tmp = "";
        }
    });

    it("crea la jerarquía y archivos de puertos inbound/outbound", async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-ddd-"));
        const { rootDir, slug } = await generateDddBoilerplate({
            domain: "Billing",
            port: "InvoicePersistence",
            outDir: tmp,
        });

        expect(rootDir).toBe(path.resolve(tmp));
        expect(slug).toBe("billing");

        const inbound = await fs.readFile(
            path.join(
                tmp,
                "application",
                "ports",
                "inbound",
                "billing-primary.port.ts"
            ),
            "utf8"
        );
        expect(inbound).toContain("export interface BillingPrimaryPort");

        const outbound = await fs.readFile(
            path.join(
                tmp,
                "application",
                "ports",
                "outbound",
                "invoice-persistence.port.ts"
            ),
            "utf8"
        );
        expect(outbound).toContain("export interface InvoicePersistence");

        const entityGitkeep = path.join(tmp, "domain", "entities", ".gitkeep");
        await fs.access(entityGitkeep);
    });

    it("rechaza dominio vacío", async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-ddd-"));
        await expect(
            generateDddBoilerplate({
                domain: "   ",
                port: "X",
                outDir: tmp,
            })
        ).rejects.toThrow(/dominio/i);
    });

    it("rechaza nombre de puerto vacío", async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-ddd-"));
        await expect(
            generateDddBoilerplate({
                domain: "a",
                port: "  ",
                outDir: tmp,
            })
        ).rejects.toThrow(/puerto/i);
    });

    it("genera entidad, repositorio, casos de uso e impl HTTP cubriendo todas las ramas de verbo (POST/PUT/PATCH/DELETE/GET)", async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-ddd-actions-"));
        const { rootDir, slug } = await generateDddBoilerplate({
            domain: "Order",
            port: "OrderRepository",
            outDir: tmp,
            actions: [
                "create",
                "findById",
                "findAll",
                "update",
                "patch",
                "delete",
            ],
        });

        expect(slug).toBe("order");
        expect(rootDir).toBe(path.resolve(tmp));

        // Entidad del dominio
        const entityContent = await fs.readFile(
            path.join(tmp, "domain", "entities", "order.entity.ts"),
            "utf8"
        );
        expect(entityContent).toContain("export class OrderEntity");
        expect(entityContent).toContain("export interface OrderEntityProps");

        // Interfaz de repositorio — needsProps=true por la acción "patch"
        const repoContent = await fs.readFile(
            path.join(tmp, "domain", "repositories", "i-order.repository.ts"),
            "utf8"
        );
        expect(repoContent).toContain("export interface IOrderRepository");
        expect(repoContent).toContain("OrderEntityProps");
        expect(repoContent).toContain("patch(");

        // Caso de uso CREATE — needsEntity=true, needsProps=false → importa solo OrderEntity
        const createUC = await fs.readFile(
            path.join(
                tmp,
                "application",
                "use-cases",
                "create-order.use-case.ts"
            ),
            "utf8"
        );
        expect(createUC).toContain("export class CreateOrderUseCase");
        expect(createUC).toContain("import type { OrderEntity }");

        // Caso de uso DELETE — needsEntity=false → sin import de entidad
        const deleteUC = await fs.readFile(
            path.join(
                tmp,
                "application",
                "use-cases",
                "delete-order.use-case.ts"
            ),
            "utf8"
        );
        expect(deleteUC).toContain("export class DeleteOrderUseCase");
        expect(deleteUC).not.toContain("import type { OrderEntity");

        // Caso de uso PATCH — needsEntity=true, needsProps=true → importa entidad + props
        const patchUC = await fs.readFile(
            path.join(
                tmp,
                "application",
                "use-cases",
                "patch-order.use-case.ts"
            ),
            "utf8"
        );
        expect(patchUC).toContain("export class PatchOrderUseCase");
        expect(patchUC).toContain("OrderEntityProps");

        // Caso de uso GET-lista (findAll)
        const findAllUC = await fs.readFile(
            path.join(
                tmp,
                "application",
                "use-cases",
                "find-all-order.use-case.ts"
            ),
            "utf8"
        );
        expect(findAllUC).toContain("export class FindAllOrderUseCase");

        // Adaptador HTTP — cubre las tres ramas de generateHttpMethod:
        // DELETE → this.client.delete, POST/PUT/PATCH (bodyArg) → method específico, GET → this.client.get
        const httpRepo = await fs.readFile(
            path.join(
                tmp,
                "infrastructure",
                "persistence",
                "http-order.repository.ts"
            ),
            "utf8"
        );
        expect(httpRepo).toContain("export class HttpOrderRepository");
        expect(httpRepo).toContain("async create(");
        expect(httpRepo).toContain("async update(");
        expect(httpRepo).toContain("async patch(");
        expect(httpRepo).toContain("async delete(");
        expect(httpRepo).toContain("async findById(");
        expect(httpRepo).toContain("async findAll(");
        // Rama DELETE
        expect(httpRepo).toContain("this.client.delete<void>");
        // Ramas con bodyArg (POST, PUT, PATCH)
        expect(httpRepo).toContain("this.client.post<");
        expect(httpRepo).toContain("this.client.put<");
        expect(httpRepo).toContain("this.client.patch<");
        // Rama GET sin body
        expect(httpRepo).toContain("this.client.get<");
    });

    it("silencia EEXIST al generar dos veces en el mismo directorio", async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-ddd-twice-"));
        // Primera pasada — crea directorios y .gitkeep
        await generateDddBoilerplate({
            domain: "Invoice",
            port: "InvoiceRepo",
            outDir: tmp,
        });
        // Segunda pasada — los .gitkeep ya existen → EEXIST debe silenciarse sin lanzar
        const { slug } = await generateDddBoilerplate({
            domain: "Invoice",
            port: "InvoiceRepo",
            outDir: tmp,
        });
        expect(slug).toBe("invoice");
    });

    it("relanza errores no-EEXIST que ocurren al escribir .gitkeep (rama throw e, línea 371)", async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-ddd-rethrow-"));
        const permError = Object.assign(new Error("Permission denied"), {
            code: "EACCES",
        });
        const spy = vi
            .spyOn(fs, "writeFile")
            .mockRejectedValueOnce(permError as never);
        try {
            await expect(
                generateDddBoilerplate({
                    domain: "Fail",
                    port: "FailRepo",
                    outDir: tmp,
                })
            ).rejects.toThrow("Permission denied");
        } finally {
            spy.mockRestore();
        }
    });

    it("genera interfaz de repositorio sin EntityProps cuando ninguna acción usa PATCH (rama needsProps=false)", async () => {
        tmp = await fs.mkdtemp(
            path.join(os.tmpdir(), "bytekit-ddd-nopartial-")
        );
        await generateDddBoilerplate({
            domain: "Product",
            port: "ProductStore",
            outDir: tmp,
            // Solo POST y DELETE — ninguno requiere Partial<EntityProps>
            actions: ["create", "delete"],
        });

        const repoContent = await fs.readFile(
            path.join(tmp, "domain", "repositories", "i-product.repository.ts"),
            "utf8"
        );
        // needsProps=false → el import solo contiene ProductEntity, sin ProductEntityProps
        expect(repoContent).toContain("import type { ProductEntity }");
        expect(repoContent).not.toContain("ProductEntityProps");
    });

    it("usa el slug como directorio raíz cuando outDir no se proporciona (rama `|| slug`)", async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bytekit-ddd-cwd-"));
        const originalCwd = process.cwd();
        process.chdir(tmp);
        try {
            const { rootDir, slug } = await generateDddBoilerplate({
                domain: "Widget",
                port: "WidgetRepo",
                // sin outDir → usa el slug como directorio de salida
            });
            expect(slug).toBe("widget");
            expect(realpathSync(rootDir)).toBe(
                realpathSync(path.resolve(tmp, "widget"))
            );
        } finally {
            process.chdir(originalCwd);
        }
    });
});
