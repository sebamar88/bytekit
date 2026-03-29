# Data Model: Resumable File Uploads with Chunking

**Feature**: `007-resumable-uploads`  
**Phase**: 1 — Design  
**Source decisions**: research.md D1–D5

---

## Overview

All changes are additive modifications to the existing interfaces in
`src/utils/helpers/FileUploadHelper.ts`. No new files, no breaking changes.

---

## Modified Interface: `FileUploadOptions`

```typescript
/**
 * Options for controlling file upload behavior.
 */
export interface FileUploadOptions {
    /** Called after each chunk completes with aggregated bytes loaded so far. */
    onProgress?: (progress: UploadProgress) => void;

    /**
     * Size of each chunk in bytes.
     * @default 5 * 1024 * 1024  (5 MB)
     */
    chunkSize?: number;

    /**
     * Maximum number of retry attempts per chunk on failure.
     * @default 3
     */
    maxRetries?: number;

    /**
     * Request timeout per chunk in milliseconds.
     * @default 30000
     */
    timeout?: number;

    /** Additional headers to include with every chunk request. */
    headers?: Record<string, string>;

    // ── NEW (007-resumable-uploads) ──────────────────────────────────────────

    /**
     * Chunk index (0-based) to start uploading from, skipping all prior chunks.
     * Obtain from a previous `UploadResponse.uploadedChunks` to resume an
     * interrupted upload.
     * @default 0  (start from the beginning)
     */
    resumeFrom?: number;

    /**
     * Maximum number of chunks to upload concurrently.
     * Uploads proceed in sequential batches of this size.
     * A value of 1 (default) preserves the original sequential behavior.
     * @default 1
     */
    concurrency?: number;
}
```

### Field summary

| Field | Type | Default | Status |
|-------|------|---------|--------|
| `onProgress` | `(p: UploadProgress) => void` | — | existing |
| `chunkSize` | `number` | `5_242_880` | existing |
| `maxRetries` | `number` | `3` | existing |
| `timeout` | `number` | `30_000` | existing |
| `headers` | `Record<string, string>` | — | existing |
| `resumeFrom` | `number` | `0` | **NEW** |
| `concurrency` | `number` | `1` | **NEW** |

---

## Modified Interface: `UploadResponse`

```typescript
/**
 * Result of an upload operation.
 */
export interface UploadResponse {
    /** Whether the upload completed successfully (all chunks sent). */
    success: boolean;

    /** Server-assigned file identifier, if provided by the server. */
    fileId?: string;

    /** URL of the uploaded file, if provided by the server. */
    url?: string;

    /** Error message if `success` is false. */
    error?: string;

    // ── NEW (007-resumable-uploads) ──────────────────────────────────────────

    /**
     * Number of chunks successfully uploaded.
     * On success: equals `totalChunks`.
     * On failure: the number of chunks that completed before the error,
     *   which can be passed as `resumeFrom` on a subsequent call.
     */
    uploadedChunks?: number;

    /**
     * Total number of chunks the file was divided into at the given `chunkSize`.
     * Useful for computing progress or verifying resume arithmetic.
     */
    totalChunks?: number;
}
```

### Field summary

| Field | Type | Status |
|-------|------|--------|
| `success` | `boolean` | existing |
| `fileId` | `string \| undefined` | existing |
| `url` | `string \| undefined` | existing |
| `error` | `string \| undefined` | existing |
| `uploadedChunks` | `number \| undefined` | **NEW** |
| `totalChunks` | `number \| undefined` | **NEW** |

---

## Unchanged Interface: `UploadProgress`

No changes needed. The existing fields already support byte-accurate aggregation.

```typescript
export interface UploadProgress {
    /** Bytes loaded so far (sum of completed chunk sizes). */
    loaded: number;
    /** Total file size in bytes. */
    total: number;
    /** Percentage complete: (loaded / total) * 100, rounded to 2 decimal places. */
    percentage: number;
}
```

---

## Internal Concurrency Model

```
Chunks: [0][1][2][3][4][5][6][7][8][9]   (totalChunks = 10)
         ────────────────────────────────────────────────────
resumeFrom=3, concurrency=3:

Skip:   [0][1][2]
Batch1: [3][4][5]  → Promise.all([upload(3), upload(4), upload(5)])
Batch2: [6][7][8]  → Promise.all([upload(6), upload(7), upload(8)])
Batch3: [9]        → Promise.all([upload(9)])
```

- Each `upload(i)` is a call to `uploadChunkWithRetry(chunk, index, totalChunks, ...)`
- After each individual chunk resolves, `onProgress` fires with updated cumulative `loaded`
- If any chunk in a batch throws after exhausting retries, the error propagates out of
  `Promise.all`, the upload halts, and `uploadedChunks` reflects chunks completed *before*
  the failed batch

---

## Validation Rules

| Rule | Behavior |
|------|----------|
| `concurrency < 1` | Clamped to `1` (treated as sequential) |
| `resumeFrom >= totalChunks` | Returns `{ success: true, uploadedChunks: totalChunks, totalChunks }` immediately — nothing to upload |
| `resumeFrom < 0` | Treated as `0` |
| `chunkSize < 1` | Falls back to default 5 MB (existing behavior) |
| Single-chunk file with `resumeFrom >= 1` | Immediate success (nothing left to upload) |

---

## State Transitions

```
Initial call:
  uploadFile(file, url, { chunkSize: 1MB })
  → success=true, uploadedChunks=10, totalChunks=10

Interrupted at chunk 4 (0-based):
  → success=false, uploadedChunks=4, totalChunks=10, error="..."

Resume call:
  uploadFile(file, url, { chunkSize: 1MB, resumeFrom: 4 })
  → uploads chunks 4..9
  → success=true, uploadedChunks=10, totalChunks=10
```

> **Note**: The server must be able to reassemble chunks out-of-order or by index. The
> existing FormData fields `chunkIndex` and `totalChunks` already provide this information.
