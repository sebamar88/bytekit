import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ApiClient } from "../src/utils/core/ApiClient";
import { zodAdapter, valibotAdapter } from "../src/utils/core/SchemaAdapter";
import { z } from "zod";
import * as v from "valibot";

describe("Schema Adapters for ApiClient", () => {
    let client: ApiClient;

    beforeAll(() => {
        // Mock fetch for tests
        globalThis.fetch = async (
            input: RequestInfo | URL,
            init?: RequestInit
        ) => {
            const url = input.toString();

            if (url.includes("/user/zod")) {
                return new Response(
                    JSON.stringify({ id: 1, name: "Alice", age: 30 }),
                    {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }

            if (url.includes("/user/valibot")) {
                return new Response(
                    JSON.stringify({ id: 2, name: "Bob", age: 25 }),
                    {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }

            if (url.includes("/user/invalid")) {
                return new Response(
                    JSON.stringify({ id: "invalid", name: 123 }),
                    {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }

            return new Response("Not found", { status: 404 });
        };

        client = new ApiClient({ baseUrl: "https://api.test.com" });
    });

    afterAll(() => {
        // Simple way to restore fetch if needed
    });

    describe("Zod Adapter", () => {
        const UserSchema = z.object({
            id: z.number(),
            name: z.string(),
            age: z.number(),
        });

        it("should successfully parse and validate a correct response", async () => {
            const result = await client.get("/user/zod", {
                validateResponse: zodAdapter(UserSchema),
            });

            expect(result).toEqual({ id: 1, name: "Alice", age: 30 });
        });

        it("should allow passing the schema directly since it has a parse method", async () => {
            const result = await client.get("/user/zod", {
                validateResponse: UserSchema,
            });

            expect(result).toEqual({ id: 1, name: "Alice", age: 30 });
        });

        it("should throw an error when validation fails", async () => {
            await expect(
                client.get("/user/invalid", {
                    validateResponse: zodAdapter(UserSchema),
                })
            ).rejects.toThrow(); // ZodError
        });
    });

    describe("Valibot Adapter", () => {
        const UserSchema = v.object({
            id: v.number(),
            name: v.string(),
            age: v.number(),
        });

        it("should successfully parse and validate a correct response", async () => {
            const result = await client.get("/user/valibot", {
                validateResponse: valibotAdapter(UserSchema, v.parse),
            });

            expect(result).toEqual({ id: 2, name: "Bob", age: 25 });
        });

        it("should throw an error when validation fails", async () => {
            await expect(
                client.get("/user/invalid", {
                    validateResponse: valibotAdapter(UserSchema, v.parse),
                })
            ).rejects.toThrow(); // ValibotError
        });
    });
});
