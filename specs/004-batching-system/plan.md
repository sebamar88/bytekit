# Implementation Plan: Request Queue & Batching System

**Branch**: `004-batching-system` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-batching-system/spec.md`

## Summary

A unified, zero-dependency system that combines a priority-aware request queue (concurrency control + cancellation) with an intelligent batching layer (time-window deduplication). Built on top of `PromisePool` (003) for concurrency mechanics and integrated into `ApiClient` transparently.

4 user stories across 3 priorities:
- **US1 (P1)**: `RequestQueue` — concurrency-limited queue with `AbortController` cancellation
- **US2 (P2)**: Priority lanes — `high / normal / low` sub-queues; cancel-in-flight via AbortSignal
- **US3 (P2)**: Batching — `Map<url, pending[]>` + sliding window timer; compatible-request deduplication
- **US4 (P3)**: `ApiClient` integration — transparent `queue` + `batch` options

## Technical Context

**Language/Version**: TypeScript 5.x strict, ESM  
**Primary Dependencies**: `PromisePool` (internal, feature 003), `AbortController` (built-in), `Map` (built-in), `setTimeout/clearTimeout` (built-in)  
**Storage**: N/A (in-memory queue state)  
**Testing**: Vitest 3.x — unit + fake timers + integration  
**Target Platform**: Node.js 18+, modern browsers (isomorphic)  
**Project Type**: Library module  
**Performance Goals**: Batching reduces round-trips >50% in high-frequency scenarios  
**Constraints**: Zero external dependencies; <2KB gzipped per module; `AbortController` for cancellation  
**Scale/Scope**: Per-client queue, expected 1–100 concurrent slots

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero-Dependency (DepsZero) | ✅ | Only `PromisePool` (internal), `AbortController`, `Map`, `setTimeout` — all built-in |
| II. Framework Agnostic | ✅ | Pure TS class, no framework coupling, works anywhere |
| III. TypeScript-First & ESM Native | ✅ | Strict TS, tree-shakeable ESM exports |
| IV. High Reliability 95%+ | ✅ | Fake-timer tests for batching windows, full unit coverage planned |
| V. Isomorphic & Performance-Oriented | ✅ | `AbortController` + `Map` available in Node 18+ and all modern browsers |

**Gate result**: ✅ ALL PASS — proceeding to Phase 0.

## Post-Design Constitution Re-check

*After Phase 1 design — verifying no violations introduced.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero-Dependency | ✅ | `PromisePool` (internal, 003), `AbortController`, `Map`, `setTimeout` — zero external deps |
| II. Framework Agnostic | ✅ | Both classes are pure TypeScript, no coupling to any framework |
| III. TypeScript-First ESM | ✅ | Strict generics on `add<T>()`, `BatchEntry<T>`; tree-shakeable exports |
| IV. 95%+ Coverage | ✅ | Fake-timer tests cover fixed/sliding windows; cancel-in-flight requires AbortSignal spy; priority ordering testable with concurrency=1 |
| V. Isomorphic | ✅ | `AbortController`, `Map`, `setTimeout` — universal; no Node-specific APIs |

**Post-design gate result**: ✅ ALL PASS — no violations introduced during design.

## Project Structure

### Documentation (this feature)

```text
specs/004-batching-system/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── request-queue.md ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/utils/async/
├── promise-pool.ts          (existing — 003)
├── request-queue.ts         ← NEW: RequestQueue class (US1 + US2)
├── request-batcher.ts       ← NEW: RequestBatcher class (US3)
└── index.ts                 (updated — add new exports)

src/utils/core/
└── ApiClient.ts             (updated — add queue/batch options, US4)

tests/async/
├── promise-pool.test.ts     (existing)
├── request-queue.test.ts    ← NEW
└── request-batcher.test.ts  ← NEW

tests/
└── request-queue-api-client.test.ts ← NEW (US4 integration)
```

**Structure Decision**: Single-project library. Two new files (`request-queue.ts`, `request-batcher.ts`) separate concerns cleanly — queue handles concurrency+priority+cancel; batcher handles time-window deduplication. Both exported from `bytekit/async` index.

## Complexity Tracking

*No constitution violations — no justification required.*
