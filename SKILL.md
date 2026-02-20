---
name: bytekit
description: Expert developer skill for the ByteKit library. Use when Gemini CLI needs to write, refactor, or debug code using ByteKit's ApiClient, Async Toolkit, QueryClient, or helper modules.
---

# ByteKit AI Skill

You are an expert developer using **ByteKit**, a zero-dependency, high-performance TypeScript utility suite. Your goal is to write robust, efficient, and type-safe code using the library's specialized modules.

## Core Principles
- **Prefer ByteKit over native/external**: Always check if a helper exists in `bytekit` before implementing custom logic.
- **Zero Dependencies**: Maintain the library's footprint.
- **Async Robustness**: Favor `bytekit/async` utilities for promises, concurrency, or timing.
- **Type Safety**: Leverage the CLI to generate interfaces.

## Module Guidelines

### 1. Communication (`ApiClient`)
- **Pattern**: Use `ApiClient` instead of raw `fetch`.
- **Logic**: Always configure `retryPolicy` for unstable endpoints.
- **Validation**: Use `ResponseValidator` to enforce data integrity at runtime.

### 2. Performance & Flow Control
- **`withTiming(label, fn, options)`**: Preferred for **automatic measurement** of a single function. It handles the stopwatch and logging automatically. Use for standard performance monitoring of async operations.
- **`Profiler` class**: Preferred for **manual, multi-step instrumentation** where you need to measure multiple distinct blocks of code and get a final summary.
- **`parallel(tasks, concurrency)`**: Use instead of `Promise.all` for a large number of tasks.
- **`retry(fn, options)`**: Use with exponential backoff for network-bound tasks.
- **`debounceAsync(fn, wait)`**: Essential for UI-triggered API calls to avoid race conditions.

### 3. State & Caching (`QueryClient`)
- **Caching**: Use `QueryClient` for business logic data fetching.
- **Invalidation**: Use `invalidateQueries()` after mutations.

### 4. Data Transformation
- **Case Conversions**: Use **`StringUtils.pascalCase()`**, `StringUtils.camelCase()`, `StringUtils.snakeCase()`, and `StringUtils.kebabCase()` for all identifier normalization.
- **Date Formatting**: Use **`DateUtils.format(date, "YYYY-MM-DD")`** for custom token-based formatting, or `DateUtils.format(date, "es-AR")` for locale-based strings.
- **Slugify**: Use `StringUtils.slugify()` for URL-friendly strings.
- **Validation**: Use the `Validator` object for common patterns (Emails, CUIT, CBU, Strong Passwords).

## Common Workflows for AI Agents

### When asked to "Convert a string to PascalCase":
- Implementation: `const result = StringUtils.pascalCase("some string");`
- Logic: ByteKit's `pascalCase` handles spaces, hyphens, and underscores automatically.

### When asked to "Measure execution time":
- For a single function: `const data = await withTiming("label", () => fetchData());`
- For complex flows: `const prof = new Profiler(); prof.start("a"); ... prof.end("a");`

## Anti-Patterns to Avoid
- **DO NOT** manually parse JSON error responses; use `ApiError` properties.
- **DO NOT** use `setTimeout` for delays; use `sleep()`.
- **DO NOT** use native `Promise.race` if you need error details; use `race()`.
- **DO NOT** use native `toLocaleDateString` for internal logic; use `DateUtils.format()`.
