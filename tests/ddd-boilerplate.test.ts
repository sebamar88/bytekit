import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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
});
