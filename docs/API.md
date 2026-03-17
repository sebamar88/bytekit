# API Reference

Welcome to the **bytekit** API reference. This document provides an overview of all available modules in the current version (**v2.0.1+**).

## 🌐 Networking & Resilience

Core modules for making robust, type-safe HTTP requests.

- **[ApiClient](./api/classes/ApiClient.md)** - Isomorphic fetch wrapper with interceptors, circuit breakers, and native schema validation support.
- **[RetryPolicy](./api/classes/RetryPolicy.md)** - Configurable retry logic with exponential backoff and jitter.
- **[ResponseValidator](./api/classes/ResponseValidator.md)** - Utilities for manual response body validation.
- **[SchemaAdapter](./api/interfaces/SchemaAdapter.md)** - Native adapters for **Zod** and **Valibot** validation.
- **[RequestCache](./api/classes/RequestCache.md)** - In-memory caching for idempotent requests.
- **[RequestDeduplicator](./api/classes/RequestDeduplicator.md)** - Prevent duplicate concurrent requests.
- **[RateLimiter](./api/classes/RateLimiter.md)** - Token bucket and sliding window rate limiting.
- **[ErrorBoundary](./api/classes/ErrorBoundary.md)** - Global error normalization and recovery.

## ⚡ Async Toolkit (`bytekit/async`)

High-performance utilities for concurrency and execution control.

- **Concurrency**: `parallel`, `race`, `allSettled`, `sequential`.
- **Execution**: `retry`, `debounceAsync`, `throttleAsync`.
- **Timing**: `sleep`, `timeout`.

## 🪵 Observability & Debugging

- **[Logger](./api/classes/Logger.md)** - Structured, isomorphic logging with levels and namespaces.
- **[Profiler](./api/classes/Profiler.md)** - Precision performance measurements for async operations.
- **[Debug](./api/modules/debug.md)** - Diagnostic utilities for development.

## 🛠️ Specialized Helpers

- **[UrlSlugHelper](./api/classes/UrlSlugHelper.md)** - SEO-friendly URL slug generation.
- **[QueryStringHelper](./api/classes/QueryStringHelper.md)** - Robust object-to-query-string serialization.
- **[FileUploadHelper](./api/classes/FileUploadHelper.md)** - Multipart upload management with progress tracking.
- **[StreamingHelper](./api/classes/StreamingHelper.md)** - Utilities for handling Server-Sent Events (SSE) and streams.
- **[WebSocketHelper](./api/classes/WebSocketHelper.md)** - Typed WebSocket wrapper with automatic reconnection.
- **[EventEmitter](./api/classes/EventEmitter.md)** - High-performance, type-safe event emitter.
- **[CacheManager](./api/classes/CacheManager.md)** - Advanced TTL-based caching strategies.
- **[CryptoUtils](./api/classes/CryptoUtils.md)** - Secure hashing and UUID generation.
- **[CompressionUtils](./api/classes/CompressionUtils.md)** - Data compression and decompression (gzip/deflate).
- **[DiffUtils](./api/classes/DiffUtils.md)** - Deep object and array diffing.
- **[PollingHelper](./api/classes/PollingHelper.md)** - Configurable polling with intelligent backoff.
- **[EnvManager](./api/classes/EnvManager.md)** - Isomorphic environment variable management.

---

> **Note**: Modules like `DateUtils`, `StringUtils`, `QueryClient`, and others were removed in **v2.0.0** as part of our focus on the core HTTP & Async identity. For more details, see the [v2 Improvements Guide](./API_CLIENT_V2_IMPROVEMENTS.md).
