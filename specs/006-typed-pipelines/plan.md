# Implementation Plan: Typed Data Pipelines

**Branch**: `006-typed-pipelines` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-typed-pipelines/spec.md`

## Summary

Add a zero-dependency, TypeScript-first functional pipeline system to bytekit that lets developers compose `map`, `filter`, and `reduce` operations with full type inference across async/sync transformations. A `pipe()` factory function builds a `Pipeline<TIn, TOut>` with a `.pipe(op)` chainable builder and a `.process(data)` executor. Additionally, `ApiClient` gains an optional per-request `pipeline` option so responses can be post-processed automatically.

## Technical Context

**Language/Version**: TypeScript 5.x strict, ESM (`moduleResolution: "Bundler"`, `target: ES2020`)
**Primary Dependencies**: Zero runtime dependencies (dev: vitest 3.x, typescript 5.x)
**Storage**: N/A
**Testing**: Vitest 3.x (`vitest run`, `globals: true`)
**Target Platform**: Node.js 18+, modern browsers (isomorphic — no Node-specific APIs)
**Project Type**: Library module added to existing `bytekit` package
**Performance Goals**: Lazy evaluation — ops accumulate; execution starts only on `.process()` call
**Constraints**: Zero deps; tree-shakeable ESM export; strict TypeScript (no `any` in public API)
**Scale/Scope**: Single new file `src/utils/async/pipeline.ts` + minor edits to `ApiClient.ts`, `async/index.ts`, `package.json`, `src/utils/index.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero-Dependency | ✅ PASS | Pure TypeScript built-ins only. No npm runtime deps. |
| II. Framework Agnostic | ✅ PASS | No UI framework coupling. Works in Node and browser. |
| III. TypeScript-First & ESM Native | ✅ PASS | Strict generics, overloaded `pipe()`, ESM-only export. |
| IV. High Reliability & 95%+ Coverage | ⚠️ GATE | Must ship with ≥95% coverage on `pipeline.ts`. Tests for sync, async, error paths required. |
| V. Isomorphic & Performance-Oriented | ✅ PASS | Uses native `Array` ops internally; no Node-specific APIs. |
| VI. Comprehensive JSDoc | ⚠️ GATE | Every exported symbol (`pipe`, `map`, `filter`, `reduce`, `Pipeline`, `PipelineOp`) must have JSDoc with `@param`, `@returns`, `@example`. |

**Post-design re-check**: ✅ All gates satisfiable. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/006-typed-pipelines/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── pipeline.md      ← Phase 1 output
└── tasks.md             ← Phase 2 output (speckit.tasks — NOT this command)
```

### Source Code (repository root)

```text
src/utils/async/
├── pipeline.ts          ← NEW: Pipeline class, pipe(), map(), filter(), reduce()
└── index.ts             ← EDIT: add pipeline exports

src/utils/core/
└── ApiClient.ts         ← EDIT: add optional `pipeline` field to RequestOptions

src/utils/
└── index.ts             ← EDIT: pipeline already re-exported via async/index.ts

package.json             ← EDIT: add "./pipeline" export entry

tests/
└── pipeline.test.ts     ← NEW: unit + integration tests

examples/
└── pipeline-example.ts  ← NEW: usage examples
```

**Structure Decision**: Single-project layout. New module `pipeline.ts` lives in `src/utils/async/` alongside the other async composition utilities (`parallel`, `sequential`, `retry`). ApiClient integration is a minimal, non-breaking addition to `RequestOptions`.

## Complexity Tracking

> No constitution violations requiring justification.
