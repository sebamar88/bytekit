# Phase 0 Research: Request Queue & Batching System

**Feature**: `004-batching-system`  
**Branch**: `004-batching-system`

---

## Decision 1: Priority Queue Implementation Pattern

**Decision**: 3 separate arrays `[high, normal, low]` with linear dequeue from the highest non-empty lane.

**Rationale**: At typical scales (1–1,000 items), 3 fixed arrays give true O(1) enqueue and dequeue with zero overhead. Re-entrancy is safe: each lane is independent; no shared mutable sort state can be corrupted by a synchronous re-entrant dequeue call.

**Alternatives considered**:
- Single sorted array: O(n) `splice` on every insert — degrades at 500+ items under bursty load.
- Min-heap: Correct for dynamic priorities or >10k items, but unjustified complexity for 3 fixed levels in a zero-dependency library.

---

## Decision 2: AbortController Cancellation — API Surface

**Decision**: Task factory receives the `AbortSignal` as its first argument via `add(fn: (signal: AbortSignal) => Promise<T>, options?)`. Queued tasks are rejected with `AbortError` immediately on `cancel()`; in-flight tasks receive the fired signal and must handle it themselves (library boundary).

**Rationale**: Matches the Web Platform pattern (Fetch, `addEventListener`). The library owns queue-level cancellation; the caller owns in-flight cancellation through the signal. This is the only safe contract since cancelling a running Promise is impossible.

**Alternatives considered**:
- Internal `AbortController` per task managed by the library: creates hidden ownership, prevents callers from composing their own controllers (e.g., a parent signal that also cancels other work).
- External controller passed by caller into both options and factory: verbose, no ergonomic win over receiving the signal directly as a factory argument.

---

## Decision 3: Batch Deduplication Key

**Decision**: `"${method}:${url}:${stableSerialize(body)}"` as the default key, with a user-supplied `keyFn: (url: string, init: RequestInit) => string` override on `RequestBatcher`.

**Rationale**: URL alone is wrong for POST/PATCH (same URL, different bodies = different requests). URL + method is wrong for mutations with different payloads. URL + method + body is the minimum correct default for all HTTP verbs.

**Alternatives considered**:
- URL only: silent false deduplication for non-idempotent methods — a data bug.
- URL + method: silently merges non-identical POST calls — correctness failure hard to debug in production.
- `JSON.stringify` for body: key-ordering instability across equivalent objects requires stable (sorted-key) serialization.

---

## Decision 4: Sliding Window vs Fixed Window for Batching

**Decision**: Fixed window by default — timer fires once after the first request in a batch — with `sliding: true` as an opt-in config flag.

**Rationale**: Fixed window gives a hard upper bound on latency (`windowMs` at most) and is fully predictable: users reason about it as "batches flush at most every N ms." Sliding window can delay indefinitely under sustained load, making latency unbounded — wrong default for a utility library where deterministic behavior is expected.

**Alternatives considered**:
- Sliding window as default: optimizes for batch size at the cost of unbounded latency — wrong trade-off.
- No default (both required config): adds cognitive burden; a sensible default covering 90% of cases is more ergonomic.

---

## Decision 5: Return Type of `add()`

**Decision**: `add()` returns `Promise<T>` directly.

**Rationale**: A bare Promise is directly `await`-able, composes with `Promise.all`, `Promise.race`, and every async utility in the library without unwrapping. `const data = await queue.add(fn)` reads exactly like any other async call. Cancellation is already handled orthogonally via AbortController (Decision 2), so a handle object's only affordance would duplicate that contract.

**Alternatives considered**:
- `{ promise: Promise<T>, cancel: () => void }` handle object: cannot be directly `await`-ed (breaks `async/await`), duplicates AbortController cancellation, creates a composability cliff where every caller must unwrap — leaky API that violates the principle of least surprise.
