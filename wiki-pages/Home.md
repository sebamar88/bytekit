# 📚 Bytekit Wiki

**EN:** Welcome to the comprehensive documentation for Bytekit utilities.  
**ES:** Bienvenido a la documentación completa de las utilidades de Bytekit.

## 🚀 Quick Navigation / Navegación Rápida

### Core Modules / Módulos Core
**EN:** Essential modules for HTTP clients, logging, and core functionality.  
**ES:** Módulos esenciales para clientes HTTP, logging y funcionalidad core.

- **[ApiClient](ApiClient)** - Typed HTTP client with retries, localized errors, and custom fetch support
- **[Logger](Logger)** - Structured logger with levels, namespaces, and transports for Node/browser
- **[Profiler](Profiler)** - Performance monitoring: `Profiler` class and `withTiming` wrapper
- **[RetryPolicy](RetryPolicy)** - RetryPolicy utilities and helpers
- **[ResponseValidator](ResponseValidator)** - ResponseValidator utilities and helpers
- **[RequestCache](RequestCache)** - RequestCache utilities and helpers
- **[RateLimiter](RateLimiter)** - RateLimiter utilities and helpers
- **[RequestDeduplicator](RequestDeduplicator)** - RequestDeduplicator utilities and helpers
- **[ErrorBoundary](ErrorBoundary)** - ErrorBoundary utilities and helpers

### Helper Modules / Módulos Helpers
**EN:** Utility modules for common tasks like date manipulation, string processing, and validation.  
**ES:** Módulos de utilidad para tareas comunes como manipulación de fechas, procesamiento de strings y validación.

- **[DateUtils](DateUtils)** - Date manipulation and formatting (locale or custom tokens like YYYY-MM-DD)
- **[StringUtils](StringUtils)** - Text processing: slugify, capitalize, and **Case Conversions** (pascalCase, camelCase, etc.)
- **[Validator](Validator)** - Validation for emails, phones, CUIT, CBU and more
- **[EnvManager](EnvManager)** - EnvManager utilities and helpers
- **[StorageUtils](StorageUtils)** - StorageUtils utilities and helpers
- **[FileUploadHelper](FileUploadHelper)** - FileUploadHelper utilities and helpers
- **[StreamingHelper](StreamingHelper)** - StreamingHelper utilities and helpers
- **[WebSocketHelper](WebSocketHelper)** - WebSocketHelper utilities and helpers
- **[ArrayUtils](ArrayUtils)** - Array manipulation utilities: chunk, flatten, unique, shuffle, zip
- **[ObjectUtils](ObjectUtils)** - Object manipulation utilities: merge, pick, omit, flatten, groupBy
- **[FormUtils](FormUtils)** - FormUtils utilities and helpers
- **[TimeUtils](TimeUtils)** - TimeUtils utilities and helpers

### Utility Modules / Módulos Utilities  
**EN:** Advanced utilities for events, caching, compression, and specialized tasks.  
**ES:** Utilidades avanzadas para eventos, caching, compresión y tareas especializadas.

- **[EventEmitter](EventEmitter)** - EventEmitter utilities and helpers
- **[DiffUtils](DiffUtils)** - DiffUtils utilities and helpers
- **[PollingHelper](PollingHelper)** - PollingHelper utilities and helpers
- **[CryptoUtils](CryptoUtils)** - Token/UUID generation, base64 encoding, hashing, and HMAC
- **[PaginationHelper](PaginationHelper)** - PaginationHelper utilities and helpers
- **[CacheManager](CacheManager)** - Multi-tier cache with TTL, LRU eviction, and statistics
- **[CompressionUtils](CompressionUtils)** - CompressionUtils utilities and helpers

## 📖 Getting Started / Comenzando

### Installation / Instalación

```bash
npm install bytekit
# or / o
pnpm add bytekit
# or / o  
yarn add bytekit
```

### Basic Usage / Uso Básico

```typescript
import { ApiClient, DateUtils, StringUtils } from "bytekit";

const client = new ApiClient({ baseUrl: "https://api.example.com" });
const formattedDate = DateUtils.format(new Date(), "es-AR");
const slug = StringUtils.slugify("Hello World");
```

## 🔗 External Links / Enlaces Externos

- **[📦 NPM Package](https://www.npmjs.com/package/bytekit)**
- **[🐙 GitHub Repository](https://github.com/sebamar88/bytekit)**
- **[📋 Issues & Support](https://github.com/sebamar88/bytekit/issues)**
- **[🚀 Examples](https://github.com/sebamar88/bytekit/tree/main/examples)**

---

**💡 ¿Necesitas ayuda?** [Abre un issue](https://github.com/sebamar88/bytekit/issues) o consulta los [ejemplos](https://github.com/sebamar88/bytekit/tree/main/examples).
