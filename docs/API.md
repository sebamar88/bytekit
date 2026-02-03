# API Documentation

Complete API reference for bytekit modules.

## 📚 Core Modules

### ApiClient

Complete HTTP client with retry policies, circuit breaker, and caching.

**[→ View Full ApiClient Documentation](./api/ApiClient.md)**

### Logger

Structured logging with namespaces, levels, and custom transports.

**[→ View Full Logger Documentation](./api/Logger.md)**

### Profiler

Performance profiling and timing utilities.

**[→ View Full Profiler Documentation](./api/Profiler.md)**

---

## 🔧 Helper Modules

### DateUtils

Date manipulation and formatting utilities.

**[→ View Full DateUtils Documentation](./api/DateUtils.md)**

### StringUtils

String manipulation, formatting, and validation utilities.

**[→ View Full StringUtils Documentation](./api/StringUtils.md)**

### ArrayUtils

Array manipulation and functional programming utilities.

**[→ View Full ArrayUtils Documentation](./api/ArrayUtils.md)**

### ObjectUtils

Object manipulation and transformation utilities.

**[→ View Full ObjectUtils Documentation](./api/ObjectUtils.md)**

### NumberUtils

Number formatting and manipulation utilities.

**[→ View Full NumberUtils Documentation](./api/NumberUtils.md)**

---

## 🛠️ Utility Modules

### CacheManager

In-memory and localStorage caching with TTL support.

**[→ View Full CacheManager Documentation](./api/CacheManager.md)**

### StorageManager

Type-safe localStorage/sessionStorage wrapper.

**[→ View Full StorageManager Documentation](./api/StorageManager.md)**

### FormUtils

Form handling, validation, and state management.

**[→ View Full FormUtils Documentation](./api/FormUtils.md)**

### CryptoUtils

Cryptographic utilities for hashing and token generation.

**[→ View Full CryptoUtils Documentation](./api/CryptoUtils.md)**

### Validator

Input validation utilities for common data types.

**[→ View Full Validator Documentation](./api/Validator.md)**

---

## 🔗 Additional Modules

- **[RateLimiter](./api/RateLimiter.md)** - Rate limiting for API calls
- **[WebSocketHelper](./api/WebSocketHelper.md)** - WebSocket connection management
- **[StreamingHelper](./api/StreamingHelper.md)** - Server-sent events and streaming
- **[ErrorBoundary](./api/ErrorBoundary.md)** - Error handling and recovery
- **[EventEmitter](./api/EventEmitter.md)** - Pub/sub event system
- **[SignalManager](./api/SignalManager.md)** - Signal-based state management
- **[EnvManager](./api/EnvManager.md)** - Environment variable management

---

## 🔍 Generating API Docs

We're currently setting up automated API documentation generation using TypeDoc.

In the meantime, you can:

1. **Browse the source code** - All modules have comprehensive JSDoc comments
2. **Check the guides** - [Getting Started](../guides/GETTING_STARTED.md) and [Advanced Usage](../guides/ADVANCED_USAGE.md)
3. **Try the examples** - [Examples & Snippets](../examples/README.md)

### Future: TypeDoc Integration

Coming soon:

```bash
# Generate API documentation
pnpm run docs:generate

# Serve documentation locally
pnpm run docs:serve
```

This will create a fully searchable API reference with:

- Complete function signatures
- Parameter descriptions
- Return types
- Usage examples
- Cross-references between modules

---

## 💡 Contributing to Documentation

Want to help improve the API documentation? Check out our [Contributing Guide](../../CONTRIBUTING.md).

---

**[← Back to Main Documentation](../../README.md)**
