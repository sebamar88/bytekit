# Feature Specification: Fix CI format:check failures and generate CHANGELOG v2.2.0→v2.2.3

**Feature Branch**: `008-fix-ci-changelog`
**Created**: 2026-03-29
**Status**: Draft
**Input**: Fix CI workflow failures (format:check) and write CHANGELOG entries from v2.2.0 to v2.2.3

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix CI green on every PR (Priority: P1)

As a developer, I want every PR to pass CI without needing to manually run prettier
before pushing, so I stop losing time investigating "red CI" that has nothing to do
with my actual code change.

**Why this priority**: CI is failing on every PR due to format:check reporting 19 files
with prettier violations. Nothing else in CI is broken (typecheck passes, lint is warnings
only, tests pass). This blocks contributors and wastes review time.

**Independent Test**: Run `pnpm run format:check` locally — must exit 0 with no warnings.
Run `pnpm run lint` — must exit 0. Run `pnpm test` — must pass. All three pass in CI.

**Acceptance Scenarios**:

1. **Given** the current codebase, **When** `pnpm run format:check` runs, **Then** exits 0
   with the message "All matched files use Prettier code style!"
2. **Given** a developer pushes a branch, **When** CI runs, **Then** the `Lint`,
   `Format check`, `Type check`, `Build`, and `Test` steps all pass (green).

---

### User Story 2 - Readable CHANGELOG for v2.2.1, v2.2.2, v2.2.3 (Priority: P2)

As a library consumer or contributor, I want to read what changed in each release,
so I can decide whether to upgrade and understand what new APIs are available.

**Why this priority**: CHANGELOG.md currently has "No changes yet." for v2.2.1–v2.2.3
even though three significant features shipped. This makes it impossible to audit
what changed without reading raw git log.

**Independent Test**: Open CHANGELOG.md — each of v2.2.1, v2.2.2, v2.2.3 must have
at least one `### Added` or `### Changed` section with a non-placeholder entry.

**Acceptance Scenarios**:

1. **Given** CHANGELOG.md, **When** reading the v2.2.3 section, **Then** it documents
   the Pipeline feature (pipe(), map(), filter(), reduce(), Pipeline class, bytekit/pipeline export).
2. **Given** CHANGELOG.md, **When** reading the v2.2.2 section, **Then** it documents
   WebSocket advanced features (backoff strategies, schema validation, pong detection)
   and RequestQueue/RequestBatcher (batching system, priority lanes, concurrency).
3. **Given** CHANGELOG.md, **When** reading the v2.2.1 section, **Then** it documents
   FileUploadHelper resume support (resumeFrom, concurrency, uploadedChunks/totalChunks)
   and the ApiClient RequestBody type fix.

---

## Technical Requirements

### CI Fix

- Run `pnpm run format` to auto-fix all 19 files with prettier violations
- Verify `pnpm run format:check` exits 0 after fix
- Note: ci.yml `build` job uses pnpm v8 throughout; `coverage` and `security` jobs
  use v9. This version mismatch is a secondary CI risk — standardize to v9.

### CHANGELOG

- Format: Keep a Changelog (https://keepachangelog.com/en/1.0.0/)
- Sections per release: Added / Changed / Fixed (only non-empty sections)
- Content sourced from PR merge commit bodies (#15–#18)

## Success Metrics

- `pnpm run format:check` exits 0 locally and in CI
- CHANGELOG entries are accurate and non-empty for v2.2.1–v2.2.3
