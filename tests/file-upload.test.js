import test from "node:test";
import assert from "node:assert/strict";
import { FileUploadHelper } from "../dist/utils/helpers/FileUploadHelper.js";

// Mocking global fetch for testing
const originalFetch = globalThis.fetch;

// ============================================================================
// FileUploadHelper Tests
// ============================================================================

test("FileUploadHelper.validateFile validates file size", () => {
    // @ts-expect-error - Test type override
    const mockFile = { size: 200 * 1024 * 1024, name: "large.txt", type: "text/plain" };
    const result = FileUploadHelper.validateFile(mockFile, { maxSize: 100 * 1024 * 1024 });
    
    assert.equal(result.valid, false);
    assert.match(result.error || "", /exceeds maximum/);
});

test("FileUploadHelper.validateFile validates file type", () => {
    // @ts-expect-error - Test type override
    const mockFile = { size: 1000, name: "image.png", type: "image/png" };
    const result = FileUploadHelper.validateFile(mockFile, { allowedTypes: ["image/jpeg"] });
    
    assert.equal(result.valid, false);
    assert.match(result.error || "", /type image\/png is not allowed/);
});

test("FileUploadHelper.validateFile validates file extension", () => {
    // @ts-expect-error - Test type override
    const mockFile = { size: 1000, name: "doc.pdf", type: "application/pdf" };
    const result = FileUploadHelper.validateFile(mockFile, { allowedExtensions: ["txt", "docx"] });
    
    assert.equal(result.valid, false);
    assert.match(result.error || "", /extension .pdf is not allowed/);
});

test("FileUploadHelper.validateFile passes for valid file", () => {
    // @ts-expect-error - Test type override
    const mockFile = { size: 1000, name: "image.jpg", type: "image/jpeg" };
    const result = FileUploadHelper.validateFile(mockFile, {
        maxSize: 2000,
        allowedTypes: ["image/jpeg"],
        allowedExtensions: ["jpg", "jpeg"]
    });
    
    assert.equal(result.valid, true);
});

test("FileUploadHelper.uploadFile handles small files (direct upload)", async () => {
    // Mock successful fetch
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
    });
    
    const blob = new Blob(["hello world"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(blob, "https://api.example.com/upload", {
        chunkSize: 1024 // Larger than file size
    });
    
    assert.equal(result.success, true);
    assert.ok(result.fileId);
    
    globalThis.fetch = originalFetch;
});

test("FileUploadHelper.uploadFile handles large files (chunked upload)", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };
    
    const data = "a".repeat(1024); // 1KB data
    const blob = new Blob([data], { type: "text/plain" });
    
    const progressUpdates = [];
    const result = await FileUploadHelper.uploadFile(blob, "https://api.example.com/upload", {
        chunkSize: 512, // Should create 2 chunks
        onProgress: (p) => progressUpdates.push(p.percentage)
    });
    
    assert.equal(result.success, true);
    assert.equal(callCount, 2);
    assert.ok(progressUpdates.includes(100));
    
    globalThis.fetch = originalFetch;
});

test("FileUploadHelper.uploadFile handles retries on failure", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        if (callCount === 1) return { ok: false, status: 500 };
        return { ok: true, status: 200 };
    };
    
    const blob = new Blob(["test"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(blob, "https://api.example.com/upload", {
        maxRetries: 2,
        chunkSize: 10
    });
    
    assert.equal(result.success, true);
    assert.equal(callCount, 2);
    
    globalThis.fetch = originalFetch;
});

test("FileUploadHelper.uploadFile returns error after all retries fail", async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    
    const blob = new Blob(["test"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(blob, "https://api.example.com/upload", {
        maxRetries: 1,
        chunkSize: 10
    });
    
    assert.equal(result.success, false);
    assert.match(result.error || "", /status 500/);
    
    globalThis.fetch = originalFetch;
});

test("FileUploadHelper.uploadFile handles network exceptions", async () => {
    globalThis.fetch = async () => {
        throw new Error("Network error");
    };
    
    const blob = new Blob(["test"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(blob, "https://api.example.com/upload", {
        maxRetries: 1
    });
    
    assert.equal(result.success, false);
    assert.equal(result.error, "Network error");
    
    globalThis.fetch = originalFetch;
});
