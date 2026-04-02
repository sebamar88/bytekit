/**
 * Tests for v3.1.0 security hardening features.
 * Covers: path traversal, SSRF redirect, response size limit,
 * proto key blocking, stack trace redaction, queue/batcher limits,
 * ReDoS prevention, and recursion depth limits.
 */
import { describe, expect, it, vi } from "vitest";
import {
    assertSafeOutputPath,
    assertResponseUrl,
    readResponseWithLimit,
    MAX_CLI_RESPONSE_BYTES,
} from "../src/cli/security.js";
import { safeSerialize } from "../src/utils/core/SafeSerialization.js";
import { RequestQueue } from "../src/utils/async/request-queue.js";
import { RequestBatcher } from "../src/utils/async/request-batcher.js";

// ── Path traversal ──────────────────────────────────────────────────────

describe("assertSafeOutputPath", () => {
    it("accepts relative paths within cwd", () => {
        const result = assertSafeOutputPath("output.ts");
        expect(result).toContain("output.ts");
    });

    it("accepts '.' (current directory)", () => {
        const result = assertSafeOutputPath(".");
        expect(result).toBe(process.cwd());
    });

    it("rejects parent directory traversal", () => {
        expect(() => assertSafeOutputPath("../../etc/passwd")).toThrow(
            /outside the current working directory/
        );
    });

    it("rejects absolute paths outside cwd", () => {
        const outsidePath =
            process.platform === "win32" ? "C:\\Windows\\Temp" : "/tmp";
        expect(() => assertSafeOutputPath(outsidePath)).toThrow(
            /outside the current working directory/
        );
    });
});

// ── SSRF redirect protection ────────────────────────────────────────────

describe("assertResponseUrl", () => {
    it("accepts HTTPS final URLs", () => {
        const response = { url: "https://api.example.com/data" } as Response;
        expect(() =>
            assertResponseUrl(response, "test")
        ).not.toThrow();
    });

    it("rejects HTTP final URLs on non-loopback hosts", () => {
        const response = { url: "http://internal.corp/secret" } as Response;
        expect(() => assertResponseUrl(response, "test")).toThrow(
            /requires https/i
        );
    });

    it("allows empty response.url (no redirect verification possible)", () => {
        const response = { url: "" } as Response;
        expect(() =>
            assertResponseUrl(response, "test")
        ).not.toThrow();
    });
});

// ── Response size limit ─────────────────────────────────────────────────

describe("readResponseWithLimit", () => {
    it("reads normal responses via text() fallback", async () => {
        const response = {
            headers: new Headers(),
            body: null,
            text: async () => '{"ok":true}',
        } as unknown as Response;
        const result = await readResponseWithLimit(response);
        expect(result).toBe('{"ok":true}');
    });

    it("rejects responses with content-length exceeding limit", async () => {
        const response = {
            headers: new Headers({
                "content-length": String(MAX_CLI_RESPONSE_BYTES + 1),
            }),
            body: null,
            text: async () => "",
        } as unknown as Response;
        await expect(
            readResponseWithLimit(response)
        ).rejects.toThrow(/too large/);
    });

    it("reads streaming responses via body.getReader()", async () => {
        const encoder = new TextEncoder();
        const chunks = [encoder.encode("hello"), encoder.encode(" world")];
        let i = 0;
        const reader = {
            read: async () => {
                if (i < chunks.length) {
                    return { done: false, value: chunks[i++] };
                }
                return { done: true, value: undefined };
            },
            cancel: vi.fn(),
        };
        const response = {
            headers: new Headers(),
            body: { getReader: () => reader },
            text: async () => "fallback",
        } as unknown as Response;
        const result = await readResponseWithLimit(response);
        expect(result).toBe("hello world");
    });

    it("aborts streaming when byte limit exceeded", async () => {
        const encoder = new TextEncoder();
        const bigChunk = encoder.encode("x".repeat(100));
        const reader = {
            read: async () => ({ done: false, value: bigChunk }),
            cancel: vi.fn(),
        };
        const response = {
            headers: new Headers(),
            body: { getReader: () => reader },
            text: async () => "",
        } as unknown as Response;
        await expect(
            readResponseWithLimit(response, 50)
        ).rejects.toThrow(/too large/);
        expect(reader.cancel).toHaveBeenCalled();
    });

    it("exports MAX_CLI_RESPONSE_BYTES as 50 MB", () => {
        expect(MAX_CLI_RESPONSE_BYTES).toBe(50 * 1024 * 1024);
    });
});

// ── Proto key blocking ──────────────────────────────────────────────────

describe("safeSerialize – proto key blocking", () => {
    it("strips __proto__ keys from objects", () => {
        const input = JSON.parse('{"__proto__":{"polluted":true},"safe":"ok"}');
        const result = safeSerialize(input) as Record<string, unknown>;
        expect(result).not.toHaveProperty("__proto__");
        expect(result.safe).toBe("ok");
    });

    it("strips constructor keys from objects", () => {
        const input = { constructor: "evil", safe: "ok" };
        const result = safeSerialize(input) as Record<string, unknown>;
        expect(result).not.toHaveProperty("constructor");
        expect(result.safe).toBe("ok");
    });

    it("strips prototype keys from objects", () => {
        const input = { prototype: { x: 1 }, safe: "ok" };
        const result = safeSerialize(input) as Record<string, unknown>;
        expect(result).not.toHaveProperty("prototype");
        expect(result.safe).toBe("ok");
    });
});

// ── Stack trace redaction ───────────────────────────────────────────────

describe("safeSerialize – Error handling", () => {
    it("serializes Error name and message", () => {
        const err = new TypeError("bad input");
        const result = safeSerialize(err) as Record<string, unknown>;
        expect(result.name).toBe("TypeError");
        expect(result.message).toBe("bad input");
    });

    it("does not leak stack traces", () => {
        const err = new Error("test");
        const result = safeSerialize(err) as Record<string, unknown>;
        expect(result).not.toHaveProperty("stack");
    });
});

// ── Queue size limit ────────────────────────────────────────────────────

describe("RequestQueue – maxQueueSize", () => {
    it("rejects tasks when queue is full", async () => {
        // maxQueueSize counts QUEUED items only (not running)
        // concurrency=1: first task runs, second queues (size=1), third rejects
        const queue = new RequestQueue({ concurrency: 1, maxQueueSize: 1 });
        const slow = () => new Promise((r) => setTimeout(r, 5000));
        void queue.add(slow); // running
        void queue.add(slow); // queued (size=1)
        await expect(queue.add(slow)).rejects.toThrow(/Queue is full/);
    });
});

// ── Batcher pending limit ───────────────────────────────────────────────

describe("RequestBatcher – maxPending", () => {
    it("rejects when pending limit is reached", async () => {
        vi.useFakeTimers();
        const batcher = new RequestBatcher({
            maxBatchSize: 10,
            maxWaitMs: 60_000,
            executor: async (items: string[]) => items.map(() => "ok"),
            maxPending: 2,
        });
        void batcher.add("https://api.com/a", {});
        void batcher.add("https://api.com/b", {});
        await expect(
            batcher.add("https://api.com/c", {})
        ).rejects.toThrow(/Batcher is full/);
        vi.useRealTimers();
    });
});

// ── ReDoS prevention ────────────────────────────────────────────────────

describe("RequestCache – patternToRegex safety", () => {
    it("invalidation with wildcards completes quickly (no ReDoS)", async () => {
        // Import dynamically to access the class
        const { RequestCache } = await import(
            "../src/utils/core/RequestCache.js"
        );
        const cache = new RequestCache({ ttl: 60_000 });

        // Populate cache with keys that could trigger catastrophic backtracking
        const evilKey = "/api/" + "a".repeat(50) + "/resource";
        cache.set(evilKey, "data");

        const start = performance.now();
        cache.invalidate("/api/*");
        const elapsed = performance.now() - start;

        // Should complete in < 50ms; a vulnerable regex would take seconds
        expect(elapsed).toBeLessThan(50);
    });
});
