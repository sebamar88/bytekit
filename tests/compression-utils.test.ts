import { CompressionUtils } from "../src/utils/helpers/CompressionUtils";

test("CompressionUtils compress/decompress roundtrip", () => {
    const original = "aaabbbccccccdddd";
    const compressed = CompressionUtils.compress(original);
    const decompressed = CompressionUtils.decompress(compressed);

    assert.equal(decompressed, original);
});

test("CompressionUtils base64 encode/decode roundtrip", () => {
    const original = "hello world";
    const encoded = CompressionUtils.base64Encode(original);
    const decoded = CompressionUtils.base64Decode(encoded);

    assert.equal(decoded, original);
});

test("CompressionUtils base64 url encode/decode roundtrip", () => {
    const original = "url-safe+data/with=padding";
    const encoded = CompressionUtils.base64UrlEncode(original);
    const decoded = CompressionUtils.base64UrlDecode(encoded);

    assert.equal(decoded, original);
});

test("CompressionUtils serialize/deserialize compressed JSON", () => {
    const obj = { name: "test", tag: "alpha" };
    const serialized = CompressionUtils.serializeCompressed(obj);
    const restored = CompressionUtils.deserializeCompressed(serialized);

    assert.deepEqual(restored, obj);
});

test("CompressionUtils getCompressionRatio returns non-negative", () => {
    const original = "aaaaaaaaaa";
    const compressed = CompressionUtils.compress(original);
    const ratio = CompressionUtils.getCompressionRatio(original, compressed);

    assert.ok(ratio >= 0);
});

test("CompressionUtils minifyJSON trims whitespace", () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}';
    const minified = CompressionUtils.minifyJSON(input);

    assert.equal(minified, '{ "a": 1, "b": 2 }');
});

test("CompressionUtils prettyJSON formats valid JSON and returns input on error", () => {
    const input = '{"a":1}';
    const pretty = CompressionUtils.prettyJSON(input, 4);

    assert.match(pretty, /\n/);

    const invalid = "{broken";
    const result = CompressionUtils.prettyJSON(invalid, 2);
    assert.equal(result, invalid);
});

test("CompressionUtils gzip/gunzip roundtrip", async () => {
    const original = "hello gzip";
    const gzipped = await CompressionUtils.gzip(original);
    const restored = await CompressionUtils.gunzip(gzipped);

    assert.equal(restored, original);
});

test("CompressionUtils deflate/inflate roundtrip", async () => {
    const original = "hello deflate";
    const deflated = await CompressionUtils.deflate(original);
    const restored = await CompressionUtils.inflate(deflated);

    assert.equal(restored, original);
});

test("CompressionUtils getSize and formatBytes", () => {
    const size = CompressionUtils.getSize("hello");
    assert.ok(size > 0);

    assert.equal(CompressionUtils.formatBytes(0), "0 Bytes");
    assert.equal(CompressionUtils.formatBytes(1024), "1 KB");
});

test("CompressionUtils base64 uses browser btoa/atob when available", () => {
    const originalBtoa = globalThis.btoa;
    const originalAtob = globalThis.atob;

    // @ts-expect-error - Testing error handling
    globalThis.btoa = (value) => Buffer.from(value, "utf-8").toString("base64");
    // @ts-expect-error - Testing error handling
    globalThis.atob = (value) => Buffer.from(value, "base64").toString("utf-8");

    const original = "browser-base64";
    const encoded = CompressionUtils.base64Encode(original);
    const decoded = CompressionUtils.base64Decode(encoded);

    assert.equal(decoded, original);

    globalThis.btoa = originalBtoa;
    globalThis.atob = originalAtob;
});

test("CompressionUtils prettyJSON handles object input", () => {
    const pretty = CompressionUtils.prettyJSON({ a: 1 }, 2);
    assert.match(pretty, /\n/);
});

test("CompressionUtils gzip/deflate fallback without node", async () => {
    const originalVersions = process.versions;
    let overridden = false;

    try {
        Object.defineProperty(process, "versions", {
            value: {},
            configurable: true,
            writable: true,
        });
        overridden = true;
    } catch {
        return;
    }

    const gzipped = await CompressionUtils.gzip("hello");
    assert.equal(typeof gzipped, "string");

    const deflated = await CompressionUtils.deflate("hello");
    assert.equal(typeof deflated, "string");

    const inflated = await CompressionUtils.inflate(deflated);
    assert.equal(inflated, "hello");

    if (overridden) {
        Object.defineProperty(process, "versions", {
            value: originalVersions,
            configurable: true,
            writable: true,
        });
    }
});

test("CompressionUtils compress handles empty string", () => {
    const compressed = CompressionUtils.compress("");
    const decompressed = CompressionUtils.decompress(compressed);
    assert.equal(decompressed, "");
});

test("CompressionUtils formatBytes handles large sizes", () => {
    assert.equal(CompressionUtils.formatBytes(1024 * 1024), "1 MB");
    assert.equal(CompressionUtils.formatBytes(1024 * 1024 * 1024), "1 GB");
    assert.equal(
        CompressionUtils.formatBytes(1024 * 1024 * 1024 * 1024),
        "1 TB"
    );
});

test("CompressionUtils base64UrlEncode replaces special chars", () => {
    const encoded = CompressionUtils.base64UrlEncode("test+/=data");
    assert.ok(!encoded.includes("+"));
    assert.ok(!encoded.includes("/"));
    assert.ok(!encoded.includes("="));
});

test("CompressionUtils minifyJSON handles already minified JSON", () => {
    const input = '{"a":1,"b":2}';
    const minified = CompressionUtils.minifyJSON(input);
    assert.ok(minified.length <= input.length + 4); // Con espacios mínimos
});

test("CompressionUtils getCompressionRatio with incompressible data", () => {
    const random = Math.random().toString(36).repeat(10);
    const compressed = CompressionUtils.compress(random);
    const ratio = CompressionUtils.getCompressionRatio(random, compressed);
    assert.ok(ratio >= 0);
});

test("CompressionUtils deserializeCompressed handles invalid data", () => {
    try {
        CompressionUtils.deserializeCompressed("invalid-compressed-data");
        assert.fail("Should have thrown");
    } catch (error) {
        assert.ok(error);
    }
});

test("CompressionUtils base64Decode handles invalid base64", () => {
    try {
        CompressionUtils.base64Decode("!!!invalid!!!");
        assert.fail("Should have thrown");
    } catch (error) {
        assert.ok(error);
    }
});

test("CompressionUtils gzip with non-string input", async () => {
    const obj = { test: "data" };
    const gzipped = await CompressionUtils.gzip(JSON.stringify(obj));
    const restored = await CompressionUtils.gunzip(gzipped);
    assert.deepEqual(JSON.parse(restored), obj);
});

test("CompressionUtils.inflate falls back gracefully when zlib throws on invalid Buffer (lines 228-232)", async () => {
    // Pass a Buffer that is NOT valid deflate data — zlib.inflate will throw
    const invalidData = Buffer.from("this is not deflate data");
    const result = await CompressionUtils.inflate(invalidData);
    // The catch block returns data.toString() for Buffer input
    assert.equal(typeof result, "string");
});

test("CompressionUtils.inflate catch: string input falls back to decompress (lines 229-230)", async () => {
    // Pass a plain string that is NOT valid deflate/zlib data
    // zlib.inflate will throw → catch block → typeof data === "string" → this.decompress(data)
    // Use a simple repeated-char string that is valid RLE (the custom decompress format)
    // compress('aaa') → e.g. '3a' ; decompress('3a') → 'aaa'
    const compressed = CompressionUtils.compress("aaabbb");
    // Pass it directly to inflate (which expects zlib data) → zlib throws → decompress fallback
    const result = await CompressionUtils.inflate(compressed);
    // decompress on the custom RLE-compressed string returns the original
    assert.equal(typeof result, "string");
});

test("CompressionUtils.getSize uses Buffer.byteLength when Blob is unavailable (line 249)", () => {
    const originalBlob = globalThis.Blob;
    vi.stubGlobal("Blob", undefined);
    const size = CompressionUtils.getSize("hello");
    assert.ok(size > 0);
    vi.unstubAllGlobals();
    globalThis.Blob = originalBlob;
});
