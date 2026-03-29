# Tasks: WebSocket con Reconexión Inteligente y Schema Validation

**Input**: Design documents from `/specs/005-websocket-advanced/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Feature branch**: `005-websocket-advanced`
**Tech stack**: TypeScript 5.x strict · ESM · Vitest 3.x · Zero-deps

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm the existing baseline is green before any changes are made.

- [X] T001 Run `pnpm test -- websocket` and `pnpm build` to confirm all 14 existing WebSocketHelper tests pass and TypeScript compiles cleanly in `tests/websocket-helper.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add all new types, interface fields, private fields, and stub methods that every user story depends on. No story work can begin until T002–T006 are complete.

**⚠️ CRITICAL**: All three user story phases depend on this foundation being in place.

- [X] T002 Export new handler types `BackoffStrategy`, `WebSocketReconnectHandler`, `WebSocketMaxRetriesHandler`, `WebSocketValidationErrorHandler` at the top of `src/utils/helpers/WebSocketHelper.ts`
- [X] T003 [P] Extend `WebSocketOptions` interface with 5 new optional fields (`backoffStrategy`, `maxReconnectDelayMs`, `jitter`, `heartbeatTimeoutMs`, `schemas`) in `src/utils/helpers/WebSocketHelper.ts`
- [X] T004 Update the constructor's `Required<WebSocketOptions>` defaults object to include all 5 new fields (`backoffStrategy: "linear"`, `maxReconnectDelayMs: 30000`, `jitter: false`, `heartbeatTimeoutMs: 5000`, `schemas: undefined`) in `src/utils/helpers/WebSocketHelper.ts`
- [X] T005 [P] Add 4 new private fields (`reconnectHandlers: Set<WebSocketReconnectHandler>`, `maxRetriesHandlers: Set<WebSocketMaxRetriesHandler>`, `validationErrorHandlers: Set<WebSocketValidationErrorHandler>`, `pongTimeoutTimer: ReturnType<typeof setTimeout> | undefined`) initialised in the constructor in `src/utils/helpers/WebSocketHelper.ts`
- [X] T006 Add 3 new public methods `onReconnect(handler)`, `onMaxRetriesReached(handler)`, `onValidationError(handler)` — each adds to the corresponding private `Set` and returns `() => void` unsubscribe — in `src/utils/helpers/WebSocketHelper.ts`

**Checkpoint**: `pnpm build` passes with no new type errors. All 14 existing tests still pass.

---

## Phase 3: User Story 1 — Reconexión Automática (Priority: P1) 🎯 MVP

**Goal**: `WebSocketHelper` supports configurable backoff strategies (`"linear"`, `"exponential"`, custom function), respects a `maxReconnectDelayMs` cap, optionally applies Full Jitter, and fires `onReconnect`/`onMaxRetriesReached` handlers so consumers can observe the full reconnect lifecycle without string-matching error messages.

**Independent Test**: Configure `backoffStrategy: "exponential"`, trigger 3 disconnect/reconnect cycles via `MockWebSocket.close()`, assert delays double each time up to the cap; assert `onMaxRetriesReached` fires (not `onError`) when all attempts are exhausted.

### Implementation for User Story 1

- [X] T007 [US1] Add private `computeDelay(attempt: number): number` method: `"linear"` → `reconnectDelayMs × attempt`; `"exponential"` → `min(maxReconnectDelayMs, reconnectDelayMs × 2^(attempt-1))`, applying `Math.random() × cap` when `jitter=true`; function → `this.options.backoffStrategy(attempt)` in `src/utils/helpers/WebSocketHelper.ts`
- [X] T008 [US1] Update `attemptReconnect()` to: call `computeDelay(reconnectAttempts)` for the delay, fire all `reconnectHandlers(attempt, delay)` before `setTimeout`, and call all `maxRetriesHandlers()` (instead of `notifyError`) when `reconnectAttempts >= maxReconnectAttempts` in `src/utils/helpers/WebSocketHelper.ts`

### Tests for User Story 1

- [X] T009 [P] [US1] Write tests: default `"linear"` strategy computes `delay = reconnectDelayMs × attempt` for attempts 1–3; assert `onReconnect` handler receives correct `(attempt, delay)` pairs in `tests/websocket-helper.test.ts`
- [X] T010 [P] [US1] Write tests: `"exponential"` strategy doubles delay each attempt (`1000 → 2000 → 4000`) and caps at `maxReconnectDelayMs` in `tests/websocket-helper.test.ts`
- [X] T011 [P] [US1] Write tests: `"exponential"` + `jitter: true` produces a delay in `[0, cap]` range (spy on `Math.random` with `vi.spyOn`) in `tests/websocket-helper.test.ts`
- [X] T012 [P] [US1] Write tests: custom `backoffStrategy` function receives the 1-based attempt number and its return value is used as the `setTimeout` delay in `tests/websocket-helper.test.ts`
- [X] T013 [P] [US1] Write tests: `onMaxRetriesReached` fires when all attempts are exhausted; `onError` is NOT called for the exhaustion case in `tests/websocket-helper.test.ts`
- [X] T014 [P] [US1] Write tests: `onReconnect` unsubscribe function stops the handler from receiving further notifications in `tests/websocket-helper.test.ts`
- [X] T015 [P] [US1] Write tests: multiple `onReconnect` subscribers are all notified; each has an independent unsubscribe in `tests/websocket-helper.test.ts`

**Checkpoint**: `pnpm test -- websocket` passes all US1 tests. Exponential backoff, jitter, custom functions, and the new event handlers all verified.

---

## Phase 4: User Story 2 — Validación de Mensajes (Priority: P2)

**Goal**: Incoming messages with a matching entry in `schemas` are validated before being dispatched to `on()` handlers. Invalid messages fire `onValidationError` (with the raw error and message) and are silently dropped. Messages with no matching schema key pass through unchanged.

**Independent Test**: Register a schema for type `"trade"` using a mock `SchemaAdapter` that throws on invalid data. Simulate a valid message — assert `on("trade")` handler fires. Simulate an invalid message — assert `onValidationError` fires and `on("trade")` handler does NOT fire.

### Implementation for User Story 2

- [X] T016 [US2] Add private `notifyValidationError(error: Error, message: WebSocketMessage): void` method that iterates `validationErrorHandlers` (with the same try/catch pattern as `notifyError`) in `src/utils/helpers/WebSocketHelper.ts`
- [X] T017 [US2] Update `handleMessage()` to look up `this.options.schemas?.[message.type]`; on match: call `schema.parse(message.data)`, replace `message.data` with the parsed result on success, or call `notifyValidationError(error, message)` and `return` (drop) on failure — before dispatching to `on()` handlers in `src/utils/helpers/WebSocketHelper.ts`

### Tests for User Story 2

- [X] T018 [P] [US2] Write tests: valid message matching a schema is parsed and the parsed value is dispatched to `on()` handlers (not the raw value) in `tests/websocket-helper.test.ts`
- [X] T019 [P] [US2] Write tests: invalid message fires `onValidationError(error, rawMessage)` where `rawMessage.type` and `rawMessage.data` match the original in `tests/websocket-helper.test.ts`
- [X] T020 [P] [US2] Write tests: invalid message is NOT dispatched to `on()` handlers — registered handler call count stays zero in `tests/websocket-helper.test.ts`
- [X] T021 [P] [US2] Write tests: message type with no matching key in `schemas` passes through to `on()` handlers unvalidated in `tests/websocket-helper.test.ts`
- [X] T022 [P] [US2] Write tests: `onValidationError` returns an unsubscribe function; after calling it the handler no longer fires in `tests/websocket-helper.test.ts`

**Checkpoint**: `pnpm test -- websocket` passes all US1 + US2 tests. Schema validation and drop/dispatch logic fully verified.

---

## Phase 5: User Story 3 — Heartbeat y Monitoreo (Priority: P3)

**Goal**: After each `ping` send, a `heartbeatTimeoutMs` timer starts. Any incoming message cancels it. If the timer fires (no message received in time), `ws.close()` is called, which flows into the existing reconnect pipeline. No new config is needed — `heartbeatTimeoutMs` defaults to `5000` ms (matching `messageTimeout`).

**Independent Test**: Use `vi.useFakeTimers()`. Configure `heartbeatIntervalMs: 100`, `heartbeatTimeoutMs: 50`. Advance timers past the interval, assert `ws.close()` is called when no message arrives within `heartbeatTimeoutMs`. Then advance again, this time deliver a mock message — assert `ws.close()` is NOT called.

### Implementation for User Story 3

- [X] T023 [US3] Clear `pongTimeoutTimer` in `stopHeartbeat()` (add `clearTimeout(this.pongTimeoutTimer)` before clearing the interval) and in `close()` in `src/utils/helpers/WebSocketHelper.ts`
- [X] T024 [US3] Update `startHeartbeat()` to call `this.pongTimeoutTimer = setTimeout(() => this.ws?.close(), this.options.heartbeatTimeoutMs)` after each successful `send("ping", {})` in `src/utils/helpers/WebSocketHelper.ts`
- [X] T025 [US3] Update `handleMessage()` to call `clearTimeout(this.pongTimeoutTimer)` and reset `this.pongTimeoutTimer = undefined` at the very start (before JSON parse) in `src/utils/helpers/WebSocketHelper.ts`

### Tests for User Story 3

- [X] T026 [P] [US3] Write tests: receiving any message within `heartbeatTimeoutMs` cancels the forced-close timer (advance fake timers past interval but deliver message before timeout; assert `ws.close()` not called) in `tests/websocket-helper.test.ts`
- [X] T027 [P] [US3] Write tests: no message within `heartbeatTimeoutMs` after ping triggers `ws.close()` which initiates a reconnect (advance fake timers past interval + timeout; assert reconnect fires) in `tests/websocket-helper.test.ts`
- [X] T028 [P] [US3] Write tests: calling `close()` clears the pong timeout timer so it never fires after intentional disconnect in `tests/websocket-helper.test.ts`

**Checkpoint**: `pnpm test -- websocket` passes all US1 + US2 + US3 tests. Pong detection and forced-close-on-silence fully verified.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T029 [P] Create `examples/websocket-advanced-example.ts` demonstrating exponential backoff with `onReconnect`, schema validation with a mock `SchemaAdapter`, and pong detection with `heartbeatTimeoutMs`
- [X] T030 [P] Update `bytekit.wiki/WebSocketHelper.md` with the 5 new options (`backoffStrategy`, `maxReconnectDelayMs`, `jitter`, `heartbeatTimeoutMs`, `schemas`) and 3 new methods (`onReconnect`, `onMaxRetriesReached`, `onValidationError`)
- [X] T031 [P] Update `docs/guides/REALTIME.md` to include a reconnect backoff example and a schema validation example using the new API
- [X] T032 Run `pnpm test` (full suite) and confirm all tests pass with zero regressions across the 700+ existing tests
- [X] T033 Run `pnpm test -- --coverage` scoped to `src/utils/helpers/WebSocketHelper.ts` and confirm branch coverage ≥ 95%

---

## Dependencies

```
T001 (baseline check)
  └─ T002–T006 (foundational — must complete before any story)
        ├─ T007–T015 (US1: backoff + reconnect events) — independent of US2/US3
        ├─ T016–T022 (US2: schema validation) — independent of US1/US3
        └─ T023–T028 (US3: pong detection) — independent of US1/US2
              └─ T029–T033 (polish — after all stories)
```

US1, US2, and US3 are fully independent of each other after the foundational phase. Implementation tasks within each story are sequential; test tasks within a story are all parallelisable.

## Parallel Execution Examples

### After T001–T006, full story parallelism:

**Stream A (US1)**:
```
T007 → T008 → T009–T015 (all parallel)
```

**Stream B (US2)** (starts simultaneously with Stream A):
```
T016 → T017 → T018–T022 (all parallel)
```

**Stream C (US3)** (starts simultaneously with Streams A and B):
```
T023 → T024 → T025 → T026–T028 (all parallel)
```

**Stream D (Polish)** — after all stories complete:
```
T029–T031 (parallel) → T032 → T033
```

## Implementation Strategy

**MVP scope** (deliver US1 first, independently shippable):
1. Complete Phase 1 (T001) + Phase 2 (T002–T006)
2. Complete US1 (T007–T015) — exponential backoff and reconnect events working
3. Ship as increment; US2 and US3 follow independently

**Task counts**:
| Phase | Tasks | Parallelisable |
|-------|-------|----------------|
| Phase 1: Setup | 1 | 0 |
| Phase 2: Foundational | 5 | 2 (T003, T005) |
| Phase 3: US1 | 9 | 7 (T009–T015) |
| Phase 4: US2 | 7 | 5 (T018–T022) |
| Phase 5: US3 | 6 | 3 (T026–T028) |
| Final: Polish | 5 | 3 (T029–T031) |
| **Total** | **33** | **20** |
