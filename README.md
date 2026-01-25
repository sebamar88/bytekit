# bytekit

> **Previously known as:** `@sebamar88/utils` (v0.1.9 and earlier)

**EN:** Modern TypeScript utilities: an isomorphic **ApiClient**, structured logging/profiling helpers, and ready-to-use modules (`DateUtils`, `StringUtils`, `StorageManager`, etc.).  
**ES:** Colección moderna de utilidades TypeScript: **ApiClient** isomórfico, logging/profiling estructurado y helpers listos (`DateUtils`, `StringUtils`, `StorageManager`, etc.).

## 📊 Status / Estado

[![CI](https://github.com/sebamar88/bytekit/workflows/CI/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/ci.yml)
[![Coverage](https://github.com/sebamar88/bytekit/workflows/Enhanced%20Coverage%20Report/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/coverage.yml)
[![CodeQL](https://github.com/sebamar88/bytekit/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/bytekit.svg)](https://www.npmjs.com/package/bytekit)
[![npm downloads](https://img.shields.io/npm/dm/bytekit.svg)](https://www.npmjs.com/package/bytekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/bytekit.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ Highlights / Características

- ✅ **EN:** Fully ESM with `.d.ts` definitions. **ES:** Build 100% ESM con tipos listos.
- 🌐 **EN:** Works on Node.js 18+ and modern browsers (via `cross-fetch`). **ES:** Compatible con Node.js 18+ y navegadores modernos (usa `cross-fetch`).
- 🔁 **EN:** ApiClient with retries, localized errors, flexible options. **ES:** ApiClient con reintentos, errores localizados y configuración flexible.
- 🧩 **EN:** Helper modules (strings, dates, validators, env, storage). **ES:** Helpers para strings, fechas, validadores, env y storage.
- 🪵 **EN:** Structured logging/profiling: `createLogger`, `Profiler`, `withTiming`. **ES:** Logging/profiling estructurado: `createLogger`, `Profiler`, `withTiming`.

## 🚀 Quick Start / Inicio Rápido

### Installation / Instalación

```bash
npm install bytekit
# or / o
pnpm add bytekit
# or / o
yarn add bytekit
```

### Global CLI Installation / Instalación CLI Global

```bash
npm install -g bytekit
# Then use / Luego usa:
sutils create users
sutils types https://api.example.com/users
```

### Basic Usage / Uso Básico

```ts
import { ApiClient, createLogger, DateUtils, StringUtils } from "bytekit";

const http = new ApiClient({
    baseUrl: "https://api.my-service.com",
    defaultHeaders: { "X-Team": "@sebamar88" },
    locale: "es",
    errorMessages: {
        es: { 418: "Soy una tetera ☕" },
    },
});

const users = await http.get<{ id: string; name: string }[]>("/users");

const logger = createLogger({ namespace: "users-service", level: "info" });
logger.info("Users synced", { count: users.length });

const slug = StringUtils.slugify("New Users – October 2024");
```

### Modular Imports / Importaciones Modulares

```ts
// Import specific modules to reduce bundle size
// Importa módulos específicos para reducir el tamaño del bundle

// Core modules / Módulos core
import { ApiClient } from "bytekit/api-client";
import { Logger } from "bytekit/logger";
import { RetryPolicy } from "bytekit/retry-policy";

// Helper modules / Módulos helpers
import { DateUtils } from "bytekit/date-utils";
import { StringUtils } from "bytekit/string-utils";
import { ArrayUtils } from "bytekit/array-utils";
```

## 🎯 Framework Support / Soporte de Frameworks

**EN:** Works seamlessly with React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit, and more.  
**ES:** Funciona perfectamente con React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit y más.

### React Example / Ejemplo React

```jsx
import { createApiClient } from "bytekit";
import { useState, useEffect } from "react";

function Users() {
    const client = createApiClient({ baseURL: "https://api.example.com" });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        client.get("/users").then(setUsers);
    }, [client]);

    return (
        <div>
            {users.map((u) => (
                <div key={u.id}>{u.name}</div>
            ))}
        </div>
    );
}
```

**[📖 View More Framework Examples →](https://github.com/sebamar88/bytekit/wiki/Framework-Examples)**

## 📚 Complete Documentation / Documentación Completa

**EN:** For detailed documentation of all 28 modules, visit our comprehensive GitHub Wiki.  
**ES:** Para documentación detallada de todos los 28 módulos, visita nuestra GitHub Wiki completa.

### 🔗 Quick Links by Category / Enlaces Rápidos por Categoría

#### 🔧 Core Modules (9) - Essential functionality / Funcionalidad esencial
- **[ApiClient](https://github.com/sebamar88/bytekit/wiki/ApiClient)** - Typed HTTP client with retries, localized errors, and custom fetch support
- **[Logger](https://github.com/sebamar88/bytekit/wiki/Logger)** - Structured logger with levels, namespaces, and transports for Node/browser
- **[Profiler](https://github.com/sebamar88/bytekit/wiki/Profiler)** - Profiler utilities and helpers
- **[RetryPolicy](https://github.com/sebamar88/bytekit/wiki/RetryPolicy)** - RetryPolicy utilities and helpers
- **[ResponseValidator](https://github.com/sebamar88/bytekit/wiki/ResponseValidator)** - ResponseValidator utilities and helpers
- **[RequestCache](https://github.com/sebamar88/bytekit/wiki/RequestCache)** - RequestCache utilities and helpers
- **[RateLimiter](https://github.com/sebamar88/bytekit/wiki/RateLimiter)** - RateLimiter utilities and helpers
- **[RequestDeduplicator](https://github.com/sebamar88/bytekit/wiki/RequestDeduplicator)** - RequestDeduplicator utilities and helpers
- **[ErrorBoundary](https://github.com/sebamar88/bytekit/wiki/ErrorBoundary)** - ErrorBoundary utilities and helpers

#### 🛠️ Helper Modules (12) - Common utilities / Utilidades comunes
- **[DateUtils](https://github.com/sebamar88/bytekit/wiki/DateUtils)** - Safe date parsing, manipulation, and formatting utilities
- **[StringUtils](https://github.com/sebamar88/bytekit/wiki/StringUtils)** - Text processing utilities: slugify, capitalize, mask, interpolate
- **[Validator](https://github.com/sebamar88/bytekit/wiki/Validator)** - Validation utilities for emails, phones, passwords, and more
- **[EnvManager](https://github.com/sebamar88/bytekit/wiki/EnvManager)** - EnvManager utilities and helpers
- **[StorageUtils](https://github.com/sebamar88/bytekit/wiki/StorageUtils)** - StorageUtils utilities and helpers
- **[FileUploadHelper](https://github.com/sebamar88/bytekit/wiki/FileUploadHelper)** - FileUploadHelper utilities and helpers
- **[StreamingHelper](https://github.com/sebamar88/bytekit/wiki/StreamingHelper)** - StreamingHelper utilities and helpers
- **[WebSocketHelper](https://github.com/sebamar88/bytekit/wiki/WebSocketHelper)** - WebSocketHelper utilities and helpers
- **[ArrayUtils](https://github.com/sebamar88/bytekit/wiki/ArrayUtils)** - Array manipulation utilities: chunk, flatten, unique, shuffle, zip
- **[ObjectUtils](https://github.com/sebamar88/bytekit/wiki/ObjectUtils)** - Object manipulation utilities: merge, pick, omit, flatten, groupBy
- **[FormUtils](https://github.com/sebamar88/bytekit/wiki/FormUtils)** - FormUtils utilities and helpers
- **[TimeUtils](https://github.com/sebamar88/bytekit/wiki/TimeUtils)** - TimeUtils utilities and helpers

#### ⚡ Utility Modules (7) - Advanced features / Características avanzadas
- **[EventEmitter](https://github.com/sebamar88/bytekit/wiki/EventEmitter)** - EventEmitter utilities and helpers
- **[DiffUtils](https://github.com/sebamar88/bytekit/wiki/DiffUtils)** - DiffUtils utilities and helpers
- **[PollingHelper](https://github.com/sebamar88/bytekit/wiki/PollingHelper)** - PollingHelper utilities and helpers
- **[CryptoUtils](https://github.com/sebamar88/bytekit/wiki/CryptoUtils)** - Token/UUID generation, base64 encoding, hashing, and HMAC
- **[PaginationHelper](https://github.com/sebamar88/bytekit/wiki/PaginationHelper)** - PaginationHelper utilities and helpers
- **[CacheManager](https://github.com/sebamar88/bytekit/wiki/CacheManager)** - Multi-tier cache with TTL, LRU eviction, and statistics
- **[CompressionUtils](https://github.com/sebamar88/bytekit/wiki/CompressionUtils)** - CompressionUtils utilities and helpers

**[🏠 Browse Full Wiki Index →](https://github.com/sebamar88/bytekit/wiki)**

## 🌟 Popular Use Cases / Casos de Uso Populares

### HTTP Client with Retries / Cliente HTTP con Reintentos
```ts
const api = new ApiClient({
    baseUrl: "https://api.example.com",
    retryPolicy: { maxAttempts: 3, initialDelayMs: 100 },
    circuitBreaker: { failureThreshold: 5 }
});

const users = await api.get("/users");
```

### Structured Logging / Logging Estructurado
```ts
const logger = createLogger({ namespace: "app", level: "info" });
logger.info("User created", { userId: 123, email: "user@example.com" });
```

### Date & String Utilities / Utilidades de Fecha y String
```ts
const formatted = DateUtils.format(new Date(), "es-AR");
const slug = StringUtils.slugify("Hello World! 🌍");
const masked = StringUtils.mask("1234567890", { start: 4, end: 2 });
```

### Array & Object Manipulation / Manipulación de Arrays y Objetos
```ts
const chunks = ArrayUtils.chunk([1, 2, 3, 4, 5], 2); // [[1,2], [3,4], [5]]
const picked = ObjectUtils.pick(user, ["id", "name", "email"]);
const grouped = ObjectUtils.groupBy(users, "department");
```

## 🚀 Live Examples / Ejemplos en Vivo

**EN:** Try bytekit in your browser with these interactive examples:  
**ES:** Prueba bytekit en tu navegador con estos ejemplos interactivos:

- **[React Example](https://codesandbox.io/p/devbox/bytekit-react-example-gr2k2j)** - Complete React app with ApiClient
- **[Vue Example](https://codesandbox.io/p/devbox/df26fs)** - Vue 3 composition API usage
- **[Svelte Example](https://codesandbox.io/p/devbox/lxvghg)** - Svelte integration example

**[📁 View Local Examples →](https://github.com/sebamar88/bytekit/tree/main/examples)**

## 🔗 Links / Enlaces

- **[📦 NPM Package](https://www.npmjs.com/package/bytekit)** - Install and version info
- **[📚 Full Documentation Wiki](https://github.com/sebamar88/bytekit/wiki)** - Complete API reference
- **[🚀 Live Examples](https://github.com/sebamar88/bytekit/tree/main/examples)** - Working code samples
- **[📋 Issues & Support](https://github.com/sebamar88/bytekit/issues)** - Bug reports and feature requests
- **[🔄 Changelog](https://github.com/sebamar88/bytekit/blob/main/CHANGELOG.md)** - Version history

## 🤝 Contributing / Contribuir

**EN:** Contributions are welcome! Please read our contributing guidelines and feel free to submit issues and pull requests.  
**ES:** ¡Las contribuciones son bienvenidas! Lee nuestras guías de contribución y no dudes en enviar issues y pull requests.

## 📄 License / Licencia

MIT © [Sebastián Martinez](https://github.com/sebamar88)

---

**💡 Need help?** Check the **[Wiki](https://github.com/sebamar88/bytekit/wiki)** or **[open an issue](https://github.com/sebamar88/bytekit/issues)**.
