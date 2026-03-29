/**
 * @file resumable-upload.ts
 * @description End-to-end example demonstrating chunked, resumable, concurrent
 * file uploads using FileUploadHelper (007-resumable-uploads).
 */

import { FileUploadHelper } from "../src/utils/helpers/FileUploadHelper.js";

// ---------------------------------------------------------------------------
// 1. Basic chunked upload (US1)
// ---------------------------------------------------------------------------

async function basicChunkedUpload(file: File) {
    const result = await FileUploadHelper.uploadFile(file, "https://api.example.com/upload", {
        chunkSize: 1 * 1024 * 1024, // 1 MB chunks
    });

    if (result.success) {
        console.log(`✅ Upload complete — ${result.totalChunks} chunks sent.`);
        console.log(`   fileId: ${result.fileId}`);
    } else {
        console.error(`❌ Upload failed: ${result.error}`);
        console.log(`   Completed ${result.uploadedChunks}/${result.totalChunks} chunks.`);
    }
}

// ---------------------------------------------------------------------------
// 2. Resilient upload with automatic resume (US2)
// ---------------------------------------------------------------------------

async function resilientUpload(
    file: File,
    endpoint: string,
    chunkSize = 1 * 1024 * 1024,
    maxAttempts = 5
) {
    let result = await FileUploadHelper.uploadFile(file, endpoint, { chunkSize });
    let attempt = 1;

    while (!result.success && attempt < maxAttempts && result.uploadedChunks !== undefined) {
        console.warn(
            `⚠️  Attempt ${attempt} interrupted at chunk ` +
            `${result.uploadedChunks}/${result.totalChunks}. Resuming…`
        );

        result = await FileUploadHelper.uploadFile(file, endpoint, {
            chunkSize,
            // Resume from where the last call left off — no duplicate sends
            resumeFrom: result.uploadedChunks,
        });

        attempt++;
    }

    if (result.success) {
        console.log(`✅ Upload complete after ${attempt} attempt(s).`);
    } else {
        console.error(`❌ Upload ultimately failed after ${attempt} attempts: ${result.error}`);
    }

    return result;
}

// ---------------------------------------------------------------------------
// 3. Concurrent upload with live progress (US3)
// ---------------------------------------------------------------------------

async function concurrentUploadWithProgress(file: File) {
    const progressBar = { value: 0 }; // substitute for a real DOM element

    const result = await FileUploadHelper.uploadFile(file, "https://api.example.com/upload", {
        chunkSize: 512 * 1024,  // 512 KB chunks
        concurrency: 4,          // 4 parallel chunk requests
        onProgress: ({ loaded, total, percentage }) => {
            progressBar.value = percentage;
            console.log(
                `📊 ${percentage.toFixed(1)}% — ` +
                `${(loaded / 1024 / 1024).toFixed(2)} MB / ` +
                `${(total / 1024 / 1024).toFixed(2)} MB`
            );
        },
    });

    return result;
}

// ---------------------------------------------------------------------------
// 4. All features combined: validate → concurrent → resume
// ---------------------------------------------------------------------------

async function robustUpload(file: File, endpoint: string) {
    // Validate before uploading
    const validation = FileUploadHelper.validateFile(file, {
        maxSize: 500 * 1024 * 1024,
        allowedTypes: ["image/jpeg", "image/png", "application/pdf", "video/mp4"],
        allowedExtensions: ["jpg", "jpeg", "png", "pdf", "mp4"],
    });

    if (!validation.valid) {
        throw new Error(`File rejected: ${validation.error}`);
    }

    const uploadOptions = {
        chunkSize: 2 * 1024 * 1024, // 2 MB
        concurrency: 3,
        onProgress: ({ percentage }: { percentage: number }) =>
            console.log(`Progress: ${percentage.toFixed(1)}%`),
    };

    // First attempt
    let result = await FileUploadHelper.uploadFile(file, endpoint, uploadOptions);

    // Auto-resume up to 3 times on failure
    for (let i = 0; i < 3 && !result.success; i++) {
        console.warn(`Retrying upload from chunk ${result.uploadedChunks}…`);
        result = await FileUploadHelper.uploadFile(file, endpoint, {
            ...uploadOptions,
            resumeFrom: result.uploadedChunks ?? 0,
        });
    }

    return result;
}

// ---------------------------------------------------------------------------
// Demo (Node.js — uses Blob instead of File)
// ---------------------------------------------------------------------------

async function demo() {
    // Simulate a ~3 KB "file" for the demo
    const content = "x".repeat(3 * 1024);
    const blob = new Blob([content], { type: "text/plain" });

    // Mock fetch for the demo
    const originalFetch = globalThis.fetch;
    let fetchCallCount = 0;
    globalThis.fetch = async () => {
        fetchCallCount++;
        // Simulate intermittent failure on 3rd chunk
        if (fetchCallCount === 3) {
            return { ok: false, status: 503 } as Response;
        }
        return { ok: true, status: 200 } as Response;
    };

    console.log("=== Resumable Upload Demo ===\n");

    console.log("1. Basic chunked upload (chunkSize=1024, 3 chunks expected):");
    await basicChunkedUpload(blob as unknown as File);

    console.log("\n2. Concurrent upload with progress (chunkSize=512, concurrency=2):");
    fetchCallCount = 0;
    globalThis.fetch = async () => ({ ok: true, status: 200 }) as Response;
    await concurrentUploadWithProgress(blob as unknown as File);

    globalThis.fetch = originalFetch;
    console.log("\n✅ Demo complete.");
}

demo().catch(console.error);

export { basicChunkedUpload, resilientUpload, concurrentUploadWithProgress, robustUpload };
