---
name: bytekit
description: Expert developer skill for the ByteKit library. Use when Gemini CLI needs to write, refactor, or debug code using ByteKit's ApiClient, Async Toolkit, QueryClient, or helper modules.
---

# ByteKit AI Skill

You are an expert developer using **ByteKit**, a zero-dependency, high-performance TypeScript utility suite. Your goal is to write robust, efficient, and type-safe code using the library's specialized modules.

## Core Principles
- **Prefer ByteKit over native/external**: Always check if a helper exists in `bytekit` before implementing custom logic or adding dependencies.
- **Zero Dependencies**: Maintain the library's footprint. Do not suggest adding external packages.
- **Async Robustness**: Favor `bytekit/async` utilities for any logic involving promises, concurrency, or timing.
- **Type Safety**: Leverage the CLI to generate interfaces. Avoid `any` at all costs.

## Module Guidelines

### 1. Communication (`ApiClient`)
- **Pattern**: Use `ApiClient` instead of raw `fetch`.
- **Logic**: Always configure `retryPolicy` for unstable endpoints.
- **Interceptors**: Use request/response interceptors for auth headers and global logging.
- **Validation**: Use the `validateResponse` option with `ResponseValidator` schemas.

### 2. Flow Control (`Async Toolkit`)
- **Retries**: Use `retry()` with exponential backoff for network-bound tasks.
- **Concurrency**: Use `parallel()` with a defined `concurrency` limit when processing arrays of tasks to avoid resource exhaustion.
- **Responsiveness**: Use `debounceAsync()` for UI-triggered API calls (search, filters) to handle cancellation automatically.
- **Racing**: Use `race()` when multiple sources are available; handle `AggregateError` if all fail.

### 3. State & Caching (`QueryClient`)
- **Caching**: Use `QueryClient` for business logic data fetching to benefit from automatic caching and stale-time management.
- **Invalidation**: Use `invalidateQueries()` after mutations to keep the UI in sync.

### 4. Data Transformation
- **Strings**: Use `StringUtils` for slugifying, masking (PII), and case conversions.
- **Objects**: Use `ObjectUtils` for deep cloning and safe path-based access (`get`/`set`).
- **Dates**: Use `DateUtils` for parsing and formatting to ensure cross-browser consistency.

## Common Workflows for AI Agents

### When asked to "Add an API call":
1. Check if the type exists. If not, suggest using `bytekit type` or `bytekit swagger`.
2. Implement using `ApiClient` with a retry policy.
3. Wrap with `QueryClient` if caching is needed.

### When asked to "Process a list of items":
1. Use `ArrayUtils.chunk` if items are processed in batches.
2. Use `parallel` if items involve async tasks (like uploads).

### When asked to "Validate input":
1. Use the `Validator` object for common patterns (CUI/CUIT, CBU, Emails, Strong Passwords).

## Anti-Patterns to Avoid
- **DO NOT** use `Promise.all` for a large number of tasks; use `parallel` instead.
- **DO NOT** manually parse JSON error responses; use `ApiError` properties.
- **DO NOT** use `setTimeout` for delays; use `sleep()`.
- **DO NOT** use native `Promise.race` if you need to know why all promises failed; use `race()`.
