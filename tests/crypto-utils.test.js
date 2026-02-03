import test from "node:test";
import assert from "node:assert/strict";
import { CryptoUtils } from "../dist/utils/helpers/CryptoUtils.js";

// ============================================================================
// CryptoUtils Tests
// ============================================================================

test("CryptoUtils.generateToken generates hex strings of correct length", () => {
    const token16 = CryptoUtils.generateToken(16);
    const token32 = CryptoUtils.generateToken(32);

    // 16 bytes = 32 hex chars
    assert.equal(token16.length, 32);
    // 32 bytes = 64 hex chars
    assert.equal(token32.length, 64);

    assert.match(token16, /^[0-9a-f]+$/);
    assert.notEqual(token16, token32);
});

test("CryptoUtils.generateUUID generates valid UUID v4", () => {
    const uuid = CryptoUtils.generateUUID();
    // Regex for UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is [8, 9, a, b]
    assert.match(
        uuid,
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
});

test("CryptoUtils.base64UrlEncode and base64UrlDecode", () => {
    const original = "Hello World + / = ?";
    const encoded = CryptoUtils.base64UrlEncode(original);

    assert.ok(!encoded.includes("+"));
    assert.ok(!encoded.includes("/"));
    assert.ok(!encoded.includes("="));

    const decoded = CryptoUtils.base64UrlDecode(encoded);
    assert.equal(decoded, original);
});

test("CryptoUtils.simpleHash returns hex string", () => {
    const hash = CryptoUtils.simpleHash("hello world");
    assert.match(hash, /^[0-9a-f]+$/);
    assert.equal(CryptoUtils.simpleHash("hello world"), hash);
    assert.notEqual(CryptoUtils.simpleHash("other"), hash);
});

test("CryptoUtils.hash supports different algorithms in Node.js", async () => {
    const data = "test-data";
    const sha1 = await CryptoUtils.hash(data, "SHA-1");
    const sha256 = await CryptoUtils.hash(data, "SHA-256");
    const sha512 = await CryptoUtils.hash(data, "SHA-512");

    assert.notEqual(sha1, sha256);
    assert.notEqual(sha256, sha512);
    assert.equal(sha256.length, 64);
    assert.equal(sha512.length, 128);
});

test("CryptoUtils.hmac generates signatures", async () => {
    const secret = "my-secret";
    const message = "hello";
    const hmac256 = await CryptoUtils.hmac(message, secret, "SHA-256");
    const hmac512 = await CryptoUtils.hmac(message, secret, "SHA-512");

    assert.ok(hmac256.length > 0);
    assert.ok(hmac512.length > 0);
    assert.notEqual(hmac256, hmac512);

    // Deterministic
    assert.equal(await CryptoUtils.hmac(message, secret), hmac256);
});

test("CryptoUtils.verifyHash works correctly", async () => {
    const data = "sensitive";
    const hash = await CryptoUtils.hash(data);

    assert.equal(await CryptoUtils.verifyHash(data, hash), true);
    assert.equal(await CryptoUtils.verifyHash("other", hash), false);
    assert.equal(await CryptoUtils.verifyHash(data, "wrong-hash"), false);
});

test("CryptoUtils.xorEncrypt and xorDecrypt", () => {
    const original = "secret message";
    const key = "pass";

    const encrypted = CryptoUtils.xorEncrypt(original, key);
    assert.notEqual(encrypted, original);

    const decrypted = CryptoUtils.xorDecrypt(encrypted, key);
    assert.equal(decrypted, original);
});

test("CryptoUtils.randomBytes generates Uint8Array", () => {
    const bytes = CryptoUtils.randomBytes(16);
    assert.ok(bytes instanceof Uint8Array);
    assert.equal(bytes.length, 16);
});

test("CryptoUtils.constantTimeCompare prevents basic inequality", () => {
    assert.equal(CryptoUtils.constantTimeCompare("abc", "abc"), true);
    assert.equal(CryptoUtils.constantTimeCompare("abc", "abd"), false);
    assert.equal(CryptoUtils.constantTimeCompare("abc", "abcd"), false);
});

test("CryptoUtils base64 uses browser btoa/atob when available", () => {
    const originalBtoa = globalThis.btoa;
    const originalAtob = globalThis.atob;

    // @ts-expect-error - Mock btoa for testing
    globalThis.btoa = (value) => Buffer.from(value, "utf-8").toString("base64");
    // @ts-expect-error - Mock atob for testing
    globalThis.atob = (value) => Buffer.from(value, "base64").toString("utf-8");

    const original = "browser-base64";
    const encoded = CryptoUtils.base64Encode(original);
    const decoded = CryptoUtils.base64Decode(encoded);

    assert.equal(decoded, original);

    globalThis.btoa = originalBtoa;
    globalThis.atob = originalAtob;
});

test("CryptoUtils fallback paths when crypto is missing", () => {
    const originalCrypto = globalThis.crypto;
    let overridden = false;

    try {
        Object.defineProperty(globalThis, "crypto", {
            value: undefined,
            configurable: true,
            writable: true,
        });
        overridden = true;
    } catch {
        return;
    }

    const token = CryptoUtils.generateToken(4);
    assert.equal(token.length, 8);

    const bytes = CryptoUtils.randomBytes(4);
    assert.equal(bytes.length, 4);

    if (overridden) {
        Object.defineProperty(globalThis, "crypto", {
            value: originalCrypto,
            configurable: true,
            writable: true,
        });
    }
});

test("CryptoUtils UUID fallback when randomUUID is unavailable", () => {
    const originalCrypto = globalThis.crypto;
    let overridden = false;

    try {
        Object.defineProperty(globalThis, "crypto", {
            value: {
                getRandomValues: (arr) => originalCrypto.getRandomValues(arr),
                randomUUID: undefined, // explicitly undefined to test fallback
            },
            configurable: true,
            writable: true,
        });
        overridden = true;
    } catch {
        return;
    }

    const uuid = CryptoUtils.generateUUID();
    assert.match(
        uuid,
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    if (overridden) {
        Object.defineProperty(globalThis, "crypto", {
            value: originalCrypto,
            configurable: true,
            writable: true,
        });
    }
});

test("CryptoUtils hash uses SubtleCrypto when available", async () => {
    const originalCrypto = globalThis.crypto;
    let overridden = false;

    const subtle = {
        digest: async () => new Uint8Array([1, 2, 3]).buffer,
        importKey: async () => ({}),
        sign: async () => new Uint8Array([9, 9, 9]).buffer,
    };

    try {
        Object.defineProperty(globalThis, "crypto", {
            value: { subtle },
            configurable: true,
            writable: true,
        });
        overridden = true;
    } catch {
        return;
    }

    const hash = await CryptoUtils.hash("data");
    assert.equal(hash, "010203");

    const hmac = await CryptoUtils.hmac("msg", "secret");
    assert.equal(hmac, "090909");

    if (overridden) {
        Object.defineProperty(globalThis, "crypto", {
            value: originalCrypto,
            configurable: true,
            writable: true,
        });
    }
});
