/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from "vitest";
import { ApiClient } from "../src/utils/core/ApiClient.js";

describe("ApiClient - Body vs RequestOptions detection", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({
      baseUrl: "https://httpbin.org",
    });
  });

  describe("POST method", () => {
    it("should accept body directly", async () => {
      const data = { name: "John", age: 30 };
      const response = await client.post<unknown>("/post", data);
      
      expect(response.json).toEqual(data);
    });

    it("should accept RequestOptions with body", async () => {
      const data = { name: "Jane", age: 25 };
      const response = await client.post<unknown>("/post", {
        body: data,
        searchParams: { version: "v1" },
      });
      
      expect(response.json).toEqual(data);
      expect(response.url).toContain("version=v1");
    });

    it("should treat object with 'body' field as plain data, not RequestOptions", async () => {
      const data = {
        body: "This is message content",
        title: "Important",
      };
      const response = await client.post<unknown>("/post", data);
      
      expect(response.json).toEqual(data);
      expect(response.json.body).toBe("This is message content");
    });

    it("should detect RequestOptions when it has searchParams", async () => {
      const data = { message: "Hello" };
      const response = await client.post<unknown>("/post", {
        body: data,
        searchParams: { lang: "en" },
      });
      
      expect(response.json).toEqual(data);
      expect(response.url).toContain("lang=en");
    });

    it("should detect RequestOptions when it has headers", async () => {
      const data = { test: "data" };
      const response = await client.post<unknown>("/post", {
        body: data,
        headers: {
          "X-Custom": "test-value",
        },
      });
      
      expect(response.json).toEqual(data);
      expect(response.headers["X-Custom"]).toBe("test-value");
    });

    it("should detect RequestOptions when it has timeoutMs", async () => {
      const data = { test: "data" };
      const response = await client.post<unknown>("/post", {
        body: data,
        timeoutMs: 5000,
      });
      
      expect(response.json).toEqual(data);
    });

    it("should handle undefined body", async () => {
      const response = await client.post<unknown>("/post");
      expect(response.json).toBeUndefined();
    });

    it("should handle null body", async () => {
      const response = await client.post<unknown>("/post", null);
      // null se trata como body directo
      expect(response.data).toBe("null");
    });
  });

  describe("PUT method", () => {
    it("should accept body directly", async () => {
      const data = { name: "Updated", age: 31 };
      const response = await client.put<unknown>("/put", data);
      
      expect(response.json).toEqual(data);
    });

    it("should accept RequestOptions with body", async () => {
      const data = { name: "Updated" };
      const response = await client.put<unknown>("/put", {
        body: data,
        searchParams: { force: "true" },
      });
      
      expect(response.json).toEqual(data);
      expect(response.url).toContain("force=true");
    });
  });

  describe("PATCH method", () => {
    it("should accept body directly", async () => {
      const data = { age: 32 };
      const response = await client.patch<unknown>("/patch", data);
      
      expect(response.json).toEqual(data);
    });

    it("should accept RequestOptions with body", async () => {
      const data = { status: "active" };
      const response = await client.patch<unknown>("/patch", {
        body: data,
        headers: { "X-Patch-Mode": "partial" },
      });
      
      expect(response.json).toEqual(data);
    });
  });

  describe("Edge cases", () => {
    it("should handle arrays as body", async () => {
      const data = [1, 2, 3, 4, 5];
      const response = await client.post<unknown>("/post", data);
      
      expect(response.json).toEqual(data);
    });

    it("should handle strings as body", async () => {
      const data = "plain string data";
      const response = await client.post<unknown>("/post", data);
      
      expect(response.data).toBe(data);
    });

    it("should handle numbers as body", async () => {
      const data = 42;
      const response = await client.post<unknown>("/post", data);
      
      expect(response.data).toBe("42");
    });

    it("should handle boolean as body", async () => {
      const data = true;
      const response = await client.post<unknown>("/post", data);
      
      expect(response.data).toBe("true");
    });

    it("should handle complex nested objects", async () => {
      const data = {
        user: {
          name: "John",
          address: {
            city: "NYC",
            zip: "10001",
          },
        },
        tags: ["important", "urgent"],
        metadata: {
          created: new Date().toISOString(),
        },
      };
      
      const response = await client.post<unknown>("/post", data);
      expect(response.json).toEqual(data);
    });
  });

  describe("Backward compatibility", () => {
    it("should still work with old syntax: { body: data }", async () => {
      const data = { old: "syntax" };
      const response = await client.post<unknown>("/post", { body: data });
      
      expect(response.json).toEqual(data);
    });

    it("should work with empty RequestOptions", async () => {
      const response = await client.post<unknown>("/post", {});
      expect(response.json).toBeUndefined();
    });
  });
});
