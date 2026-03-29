# Feature Specification: Add JSDoc Documentation to Undocumented Library Files

**Feature Branch**: `009-add-jsdoc-docs`  
**Created**: 2026-03-29  
**Status**: Draft  
**Input**: User description: "necesito documentar lo q falta de la libreria con JSDocs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Document core utility classes (Priority: P1)

A developer integrating the library opens their IDE and hovers over `Logger`, `Profiler`, `RetryPolicy`, or `CircuitBreaker`. They see a clear description of the class, its constructor parameters, return values, and a usage example — without needing to read the source code.

**Why this priority**: Core classes are used by most consumers of the library. Missing docs here causes the most friction and support requests.

**Independent Test**: Open any of the undocumented core files in an IDE with TypeScript support, hover over the class or a method, and confirm that a JSDoc tooltip appears with a description, `@param` tags, `@returns`, and at least one `@example`.

**Acceptance Scenarios**:

1. **Given** `Logger` has no JSDoc, **When** JSDoc is added to the class, constructor, and all public methods (`debug`, `info`, `warn`, `error`, `log`, `setLevel`, `child`, `setLevel`), **Then** hovering each symbol in an IDE shows a populated tooltip with description and parameter types.
2. **Given** `Profiler` has no JSDoc, **When** JSDoc is added to the class, constructor, `start`, `end`, and `summary`, **Then** each method's purpose and return value are visible in the IDE.
3. **Given** `RetryPolicy` and `CircuitBreaker` have no JSDoc, **When** JSDoc is added to both classes and all public methods, **Then** the retry/circuit-breaker behavior and configuration options are clearly described in tooltips.
4. **Given** `createLogger` factory function has no JSDoc, **When** JSDoc is added, **Then** the function's purpose and the `LoggerOptions` parameter are documented.

---

### User Story 2 — Document helper classes (Priority: P2)

A developer using `EnvManager`, `StorageManager`, or `UrlHelper.stringify` needs to understand the expected inputs and the behavior for edge cases (e.g., TTL expiry, missing env vars) without reading the implementation.

**Why this priority**: Helpers are frequently used in day-to-day integration work; undocumented edge cases lead to incorrect usage.

**Independent Test**: Add JSDoc to each helper class/method and verify that parameter descriptions, return types, thrown errors, and at least one `@example` are visible in the IDE tooltip for every public method.

**Acceptance Scenarios**:

1. **Given** `EnvManager.get`, `require`, and `isProd` have no JSDoc, **When** JSDoc is added, **Then** the tooltip for `require` describes the thrown error when the variable is missing.
2. **Given** `StorageManager.set` has no JSDoc, **When** JSDoc is added, **Then** the `ttlMs` optional parameter and TTL-expiry behavior are described.
3. **Given** `UrlHelper.stringify` has no JSDoc, **When** JSDoc is added, **Then** the method's behavior with `null`/`undefined` input and all `QueryStringOptions` fields are documented.

---

### User Story 3 — Document ResponseValidator public API (Priority: P3)

A developer using `ResponseValidator.validate` needs to understand the shape of the returned `ValidationError[]` array and how to compose a `ValidationSchema` — without reading the implementation.

**Why this priority**: Lower priority because partial JSDoc already exists on private helpers; only the public entry point and interfaces are missing docs.

**Independent Test**: Add JSDoc to `ResponseValidator.validate`, the `ValidationSchema` interface fields, and the `ValidationError` interface fields; verify all fields show descriptions in the IDE.

**Acceptance Scenarios**:

1. **Given** `ResponseValidator.validate` has no JSDoc, **When** JSDoc is added with `@param`, `@returns`, and `@example`, **Then** the return type and error structure are clear from the tooltip alone.
2. **Given** `ValidationSchema` interface fields have no inline JSDoc, **When** JSDoc comments are added to each property, **Then** hovering a property in consumer code shows its purpose and allowed values.

---

### Edge Cases

- A file that already has partial JSDoc (e.g., `ResponseValidator`, `UrlHelper`) — only the missing symbols should receive new comments; existing comments must not be altered.
- Overloaded or generic methods must document all type parameters with `@template`.
- Private methods should use `@internal` rather than full public JSDoc to avoid cluttering generated docs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every public class in the library MUST have a class-level JSDoc comment describing its purpose.
- **FR-002**: Every public constructor MUST have JSDoc documenting each `@param` with its type and purpose.
- **FR-003**: Every public method MUST have JSDoc with a description, all `@param` tags, a `@returns` tag, and any `@throws` tags for documented error conditions.
- **FR-004**: Every public interface's properties MUST have inline JSDoc comments describing their purpose, valid values, and defaults where applicable.
- **FR-005**: Every documented symbol MUST include at least one `@example` block showing typical usage.
- **FR-006**: Generic type parameters on classes and functions MUST be documented with `@template`.
- **FR-007**: Factory functions (e.g., `createLogger`, `consoleTransportNode`, `consoleTransportBrowser`) MUST have JSDoc describing their purpose and parameters.
- **FR-008**: Existing JSDoc comments MUST NOT be modified unless they are incorrect or incomplete relative to the current implementation.
- **FR-009**: Private methods that must appear in the file MUST use `/** @internal */` instead of full public JSDoc.

### Key Entities

- **Target files (zero JSDoc)**: `Logger.ts`, `Profiler.ts`, `RetryPolicy.ts`, `EnvManager.ts`, `StorageUtils.ts`
- **Target files (partial JSDoc)**: `ResponseValidator.ts` (public `validate` method + interface fields), `UrlHelper.ts` (`stringify` method + `QueryStringOptions` interface fields)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public classes, methods, and interfaces in the target files have JSDoc after the change.
- **SC-002**: All documented symbols display a tooltip with description, parameters, and return type in a standard TypeScript-aware IDE (VS Code with Pylance/TypeScript Language Server).
- **SC-003**: At least one `@example` block is present per public class and per public method in every target file.
- **SC-004**: No regressions — all existing tests continue to pass and no new lint/format errors are introduced.
- **SC-005**: The generated TypeDoc output (if run) includes entries for every previously undocumented symbol in the target files.

## Assumptions

- The library targets TypeScript consumers using IDEs with TypeScript Language Server support; JSDocs are the primary discoverability mechanism.
- CLI source files (`src/cli/`) are out of scope for this task — they are internal tooling and do not need public JSDoc at this stage.
- Root-level barrel files (`src/index.ts`, `src/utils/index.ts`, etc.) are out of scope unless they export undocumented symbols not covered by the source file docs.
- The existing TypeDoc configuration (`typedoc.json`) and Prettier config (`.prettierrc`) remain unchanged — all new JSDoc must pass the existing format check.
- `consoleTransportNode` and `consoleTransportBrowser` are considered public exports and require full JSDoc.
