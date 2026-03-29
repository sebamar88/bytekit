# Tasks: Resumable File Uploads with Chunking

**Input**: Design documents from `/specs/007-resumable-uploads/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included — spec.md explicitly requests unit tests for chunking and resume.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files or independent sections)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All implementation edits target `src/utils/helpers/FileUploadHelper.ts`
- All test additions append to `tests/file-upload.test.ts`

---

## Phase 1: Setup (Type Interface Updates)

**Purpose**: Add the new optional fields to the public interfaces. These are non-breaking
type-only additions that all three user stories depend on. Must complete before any behavior
implementation.

- [X] T001 Extend `FileUploadOptions` interface with `resumeFrom?: number` and `concurrency?: number` (with JSDoc per constitution) in `src/utils/helpers/FileUploadHelper.ts`
- [X] T002 Extend `UploadResponse` interface with `uploadedChunks?: number` and `totalChunks?: number` (with JSDoc) in `src/utils/helpers/FileUploadHelper.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core scaffolding in `uploadFile()` that ALL user stories depend on — compute
`totalChunks` upfront and track `uploadedChunks` through success and error paths.

**⚠️ CRITICAL**: No user story implementation can proceed until T003–T004 are complete.

- [X] T003 Compute `totalChunks = Math.ceil(file.size / chunkSize)` once at the start of `uploadFile()` and always include `totalChunks` in every `UploadResponse` return path in `src/utils/helpers/FileUploadHelper.ts`
- [X] T004 Add `uploadedChunks` counter to `uploadFile()`, increment after each successful chunk call, and include it in both success and error `UploadResponse` returns in `src/utils/helpers/FileUploadHelper.ts`

**Checkpoint**: Foundation ready — `totalChunks` and `uploadedChunks` now always present in response. User story implementation can begin.

---

## Phase 3: User Story 1 — Upload en Chunks (Priority: P1) 🎯 MVP

**Goal**: Chunk count is deterministic and observable via `UploadResponse.totalChunks` and
`uploadedChunks`. Acceptance: Given a 1KB file + `chunkSize=512`, exactly 2 chunks are sent and `totalChunks=2`.

**Independent Test**: Upload a file with a specific `chunkSize`, verify `Math.ceil(size / chunkSize)` chunks are sent and `totalChunks` / `uploadedChunks` match expected values.

> **Note**: No new implementation required — Phases 1–2 deliver US1. These tasks are tests only.

- [X] T005 [P] [US1] Write test: 1KB blob + `chunkSize=512` → 2 fetch calls, `totalChunks=2`, `uploadedChunks=2` in `tests/file-upload.test.ts`
- [X] T006 [P] [US1] Write test: blob smaller than `chunkSize` → 1 fetch call, `totalChunks=1`, `uploadedChunks=1` in `tests/file-upload.test.ts`
- [X] T007 [P] [US1] Write test: failure at chunk 1 of 2 → `success=false`, `totalChunks=2`, `uploadedChunks=1` (one chunk completed before failure) in `tests/file-upload.test.ts`

**Checkpoint**: US1 fully verifiable. Run `pnpm test -- file-upload` — T005–T007 must pass.

---

## Phase 4: User Story 2 — Resume desde Fallo (Priority: P2)

**Goal**: Caller can resume an interrupted upload by passing `resumeFrom: N` to skip
chunks 0..N-1. Acceptance: Given upload interrupted at chunk 4, calling with `resumeFrom=4`
sends only chunks 4+ and the server never receives duplicate chunks.

**Independent Test**: Simulate failure at chunk N, capture `uploadedChunks` from error
response, call again with `resumeFrom: uploadedChunks`, verify only remaining chunks are sent.

### Implementation for User Story 2

- [X] T008 [US2] Implement `resumeFrom` in `uploadFile()`: read `options.resumeFrom ?? 0`, validate (clamp negatives to 0, handle `resumeFrom >= totalChunks` as immediate success), start chunk loop from `resumeFrom` in `src/utils/helpers/FileUploadHelper.ts`
- [X] T009 [US2] Adjust `onProgress` baseline for resume: initialize `loaded` to sum of skipped-chunk byte sizes before the upload loop so `percentage` reflects total file progress (not just resumed portion) in `src/utils/helpers/FileUploadHelper.ts`
- [X] T010 [US2] Set `uploadedChunks` in response to `resumeFrom + chunksUploadedThisCall` (so the caller always gets an absolute count usable as the next `resumeFrom`) in `src/utils/helpers/FileUploadHelper.ts`

### Tests for User Story 2

- [X] T011 [P] [US2] Write test: 2-chunk upload with `resumeFrom=1` → exactly 1 fetch call, `uploadedChunks=2`, `totalChunks=2` in `tests/file-upload.test.ts`
- [X] T012 [P] [US2] Write test: simulate failure at chunk 0 (first chunk fails), capture `uploadedChunks=0`, then re-call with `resumeFrom=0` → succeeds in `tests/file-upload.test.ts`
- [X] T013 [P] [US2] Write test: `resumeFrom >= totalChunks` → immediate `success=true`, zero fetch calls, `uploadedChunks=totalChunks` in `tests/file-upload.test.ts`

**Checkpoint**: US2 fully verifiable independently of US3. Run `pnpm test -- file-upload`.

---

## Phase 5: User Story 3 — Progress y Concurrency (Priority: P3)

**Goal**: Multiple chunks upload in parallel up to `concurrency` limit; `onProgress` fires
after each individual chunk (not each batch). Acceptance: `concurrency=3` with 6 chunks →
2 batches of 3 parallel requests, `onProgress` called 6 times.

**Independent Test**: Track concurrent inflight requests using a mock; verify at most
`concurrency` requests are active simultaneously.

### Implementation for User Story 3

- [X] T014 [US3] Replace sequential for-loop in `uploadFile()` with windowed `Promise.all` batch loop: clamp `concurrency` to minimum 1 (`Math.max(1, options.concurrency ?? 1)`), split chunk indices into groups of that size, `await Promise.all` each group in `src/utils/helpers/FileUploadHelper.ts`
- [X] T015 [US3] Ensure `onProgress` fires per-chunk within a batch (not per-batch): each chunk's upload promise calls `onProgress` and increments `uploadedChunks` immediately when it resolves, using a shared atomic counter pattern in `src/utils/helpers/FileUploadHelper.ts`

### Tests for User Story 3

- [X] T016 [P] [US3] Write test: `concurrency=3`, 6-chunk blob → fetch called 6 times across 2 batches; verify via call-count tracking in `tests/file-upload.test.ts`
- [X] T017 [P] [US3] Write test: `concurrency=1` (default) → sequential behavior unchanged; existing chunk tests still pass in `tests/file-upload.test.ts`
- [X] T018 [P] [US3] Write test: `onProgress` callback fires exactly `totalChunks` times (once per chunk) when `concurrency=3` in `tests/file-upload.test.ts`

### Edge-Case Validation Tests (C1 remediation)

- [X] T023 [P] [US2] Write test: `resumeFrom=-1` (negative value) → clamped to 0, upload starts from chunk 0, all chunks sent in `tests/file-upload.test.ts`
- [X] T024 [P] [US3] Write test: `concurrency=0` (below minimum) → clamped to 1 (sequential), all chunks upload successfully in `tests/file-upload.test.ts`
- [X] T025 [P] Write test: `chunkSize=0` → falls back to default 5 MB chunk size (existing behavior regression) in `tests/file-upload.test.ts`

**Checkpoint**: All three user stories independently verifiable. Run full `pnpm test -- file-upload`.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 [P] Audit JSDoc on all modified public symbols in `src/utils/helpers/FileUploadHelper.ts` — every new option field and response field must have a `@param`/`@default` note per constitution Principle VI
- [X] T020 [P] Create `examples/resumable-upload.ts` demonstrating the full resume workflow (initial upload → failure → resume with `resumeFrom`) per `quickstart.md`
- [X] T021 Run `pnpm test -- file-upload` and confirm all 20 tests pass (8 existing + 12 new: T005–T007, T011–T013, T016–T018, T023–T025); fix any regressions in `tests/file-upload.test.ts` or `src/utils/helpers/FileUploadHelper.ts`
- [X] T022 Update `bytekit.wiki/FileUploadHelper.md` with new `FileUploadOptions` fields (`resumeFrom`, `concurrency`) and new `UploadResponse` fields (`uploadedChunks`, `totalChunks`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types must exist before implementation)
- **Phase 3 (US1)**: Depends on Phase 2 — tests reference `totalChunks`/`uploadedChunks`
- **Phase 4 (US2)**: Depends on Phase 2 — `resumeFrom` builds on `uploadedChunks` counter
- **Phase 5 (US3)**: Depends on Phase 4 — concurrency replaces the loop introduced in US2
- **Phase 6 (Polish)**: Depends on Phases 3–5

### User Story Dependencies

- **US1 (P1)**: Tests only — depends on Phase 2 foundation
- **US2 (P2)**: Implementation + tests — depends on Phase 2; independent of US1 (US1 has no impl)
- **US3 (P3)**: Implementation + tests — depends on US2 loop structure (T014 replaces the loop T008 introduced)

### Within Each User Story

- Implementation tasks before their tests (tests verify the impl)
- T008→T009→T010 must be sequential (each modifies the same function incrementally)
- T014→T015 must be sequential (T015 refines the loop T014 introduces)
- All test tasks within a story marked [P] can be written in parallel

---

## Parallel Opportunities

### Phase 3 (US1) — all tests are independent:
```
T005: "1KB + chunkSize=512 → 2 chunks"
T006: "file < chunkSize → 1 chunk"
T007: "failure → uploadedChunks < totalChunks"
```

### Phase 4 (US2) — tests are independent once T008–T010 complete:
```
T011: "resumeFrom=1 skips first chunk"
T012: "failure at chunk 0 then resume"
T013: "resumeFrom >= totalChunks → immediate success"
```

### Phase 5 (US3) — tests are independent once T014–T015 complete:
```
T016: "concurrency=3 → 2 batches of 3"
T017: "concurrency=1 → sequential (regression)"
T018: "onProgress fires per-chunk not per-batch"
```

### Phase 6 — T019 and T020 are in different files:
```
T019: JSDoc audit in FileUploadHelper.ts
T020: Create examples/resumable-upload.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Type updates (T001–T002)
2. Complete Phase 2: Foundational scaffolding (T003–T004)
3. Complete Phase 3: US1 tests (T005–T007)
4. **STOP and VALIDATE**: `pnpm test -- file-upload` — all 11 tests pass
5. Merge or demo as MVP

### Incremental Delivery

1. **T001–T004** → Types + foundation (no behavior change, safe to merge)
2. **T005–T007** → US1 tests pass (chunk count is observable) — MVP ✅
3. **T008–T013** → Resume works — robustness feature ✅
4. **T014–T018** → Concurrency works — performance/UX feature ✅
5. **T019–T022** → Polish — docs + example ✅

---

## Task Count Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Phase 1: Setup | 2 | — |
| Phase 2: Foundational | 2 | — |
| Phase 3: US1 | 3 | US1 |
| Phase 4: US2 | 6 | US2 |
| Phase 5: US3 | 8 | US3 + validation |
| Phase 6: Polish | 4 | — |
| **Total** | **25** | |

| Story | Task count | Parallel opportunities |
|-------|-----------|----------------------|
| US1 | 3 (tests) | All 3 parallel |
| US2 | 7 (3 impl + 3 tests + 1 edge-case test) | Tests parallel after impl |
| US3 | 7 (3 impl + 3 tests + 2 edge-case tests) | Tests parallel after impl |
