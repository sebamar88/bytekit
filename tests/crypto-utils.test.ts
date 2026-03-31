import { CryptoUtils } from "../src/utils/helpers/CryptoUtils";

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

test("CryptoUtils.encrypt and decrypt", async () => {
    const original = "secret message";
    const key = "pass";

    const encrypted = await CryptoUtils.encrypt(original, key);
    assert.notEqual(encrypted, original);

    const decrypted = await CryptoUtils.decrypt(encrypted, key);
    assert.equal(decrypted, original);
});

test("CryptoUtils.xorEncrypt throws — method removed for security", () => {
    assert.throws(
        () => CryptoUtils.xorEncrypt("secret", "pass"),
        /xorEncrypt has been removed/
    );
});

test("CryptoUtils.xorDecrypt throws — method removed for security", () => {
    assert.throws(
        () => CryptoUtils.xorDecrypt("anything", "pass"),
        /xorDecrypt has been removed/
    );
});

test("CryptoUtils.encrypt is non-deterministic (uses random IV)", async () => {
    const original = "secret message";
    const key = "pass";

    const encrypted1 = await CryptoUtils.encrypt(original, key);
    const encrypted2 = await CryptoUtils.encrypt(original, key);

    assert.notEqual(encrypted1, encrypted2);

    const decrypted1 = await CryptoUtils.decrypt(encrypted1, key);
    const decrypted2 = await CryptoUtils.decrypt(encrypted2, key);

    assert.equal(decrypted1, original);
    assert.equal(decrypted2, original);
});

test("CryptoUtils.decrypt fails with wrong key", async () => {
    const original = "secret message";
    const key = "pass";
    const wrongKey = "wrong";

    const encrypted = await CryptoUtils.encrypt(original, key);

    await assert.rejects(
        async () => await CryptoUtils.decrypt(encrypted, wrongKey),
        /Decryption failed/
    );
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

test("CryptoUtils throws error when crypto is missing", () => {
    const originalCrypto = globalThis.crypto;

    try {
        Object.defineProperty(globalThis, "crypto", {
            value: undefined,
            configurable: true,
            writable: true,
        });
    } catch {
        return;
    }

    // Should throw error when crypto is not available
    assert.throws(
        () => CryptoUtils.generateToken(4),
        /Secure random generation unavailable/
    );

    assert.throws(
        () => CryptoUtils.randomBytes(4),
        /Secure random generation unavailable/
    );

    Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
        writable: true,
    });
});

test("CryptoUtils UUID uses getRandomValues fallback when randomUUID is unavailable", () => {
    const originalCrypto = globalThis.crypto;

    try {
        Object.defineProperty(globalThis, "crypto", {
            value: {
                getRandomValues: (arr) => originalCrypto.getRandomValues(arr),
                randomUUID: undefined, // explicitly undefined to test fallback to getRandomValues
            },
            configurable: true,
            writable: true,
        });
    } catch {
        return;
    }

    const uuid = CryptoUtils.generateUUID();
    assert.match(
        uuid,
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
        writable: true,
    });
});

test("CryptoUtils hash uses SubtleCrypto when available", async () => {
    const originalCrypto = globalThis.crypto;

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
    } catch {
        return;
    }

    const hash = await CryptoUtils.hash("data");
    assert.equal(hash, "010203");

    const hmac = await CryptoUtils.hmac("msg", "secret");
    assert.equal(hmac, "090909");

    Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
        writable: true,
    });
});

test("CryptoUtils.generateToken with default length", () => {
    const token = CryptoUtils.generateToken();
    assert.equal(token.length, 64); // 32 bytes = 64 hex
});

test("CryptoUtils.hash with default algorithm", async () => {
    const hash = await CryptoUtils.hash("test");
    assert.ok(hash.length > 0);
    assert.match(hash, /^[0-9a-f]+$/);
});

test("CryptoUtils.hmac with default algorithm", async () => {
    const hmac = await CryptoUtils.hmac("message", "secret");
    assert.ok(hmac.length > 0);
    assert.match(hmac, /^[0-9a-f]+$/);
});

test("CryptoUtils.encrypt handles empty strings", async () => {
    const encrypted = await CryptoUtils.encrypt("", "key");
    const decrypted = await CryptoUtils.decrypt(encrypted, "key");
    assert.equal(decrypted, "");
});

test("CryptoUtils.constantTimeCompare with empty strings", () => {
    assert.equal(CryptoUtils.constantTimeCompare("", ""), true);
    assert.equal(CryptoUtils.constantTimeCompare("", "a"), false);
});

test("CryptoUtils.base64Encode handles special characters", () => {
    const original = "Hello 世界 🌍";
    const encoded = CryptoUtils.base64Encode(original);
    const decoded = CryptoUtils.base64Decode(encoded);
    assert.equal(decoded, original);
});

test("CryptoUtils.simpleHash produces different hashes for different inputs", () => {
    const hash1 = CryptoUtils.simpleHash("input1");
    const hash2 = CryptoUtils.simpleHash("input2");
    const hash3 = CryptoUtils.simpleHash("input1");

    assert.notEqual(hash1, hash2);
    assert.equal(hash1, hash3); // Deterministic
});

test("CryptoUtils.verifyHash handles invalid hash format", async () => {
    const result = await CryptoUtils.verifyHash("data", "invalid-hash");
    assert.equal(result, false);
});

test("CryptoUtils.randomBytes generates different values", () => {
    const bytes1 = CryptoUtils.randomBytes(16);
    const bytes2 = CryptoUtils.randomBytes(16);

    assert.notDeepEqual(bytes1, bytes2);
});

test("CryptoUtils.encrypt with long key", async () => {
    const original = "short";
    const key = "very-long-encryption-key-that-exceeds-message-length";

    const encrypted = await CryptoUtils.encrypt(original, key);
    const decrypted = await CryptoUtils.decrypt(encrypted, key);

    assert.equal(decrypted, original);
});

test("CryptoUtils.encrypt/decrypt uses btoa/atob browser paths when Buffer is undefined (lines 373-376, 386-391)", async () => {
    // Stub Buffer as undefined to force the browser (btoa/atob) fallback paths
    // in uint8ArrayToBase64 and base64ToUint8Array
    vi.stubGlobal("Buffer", undefined);
    try {
        const original = "browser-path-test";
        const key = "browser-key-xyz";
        const encrypted = await CryptoUtils.encrypt(original, key);
        const decrypted = await CryptoUtils.decrypt(encrypted, key);
        assert.equal(decrypted, original);
    } finally {
        vi.unstubAllGlobals();
    }
});

test("CryptoUtils.decrypt throws 'too short' when encrypted data is fewer than 13 bytes (lines 288-289)", async () => {
    // Base64-encode a string that is fewer than 13 bytes when decoded
    // "short" = 5 bytes → well under 13
    const tooShort = Buffer.from("short").toString("base64");

    await assert.rejects(
        () => CryptoUtils.decrypt(tooShort, "any-key"),
        /Invalid encrypted data: too short/
    );
});
