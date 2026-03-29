# Research: Resumable File Uploads with Chunking

**Feature**: `007-resumable-uploads`  
**Phase**: 0 — Unknowns & Design Decisions  
**Status**: Complete

---

## D1 — Resume State Model

**Question**: How should the caller specify "where to resume"? A simple chunk index vs. a
richer state object tracking which specific chunks have succeeded (useful for sparse
failures in concurrent uploads)?

**Decision**: Simple integer — `resumeFrom?: number` (0-based chunk index)

**Rationale**:
- Spec says "continúa desde chunk 6" — the mental model is linear, not sparse.
- Concurrent uploads will still upload chunks in order within their slot; a failed batch
  will not produce sparse successful chunks because the entire upload is aborted on
  first-unretried failure.
- Callers obtain the resume point from `UploadResponse.uploadedChunks` (see D2), which is
  always a contiguous count.
- A sparse `Set<number>` model would require callers to manage state themselves and adds
  no practical benefit given the sequential-by-default design.

**Alternatives considered**:
- `UploadState` object (`{ completedChunks: Set<number>; uploadId: string }`) — richer but
  over-engineered for linear resume; rejected for complexity.
- Server-side query for completed chunks — out of scope; helper is transport-agnostic.

---

## D2 — `uploadFile()` Return Type: Exposing Resume Point

**Question**: What does `UploadResponse` return to enable a caller to resume later?

**Decision**: Add two optional fields to `UploadResponse`:
- `uploadedChunks?: number` — count of chunks successfully sent before failure
- `totalChunks?: number` — total chunk count for the file at the given `chunkSize`

**Rationale**:
- `uploadedChunks` is the natural input for `resumeFrom` on the next call:
  `await FileUploadHelper.uploadFile(file, url, { resumeFrom: prev.uploadedChunks })`.
- Returning `totalChunks` lets the caller compute progress without re-deriving chunk math.
- Both fields are optional: they are populated on both success and partial failure so
  callers always have the information, but the interface remains backward-compatible.

**Alternatives considered**:
- Return a `UploadSession` class with a `.resume()` method — stateful, violates the
  static-method / functional design of the class.
- `lastSuccessfulChunkIndex?: number` (index instead of count) — count is more intuitive;
  `resumeFrom = count` maps directly to "skip the first N chunks".

---

## D3 — Concurrency Mechanism

**Question**: How to implement parallel chunk uploads in an isomorphic way without adding
external dependencies? Use the existing `PromisePool` from `bytekit/async` or write
inline?

**Decision**: Inline `Promise.all`-based batch concurrency inside `FileUploadHelper`

**Rationale**:
- Importing from `bytekit/async` within `FileUploadHelper.ts` introduces intra-package
  coupling. While technically safe, it creates an implicit build-order dependency and
  means changes to the async module API could break the upload helper.
- The required concurrency primitive is small (~10 lines): split the chunks array into
  windows of size `concurrency`, then `await Promise.all(window)` for each window.
- This "windowed batch" approach is isomorphic (uses only `Promise.all`) and requires no
  additional abstractions.
- If true sliding-window concurrency is needed in the future, refactoring to use
  `PromisePool` internally is a one-function change.

**Alternatives considered**:
- `PromisePool` from `bytekit/async` — correct abstraction but adds intra-package coupling
  and is over-engineered for 3 user stories.
- Async semaphore with `Promise` queue — more general but ~30 extra lines for no benefit
  over windowed batching at the chunk sizes in scope.

**Implementation sketch**:
```typescript
// Split chunks into batches of `concurrency` size, then run each batch in parallel
for (let batchStart = resumeFrom; batchStart < totalChunks; batchStart += concurrency) {
    const batchEnd = Math.min(batchStart + concurrency, totalChunks);
    const batchIndices = Array.from({ length: batchEnd - batchStart }, (_, i) => batchStart + i);
    await Promise.all(batchIndices.map(i => uploadChunkWithRetry(...)));
}
```

---

## D4 — Progress Reporting with Concurrency

**Question**: When chunks upload in parallel, how should `onProgress` be called? Per
chunk completion or per byte (streaming)?

**Decision**: Per-chunk completion with byte-accurate aggregation

**Rationale**:
- Byte-level streaming progress requires `ReadableStream` interception, which is
  browser-only in most environments and significantly increases complexity.
- Per-chunk completion is already the pattern in the existing sequential implementation;
  it is familiar to callers.
- Aggregated bytes (not just chunk count) are surfaced: after each chunk completes,
  `loaded = sum of chunk sizes completed so far`, which gives accurate `percentage`.
- With concurrency, multiple chunks may complete "at once" (same micro-task turn) — each
  fires a separate `onProgress` call with the updated cumulative `loaded` value. Callers
  who want smooth progress bars should debounce on their side.

**Alternatives considered**:
- Only fire `onProgress` after each full *batch* completes — coarser; gives incorrect
  percentages when the last batch is smaller than earlier ones.
- Byte-level streaming with `ReadableStream.tee()` — accurate but non-isomorphic and
  complex; rejected.

---

## D5 — Public API Shape

**Question**: Should new options live in the existing `FileUploadOptions` interface or in
a new `ChunkedUploadOptions` interface?

**Decision**: Extend the existing `FileUploadOptions` interface with two optional fields:
- `resumeFrom?: number`
- `concurrency?: number`

**Rationale**:
- All existing callers pass `FileUploadOptions`; a new interface would require them to
  change their type annotations even if the runtime behavior is identical.
- Both new fields are optional with safe defaults (`resumeFrom = 0`, `concurrency = 1`),
  so the existing sequential behavior is fully preserved.
- The spec explicitly says "Extender `FileUploadHelper` con opciones" — confirming that
  extension of the existing interface is the intended approach.
- The number of fields (7 total) remains manageable; an interface split would be premature.

**Alternatives considered**:
- New `ChunkedUploadOptions` interface that extends `FileUploadOptions` — clean but
  requires caller changes; rejected for non-breaking requirement.
- Separate `FileUploadHelper.uploadChunked()` static method — avoids touching existing
  method signature but duplicates all the upload logic; rejected.

---

## Summary Table

| ID | Decision | Chosen Approach |
|----|----------|-----------------|
| D1 | Resume state model | `resumeFrom?: number` (linear chunk index) |
| D2 | Return type for resume | `UploadResponse` + `uploadedChunks?` + `totalChunks?` |
| D3 | Concurrency mechanism | Inline windowed `Promise.all` batching |
| D4 | Progress with concurrency | Per-chunk completion, aggregated byte count |
| D5 | API shape | Extend existing `FileUploadOptions` (non-breaking) |
