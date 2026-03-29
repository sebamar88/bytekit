# Implementation Plan: 005-websocket-advanced

**Branch**: `005-websocket-advanced` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-websocket-advanced/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Upgrade `WebSocketHelper` (in-place, fully backward-compatible) with three capability areas:

1. **US1 — Smart Reconnection (P1)**: Replace linear backoff with a configurable `backoffStrategy` (`"linear"` default, `"exponential"`, or custom function) + `maxReconnectDelayMs` cap + optional Full Jitter. Add `onReconnect(handler)` and `onMaxRetriesReached(handler)` events so consumers can observe the reconnect lifecycle without message-string inspection.

2. **US2 — Schema Validation (P2)**: Add `schemas: Record<string, SchemaAdapter>` option. Incoming messages matched to a schema are validated before dispatch; failures fire `onValidationError(handler)` and the message is dropped. Zero external dependencies — uses the existing internal `SchemaAdapter` interface already consumed by `ApiClient`.

3. **US3 — Pong Detection (P3)**: After each `ping`, start a `heartbeatTimeoutMs` timer (default 5 s). Cancels on any incoming message; fires `ws.close()` if no pong arrives — triggering the existing reconnect pipeline. Transparent to consumers.

## Technical Context

**Language/Version**: TypeScript 5.x strict, ESM (`.js` imports, `"moduleResolution": "bundler"`)  
**Primary Dependencies**: `WebSocket` (Node.js 18+ built-in / browser native), `SchemaAdapter` (internal `src/utils/core/SchemaAdapter.ts`)  
**Storage**: N/A  
**Testing**: Vitest 3.x with fake timers (`vi.useFakeTimers()`), mock `WebSocket` class injected via module replacement  
**Target Platform**: Node.js 18+, modern browsers (Chromium, Firefox, Safari) — Isomorphic  
**Project Type**: Library module — single class upgrade in `src/utils/helpers/WebSocketHelper.ts`  
**Performance Goals**: Zero overhead when no schemas configured; heartbeat pong check is a single `clearTimeout` call per message  
**Constraints**: Zero external dependencies (constitution I). All new options must be optional with existing-behaviour defaults (constitution III). Test coverage ≥ 95%.  
**Scale/Scope**: Single file modification (~255 → ~340 lines); new test file `tests/helpers/websocket-helper.test.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. DepsZero — zero external runtime dependencies | ✅ PASS | Uses native `WebSocket` (Node 18+ / browser). Schema validation delegates to the existing internal `SchemaAdapter` interface — no schema library is bundled. |
| II. Framework Agnostic — no framework coupling | ✅ PASS | Pure TypeScript class. No React, Vue, Angular, or Node-specific imports. |
| III. TypeScript-First ESM — strict generics, `.js` imports | ✅ PASS | All new types are exported; new options use strict TypeScript generics. |
| IV. 95%+ coverage | ✅ PASS | New test file `tests/helpers/websocket-helper.test.ts` covers all new branches (backoff strategies, pong timeout, schema validation). |
| V. Isomorphic — Node 18+ and modern browsers | ✅ PASS | `WebSocket` is global in Node 18+ and all modern browsers. `setTimeout`/`clearTimeout`/`setInterval`/`clearInterval` are available in both. |

**Post-design re-check**: All gates still pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/005-websocket-advanced/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── websocket-helper.md   # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/utils/helpers/
└── WebSocketHelper.ts       ← MODIFY in-place (US1 + US2 + US3)
                               Add: BackoffStrategy type, new options,
                               3 new public methods, heartbeat pong timer,
                               schema validation in handleMessage()

tests/
└── websocket-helper.test.ts  ← EXTEND (14 existing tests at this path)
                               Add: backoff strategies, pong detection,
                               schema validation, new event handlers
```

**Structure Decision**: Single-project, single-file modification. `WebSocketHelper.ts` is the sole source file changed. No new modules, services, or packages are introduced. The `helpers/index.ts` re-export (`export * from "#helpers/WebSocketHelper.js"`) automatically surfaces all new exported types (`BackoffStrategy`, `WebSocketReconnectHandler`, `WebSocketMaxRetriesHandler`, `WebSocketValidationErrorHandler`) without changes.
