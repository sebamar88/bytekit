# Implementation Plan: Resumable File Uploads with Chunking

**Branch**: `007-resumable-uploads` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-resumable-uploads/spec.md`

## Summary

Enhance the existing `FileUploadHelper` with three new capabilities: explicit chunk-count
verification (US1), resume-from-failure via a `resumeFrom` chunk index option (US2), and
concurrent chunk uploads with aggregated `onProgress` callbacks (US3). All changes are
additive to the existing `FileUploadOptions` / `UploadResponse` types and must not break
any current callers. Implementation uses only `Blob.slice()` and the Fetch API — zero
external dependencies, fully isomorphic.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, ESM, `moduleResolution: "Bundler"`, `target: ES2020`)  
**Primary Dependencies**: None (zero-dep library); internal: `CryptoUtils.generateUUID()`  
**Storage**: N/A — stateless helper, callers own upload-state for resume  
**Testing**: Vitest 3.x — `globals: true`, Node `assert.*` style, file `tests/file-upload.test.ts`  
**Target Platform**: Isomorphic (browser + Node.js 18+), uses `Blob.slice()` and Fetch API  
**Project Type**: TypeScript library (bytekit@2.x)  
**Performance Goals**: Support concurrency up to 10 parallel chunks; progress callbacks must not block  
**Constraints**: Zero external deps; must not break existing callers; Blob/Fetch only (no `fs`)  
**Scale/Scope**: Single-file helper ~250 LOC; ~15 new tests; no new source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Zero external dependencies | PASS | Uses only `Blob.slice()`, Fetch API, internal `CryptoUtils` |
| TypeScript-first / strict | PASS | Strict mode, all types explicit, no `any` |
| ESM-only exports | PASS | File already ESM; no new export entry needed (same file) |
| Isomorphic (browser + Node) | PASS | `Blob.slice()` is standard; concurrency via `Promise.all` |
| 95%+ test coverage | TARGET | New branches must be covered; 3 USes x ~5 tests = ~15 new tests |
| JSDoc on all public APIs | PASS | All new options and return fields must have JSDoc |
| Non-breaking changes | PASS | Extending existing interfaces — all new fields are optional |

*Post-design re-check*: No violations after Phase 1 design. See research.md for concurrency
mechanism decision that preserves isomorphic constraint.

## Project Structure

### Documentation (this feature)

```
specs/007-resumable-uploads/
├── plan.md              (this file)
├── research.md          (Phase 0 output)
├── data-model.md        (Phase 1 output)
├── quickstart.md        (Phase 1 output)
├── contracts/
│   └── file-upload-helper.md  (Phase 1 output)
└── tasks.md             (Phase 2 output ✅)
```

### Source Code (repository root)

```
src/
└── utils/
    └── helpers/
        └── FileUploadHelper.ts   <- MODIFY: add resumeFrom, concurrency, update UploadResponse

tests/
└── file-upload.test.ts           <- MODIFY: append ~15 new tests (US1-US3)

examples/
└── resumable-upload.ts           <- CREATE: end-to-end example for resume workflow
```

**Structure Decision**: Single project. No new source files — all changes are additive
edits to the existing `FileUploadHelper.ts` and `file-upload.test.ts`.

## Implementation Dependencies

> **US3 is not independently implementable from scratch.** US3's implementation (T014)
> replaces the sequential for-loop that US2's T008 introduces. The test tasks for US3
> (T016–T018, T024) can be written in parallel with US2, but T014–T015 must execute
> after T008–T010 are complete.

## Complexity Tracking

> No constitution violations — section not required.
