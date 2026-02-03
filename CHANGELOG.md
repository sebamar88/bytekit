# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.13] - 2026-02-03

### Fixed

- **Tests**: Updated CryptoUtils tests to expect errors when crypto API is unavailable
    - Fixed test `"CryptoUtils throws error when crypto is missing"` to properly test error throwing
    - Fixed test `"CryptoUtils UUID uses getRandomValues fallback"` to test secure fallback
- **Code Quality**: Suppressed intentional ESLint warnings with proper comments
    - Added `eslint-disable-next-line` for destructured variables used in spread operator exclusion
    - Suppressed `@typescript-eslint/no-unused-vars` in `QueryClient`, `ApiClient`, and `PollingHelper`
    - Suppressed `@typescript-eslint/no-explicit-any` in `EventEmitter` for dynamic typing needs

## [1.0.12] - 2026-02-03

### Security

- **CRITICAL**: Eliminated all `Math.random()` usage and replaced with cryptographically secure `crypto.getRandomValues()`
    - `NumberUtils.random()` and `randomFloat()` now use secure random generation
    - `ArrayUtils.shuffle()` and `random()` use secure random
    - `ColorUtils.random()` and `randomWithLightness()` use secure random
    - `RetryPolicy` jitter now uses secure random
    - `PollingHelper` jitter now uses secure random
    - `CryptoUtils.generateToken()`, `generateUUID()`, and `randomBytes()` removed Math.random() fallbacks
    - All methods throw errors if crypto API is unavailable instead of falling back to insecure Math.random()
- **PATH Security**: Fixed PATH variable security in `examples/setup-local.js`
    - All `execSync` calls now use controlled PATH with only system directories: `/usr/local/bin:/usr/bin:/bin`
    - Prevents potential command injection from writable directories in PATH

### Fixed

- **Security Hotspots**: Resolved 5 ReDoS (Regular Expression Denial of Service) vulnerabilities
    - `StringUtils.camelCase()` and `pascalCase()`: Replaced vulnerable regex with safe `.split()` approach
    - `FormUtils.Validators.email()`: Replaced regex with `indexOf()` and `includes()` validation
    - `UrlBuilder.path()`: Replaced regex with `while` loops using `startsWith()` and `endsWith()`
    - `Validator.isEmail()`: Implemented safe string-based email validation
- **Security**: `QueryClient.generateRequestId()` now uses `CryptoUtils.generateUUID()` instead of timestamp + random
- **Security**: `FileUploadHelper.generateUploadId()` now uses `CryptoUtils.generateUUID()`

## [1.0.7] - 2026-02-03

### Fixed

- **SonarQube**: Fixed all CRITICAL void operator issues
    - Replaced `void functionCall()` with `const _val = functionCall()`
- **Code Quality**: Fixed all linting errors
    - Replaced `@ts-ignore` comments with proper `@ts-expect-error`
    - Added specific error messages for type suppressions
- **Code Quality**: Fixed MAJOR SonarQube issues
    - Simplified nested ternary operators
    - Removed top-level await
    - Improved error throwing patterns
- **Modern APIs**: Updated code to use ES2021+ APIs
    - `Object.hasOwn()` instead of `hasOwnProperty.call()`
    - `String.replaceAll()` instead of `replace()` with global regex
    - `Number.parseInt()` and `Number.parseFloat()` instead of global functions
- **Browser Compatibility**: Fixed window references
    - Changed `window` to `globalThis.window` with proper checks

## [1.0.4] - 2025-01-30

### Fixed

- **Browser Compatibility**: Fixed Vite warnings about Node.js modules (`zlib`, `util`, `crypto`) being externalized for browser compatibility
    - Added runtime environment checks before importing Node.js-specific modules
    - `CompressionUtils`: gzip, gunzip, deflate, and inflate methods now check for Node.js environment before importing `zlib` and `util`
    - `CryptoUtils`: hash and hmac methods now check for Node.js environment before importing `crypto`
    - Browser environments will gracefully fall back to browser-compatible alternatives (Web Crypto API, simple compression, etc.)
    - Eliminates console warnings when using bytekit in Vite/browser projects

### Fixed

- **CRITICAL**: Fixed `ApiClient` header handling for better compatibility with all fetch implementations
    - Headers are now converted to plain objects before passing to `RequestInit`
    - `Content-Type` header is only set automatically if not already present
    - Fixes 401 authentication errors with APIs like Groq, OpenAI, and others
    - Improves compatibility with `cross-fetch`, `node-fetch`, and native fetch implementations

## [0.2.4] - 2024-12-22

### Fixed

- **CRITICAL**: Fixed API responses returning `undefined` when `content-length` header is missing. Now only returns `undefined` for 204 No Content responses.

## [0.2.3] - 2024-12-22

### Fixed

- **CRITICAL**: Fixed "Illegal invocation" error in browser environments by binding `globalThis.fetch` context in `ApiClient`
- All TypeScript examples now use `Parameters<typeof createApiClient>[0]` instead of importing `ApiClientConfig` type

## [0.2.0] - 2024-12-22

### Added

#### Framework Examples

- **React example** with custom hooks (`useApiClient`, `useApiQuery`)
- **Vue 3 example** with Composition API and composables
- **Svelte example** with reactive stores
- Complete documentation for each framework in `docs/examples/`
- CodeSandbox templates for interactive demos

#### New Utilities

- **BatchRequest**: Batch multiple API requests efficiently
- **UrlBuilder**: Fluent API for building URLs with query parameters
- **HttpStatusHelper**: HTTP status code utilities and helpers
- **RequestCache**: In-memory caching for API requests
- **RateLimiter**: Token bucket and sliding window rate limiting
- **RequestDeduplicator**: Prevent duplicate concurrent requests
- **ErrorBoundary**: Global error handling and recovery
- **ArrayUtils**: Array manipulation utilities
- **ObjectUtils**: Object manipulation and deep operations
- **FormUtils**: Form validation and handling
- **TimeUtils**: Time formatting and calculations
- **EventEmitter**: Type-safe event emitter
- **DiffUtils**: Object and array diffing
- **PollingHelper**: Configurable polling with backoff
- **CryptoUtils**: Hashing and encryption utilities
- **PaginationHelper**: Pagination state management
- **CacheManager**: Advanced caching with TTL and strategies
- **CompressionUtils**: Data compression utilities

### Changed

- **BREAKING**: Removed `postinstall` script that was causing installation issues
- Updated README with framework examples section
- Improved documentation structure
- Enhanced TypeScript definitions

### Fixed

- Installation errors related to `tsconfig-generator.js` postinstall script
- npm link issues in example projects
- **CRITICAL**: Fixed all examples and documentation to use correct `baseUrl` parameter (was incorrectly using `baseURL`)
- npm link issues in example projects

## [0.1.12] - 2024-12-21

### Added

- CLI tool `sutils` for generating CRUD helpers and React Query hooks
- Type generator from API endpoints
- Modular exports for tree-shaking

### Changed

- Package renamed from `@sebamar88/utils` to `bytekit`
- Improved module organization

## [0.1.9] - 2024-12-20

### Added

- Initial release as `@sebamar88/utils`
- ApiClient with retry logic and circuit breaker
- Logger with structured logging
- DateUtils, StringUtils, Validator
- EnvManager, StorageUtils
- FileUploadHelper, StreamingHelper, WebSocketHelper

[1.0.13]: https://github.com/sebamar88/bytekit/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/sebamar88/bytekit/compare/v1.0.7...v1.0.12
[1.0.7]: https://github.com/sebamar88/bytekit/compare/v1.0.4...v1.0.7
[1.0.4]: https://github.com/sebamar88/bytekit/compare/v0.2.4...v1.0.4
[0.2.4]: https://github.com/sebamar88/bytekit/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/sebamar88/bytekit/compare/v0.2.0...v0.2.3
[0.2.0]: https://github.com/sebamar88/bytekit/compare/v0.1.12...v0.2.0
[0.1.12]: https://github.com/sebamar88/bytekit/compare/v0.1.9...v0.1.12
[0.1.9]: https://github.com/sebamar88/bytekit/releases/tag/v0.1.9
