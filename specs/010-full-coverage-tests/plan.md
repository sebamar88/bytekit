# Implementation Plan: Raise Test Coverage to 100% with Robust Tests

**Branch**: `010-full-coverage-tests` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-full-coverage-tests/spec.md`

## Summary

Raise bytekit's test-suite coverage from **88% → 100%** (statements, branches, functions, lines) by adding behavioural tests for every currently-uncovered code path across `src/utils/async`, `src/utils/core`, `src/utils/helpers`, and `src/cli`. Additionally, exclude logic-free barrel re-export files from the coverage report, and raise all four coverage thresholds in `vitest.config.ts` to 100.

The implementation is exclusively test-code (`.test.ts` additions to the existing `tests/` folder) plus one config change to `vitest.config.ts`. Zero production-code changes are required.

## Technical Context

**Language/Version**: TypeScript 5.x strict, ESM native (`"type": "module"`)
**Primary Dependencies**: vitest 3.x (test runner), `@vitest/coverage-v8` (coverage provider) — test-only
**Storage**: N/A
**Testing**: vitest + v8 provider; `pnpm test -- --coverage`
**Target Platform**: Node.js 18+ (test runner); source is isomorphic (Node + browser)
**Project Type**: Library (utility)
**Performance Goals**: No new goals; tests must run within existing 10 s timeout per test
**Constraints**: No new production dependencies (Principle I); no coverage-bypass annotations; no real file-system writes from test suite
**Scale/Scope**: ~35 existing test files, ~720 tests; ~30 new test cases spread across existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| I — Zero-Dependency (DepsZero) | ✅ PASS | All mocking via `vi.*` builtins; no new production deps |
| II — Framework Agnostic | ✅ PASS | Tests are framework-independent; no framework imports |
| III — TypeScript-First & ESM Native | ✅ PASS | All new test files written in `.ts`; vitest handles ESM |
| IV — High Reliability & 95%+ Coverage | ⚠️ REMEDIATES ACTIVE VIOLATION | Pre-existing state: 88% coverage violates the 95% MUST threshold. This feature is the remediation — raising from 88% → 100%. |
| V — Isomorphic & Performance-Oriented | ✅ PASS | Browser paths tested via `vi.stubGlobal`; no new perf regressions |
| VI — Comprehensive JSDoc Documentation | ✅ PASS | Test files do not require JSDoc; all source JSDoc added in feature 009 |

**Gate result: ALL PASS — proceed to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/010-full-coverage-tests/
├── plan.md         # This file
├── research.md     # Phase 0 output
├── quickstart.md   # Phase 1 output
└── tasks.md        # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
vitest.config.ts          ← raise thresholds to 100%; add barrel exclusions

tests/
├── async/
│   ├── debounce.test.ts          ← add flush-after-cancel guard test (line 57)
│   ├── retry.test.ts             ← add abort-during-sleep test (lines 106-107)
│   ├── throttle.test.ts          ← add reject-callback error path (lines 78-79)
│   ├── request-batcher.test.ts   ← add empty-entries guard test (line 166)
│   └── request-queue.test.ts     ← add non-Error throwable normalisation (line 176)
├── debug.test.ts                 ← add performance.now fallback test (line 9)
├── logger.test.ts                ← add browser-transport level-filter tests (lines 112,114,146,158)
├── rate-limiter.test.ts          ← add sliding-window boundary + cancelRequest (lines 179,194-196)
├── request-cache.test.ts         ← add cache-miss invalidation branch (line 92)
├── response-validator.test.ts    ← add null-data early return + number minimum (lines 102-103,218-223)
├── retry-policy.test.ts          ← add CircuitBreaker.reset + formatter-throws + RetryPolicy exhaustion (lines 48,105-109,150)
├── error-boundary-exhaustive.test.ts ← add sync-error catch, UNKNOWN code, 500 statusCode (lines 299-304,425,430)
├── api-client-coverage.test.ts   ← add body-parse-catch, locale fallback, createApiClient (lines 878-881,909,926)
├── cache-manager.test.ts         ← add localStorage-undefined guard + TTL eviction (lines 143-145,222-223)
├── compression-utils.test.ts     ← add string inflate branch + Blob-undefined getSize (lines 228-232,238,249)
├── crypto-utils.test.ts          ← add btoa/atob browser-path (lines 373-376,386-391)
├── diff-utils.test.ts            ← add invertPatch add-op + removed-key detection (lines 205,164-168,240)
├── env-manager.test.ts           ← add meta.env browser path returning value (line 17)
├── event-emitter.test.ts         ← add off-not-found guard + throwErrors + empty-listeners (lines 189,198-199,242)
├── streaming-helper.test.ts      ← add CR stripping + blank-line reset + value-after-colon (lines 411,422-423,430)
├── url-helper.test.ts            ← add safeString null + serializeValue unknown (lines 12,26-27)
├── websocket-helper.test.ts      ← add reconnect-handler-throws + validation-error-throws (lines 338-339,383-384)
├── file-upload.test.ts           ← add error-message fallback (line 241)
├── polling-helper.test.ts        ← add non-Error thrown normalisation (line 126)
├── ddd-boilerplate.test.ts       ← add EEXIST gitkeep skip + multi-action scaffolding (lines 64-372,420-481)
├── cli-main.test.ts              ← add missing-URL exit + handleTypeGeneration + handleSimpleFetch (index.ts 46.1%)
├── swagger-generator.test.ts     ← add HTML-spec fallback + no-schema warning (swagger lines 181-186,199)
└── type-generator-extra.test.ts  ← add HTTP-error + non-JSON body paths (type-generator lines 176-203)
```

**Structure Decision**: Single project, Option 1. Tests extend existing files to minimise diff surface and keep related tests co-located. No new source files are created.

## Complexity Tracking

No constitution violations.
