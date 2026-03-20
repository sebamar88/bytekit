# Bytekit

> **Previously known as:** `@sebamar88/utils` (v0.1.9 and earlier)

**EN:** A lean, high-performance TypeScript toolkit focused on **Isomorphic HTTP Networking** and **Advanced Async Utilities**. Deep-zero dependencies.  
**ES:** Un toolkit TypeScript ligero y de alto rendimiento enfocado en **Networking HTTP Isomórfico** y **Utilidades Asíncronas Avanzadas**. Cero dependencias.

## 📊 Status / Estado

[![CI](https://github.com/sebamar88/bytekit/workflows/CI/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/sebamar88/bytekit/branch/main/graph/badge.svg)](https://codecov.io/gh/sebamar88/bytekit)
[![CodeQL](https://github.com/sebamar88/bytekit/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/bytekit.svg?style=flat-square)](https://www.npmjs.com/package/bytekit)
[![npm downloads](https://img.shields.io/npm/dm/bytekit.svg?style=flat-square)](https://www.npmjs.com/package/bytekit)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/bytekit?style=flat-square&label=gzip%20size)](https://bundlephobia.com/package/bytekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## ✨ Highlights / Características

- 🌐 **Isomorphic ApiClient:** Works on Node.js 18+ and modern browsers (native fetch).
- 🛡️ **Schema Validation:** Built-in adapters for Zod and Valibot. Fully typed responses.
- 🔁 **HTTP Resilience:** Retries, Circuit Breaker, Rate Limiting, Request Cache, and Deduplication out of the box.
- ⚡ **Async Toolkit:** A powerful set of tools for concurrency (`parallel`, `race`), timing (`sleep`, `timeout`), and execution control (`retry`, `debounce`, `throttle`).
- 📦 **Deep-Zero Dependencies:** No external runtime packages added to your bundle.
- 🪵 **Observability:** Structured logging and performance profiling modules.
- 🎯 **95%+ Test Coverage:** Rigorously tested core.

## 🚀 Quick Start / Inicio Rápido

### Installation / Instalación

```bash
npm install bytekit
# or / o
pnpm add bytekit
# or / o
yarn add bytekit
```

### 1. HTTP Client with Schema Validation (Zod)

```ts
import { ApiClient } from "bytekit/api-client";
import { zodAdapter } from "bytekit/schema-adapter";
import { z } from "zod";

const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
});

const http = new ApiClient({
    baseUrl: "https://api.my-service.com",
    retryPolicy: { maxAttempts: 3 }, // Automatic retries
    circuitBreaker: { failureThreshold: 5 } // Prevent cascading failures
});

// The response is safely validated and typed as { id: number, name: string }
const user = await http.get("/users/1", {
    validateResponse: zodAdapter(UserSchema)
});
```

### 2. Async Toolkit

```ts
import { parallel, retry, sleep, debounceAsync } from "bytekit/async";

// Retry an async operation automatically
const data = await retry(fetchDataFromUnstableAPI, {
    maxAttempts: 5,
    delayMs: 1000,
    backoff: "exponential"
});

// Run tasks in parallel with a concurrency limit
const results = await parallel(tasks, { concurrency: 3 });

// Debounce an async function
const fetchSuggestions = debounceAsync(api.getSuggestions, { waitMs: 300 });
```

### 3. Modular Imports / Importaciones Modulares

Bytekit is fully tree-shakeable. You can import exactly what you need:

```ts
import { ApiClient } from "bytekit/api-client";
import { Logger } from "bytekit/logger";
import { retry, timeout } from "bytekit/async";
import { UrlSlugHelper } from "bytekit/url-slug-helper";
```

## 📚 Core Modules

### 🔧 Networking & Resilience
- **`ApiClient`** - Typed HTTP client with interceptors, retries, and schema validation support.
- **`SchemaAdapter`** - Generic adapter to plug your favorite validation library (Zod, Valibot).
- **`RetryPolicy` & `CircuitBreaker`** - Prevent failures and handle flaky endpoints.
- **`RequestCache` & `RequestDeduplicator`** - Optimize your network bandwidth.
- **`RateLimiter`** - Throttle your outbound requests.

### ⚡ Async Toolkit
- Concurrency: **`parallel`**, **`race`**, **`allSettled`**, **`sequential`**.
- Execution: **`retry`**, **`debounceAsync`**, **`throttleAsync`**.
- Timing: **`sleep`**, **`timeout`**.

### 🛠️ Key Helpers
- **`Logger` & `Profiler`** - Structured logs and performance monitoring.
- **`UrlSlugHelper`** - Generate SEO-friendly URL slugs.
- **`QueryStringHelper`** - Powerful object-to-query-string serialization.
- **`FileUploadHelper`**, **`StreamingHelper`**, **`WebSocketHelper`** - Specialized network tasks.
- **`EventEmitter`**, **`DiffUtils`**, **`CacheManager`**, **`CryptoUtils`**.

## 🤝 Contributing / Contribuir

**EN:** Contributions are welcome! Please read our contributing guidelines and feel free to submit issues and pull requests.  
**ES:** ¡Las contribuciones son bienvenidas! Lee nuestras guías de contribución y no dudes en enviar issues y pull requests.

## 📄 License / Licencia

MIT © [Sebastián Martinez](https://github.com/sebamar88)
