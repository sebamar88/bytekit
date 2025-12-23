# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2024-12-22

### Fixed

-   **CRITICAL**: Fixed API responses returning `undefined` when `content-length` header is missing. Now only returns `undefined` for 204 No Content responses.

## [0.2.3] - 2024-12-22

### Fixed

-   **CRITICAL**: Fixed "Illegal invocation" error in browser environments by binding `globalThis.fetch` context in `ApiClient`
-   All TypeScript examples now use `Parameters<typeof createApiClient>[0]` instead of importing `ApiClientConfig` type

## [0.2.0] - 2024-12-22

### Added

#### Framework Examples

-   **React example** with custom hooks (`useApiClient`, `useApiQuery`)
-   **Vue 3 example** with Composition API and composables
-   **Svelte example** with reactive stores
-   Complete documentation for each framework in `docs/examples/`
-   CodeSandbox templates for interactive demos

#### New Utilities

-   **BatchRequest**: Batch multiple API requests efficiently
-   **UrlBuilder**: Fluent API for building URLs with query parameters
-   **HttpStatusHelper**: HTTP status code utilities and helpers
-   **RequestCache**: In-memory caching for API requests
-   **RateLimiter**: Token bucket and sliding window rate limiting
-   **RequestDeduplicator**: Prevent duplicate concurrent requests
-   **ErrorBoundary**: Global error handling and recovery
-   **ArrayUtils**: Array manipulation utilities
-   **ObjectUtils**: Object manipulation and deep operations
-   **FormUtils**: Form validation and handling
-   **TimeUtils**: Time formatting and calculations
-   **EventEmitter**: Type-safe event emitter
-   **DiffUtils**: Object and array diffing
-   **PollingHelper**: Configurable polling with backoff
-   **CryptoUtils**: Hashing and encryption utilities
-   **PaginationHelper**: Pagination state management
-   **CacheManager**: Advanced caching with TTL and strategies
-   **CompressionUtils**: Data compression utilities

### Changed

-   **BREAKING**: Removed `postinstall` script that was causing installation issues
-   Updated README with framework examples section
-   Improved documentation structure
-   Enhanced TypeScript definitions

### Fixed

-   Installation errors related to `tsconfig-generator.js` postinstall script
-   npm link issues in example projects
-   **CRITICAL**: Fixed all examples and documentation to use correct `baseUrl` parameter (was incorrectly using `baseURL`)
-   npm link issues in example projects

## [0.1.12] - 2024-12-21

### Added

-   CLI tool `sutils` for generating CRUD helpers and React Query hooks
-   Type generator from API endpoints
-   Modular exports for tree-shaking

### Changed

-   Package renamed from `@sebamar88/utils` to `bytekit`
-   Improved module organization

## [0.1.9] - 2024-12-20

### Added

-   Initial release as `@sebamar88/utils`
-   ApiClient with retry logic and circuit breaker
-   Logger with structured logging
-   DateUtils, StringUtils, Validator
-   EnvManager, StorageUtils
-   FileUploadHelper, StreamingHelper, WebSocketHelper

[0.2.0]: https://github.com/sebamar88/utils/compare/v0.1.12...v0.2.0
[0.1.12]: https://github.com/sebamar88/utils/compare/v0.1.9...v0.1.12
[0.1.9]: https://github.com/sebamar88/utils/releases/tag/v0.1.9
