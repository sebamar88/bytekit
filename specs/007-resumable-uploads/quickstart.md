# Quickstart: Resumable File Uploads with Chunking

**Feature**: `007-resumable-uploads`  
**Module**: `bytekit/helpers` or `bytekit`

---

## Installation

```bash
npm install bytekit
# or
pnpm add bytekit
```

---

## US1 — Upload a large file in chunks

Split a `File` (or `Blob`) into fixed-size chunks and upload them sequentially.

```typescript
import { FileUploadHelper } from "bytekit/helpers";
// or: import { FileUploadHelper } from "bytekit";

const file = document.querySelector<HTMLInputElement>("#file-input")!.files![0];

const result = await FileUploadHelper.uploadFile(file, "https://api.example.com/upload", {
    chunkSize: 1 * 1024 * 1024, // 1 MB chunks
});

if (result.success) {
    console.log(`Upload complete. ${result.totalChunks} chunks sent.`);
    console.log("File ID:", result.fileId);
} else {
    console.error("Upload failed:", result.error);
}
```

**What happens**:
- The file is sliced into `Math.ceil(file.size / chunkSize)` pieces using `Blob.slice()`.
- Each chunk is sent as a `multipart/form-data` POST with `chunkIndex` and `totalChunks`
  fields, plus an `X-Upload-ID` header shared across all chunks.
- A file smaller than `chunkSize` is uploaded in a single request (no chunking headers).

---

## US2 — Resume an interrupted upload

When an upload fails mid-way, use `uploadedChunks` from the failed response as
`resumeFrom` on the next call. The server must store previously received chunks.

```typescript
import { FileUploadHelper } from "bytekit/helpers";

const file = document.querySelector<HTMLInputElement>("#file-input")!.files![0];
const ENDPOINT = "https://api.example.com/upload";
const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB

// First attempt — may fail mid-way
let result = await FileUploadHelper.uploadFile(file, ENDPOINT, {
    chunkSize: CHUNK_SIZE,
});

// Retry from where it left off
while (!result.success && result.uploadedChunks !== undefined) {
    console.warn(
        `Upload interrupted after ${result.uploadedChunks}/${result.totalChunks} chunks. Retrying…`
    );

    result = await FileUploadHelper.uploadFile(file, ENDPOINT, {
        chunkSize: CHUNK_SIZE,
        resumeFrom: result.uploadedChunks, // skip already-uploaded chunks
    });
}

if (result.success) {
    console.log("Upload complete after resume.");
} else {
    console.error("Upload ultimately failed:", result.error);
}
```

**Key points**:
- `resumeFrom` is a 0-based chunk index. Setting `resumeFrom: 4` means chunks 0–3 are
  assumed to be on the server already; the helper starts uploading from chunk 4.
- The helper sends the `X-Upload-ID` header on all chunk requests so the server can
  correlate chunks from the same logical upload across calls.
- You must use the same `chunkSize` on resume as on the initial call, otherwise chunk
  indices will not align.

---

## US3 — Parallel chunks with progress reporting

Increase throughput on fast connections by uploading multiple chunks concurrently, and
display live upload progress to the user.

```typescript
import { FileUploadHelper } from "bytekit/helpers";

const file = document.querySelector<HTMLInputElement>("#file-input")!.files![0];
const progressBar = document.querySelector<HTMLProgressElement>("#progress")!;

const result = await FileUploadHelper.uploadFile(file, "https://api.example.com/upload", {
    chunkSize: 512 * 1024,  // 512 KB chunks
    concurrency: 3,          // upload up to 3 chunks in parallel

    onProgress: ({ loaded, total, percentage }) => {
        progressBar.value = percentage;
        console.log(`${loaded} / ${total} bytes (${percentage.toFixed(1)}%)`);
    },
});

console.log(result.success ? "Done!" : `Failed: ${result.error}`);
```

**Progress semantics with concurrency**:
- `onProgress` fires after each individual chunk completes, even when chunks run in parallel.
- `loaded` reflects the cumulative bytes of all *completed* chunks so far — not in-flight
  bytes.
- `percentage` is always in the range `[0, 100]`.
- When `concurrency > 1`, multiple `onProgress` calls may arrive in quick succession as
  parallel chunks finish within the same batch.

---

## Combining all three features

```typescript
import { FileUploadHelper } from "bytekit/helpers";

async function robustUpload(file: File, endpoint: string) {
    const options = {
        chunkSize: 1 * 1024 * 1024, // 1 MB
        concurrency: 4,
        onProgress: ({ percentage }: { percentage: number }) => {
            console.log(`Progress: ${percentage.toFixed(1)}%`);
        },
    };

    let result = await FileUploadHelper.uploadFile(file, endpoint, options);

    // Resume up to 3 times
    for (let attempt = 0; attempt < 3 && !result.success; attempt++) {
        console.warn(`Attempt ${attempt + 1} failed at chunk ${result.uploadedChunks}. Resuming…`);
        result = await FileUploadHelper.uploadFile(file, endpoint, {
            ...options,
            resumeFrom: result.uploadedChunks ?? 0,
        });
    }

    return result;
}
```

---

## Validation before upload

```typescript
import { FileUploadHelper } from "bytekit/helpers";

const file = document.querySelector<HTMLInputElement>("#file-input")!.files![0];

const validation = FileUploadHelper.validateFile(file, {
    maxSize: 100 * 1024 * 1024,          // 100 MB limit
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
    allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
});

if (!validation.valid) {
    console.error("Invalid file:", validation.error);
} else {
    await FileUploadHelper.uploadFile(file, "https://api.example.com/upload");
}
```

---

## TypeScript types

```typescript
import type { FileUploadOptions, UploadResponse, UploadProgress } from "bytekit/helpers";

const options: FileUploadOptions = {
    chunkSize: 2 * 1024 * 1024,
    concurrency: 3,
    resumeFrom: 5,
    maxRetries: 2,
    timeout: 60_000,
    headers: { Authorization: "Bearer token" },
    onProgress: (p: UploadProgress) => console.log(p.percentage),
};

const response: UploadResponse = await FileUploadHelper.uploadFile(blob, url, options);
// response.uploadedChunks — how many chunks sent
// response.totalChunks   — how many chunks total
```
