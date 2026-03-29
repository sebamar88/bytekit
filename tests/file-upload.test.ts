import { FileUploadHelper } from "../src/utils/helpers/FileUploadHelper";

// Mocking global fetch for testing
const originalFetch = globalThis.fetch;

// ============================================================================
// FileUploadHelper Tests
// ============================================================================

test("FileUploadHelper.validateFile validates file size", () => {
    // @ts-expect-error - Test type override
    const mockFile = {
        size: 200 * 1024 * 1024,
        name: "large.txt",
        type: "text/plain",
    };
    const result = FileUploadHelper.validateFile(mockFile, {
        maxSize: 100 * 1024 * 1024,
    });

    assert.equal(result.valid, false);
    assert.match(result.error || "", /exceeds maximum/);
});

test("FileUploadHelper.validateFile validates file type", () => {
    // @ts-expect-error - Test type override
    const mockFile = { size: 1000, name: "image.png", type: "image/png" };
    const result = FileUploadHelper.validateFile(mockFile, {
        allowedTypes: ["image/jpeg"],
    });

    assert.equal(result.valid, false);
    assert.match(result.error || "", /type image\/png is not allowed/);
});

test("FileUploadHelper.validateFile validates file extension", () => {
    // @ts-expect-error - Test type override
    const mockFile = { size: 1000, name: "doc.pdf", type: "application/pdf" };
    const result = FileUploadHelper.validateFile(mockFile, {
        allowedExtensions: ["txt", "docx"],
    });

    assert.equal(result.valid, false);
    assert.match(result.error || "", /extension .pdf is not allowed/);
});

test("FileUploadHelper.validateFile passes for valid file", () => {
    // @ts-expect-error - Test type override
    const mockFile = { size: 1000, name: "image.jpg", type: "image/jpeg" };
    const result = FileUploadHelper.validateFile(mockFile, {
        maxSize: 2000,
        allowedTypes: ["image/jpeg"],
        allowedExtensions: ["jpg", "jpeg"],
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
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        {
            chunkSize: 1024, // Larger than file size
        }
    );

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
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        {
            chunkSize: 512, // Should create 2 chunks
            onProgress: (p) => progressUpdates.push(p.percentage),
        }
    );

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
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        {
            maxRetries: 2,
            chunkSize: 10,
        }
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 2);

    globalThis.fetch = originalFetch;
});

test("FileUploadHelper.uploadFile returns error after all retries fail", async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500 });

    const blob = new Blob(["test"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        {
            maxRetries: 1,
            chunkSize: 10,
        }
    );

    assert.equal(result.success, false);
    assert.match(result.error || "", /status 500/);

    globalThis.fetch = originalFetch;
});

test("FileUploadHelper.uploadFile handles network exceptions", async () => {
    globalThis.fetch = async () => {
        throw new Error("Network error");
    };

    const blob = new Blob(["test"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        {
            maxRetries: 1,
        }
    );

    assert.equal(result.success, false);
    assert.equal(result.error, "Network error");

    globalThis.fetch = originalFetch;
});

// ============================================================================
// US1 — Chunk Count Observable (T005–T007)
// ============================================================================

test("[US1] uploadFile reports totalChunks and uploadedChunks for chunked uploads", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(1024); // 1 KB
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512 } // 1024 / 512 = 2 chunks
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 2);
    assert.equal(result.totalChunks, 2);
    assert.equal(result.uploadedChunks, 2);

    globalThis.fetch = originalFetch;
});

test("[US1] uploadFile reports totalChunks=1 and uploadedChunks=1 for small files", async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200 });

    const blob = new Blob(["small file"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 1024 * 1024 } // much larger than file
    );

    assert.equal(result.success, true);
    assert.equal(result.totalChunks, 1);
    assert.equal(result.uploadedChunks, 1);

    globalThis.fetch = originalFetch;
});

test("[US1] uploadFile reports uploadedChunks on partial failure", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        // chunk 0 succeeds, chunk 1 fails
        if (callCount === 2) return { ok: false, status: 500 };
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(1024);
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, maxRetries: 1 }
    );

    assert.equal(result.success, false);
    assert.equal(result.totalChunks, 2);
    assert.equal(result.uploadedChunks, 1); // chunk 0 succeeded before failure

    globalThis.fetch = originalFetch;
});

// ============================================================================
// US2 — Resume from Failure (T011–T013)
// ============================================================================

test("[US2] uploadFile skips already-uploaded chunks with resumeFrom", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(1024);
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, resumeFrom: 1 } // skip chunk 0, upload only chunk 1
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 1); // only 1 fetch call (chunk 1)
    assert.equal(result.totalChunks, 2);
    assert.equal(result.uploadedChunks, 2); // absolute count includes skipped chunk

    globalThis.fetch = originalFetch;
});

test("[US2] uploadFile can resume after failure at first chunk", async () => {
    // First call: all chunks fail
    globalThis.fetch = async () => ({ ok: false, status: 500 });

    const data = "a".repeat(1024);
    const blob = new Blob([data], { type: "text/plain" });

    const firstResult = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, maxRetries: 1 }
    );

    assert.equal(firstResult.success, false);
    assert.equal(firstResult.uploadedChunks, 0);

    // Second call: resume with uploadedChunks from previous response
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const resumeResult = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, resumeFrom: firstResult.uploadedChunks }
    );

    assert.equal(resumeResult.success, true);
    assert.equal(callCount, 2); // all chunks sent on resume (resumeFrom was 0)

    globalThis.fetch = originalFetch;
});

test("[US2] uploadFile returns immediate success when resumeFrom >= totalChunks", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(1024);
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, resumeFrom: 10 } // totalChunks=2, so 10 >= 2
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 0); // zero fetch calls
    assert.equal(result.totalChunks, 2);
    assert.equal(result.uploadedChunks, 2);

    globalThis.fetch = originalFetch;
});

// ============================================================================
// US3 — Progress and Concurrency (T016–T018)
// ============================================================================

test("[US3] uploadFile uploads all chunks with configured concurrency", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(3072); // 3 KB → 6 chunks of 512 B
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, concurrency: 3 }
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 6);
    assert.equal(result.totalChunks, 6);
    assert.equal(result.uploadedChunks, 6);

    globalThis.fetch = originalFetch;
});

test("[US3] uploadFile with concurrency=1 is sequential (regression)", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(1024);
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, concurrency: 1 }
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 2);
    assert.equal(result.totalChunks, 2);
    assert.equal(result.uploadedChunks, 2);

    globalThis.fetch = originalFetch;
});

test("[US3] uploadFile fires onProgress once per chunk when concurrent", async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200 });

    const data = "a".repeat(3072); // 6 chunks of 512 B
    const blob = new Blob([data], { type: "text/plain" });

    const progressUpdates: number[] = [];
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        {
            chunkSize: 512,
            concurrency: 3,
            onProgress: (p) => progressUpdates.push(p.percentage),
        }
    );

    assert.equal(result.success, true);
    assert.equal(progressUpdates.length, 6); // once per chunk, not per batch
    assert.ok(progressUpdates.includes(100)); // final progress is 100%

    globalThis.fetch = originalFetch;
});

// ============================================================================
// Edge-Case Validation (T023–T025)
// ============================================================================

test("[US2] uploadFile clamps negative resumeFrom to 0 (all chunks sent)", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(1024);
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, resumeFrom: -1 }
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 2); // all chunks sent (started from 0)
    assert.equal(result.uploadedChunks, 2);

    globalThis.fetch = originalFetch;
});

test("[US3] uploadFile clamps concurrency=0 to 1 (sequential upload)", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount++;
        return { ok: true, status: 200 };
    };

    const data = "a".repeat(1024);
    const blob = new Blob([data], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 512, concurrency: 0 }
    );

    assert.equal(result.success, true);
    assert.equal(callCount, 2);
    assert.equal(result.totalChunks, 2);

    globalThis.fetch = originalFetch;
});

test("uploadFile treats chunkSize=0 as default 5 MB (single chunk for small files)", async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200 });

    const blob = new Blob(["hello"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 0 }
    );

    // file (5 bytes) is smaller than the 5 MB default → 1 chunk
    assert.equal(result.success, true);
    assert.equal(result.totalChunks, 1);

    globalThis.fetch = originalFetch;
});

test("FileUploadHelper.uploadFile uses 'Upload failed' when fetch throws a non-Error (line 241)", async () => {
    // Make fetch throw a plain string (not an Error instance)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.fetch = (): any => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw "network failure string";
    };

    const blob = new Blob(["data"], { type: "text/plain" });
    const result = await FileUploadHelper.uploadFile(
        blob,
        "https://api.example.com/upload",
        { chunkSize: 1024, maxRetries: 1 }
    );

    assert.equal(result.success, false);
    // Non-Error throw → error instanceof Error is false → "Upload failed" fallback
    assert.equal(result.error, "Upload failed");

    globalThis.fetch = originalFetch;
});
