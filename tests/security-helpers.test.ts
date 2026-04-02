import { describe, expect, it } from "vitest";
import {
    assertSecureRemoteUrl,
    formatPropertyKey,
    sanitizeFileSegment,
    sanitizeTypeName,
} from "../src/cli/security";
import {
    createSensitiveKeySet,
    safeSerialize,
} from "../src/utils/core/SafeSerialization";

describe("CLI security helpers", () => {
    it("rejects URLs with embedded credentials", () => {
        expect(() =>
            assertSecureRemoteUrl(
                "https://user:pass@example.com/spec.json",
                "Spec fetch"
            )
        ).toThrow(/embedded credentials/i);
    });

    it("accepts loopback http URLs", () => {
        expect(
            assertSecureRemoteUrl(
                "http://127.0.0.5:3000/spec.json",
                "Spec fetch"
            ).toString()
        ).toContain("127.0.0.5:3000");
    });

    it("accepts URL instances directly", () => {
        const input = new URL("https://example.com/spec.json");
        expect(assertSecureRemoteUrl(input, "Spec fetch")).toBe(input);
    });

    it("sanitizes type names with fallback, numeric prefixes and reserved words", () => {
        expect(sanitizeTypeName("", "Fallback")).toBe("Fallback");
        expect(sanitizeTypeName("123 unsafe", "Fallback")).toBe(
            "Fallback123Unsafe"
        );
        expect(sanitizeTypeName("default", "Fallback")).toBe("DefaultType");
    });

    it("formats safe and unsafe property keys", () => {
        expect(formatPropertyKey("safeKey")).toBe("safeKey");
        expect(formatPropertyKey("default")).toBe('"default"');
        expect(formatPropertyKey("user-name")).toBe('"user-name"');
    });

    it("sanitizes file segments and falls back when empty", () => {
        expect(sanitizeFileSegment(" User Profile ")).toBe("user-profile");
        expect(sanitizeFileSegment("!!!", "fallback")).toBe("fallback");
    });
});

describe("safe serialization helpers", () => {
    it("creates normalized sensitive key sets", () => {
        const keys = createSensitiveKeySet(["X-API-Key"]);
        expect(keys.has("xapikey")).toBe(true);
    });

    it("redacts matching sensitive keys by inclusion", () => {
        const result = safeSerialize({
            nested: {
                refreshTokenValue: "secret",
            },
        }) as Record<string, unknown>;

        expect(
            (result.nested as Record<string, unknown>).refreshTokenValue
        ).toBe("[REDACTED]");
    });

    it("truncates long strings and preserves primitives", () => {
        const result = safeSerialize(
            {
                text: "a".repeat(20),
                count: 1,
                active: true,
                nil: null,
            },
            { maxStringLength: 5 }
        ) as Record<string, unknown>;

        expect(result.text).toBe("aaaaa…[truncated 15 chars]");
        expect(result.count).toBe(1);
        expect(result.active).toBe(true);
        expect(result.nil).toBeNull();
    });

    it("serializes dates, errors, functions and symbols safely", () => {
        const namedFn = function namedFn() {
            return null;
        };
        const result = safeSerialize({
            createdAt: new Date("2026-04-01T00:00:00.000Z"),
            err: new Error("boom"),
            namedFn,
            anon: (() => null) as () => null,
            symbolValue: Symbol("s"),
        }) as Record<string, unknown>;

        expect(result.createdAt).toBe("2026-04-01T00:00:00.000Z");
        expect((result.err as Record<string, unknown>).message).toBe("boom");
        expect(result.namedFn).toMatch(/^\[Function namedFn\d*\]$/);
        expect(result.anon).toBe("[Function anon]");
        expect(result.symbolValue).toBe("Symbol(s)");
    });

    it("handles circular objects and depth limits for arrays and objects", () => {
        const circular: Record<string, unknown> = { ok: true };
        circular.self = circular;

        const result = safeSerialize(
            {
                circular,
                deepArray: [[["x"]]],
                deepObject: { a: { b: { c: 1 } } },
            },
            { maxDepth: 2 }
        ) as Record<string, unknown>;

        expect(
            (result.circular as Record<string, unknown>).self as string
        ).toBe("[Circular]");
        expect(result.deepArray).toEqual(["[Array]"]);
        expect(result.deepObject).toEqual({ a: "[Object]" });
    });
});
