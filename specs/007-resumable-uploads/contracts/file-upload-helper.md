# Contract: FileUploadHelper (007-resumable-uploads)

**Feature**: `007-resumable-uploads`  
**Phase**: 1 — Design  
**Module**: `bytekit/helpers` (re-exported from root `bytekit`)

---

## Public API

### `FileUploadHelper` (static class)

All methods are static. The class itself is not instantiated.

---

### `FileUploadHelper.uploadFile()`

```typescript
static async uploadFile(
    file: File | Blob,
    endpoint: string,
    options?: FileUploadOptions
): Promise<UploadResponse>
```

Uploads a file to the given endpoint. Automatically chunks the file if its size exceeds
`options.chunkSize`. Supports resuming from a prior chunk index and configurable concurrency.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | `File \| Blob` | ✅ | The file or blob to upload |
| `endpoint` | `string` | ✅ | Destination URL (absolute or relative) |
| `options` | `FileUploadOptions` | ❌ | Upload configuration (all fields optional) |

#### `FileUploadOptions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `chunkSize` | `number` | `5_242_880` | Chunk size in bytes |
| `maxRetries` | `number` | `3` | Retries per chunk on failure |
| `timeout` | `number` | `30_000` | Per-chunk timeout in ms |
| `headers` | `Record<string, string>` | `{}` | Extra request headers |
| `onProgress` | `(p: UploadProgress) => void` | — | Called after each chunk |
| `resumeFrom` | `number` | `0` | Chunk index to start from (0-based) |
| `concurrency` | `number` | `1` | Max parallel chunks |

#### Returns: `Promise<UploadResponse>`

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | `true` if all chunks uploaded successfully |
| `fileId` | `string \| undefined` | Server-assigned file ID |
| `url` | `string \| undefined` | URL of uploaded file |
| `error` | `string \| undefined` | Error message if `success` is `false` |
| `uploadedChunks` | `number \| undefined` | Chunks successfully sent |
| `totalChunks` | `number \| undefined` | Total chunks the file was divided into |

#### Behavior contract

1. **Small files** (`file.size <= chunkSize`): single HTTP POST with `Content-Type:
   multipart/form-data`, field `file`. No `X-Upload-ID` header.
2. **Large files** (`file.size > chunkSize`): one POST per chunk. Each request sends
   FormData with fields `file` (the chunk), `chunkIndex` (0-based), `totalChunks`.
   The `X-Upload-ID` header is set on every chunk request.
3. **Retry**: exponential back-off — `2^n * 1000 ms` delay between retries. After
   `maxRetries` consecutive failures on a chunk, the upload halts.
4. **Resume**: chunks `0 .. resumeFrom-1` are skipped entirely. The server must
   have already received those chunks. The `uploadedChunks` count in the response
   reflects *all* chunks (including those skipped by `resumeFrom`).
5. **Concurrency**: chunks are processed in sequential batches of `concurrency` size.
   If any chunk in a batch fails after all retries, `uploadFile` rejects and
   `uploadedChunks` reflects the last *fully completed* batch.
6. **Progress**: `onProgress` is called with `{ loaded, total, percentage }` after each
   individual chunk completes. `loaded` is the cumulative byte count of all finished
   chunks. When `resumeFrom > 0`, `loaded` is **pre-initialized** to the byte-sum of all
   skipped chunks before the upload loop begins — so `percentage` always reflects
   progress across the *entire* file, not just the resumed portion. Example: resuming a
   10 MB file from chunk 5 of 10 (5 MB already on the server) will begin with
   `loaded = 5_242_880` and `percentage ≈ 50`.

#### Error contract

| Scenario | `success` | `error` | `uploadedChunks` |
|----------|-----------|---------|------------------|
| All chunks succeed | `true` | — | `totalChunks` |
| HTTP non-2xx after all retries | `false` | `"Upload failed with status NNN"` | count before failure |
| Network exception | `false` | `error.message` | count before failure |
| `resumeFrom >= totalChunks` | `true` | — | `totalChunks` (immediate) |

---

### `FileUploadHelper.validateFile()`

*Unchanged from existing implementation. Reproduced for completeness.*

```typescript
static validateFile(
    file: File,
    options?: {
        maxSize?: number;
        allowedTypes?: string[];
        allowedExtensions?: string[];
    }
): { valid: boolean; error?: string }
```

Validates a file against size, MIME type, and extension constraints synchronously.

---

## Transport Format

### Single-file upload request

```
POST {endpoint}
Content-Type: multipart/form-data

[field] file: <blob>
```

### Chunked upload request (per chunk)

```
POST {endpoint}
Content-Type: multipart/form-data
X-Upload-ID: {uuid}
[...custom headers]

[field] file:        <chunk blob>
[field] chunkIndex:  {0-based integer as string}
[field] totalChunks: {integer as string}
```

### Expected server response

The helper does not parse response body; it only checks `response.ok`.
If the server returns a JSON body with `fileId` or `url`, the helper will **not** parse it
automatically — callers must read the response body themselves if needed.

> **Note**: The current implementation generates a `fileId` client-side via UUID, not from
> the server response body. This is existing behavior preserved for compatibility.

---

## Versioning & Compatibility

| Version | Change |
|---------|--------|
| `2.2.x` | Existing `uploadFile` / `validateFile` (chunked sequential, no resume) |
| `2.3.0` (this feature) | Add `resumeFrom`, `concurrency` options; add `uploadedChunks`, `totalChunks` to response |

All new fields are optional — no breaking changes. Callers that do not use the new fields
will observe identical behavior to `2.2.x`.
