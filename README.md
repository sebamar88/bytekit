# bytekit

> **Previously known as:** `@sebamar88/utils` (v0.1.9 and earlier)

**EN:** Modern TypeScript utilities: an isomorphic **ApiClient**, structured logging/profiling helpers, and ready-to-use modules (`DateUtils`, `StringUtils`, `StorageManager`, etc.).  
**ES:** Colección moderna de utilidades TypeScript: **ApiClient** isomórfico, logging/profiling estructurado y helpers listos (`DateUtils`, `StringUtils`, `StorageManager`, etc.).

---

## Overview / Resumen

**EN:** Ship consistent networking, logging, and helper APIs across Node.js and browsers with zero setup—everything is published as ESM plus typings.  
**ES:** Centralizá networking, logging y helpers tanto en Node.js como en navegadores sin configuración extra: todo se publica en ESM con definiciones de tipos.

## Highlights / Características

-   ✅ **EN:** Fully ESM with `.d.ts` definitions. **ES:** Build 100 % ESM con tipos listos.
-   🌐 **EN:** Works on Node.js 18+ and modern browsers (via `cross-fetch`). **ES:** Compatible con Node.js 18+ y navegadores modernos (usa `cross-fetch`).
-   🔁 **EN:** ApiClient with retries, localized errors, flexible options. **ES:** ApiClient con reintentos, errores localizados y configuración flexible.
-   🧩 **EN:** Helper modules (strings, dates, validators, env, storage). **ES:** Helpers para strings, fechas, validadores, env y storage.
-   🪵 **EN:** Structured logging/profiling: `createLogger`, `Profiler`, `withTiming`. **ES:** Logging/profiling estructurado: `createLogger`, `Profiler`, `withTiming`.

## Installation / Instalación

### Global Installation / Instalación Global

**EN:** Install the package globally to use the CLI tool (`sutils`) from anywhere.  
**ES:** Instalá el paquete globalmente para usar la herramienta CLI (`sutils`) desde cualquier lugar.

```bash
npm install -g bytekit
# or / o
pnpm add -g bytekit
```

**EN:** After global installation, you can use the `sutils` command:  
**ES:** Después de la instalación global, podés usar el comando `sutils`:

```bash
sutils create users
sutils types https://api.example.com/users
```

### Project Installation / Instalación en Proyecto

**EN:** Install as a project dependency to use all utilities in your application.  
**ES:** Instalá como dependencia del proyecto para usar todos los utilities en tu aplicación.

```bash
npm install bytekit
# or / o
pnpm add bytekit
# or / o
yarn add bytekit
```

### Modular Installation / Instalación Modular

**EN:** Import only the modules you need to reduce bundle size. Each utility can be imported individually.  
**ES:** Importá solo los módulos que necesitás para reducir el tamaño del bundle. Cada utility se puede importar individualmente.

#### Core Modules / Módulos Core

```ts
// HTTP Client
import { ApiClient, createApiClient } from "bytekit/api-client";

// Retry & Circuit Breaker
import { RetryPolicy, CircuitBreaker } from "bytekit/retry-policy";

// Response Validation
import { ResponseValidator } from "bytekit/response-validator";

// Logging
import { Logger, createLogger } from "bytekit/logger";

// Profiling
import { Profiler } from "bytekit/profiler";

// Debug Utilities
import { createStopwatch, withTiming, measureAsync } from "bytekit/debug";

// Request Caching
import { RequestCache } from "bytekit/request-cache";

// Rate Limiting
import { RateLimiter, SlidingWindowRateLimiter } from "bytekit/rate-limiter";

// Request Deduplication
import { RequestDeduplicator } from "bytekit/request-deduplicator";

// Error Boundary
import { ErrorBoundary, getGlobalErrorBoundary } from "bytekit/error-boundary";
```

#### Helper Modules / Módulos Helpers

```ts
// Date Utilities
import { DateUtils } from "bytekit/date-utils";

// String Utilities
import { StringUtils } from "bytekit/string-utils";

// Validation
import { Validator } from "bytekit/validator";

// Environment Manager
import { EnvManager } from "bytekit/env-manager";

// Storage Utilities
import { StorageUtils } from "bytekit/storage-utils";

// File Upload
import { FileUploadHelper } from "bytekit/file-upload";

// Streaming
import { StreamingHelper } from "bytekit/streaming";

// WebSocket
import { WebSocketHelper } from "bytekit/websocket";

// Array Utilities
import { ArrayUtils } from "bytekit/array-utils";

// Object Utilities
import { ObjectUtils } from "bytekit/object-utils";

// Form Utilities
import { FormUtils, createForm } from "bytekit/form-utils";

// Time Utilities
import { TimeUtils } from "bytekit/time-utils";

// Event Emitter
import { EventEmitter, createEventEmitter } from "bytekit/event-emitter";

// Diff Utilities
import { DiffUtils } from "bytekit/diff-utils";

// Polling Helper
import { PollingHelper, createPoller } from "bytekit/polling-helper";

// Crypto Utilities
import { CryptoUtils } from "bytekit/crypto-utils";

// Pagination Helper
import { PaginationHelper, createPaginator } from "bytekit/pagination-helper";

// Cache Manager
import { CacheManager, createCacheManager } from "bytekit/cache-manager";

// Compression Utilities
import { CompressionUtils } from "bytekit/compression-utils";

// HTTP Status Helper
import { HTTP_STATUS, isSuccess, isRetryable } from "bytekit/http-status";

// URL Builder
import { UrlBuilder, createUrlBuilder } from "bytekit/url-builder";

// Batch Request
import { BatchRequest, createBatchRequest } from "bytekit/batch-request";
```

#### Import Everything / Importar Todo

**EN:** You can also import everything from the main entry point:  
**ES:** También podés importar todo desde el punto de entrada principal:

```ts
import {
    // Core
    ApiClient,
    Logger,
    Profiler,
    RetryPolicy,
    ResponseValidator,
    RequestCache,
    RateLimiter,
    RequestDeduplicator,
    ErrorBoundary,

    // Helpers
    DateUtils,
    StringUtils,
    Validator,
    EnvManager,
    StorageUtils,
    FileUploadHelper,
    StreamingHelper,
    WebSocketHelper,
    ArrayUtils,
    ObjectUtils,
    FormUtils,
    TimeUtils,
    EventEmitter,
    DiffUtils,
    PollingHelper,
    CryptoUtils,
    PaginationHelper,
    CacheManager,
    CompressionUtils,

    // Factory functions
    createLogger,
    createApiClient,
    createForm,
    createEventEmitter,
    createPoller,
    createPaginator,
    createCacheManager,
} from "bytekit";
```

## Quick Start / Inicio rápido

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

logger.debug("Next sync ETA (days)", {
    etaDays: DateUtils.diffInDays(
        new Date(),
        DateUtils.add(new Date(), { days: 7 })
    ),
});

const slug = StringUtils.slugify("New Users – October 2024");
```

**EN:** Import everything from the root entry, configure the ApiClient once, reuse helpers everywhere.  
**ES:** Importá desde la raíz, configurá el ApiClient una sola vez y reutilizá los helpers en todos tus servicios.

## Framework Examples / Ejemplos con Frameworks

**EN:** Bytekit is framework-agnostic and works seamlessly with React, Vue, Svelte, Angular, and more.  
**ES:** Bytekit es agnóstico al framework y funciona perfectamente con React, Vue, Svelte, Angular y más.

### 🎯 Works with / Compatible con

<div align="center">

**React** • **Vue** • **Svelte** • **Angular** • **Next.js** • **Nuxt** • **SvelteKit**

</div>

### 📚 Quick Examples / Ejemplos Rápidos

#### React

```jsx
import { createApiClient } from "bytekit";
import { useState, useEffect } from "react";

function useApiClient(config) {
    const [client] = useState(() => createApiClient(config));
    return client;
}

function Users() {
    const client = useApiClient({ baseURL: "https://api.example.com" });
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

**[📖 Full React Guide](./docs/examples/react.md)** • **[💻 Working Example](./examples/react-app)** • **[🚀 Try on CodeSandbox](https://codesandbox.io/p/devbox/bytekit-react-example-gr2k2j)**

#### Vue 3

```vue
<script setup>
import { ref, onMounted } from "vue";
import { createApiClient } from "bytekit";

const client = createApiClient({ baseURL: "https://api.example.com" });
const users = ref([]);

onMounted(async () => {
    users.value = await client.get("/users");
});
</script>

<template>
    <div v-for="user in users" :key="user.id">{{ user.name }}</div>
</template>
```

**[📖 Full Vue Guide](./docs/examples/vue.md)** • **[💻 Working Example](./examples/vue-app)** • **[🚀 Try on CodeSandbox](https://codesandbox.io/p/devbox/df26fs)**

#### Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { createApiClient } from 'bytekit';

  const client = createApiClient({ baseURL: 'https://api.example.com' });
  let users = [];

  onMount(async () => {
    users = await client.get('/users');
  });
</script>

{#each users as user}
  <div>{user.name}</div>
{/each}
```

**[📖 Full Svelte Guide](./docs/examples/svelte.md)** • **[💻 Working Example](./examples/svelte-app)** • **[🚀 Try on CodeSandbox](https://codesandbox.io/p/devbox/lxvghg)**

### 🚀 Try the Examples / Probá los Ejemplos

**EN:** Each example is a standalone Vite app ready to run:  
**ES:** Cada ejemplo es una app Vite lista para ejecutar:

```bash
cd examples/react-app    # or vue-app, svelte-app
npm install
npm run dev
```

**[📁 View all examples](./examples)**

## API surface / Métodos expuestos

**EN:** Complete reference of all exported methods and classes. Use `npm info bytekit` to see the full list.  
**ES:** Referencia completa de todos los métodos y clases exportados. Usa `npm info bytekit` para ver la lista completa.

### Core Modules / Módulos Core

#### ApiClient

```ts
class ApiClient {
    get<T>(url: string, options?: RequestOptions): Promise<T>;
    post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
    put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
    delete<T>(url: string, options?: RequestOptions): Promise<T>;
    getList<T>(
        url: string,
        options?: GetListOptions
    ): Promise<PaginatedResponse<T>>;
    request<T>(
        method: string,
        url: string,
        options?: RequestOptions
    ): Promise<T>;
}

function createApiClient(config: ApiClientConfig): ApiClient;
class HttpError extends Error {
    status: number;
    body: unknown;
}
```

#### Logger

```ts
class Logger {
    setLevel(level: LogLevel): void;
    child(namespace: string): Logger;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    log(level: LogLevel, message: string, data?: unknown): void;
    silent(): void;
}

function createLogger(config: LoggerConfig): Logger;
const consoleTransportNode: Transport;
const consoleTransportBrowser: Transport;
```

#### Profiler

```ts
class Profiler {
    start(label: string): void;
    end(label: string): number;
    summary(): ProfilerSummary[];
}
```

#### Debug Utilities

```ts
function createStopwatch(options?: StopwatchOptions): Stopwatch;
interface Stopwatch {
    stop(): number;
    elapsed(): number;
    log(data?: unknown): void;
}

async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<T>;
function measureSync<T>(
    label: string,
    fn: () => T
): { result: T; durationMs: number };
async function measureAsync<T>(
    label: string,
    fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }>;
function captureDebug(label: string, data?: unknown): void;
```

#### RetryPolicy

```ts
class RetryPolicy {
    constructor(config: RetryPolicyConfig);
    async execute<T>(fn: () => Promise<T>): Promise<T>;
    getAttempts(): number;
    getRemainingAttempts(): number;
}

class CircuitBreaker {
    constructor(config: CircuitBreakerConfig);
    async execute<T>(fn: () => Promise<T>): Promise<T>;
    getState(): CircuitBreakerState;
    reset(): void;
}
```

#### ResponseValidator

```ts
class ResponseValidator {
    static validate(data: unknown, schema: ValidationSchema): ValidationResult;
    static validateArray(
        data: unknown[],
        schema: ValidationSchema
    ): ValidationResult;
}

interface ValidationSchema {
    type: string;
    properties?: Record<string, ValidationSchema>;
    required?: string[];
    pattern?: RegExp;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
}
```

#### RequestCache

```ts
class RequestCache {
    set(key: string, value: unknown, ttl?: number): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    remove(key: string): void;
    clear(): void;
    invalidate(pattern: string): void;
    invalidatePattern(pattern: string): void;
    getStats(): CacheStats;
}
```

#### RateLimiter

```ts
class RateLimiter {
    isAllowed(key: string): boolean;
    async waitForAllowance(key: string): Promise<void>;
    getStats(key: string): RateLimiterStats;
    reset(key?: string): void;
}

class SlidingWindowRateLimiter {
    isAllowed(key: string): boolean;
    async waitForAllowance(key: string): Promise<void>;
    getStats(key: string): RateLimiterStats;
    reset(key?: string): void;
}
```

#### RequestDeduplicator

```ts
class RequestDeduplicator {
    async execute<T>(key: string, fn: () => Promise<T>): Promise<T>;
    getStats(): DeduplicatorStats;
    getInFlightCount(): number;
    clear(): void;
}
```

#### ErrorBoundary

```ts
class ErrorBoundary {
    async execute<T>(fn: () => Promise<T>, context?: ErrorContext): Promise<T>;
    executeSync<T>(fn: () => T, context?: ErrorContext): T;
    wrap<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T;
    wrapSync<T extends (...args: unknown[]) => unknown>(fn: T): T;
    addHandler(handler: ErrorHandler): void;
    getErrorHistory(limit?: number): ErrorEntry[];
    createErrorReport(): ErrorReport;
}

function getGlobalErrorBoundary(config?: ErrorBoundaryConfig): ErrorBoundary;

class AppError extends Error {
    code: string;
    context?: Record<string, unknown>;
}
class AppValidationError extends AppError {}
class NotFoundError extends AppError {}
class TimeoutError extends AppError {}
class RateLimitError extends AppError {
    retryAfter?: number;
}
```

### Helper Modules / Módulos Helpers

#### DateUtils

```ts
class DateUtils {
    static parse(date: Date | string | number): Date;
    static isValid(date: unknown): boolean;
    static toISODate(date: Date | string): string;
    static startOfDay(date: Date | string): Date;
    static endOfDay(date: Date | string): Date;
    static add(date: Date | string, duration: DateDuration): Date;
    static diff(
        from: Date | string,
        to: Date | string,
        options?: DiffOptions
    ): number;
    static diffInDays(
        from: Date | string,
        to: Date | string,
        options?: DiffOptions
    ): number;
    static isSameDay(date1: Date | string, date2: Date | string): boolean;
    static isBefore(date1: Date | string, date2: Date | string): boolean;
    static isAfter(date1: Date | string, date2: Date | string): boolean;
    static format(date: Date | string, locale?: string): string;
}
```

#### StringUtils

```ts
class StringUtils {
    static removeDiacritics(str: string): string;
    static slugify(str: string, options?: SlugifyOptions): string;
    static compactWhitespace(str: string): string;
    static capitalize(str: string): string;
    static capitalizeWords(str: string): string;
    static truncate(
        str: string,
        length: number,
        options?: TruncateOptions
    ): string;
    static mask(str: string, options?: MaskOptions): string;
    static interpolate(
        template: string,
        values: Record<string, unknown>,
        options?: InterpolateOptions
    ): string;
    static initials(str: string, limit?: number): string;
    static toQueryString(
        obj: Record<string, unknown>,
        options?: QueryStringOptions
    ): string;
}
```

#### Validator

```ts
class Validator {
    static isEmail(email: string): boolean;
    static isEmpty(value: unknown): boolean;
    static minLength(value: string, min: number): boolean;
    static maxLength(value: string, max: number): boolean;
    static matches(value: string, pattern: RegExp): boolean;
    static isUrl(url: string): boolean;
    static isInternationalPhone(phone: string): boolean;
    static isPhoneE164(phone: string): boolean;
    static isUUIDv4(uuid: string): boolean;
    static isLocalPhone(phone: string, locale?: string): boolean;
    static isDni(dni: string, locale?: string): boolean;
    static isCuit(cuit: string): boolean;
    static isCbu(cbu: string): boolean;
    static isStrongPassword(
        password: string,
        options?: PasswordOptions
    ): boolean;
    static isDateRange(
        date: Date | string,
        from: Date | string,
        to: Date | string
    ): boolean;
    static isOneTimeCode(code: string, length?: number): boolean;
}
```

#### EnvManager

```ts
class EnvManager {
    get(key: string, defaultValue?: string): string | undefined;
    require(key: string): string;
    isProd(): boolean;
    isDev(): boolean;
}
```

#### StorageUtils

```ts
class StorageUtils {
    constructor(storage?: Storage);
    set<T>(key: string, value: T, ttl?: number): void;
    get<T>(key: string): T | null;
    remove(key: string): void;
    clear(): void;
    has(key: string): boolean;
}
```

#### FileUploadHelper

```ts
class FileUploadHelper {
    static validateFile(
        file: File,
        options?: FileValidationOptions
    ): FileValidationResult;
    static async uploadFile(
        file: File,
        url: string,
        options?: UploadOptions
    ): Promise<UploadResponse>;
    static async uploadChunked(
        file: File,
        url: string,
        options?: ChunkedUploadOptions
    ): Promise<UploadResponse>;
}
```

#### StreamingHelper

```ts
class StreamingHelper {
    static async streamJsonLines<T>(
        url: string,
        options?: StreamOptions<T>
    ): Promise<StreamResult<T>>;
    static streamSSE<T>(
        url: string,
        options?: SSEOptions<T>
    ): SSESubscription<T>;
    static async downloadStream(
        url: string,
        options?: DownloadOptions
    ): Promise<Blob>;
}
```

#### WebSocketHelper

```ts
class WebSocketHelper {
    constructor(url: string, options?: WebSocketOptions);
    async connect(): Promise<void>;
    on<T>(event: string, listener: (data: T) => void): void;
    once<T>(event: string, listener: (data: T) => void): void;
    off(event: string, listener: Function): void;
    send<T>(event: string, data: T): void;
    async request<Req, Res>(event: string, data: Req): Promise<Res>;
    onError(listener: (error: Error) => void): void;
    close(): void;
    isConnected(): boolean;
}
```

#### ArrayUtils

```ts
class ArrayUtils {
    static chunk<T>(array: T[], size: number): T[][];
    static flatten<T>(array: unknown[], depth?: number): T[];
    static unique<T>(array: T[], by?: (item: T) => unknown): T[];
    static shuffle<T>(array: T[]): T[];
    static random<T>(array: T[]): T;
    static randomN<T>(array: T[], n: number): T[];
    static zip<T>(...arrays: T[][]): T[][];
    static unzip<T>(array: T[][]): T[][];
    static difference<T>(array1: T[], array2: T[]): T[];
    static intersection<T>(array1: T[], array2: T[]): T[];
    static union<T>(array1: T[], array2: T[]): T[];
    static partition<T>(
        array: T[],
        predicate: (item: T) => boolean
    ): [T[], T[]];
    static sum(array: number[]): number;
    static average(array: number[]): number;
    static min(array: number[]): number;
    static max(array: number[]): number;
    static range(start: number, end: number, step?: number): number[];
    static rotate<T>(array: T[], steps: number): T[];
    static transpose<T>(array: T[][]): T[][];
}
```

#### ObjectUtils

```ts
class ObjectUtils {
    static isEmpty(obj: unknown): boolean;
    static deepClone<T>(obj: T): T;
    static merge<T>(...objects: Partial<T>[]): T;
    static deepMerge<T>(...objects: Partial<T>[]): T;
    static pick<T>(obj: T, keys: (keyof T)[]): Partial<T>;
    static omit<T>(obj: T, keys: (keyof T)[]): Partial<T>;
    static get<T>(obj: unknown, path: string): T | undefined;
    static set<T>(obj: T, path: string, value: unknown): T;
    static flatten<T>(obj: T, prefix?: string): Record<string, unknown>;
    static unflatten(obj: Record<string, unknown>): Record<string, unknown>;
    static filter<T>(
        obj: T,
        predicate: (key: string, value: unknown) => boolean
    ): Partial<T>;
    static mapValues<T>(obj: T, mapper: (value: unknown) => unknown): T;
    static hasKeys<T>(obj: T, keys: (keyof T)[]): boolean;
    static invert<T>(obj: Record<string, T>): Record<T, string>;
    static groupBy<T>(array: T[], key: keyof T): Record<string, T[]>;
    static indexBy<T>(array: T[], key: keyof T): Record<string, T>;
    static deepEqual(obj1: unknown, obj2: unknown): boolean;
    static size(obj: Record<string, unknown>): number;
    static entries<T>(obj: T): [string, unknown][];
    static fromEntries(entries: [string, unknown][]): Record<string, unknown>;
    static fromKeys<T>(keys: string[], value: T): Record<string, T>;
}
```

#### FormUtils

```ts
class FormUtils {
    constructor(config: FormConfig);
    setValue(field: string, value: unknown): void;
    getValue(field: string): unknown;
    getFieldError(field: string): string;
    touchField(field: string): void;
    isTouched(field: string): boolean;
    isDirty(field: string): boolean;
    async validateField(field: string): Promise<string | null>;
    async validate(): Promise<Record<string, string>>;
    async submit(): Promise<boolean>;
    getState(): FormState;
    createBinding(field: string): FieldBinding;
    reset(): void;
    serialize(): Record<string, unknown>;
    deserialize(data: Record<string, unknown>): void;
}

function createForm(config: FormConfig): FormUtils;

class Validators {
    static required(value: unknown): boolean;
    static email(value: string): boolean;
    static minLength(value: string, min: number): boolean;
    static maxLength(value: string, max: number): boolean;
    static pattern(value: string, pattern: RegExp): boolean;
    static url(value: string): boolean;
    static match(value: string, other: string): boolean;
}
```

#### TimeUtils

```ts
class TimeUtils {
    static now(): number;
    static sleep(ms: number): Promise<void>;
    static debounce<T extends (...args: unknown[]) => unknown>(
        fn: T,
        delay: number
    ): T;
    static throttle<T extends (...args: unknown[]) => unknown>(
        fn: T,
        delay: number
    ): T;
    static timeout<T>(promise: Promise<T>, ms: number): Promise<T>;
    static retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
}
```

#### EventEmitter

```ts
class EventEmitter<
    Events extends Record<string, unknown> = Record<string, unknown>
> {
    on<K extends keyof Events>(
        event: K,
        listener: EventListener<Events[K]>
    ): this;
    once<K extends keyof Events>(
        event: K,
        listener: EventListener<Events[K]>
    ): this;
    off<K extends keyof Events>(
        event: K,
        listener: EventListener<Events[K]>
    ): this;
    removeAllListeners<K extends keyof Events>(event?: K): this;
    async emit<K extends keyof Events>(
        event: K,
        data: Events[K]
    ): Promise<boolean>;
    emitSync<K extends keyof Events>(event: K, data: Events[K]): boolean;
    onError(listener: EventListenerWithError): this;
    listenerCount<K extends keyof Events>(event: K): number;
    getListeners<K extends keyof Events>(event: K): EventListener<Events[K]>[];
    eventNames(): (keyof Events)[];
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
}

function createEventEmitter<
    Events extends Record<string, unknown> = Record<string, unknown>
>(options?: EventEmitterOptions): EventEmitter<Events>;
```

#### DiffUtils

```ts
class DiffUtils {
    static diff(
        old: Record<string, unknown>,
        new_: Record<string, unknown>
    ): DiffResult;
    static createPatch(
        old: Record<string, unknown>,
        new_: Record<string, unknown>
    ): Patch[];
    static applyPatch<T>(obj: T, patches: Patch[]): T;
    static deepEqual(obj1: unknown, obj2: unknown): boolean;
}

interface Patch {
    op: "add" | "remove" | "replace";
    path: string;
    value?: unknown;
}
```

#### PollingHelper

```ts
class PollingHelper {
    constructor(fn: () => Promise<unknown>, options?: PollingOptions);
    async start(): Promise<PollingResult>;
    stop(): void;
}

function createPoller(
    fn: () => Promise<unknown>,
    options?: PollingOptions
): PollingHelper;

interface PollingResult {
    success: boolean;
    attempts: number;
    lastResult: unknown;
    totalTimeMs: number;
}
```

#### CryptoUtils

```ts
class CryptoUtils {
    static generateToken(bytes?: number): string;
    static generateUUID(): string;
    static base64Encode(str: string): string;
    static base64Decode(str: string): string;
    static base64UrlEncode(str: string): string;
    static base64UrlDecode(str: string): string;
    static async hash(str: string): Promise<string>;
    static async verifyHash(str: string, hash: string): Promise<boolean>;
    static constantTimeCompare(a: string, b: string): boolean;
    static async hmac(message: string, secret: string): Promise<string>;
}
```

#### PaginationHelper

```ts
class PaginationHelper {
    constructor(items: unknown[], options?: PaginationOptions);
    getCurrentPage(): unknown[];
    next(): void;
    previous(): void;
    goToPage(page: number): void;
    getState(): PaginationState;
}

function createPaginator(
    items: unknown[],
    options?: PaginationOptions
): PaginationHelper;

interface PaginationState {
    currentPage: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    offset: number;
    limit: number;
}
```

#### CacheManager

```ts
class CacheManager {
    constructor(options?: CacheManagerOptions);
    set<T>(key: string, value: T, ttl?: number): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    remove(key: string): void;
    clear(): void;
    async getOrCompute<T>(
        key: string,
        fn: () => Promise<T>,
        ttl?: number
    ): Promise<T>;
    invalidatePattern(pattern: string): void;
    getStats(): CacheStats;
}

function createCacheManager(options?: CacheManagerOptions): CacheManager;

interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
}
```

#### CompressionUtils

```ts
class CompressionUtils {
    static compress(str: string): string;
    static decompress(compressed: string): string;
    static base64Encode(str: string): string;
    static base64Decode(str: string): string;
    static base64UrlEncode(str: string): string;
    static base64UrlDecode(str: string): string;
    static serializeCompressed(obj: unknown): string;
    static deserializeCompressed(compressed: string): unknown;
    static getCompressionRatio(original: string, compressed: string): number;
    static minifyJSON(json: string): string;
    static prettyJSON(json: string, indent?: number): string;
    static async gzip(str: string): Promise<Buffer | string>;
    static async gunzip(data: Buffer | string): Promise<string>;
    static async deflate(str: string): Promise<Buffer | string>;
    static async inflate(data: Buffer | string): Promise<string>;
    static getSize(str: string): number;
    static formatBytes(bytes: number, decimals?: number): string;
}
```

## API surface (pnpm info) / Métodos expuestos

`pnpm info bytekit readme` ahora lista todos los exports públicos:

## ApiClient Details / Detalles del ApiClient

-   `baseUrl`: **EN** required prefix for relative endpoints. **ES** prefijo requerido para endpoints relativos.
-   `defaultHeaders`: **EN** shared headers merged per request. **ES** cabeceras comunes que se combinan en cada request.
-   `locale` + `errorMessages`: **EN** localized HTTP errors. **ES** mensajes localizados por código HTTP.
-   `fetchImpl`: **EN** inject your own fetch (tests, custom environments). **ES** inyectá tu propio `fetch` (tests o entornos custom).
-   `retryPolicy`: **EN** configure automatic retries with exponential backoff. **ES** configura reintentos automáticos con backoff exponencial.
-   `circuitBreaker`: **EN** configure circuit breaker to prevent cascading failures. **ES** configura circuit breaker para evitar fallos en cascada.

Each `request` (and `get`, `post`, `put`, `patch`, `delete`) accepts / Cada request acepta:

-   `searchParams`: **EN** serializes to URLSearchParams. **ES** se serializa automáticamente.
-   `body`: **EN** strings, serializable objects, or `FormData`. **ES** strings, objetos serializables o `FormData`.
-   `errorLocale`: **EN** override language per request. **ES** forzá un idioma específico.
-   Native `RequestInit` fields (`headers`, `signal`, etc.).

```ts
import { HttpError } from "bytekit";

try {
    await http.get("/users");
} catch (error) {
    if (error instanceof HttpError) {
        console.error("Server error", error.status, error.body);
    }
}
```

### Paginated Lists / Listados Paginados

-   **getList**: **EN** fetch paginated data with built-in support for `pagination`, `sort`, and `filters`. Returns a typed `PaginatedResponse` with metadata. **ES** obtiene datos paginados con soporte para `pagination`, `sort` y `filters`. Devuelve `PaginatedResponse` con metadatos.

```ts
import { ApiClient } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.example.com" });

// Fetch first page with 10 items per page
const response = await api.getList<User>("/users", {
    pagination: { page: 1, limit: 10 },
    sort: { field: "name", order: "asc" },
    filters: { status: "active" },
});

console.log(response.data); // User[]
console.log(response.pagination);
// {
//   page: 1,
//   limit: 10,
//   total: 42,
//   totalPages: 5,
//   hasNextPage: true,
//   hasPreviousPage: false,
// }

// Fetch with custom filters
const filtered = await api.getList<User>("/users", {
    pagination: { page: 2, limit: 20 },
    sort: { field: "createdAt", order: "desc" },
    filters: { role: "admin", department: "engineering" },
});
```

## Advanced Features / Características Avanzadas

### Retry Policy & Circuit Breaker

-   **RetryPolicy**: **EN** automatic retry with exponential backoff for transient failures. **ES** reintentos automáticos con backoff exponencial para fallos transitorios.
-   **CircuitBreaker**: **EN** prevent cascading failures by stopping requests when service is down. **ES** evita fallos en cascada deteniendo requests cuando el servicio está caído.

```ts
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
    },
    circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeoutMs: 60000,
    },
});

// Requests automatically retry and respect circuit breaker state
const data = await api.get("/users");
```

### Response Validation

-   **ResponseValidator**: **EN** validate API responses against schemas before using them. **ES** valida respuestas de API contra esquemas antes de usarlas.

```ts
import { ApiClient, ValidationSchema } from "bytekit";

const userSchema: ValidationSchema = {
    type: "object",
    properties: {
        id: { type: "number", required: true },
        email: { type: "string", pattern: /.+@.+\..+/ },
        age: { type: "number", minimum: 0, maximum: 150 },
    },
};

const users = await api.get<User[]>("/users", {
    validateResponse: {
        type: "array",
        items: userSchema,
    },
});
```

### File Upload Helper

-   **FileUploadHelper**: **EN** upload files with progress tracking, chunking, and retry support. **ES** sube archivos con seguimiento de progreso, chunking y reintentos.

```ts
import { FileUploadHelper } from "bytekit";

const file = document.querySelector<HTMLInputElement>("#file")?.files?.[0];
if (file) {
    const validation = FileUploadHelper.validateFile(file, {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ["image/jpeg", "image/png"],
    });

    if (validation.valid) {
        const response = await FileUploadHelper.uploadFile(
            file,
            "/api/upload",
            {
                chunkSize: 5 * 1024 * 1024, // 5MB chunks
                onProgress: (progress) => {
                    console.log(`${progress.percentage}% uploaded`);
                },
            }
        );
    }
}
```

### Streaming Helper

-   **StreamingHelper**: **EN** stream JSON lines, Server-Sent Events, or download files with progress. **ES** transmite JSON lines, Server-Sent Events o descarga archivos con progreso.

```ts
import { StreamingHelper } from "bytekit";

// Stream JSON lines (NDJSON)
const { data, complete } = await StreamingHelper.streamJsonLines<User>(
    "/api/users/stream",
    {
        onChunk: (line) => console.log("Received:", line),
        onComplete: () => console.log("Stream complete"),
    }
);

// Stream Server-Sent Events
const sse = StreamingHelper.streamSSE<Message>("/api/messages", {
    eventType: "message",
});

const unsubscribe = sse.subscribe((message) => {
    console.log("New message:", message);
});

// Download with progress
const blob = await StreamingHelper.downloadStream("/api/export.csv", {
    onProgress: (percentage) => console.log(`Downloaded: ${percentage}%`),
});
```

### WebSocket Helper

-   **WebSocketHelper**: **EN** manage WebSocket connections with auto-reconnect, heartbeat, and typed messages. **ES** gestiona conexiones WebSocket con reconexión automática, heartbeat y mensajes tipados.

```ts
import { WebSocketHelper } from "bytekit";

const ws = new WebSocketHelper("wss://api.example.com/ws", {
    reconnect: true,
    maxReconnectAttempts: 5,
    heartbeatIntervalMs: 30000,
});

await ws.connect();

// Subscribe to messages
ws.on<{ userId: string; text: string }>("message", (data) => {
    console.log(`${data.userId}: ${data.text}`);
});

// Send messages
ws.send("message", { text: "Hello!" });

// Request-response pattern
const response = await ws.request<{ query: string }, { result: string }>(
    "query",
    { query: "SELECT * FROM users" }
);

// Handle errors
ws.onError((error) => console.error("WebSocket error:", error));

// Close connection
ws.close();
```

### Request Caching

-   **RequestCache**: **EN** cache HTTP responses with TTL and stale-while-revalidate support. **ES** cachea respuestas HTTP con TTL y soporte para stale-while-revalidate.

```ts
import { RequestCache } from "bytekit";

const cache = new RequestCache({
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 60 * 1000, // 1 minute
});

// Cache a response
cache.set("/users", users);

// Retrieve from cache
const cached = cache.get("/users");

// Check if stale but still valid
if (cache.isStale("/users")) {
    // Revalidate in background
}

// Invalidate specific entry
cache.invalidate("/users");

// Invalidate by pattern
cache.invalidatePattern("/users/*");

// Get statistics
const stats = cache.getStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

### Rate Limiting

-   **RateLimiter**: **EN** token bucket rate limiter for smooth request throttling. **ES** limitador de tasa con token bucket para throttling suave.
-   **SlidingWindowRateLimiter**: **EN** sliding window rate limiter for precise rate control. **ES** limitador de ventana deslizante para control preciso de tasa.

```ts
import { RateLimiter, SlidingWindowRateLimiter } from "bytekit";

// Token bucket limiter (allows bursts)
const limiter = new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
});

if (limiter.isAllowed("https://api.example.com/users")) {
    // Make request
}

// Wait for allowance if rate limited
await limiter.waitForAllowance("https://api.example.com/users");

// Get stats
const stats = limiter.getStats("https://api.example.com/users");
console.log(`Remaining: ${stats.remaining}/${stats.limit}`);

// Sliding window limiter (more accurate)
const slidingLimiter = new SlidingWindowRateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000,
});

if (slidingLimiter.isAllowed("https://api.example.com/users")) {
    // Make request
}
```

### Request Deduplication

-   **RequestDeduplicator**: **EN** deduplicate in-flight requests to avoid redundant API calls. **ES** deduplica requests en vuelo para evitar llamadas redundantes.

```ts
import { RequestDeduplicator } from "bytekit";

const dedup = new RequestDeduplicator();

// Multiple consumers of the same request share the same response
const [users1, users2] = await Promise.all([
    dedup.execute("/users", () => api.get("/users")),
    dedup.execute("/users", () => api.get("/users")), // Deduplicated!
]);

// Different requests execute separately
const [users, posts] = await Promise.all([
    dedup.execute("/users", () => api.get("/users")),
    dedup.execute("/posts", () => api.get("/posts")),
]);

// Get statistics
const stats = dedup.getStats();
console.log(`Deduplication rate: ${stats.deduplicationRate * 100}%`);

// Check in-flight requests
console.log(`In-flight: ${dedup.getInFlightCount()}`);
```

### Object Utilities

-   **ObjectUtils**: **EN** everyday object manipulation utilities (isEmpty, deepClone, merge, pick, omit, flatten, groupBy, etc.). **ES** utilidades cotidianas para manipular objetos.

```ts
import { ObjectUtils } from "bytekit";

// Check if empty
ObjectUtils.isEmpty(null); // true
ObjectUtils.isEmpty({}); // true
ObjectUtils.isEmpty([1, 2]); // false

// Deep clone
const original = { a: { b: 1 } };
const cloned = ObjectUtils.deepClone(original);

// Merge objects
const merged = ObjectUtils.merge({ a: 1 }, { b: 2 }, { c: 3 });
// { a: 1, b: 2, c: 3 }

// Pick/omit keys
const user = {
    id: 1,
    name: "John",
    email: "john@example.com",
    password: "secret",
};
const safe = ObjectUtils.omit(user, ["password"]);
// { id: 1, name: "John", email: "john@example.com" }

// Nested access with dot notation
const config = { db: { host: "localhost", port: 5432 } };
const host = ObjectUtils.get(config, "db.host"); // "localhost"
ObjectUtils.set(config, "db.ssl", true);

// Flatten/unflatten
const flat = ObjectUtils.flatten({ a: { b: { c: 1 } } });
// { "a.b.c": 1 }

// Group and index arrays
const users = [
    { id: 1, role: "admin" },
    { id: 2, role: "user" },
    { id: 3, role: "admin" },
];
const byRole = ObjectUtils.groupBy(users, "role");
const byId = ObjectUtils.indexBy(users, "id");

// Filter and map
const filtered = ObjectUtils.filter(
    user,
    (_, value) => typeof value === "string"
);
const doubled = ObjectUtils.mapValues({ a: 1, b: 2 }, (v) => v * 2);

// Deep equality
ObjectUtils.deepEqual({ a: 1 }, { a: 1 }); // true
```

### Array Utilities

-   **ArrayUtils**: **EN** everyday array manipulation utilities (chunk, flatten, unique, shuffle, zip, partition, etc.). **ES** utilidades cotidianas para manipular arrays.

```ts
import { ArrayUtils } from "bytekit";

// Chunk array into smaller pieces
ArrayUtils.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Flatten nested arrays
ArrayUtils.flatten(
    [
        [1, 2],
        [3, [4, 5]],
    ],
    2
); // [1, 2, 3, 4, 5]

// Get unique values
ArrayUtils.unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]
ArrayUtils.unique([{ id: 1 }, { id: 2 }, { id: 1 }], (item) => item.id); // [{ id: 1 }, { id: 2 }]

// Shuffle and random selection
const shuffled = ArrayUtils.shuffle([1, 2, 3, 4, 5]);
const random = ArrayUtils.random([1, 2, 3, 4, 5]);
const randomN = ArrayUtils.randomN([1, 2, 3, 4, 5], 3);

// Zip and unzip
ArrayUtils.zip([1, 2, 3], ["a", "b", "c"]); // [[1, "a"], [2, "b"], [3, "c"]]

// Set operations
ArrayUtils.difference([1, 2, 3, 4], [2, 4]); // [1, 3]
ArrayUtils.intersection([1, 2, 3], [2, 3, 4]); // [2, 3]
ArrayUtils.union([1, 2], [2, 3]); // [1, 2, 3]

// Partition by predicate
const [evens, odds] = ArrayUtils.partition([1, 2, 3, 4, 5], (n) => n % 2 === 0);
// evens: [2, 4], odds: [1, 3, 5]

// Math operations
ArrayUtils.sum([1, 2, 3, 4]); // 10
ArrayUtils.average([1, 2, 3, 4]); // 2.5
ArrayUtils.min([3, 1, 4, 1, 5]); // 1
ArrayUtils.max([3, 1, 4, 1, 5]); // 5

// Range generation
ArrayUtils.range(1, 5); // [1, 2, 3, 4]
ArrayUtils.range(0, 10, 2); // [0, 2, 4, 6, 8]

// Rotate and transpose
ArrayUtils.rotate([1, 2, 3, 4], 2); // [3, 4, 1, 2]
ArrayUtils.transpose([
    [1, 2],
    [3, 4],
]); // [[1, 3], [2, 4]]
```

### Error Boundary

-   **ErrorBoundary**: **EN** comprehensive error handling with automatic retry logic, error history tracking, and global error handlers. **ES** manejo completo de errores con reintentos automáticos, historial de errores y handlers globales.

```ts
import {
    ErrorBoundary,
    AppError,
    AppValidationError,
    NotFoundError,
    TimeoutError,
    RateLimitError,
} from "bytekit";

// Create error boundary with custom config
const boundary = new ErrorBoundary({
    maxRetries: 3,
    retryDelay: 1000,
});

// Handle errors with custom handlers
boundary.addHandler(async (error, context) => {
    console.error(`Error in ${context.component}:`, error.message);
    // Send to error tracking service
});

// Execute async function with automatic retry
try {
    const data = await boundary.execute(
        async () => {
            return await fetchData();
        },
        { component: "DataFetcher", userId: "user_123" }
    );
} catch (error) {
    if (error instanceof TimeoutError) {
        console.log("Request timed out after retries");
    }
}

// Execute sync function with error handling
const result = boundary.executeSync(
    () => {
        return JSON.parse(jsonString);
    },
    { context: "json-parsing" }
);

// Wrap functions for automatic error handling
const wrappedAsync = boundary.wrap(async (id: string) => {
    return await api.get(`/users/${id}`);
});

const wrappedSync = boundary.wrapSync((data: string) => {
    return JSON.parse(data);
});

// Get error history
const history = boundary.getErrorHistory(10);
history.forEach((entry) => {
    console.log(`${entry.timestamp}: ${entry.error.message}`);
});

// Create error report
const report = boundary.createErrorReport();
console.log(report);
// {
//   timestamp: "2024-12-20T10:30:00.000Z",
//   errors: [
//     {
//       code: "TIMEOUT",
//       message: "Request timeout",
//       statusCode: 408,
//       timestamp: 1703068200000
//     }
//   ]
// }

// Use global error boundary
import { getGlobalErrorBoundary } from "bytekit";

const globalBoundary = getGlobalErrorBoundary({
    maxRetries: 2,
    retryDelay: 500,
});

// Automatically catches unhandled rejections and global errors
globalBoundary.addHandler((error) => {
    console.error("Unhandled error:", error);
});

// Custom error types
try {
    throw new AppValidationError("Invalid email format", {
        component: "SignupForm",
    });
} catch (error) {
    if (error instanceof AppValidationError) {
        console.log("Validation failed:", error.message);
    }
}

try {
    throw new RateLimitError("Too many requests", 60, {
        context: "api-call",
    });
} catch (error) {
    if (error instanceof RateLimitError) {
        const retryAfter = error.context?.metadata?.retryAfter;
        console.log(`Retry after ${retryAfter} seconds`);
    }
}
```

### Form Utilities

-   **FormUtils**: **EN** form validation and state management with built-in validators, async validation, and framework-agnostic design. **ES** validación de formularios y gestión de estado con validadores integrados, validación async y agnóstico del framework.

```ts
import { FormUtils, createForm, Validators } from "bytekit";

// Create form with validation rules
const form = new FormUtils({
    initialValues: {
        email: "",
        password: "",
        confirmPassword: "",
    },
    rules: {
        email: {
            required: "Email is required",
            email: "Invalid email format",
        },
        password: {
            required: true,
            minLength: 8,
            custom: (value) => {
                return /[A-Z]/.test(value)
                    ? true
                    : "Must contain uppercase letter";
            },
        },
        confirmPassword: {
            required: true,
            custom: (value) => {
                return Validators.match(value, form.getValue("password"))
                    ? true
                    : "Passwords do not match";
            },
        },
    },
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
        console.log("Form submitted:", values);
    },
    onError: (errors) => {
        console.error("Validation errors:", errors);
    },
});

// Update field value
form.setValue("email", "user@example.com");

// Get field state
const emailError = form.getFieldError("email");
const isTouched = form.isTouched("email");
const isDirty = form.isDirty("email");

// Validate single field
await form.validateField("email");

// Validate all fields
const errors = await form.validate();

// Submit form
const success = await form.submit();

// Get form state
const state = form.getState();
console.log(state);
// {
//   values: { email: "...", password: "...", confirmPassword: "..." },
//   errors: { email: "", password: "", confirmPassword: "" },
//   touched: { email: true, password: true, confirmPassword: false },
//   dirty: { email: true, password: true, confirmPassword: false },
//   isValidating: false,
//   isValid: true
// }

// Create bindings for framework integration (React, Vue, etc.)
const emailBinding = form.createBinding("email");
// {
//   value: "user@example.com",
//   onChange: (value) => form.setValue("email", value),
//   onBlur: () => form.touchField("email"),
//   error: "",
//   touched: true,
//   dirty: true
// }

// Reset form
form.reset();

// Serialize/deserialize
const data = form.serialize();
form.deserialize({ email: "new@example.com" });

// Built-in validators
Validators.required("value"); // true
Validators.email("test@example.com"); // true
Validators.minLength("password", 8); // true
Validators.maxLength("username", 20); // true
Validators.pattern("12345", /^\d+$/); // true
Validators.url("https://example.com"); // true
Validators.match("password", "password"); // true

// Factory function
const signupForm = createForm({
    initialValues: { username: "", email: "" },
    rules: {
        username: { required: true, minLength: 3 },
        email: { required: true, email: true },
    },
});
```

```

import {
createLogger,
withTiming,
createStopwatch,
StorageManager,
EnvManager,
} from "bytekit";

const logger = createLogger({ namespace: "payments", level: "debug" });

await withTiming("settlements", async () => {
const stopwatch = createStopwatch({ label: "batch-download", logger });
const batch = await downloadPayments();
stopwatch.log({ records: batch.length });
});

const storage = new StorageManager();
storage.set("token", "abc123", 60_000);
const env = new EnvManager();
const apiKey = env.require("API_KEY");

```

-   `DateUtils`: **EN** safe parsing, add/subtract, configurable diffs, `isSameDay`. **ES** parseo seguro, sumas/restas, diferencias configurables e `isSameDay`.
-   `StringUtils`: **EN** slugify, capitalize, masking, interpolation, query strings. **ES** slugify, capitalización, máscaras, interpolación, query strings.
-   `Validator`: **EN** lightweight synchronous validators. **ES** validadores sincrónicos livianos.
-   `StorageManager`: **EN** safe wrapper for `localStorage`/`sessionStorage`. **ES** adaptador seguro para storage del navegador.

## Toolkit Catalog / Catálogo de herramientas

### ApiClient

-   **EN**: Typed HTTP client with retries, localized errors, interceptors, and custom fetch support for Node/browsers.
    **ES**: Cliente HTTP tipado con reintentos, errores localizados, interceptores y `fetch` personalizable para Node/navegadores.

```ts
import { ApiClient } from "bytekit";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    defaultHeaders: { "X-Team": "development" },
});

const user = await api.get("/users/1", {
    searchParams: { locale: "es" },
});
```

### createLogger

-   **EN**: Structured logger with levels, namespaces, transports for Node/browser, and child loggers.  
    **ES**: Logger estructurado con niveles, namespaces, transports para Node/browser y loggers hijos.

```ts
import { createLogger } from "bytekit";

const logger = createLogger({ namespace: "payments", level: "info" });
logger.warn("payment delayed", { id: "tx_1" });

const workerLogger = logger.child("worker");
workerLogger.debug("processing batch", { size: 20 });
```

### Timing & Debug Utilities

-   **EN**: `createStopwatch`, `withTiming`, `measureAsync`, `captureDebug`, and `Profiler` help you capture execution times and emit logs automatically.  
    **ES**: `createStopwatch`, `withTiming`, `measureAsync`, `captureDebug` y `Profiler` facilitan medir tiempos y loguear automáticamente.

```ts
import { createStopwatch, withTiming, measureAsync, Profiler } from "bytekit";

const stopwatch = createStopwatch({ label: "sync-users" });
// ... run task
stopwatch.log({ records: 42 });

await withTiming("refresh-cache", async () => fetchCache());
const { result, durationMs } = await measureAsync("bill-run", () =>
    processBills()
);

const profiler = new Profiler();
profiler.start("db");
await queryDb();
profiler.end("db");
console.table(profiler.summary());
```

### DateUtils

-   **parse / isValid**: **EN** accept `Date`, ISO strings, timestamps; return normalized Date or boolean. **ES** aceptan `Date`, string ISO o timestamp y devuelven Date normalizada o booleano.
-   **toISODate**: **EN** format to `YYYY-MM-DD` without timezone surprises. **ES** formatea como `YYYY-MM-DD` evitando problemas de zona horaria.
-   **startOfDay / endOfDay**: **EN** clamp hours to `00:00:00.000` or `23:59:59.999`. **ES** ajusta horas al inicio o final del día.
-   **add**: **EN** add duration (`days`, `hours`, `minutes`, `seconds`, `milliseconds`). **ES** suma duraciones con granularidad configurable.
-   **diff / diffInDays**: **EN** difference between two dates with unit + rounding + absolute options. **ES** diferencia entre fechas con unidad, redondeo y valor absoluto configurable.
-   **isSameDay / isBefore / isAfter**: **EN** compare normalized dates. **ES** compara fechas normalizadas.
-   **format**: **EN** locale-aware short date (`es-AR` default). **ES** formatea con `toLocaleDateString`.

```ts
DateUtils.isSameDay("2024-10-10", new Date());
DateUtils.diff(new Date("2024-01-01"), Date.now(), {
    unit: "days",
    rounding: "round",
    absolute: true,
});
```

### StringUtils

-   **removeDiacritics / compactWhitespace**: **EN** normalize text for comparisons or rendering. **ES** normalizan texto para comparaciones o UI.
-   **slugify**: **EN** create URL-friendly IDs with configurable separator/lowercase. **ES** genera slugs configurables.
-   **capitalize / capitalizeWords**: **EN/ES** capitaliza respetando locale.
-   **truncate**: **EN** trims long strings with optional ellipsis + word boundaries. **ES** recorta textos largos respetando palabras.
-   **mask**: **EN** hide sensitive parts with custom `maskChar`, `visibleStart`, `visibleEnd`. **ES** oculta secciones sensibles con máscara configurable.
-   **interpolate**: **EN** replace `{{placeholders}}` with nested object values (strict/fallback/transform). **ES** interpolación con soporte para rutas y validación.
-   **initials**: **EN** generate up to `limit` initials. **ES** genera iniciales rápido.
-   **toQueryString**: **EN** serialize nested objects/arrays with formats (`repeat`, `bracket`, `comma`). **ES** serializa objetos y arrays a query strings.

```ts
StringUtils.mask("4242424242424242", { visibleStart: 4, visibleEnd: 2 });
StringUtils.toQueryString({
    page: 1,
    tags: ["lab", "team"],
    filters: { status: "active" },
});
```

### StorageManager

-   **StorageManager**: **EN** wraps any `Storage` (default `localStorage`) with safe JSON parsing and TTL support. **ES** envuelve cualquier `Storage` con parseo seguro y expiración opcional.
-   **set/get/remove/clear**: **EN** persist typed values, remove expired entries automatically. **ES** guarda valores tipados y limpia expirados.

```ts
const storage = new StorageManager(sessionStorage);
storage.set("session", { token: "abc" }, 60_000);
const session = storage.get<{ token: string }>("session");
```

### EnvManager

-   **get / require**: **EN** read ENV vars from Node (via `process.env`) or Vite-style browser builds (`import.meta.env`). **ES** lee env vars en Node o navegador y marca obligatorias con `require`.
-   **isProd**: **EN** check `NODE_ENV`/`MODE`. **ES** detecta modo producción.

```ts
const env = new EnvManager();
const apiBase = env.require("API_BASE_URL");
if (env.isProd()) {
    // toggle prod-only behavior
}
```

### Validator

-   **Identity**: **EN** `isEmail`, `isUUIDv4`, `isDni`, `isCuit`, `isCbu`. **ES** validaciones de identidad y banking locales.
-   **Phones**: **EN** `isInternationalPhone`, `isPhoneE164`, `isLocalPhone(locale)`. **ES** valida teléfonos internacionales y locales con patrones por país.
-   **Security**: **EN** `isStrongPassword`, `isOneTimeCode`. **ES** contraseñas fuertes y códigos OTP.
-   **General**: **EN** `isUrl`, `isEmpty`, length guards, regex matcher, `isDateRange`. **ES** helpers generales para formularios.

```ts
Validator.isStrongPassword("SecurePass!2024", { minLength: 10 });
Validator.isLocalPhone("11 5555-7777", "es-AR");
```

### EventEmitter

-   **EN**: Pub/sub event system with sync/async listeners, once listeners, error handling, and listener tracking.  
    **ES**: Sistema de eventos pub/sub con listeners síncronos/asíncronos, listeners únicos, manejo de errores y seguimiento.

```ts
import { EventEmitter, createEventEmitter } from "bytekit";

// Create event emitter with typed events
const emitter = new EventEmitter<{
    "user:login": { userId: string; timestamp: number };
    "user:logout": { userId: string };
    error: Error;
}>();

// Register listeners
emitter.on("user:login", async (data) => {
    console.log(`User ${data.userId} logged in`);
    await trackEvent(data);
});

// One-time listener
emitter.once("user:logout", (data) => {
    console.log(`User ${data.userId} logged out`);
});

// Emit events
await emitter.emit("user:login", {
    userId: "user_123",
    timestamp: Date.now(),
});

// Sync emit
emitter.emitSync("user:logout", { userId: "user_123" });

// Error handling
emitter.onError((data, error) => {
    console.error("Event error:", error);
});

// Listener management
const count = emitter.listenerCount("user:login");
emitter.removeAllListeners("user:login");

// Factory function
const events = createEventEmitter<{ message: string }>();
```

### DiffUtils

-   **EN**: Deep object comparison, patch generation/application, and merge strategies for tracking changes.  
    **ES**: Comparación profunda de objetos, generación/aplicación de parches y estrategias de merge para rastrear cambios.

```ts
import { DiffUtils } from "bytekit";

// Detect changes
const old = { name: "John", age: 30, email: "john@example.com" };
const new_ = { name: "Jane", age: 31, phone: "555-1234" };

const diff = DiffUtils.diff(old, new_);
console.log(diff);
// {
//   changed: ["name", "age"],
//   added: ["phone"],
//   removed: ["email"]
// }

// Create patches (JSON Patch format)
const patches = DiffUtils.createPatch(old, new_);
console.log(patches);
// [
//   { op: "replace", path: "name", value: "Jane" },
//   { op: "replace", path: "age", value: 31 },
//   { op: "add", path: "phone", value: "555-1234" },
//   { op: "remove", path: "email" }
// ]

// Apply patches
const result = DiffUtils.applyPatch(old, patches);
console.log(result); // { name: "Jane", age: 31, phone: "555-1234" }

// Deep equality check
DiffUtils.deepEqual({ a: { b: 1 } }, { a: { b: 1 } }); // true
DiffUtils.deepEqual({ a: { b: 1 } }, { a: { b: 2 } }); // false
```

### PollingHelper

-   **EN**: Intelligent polling with exponential backoff, stop conditions, and max attempts for async operations.  
    **ES**: Polling inteligente con backoff exponencial, condiciones de parada e intentos máximos para operaciones async.

```ts
import { PollingHelper, createPoller } from "bytekit";

// Poll until condition is met
const poller = new PollingHelper(
    async () => {
        const status = await checkJobStatus();
        return status === "completed";
    },
    {
        interval: 1000, // Start with 1 second
        maxAttempts: 30,
        backoffMultiplier: 1.5, // Exponential backoff
        stopCondition: (result) => result === true,
    }
);

const result = await poller.start();
console.log(result);
// {
//   success: true,
//   attempts: 5,
//   lastResult: true,
//   totalTimeMs: 3500
// }

// Handle failure
if (!result.success) {
    console.log(`Failed after ${result.attempts} attempts`);
}

// Factory function
const filePoller = createPoller(
    async () => {
        return await fileExists("output.txt");
    },
    { interval: 500, maxAttempts: 60 }
);
```

### CryptoUtils

-   **EN**: Token/UUID generation, base64 encoding, hashing, HMAC, and constant-time comparison for security.  
    **ES**: Generación de tokens/UUIDs, codificación base64, hashing, HMAC y comparación en tiempo constante para seguridad.

```ts
import { CryptoUtils } from "bytekit";

// Generate secure tokens
const token = CryptoUtils.generateToken(32); // 64 hex chars
const uuid = CryptoUtils.generateUUID(); // v4 UUID

// Base64 encoding
const encoded = CryptoUtils.base64Encode("Hello, World!");
const decoded = CryptoUtils.base64Decode(encoded);

// URL-safe base64 (no +, /, =)
const urlSafe = CryptoUtils.base64UrlEncode("data+with/special=chars");
const restored = CryptoUtils.base64UrlDecode(urlSafe);

// Hashing
const hash = await CryptoUtils.hash("password");
const isValid = await CryptoUtils.verifyHash("password", hash);

// Constant-time comparison (prevents timing attacks)
const match = CryptoUtils.constantTimeCompare(token1, token2);

// HMAC signing
const signature = await CryptoUtils.hmac("message", "secret");
```

### PaginationHelper

-   **EN**: Offset-limit and cursor-based pagination with state tracking and navigation.  
    **ES**: Paginación offset-limit y basada en cursores con seguimiento de estado y navegación.

```ts
import { PaginationHelper, createPaginator } from "bytekit";

const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

// Offset-limit pagination
const paginator = new PaginationHelper(items, {
    pageSize: 10,
    mode: "offset",
});

// Get current page
const page1 = paginator.getCurrentPage(); // First 10 items

// Navigate
paginator.next();
const page2 = paginator.getCurrentPage(); // Items 11-20

paginator.previous();
const backToPage1 = paginator.getCurrentPage();

// Jump to specific page
paginator.goToPage(5);

// Get state
const state = paginator.getState();
console.log(state);
// {
//   currentPage: 5,
//   pageSize: 10,
//   total: 100,
//   totalPages: 10,
//   hasNextPage: true,
//   hasPreviousPage: true,
//   offset: 40,
//   limit: 10
// }

// Cursor-based pagination
const cursorPaginator = new PaginationHelper(items, {
    pageSize: 10,
    mode: "cursor",
    cursorField: "id",
});

// Factory function
const userPaginator = createPaginator(users, { pageSize: 20 });
```

### CacheManager

-   **EN**: Multi-tier cache (memory + localStorage) with TTL, LRU eviction, and statistics for performance optimization.  
    **ES**: Cache multi-nivel (memoria + localStorage) con TTL, evicción LRU y estadísticas para optimización de rendimiento.

```ts
import { CacheManager, createCacheManager } from "bytekit";

const cache = new CacheManager({
    maxSize: 100, // Max entries
    ttl: 5 * 60 * 1000, // 5 minutes default
    useLocalStorage: true, // Enable persistent cache
});

// Set and get
cache.set("user:123", { id: 123, name: "John" }, 60_000); // 1 minute TTL
const user = cache.get("user:123");

// Get or compute
const data = await cache.getOrCompute(
    "expensive:key",
    async () => {
        return await fetchExpensiveData();
    },
    10 * 60 * 1000
); // Cache for 10 minutes

// Check if exists
if (cache.has("user:123")) {
    console.log("User cached");
}

// Remove and clear
cache.remove("user:123");
cache.clear();

// Statistics
const stats = cache.getStats();
console.log(stats);
// {
//   hits: 42,
//   misses: 8,
//   hitRate: 0.84,
//   size: 15,
//   maxSize: 100
// }

// Invalidate by pattern
cache.invalidatePattern("user:*");

// Factory function
const apiCache = createCacheManager({ maxSize: 50 });
```

### CompressionUtils

-   **EN**: String compression, base64 encoding, JSON minification, and gzip/deflate support for data optimization.  
    **ES**: Compresión de strings, codificación base64, minificación JSON y soporte gzip/deflate para optimización de datos.

```ts
import { CompressionUtils } from "bytekit";

// Compress and decompress
const original = "Hello World Hello World Hello World";
const compressed = CompressionUtils.compress(original);
const decompressed = CompressionUtils.decompress(compressed);

// Base64 encoding
const encoded = CompressionUtils.base64Encode("data");
const decoded = CompressionUtils.base64Decode(encoded);

// URL-safe base64
const urlSafe = CompressionUtils.base64UrlEncode("data+special/chars=");

// JSON utilities
const json = '{ "name": "John", "age": 30 }';
const minified = CompressionUtils.minifyJSON(json);
const pretty = CompressionUtils.prettyJSON(minified, 2);

// Compression ratio
const ratio = CompressionUtils.getCompressionRatio(original, compressed);
console.log(`Compression: ${ratio.toFixed(2)}%`);

// Format bytes
CompressionUtils.formatBytes(1024); // "1 KB"
CompressionUtils.formatBytes(1024 * 1024); // "1 MB"

// Serialize/deserialize with compression
const obj = { users: [{ id: 1, name: "John" }] };
const serialized = CompressionUtils.serializeCompressed(obj);
const restored = CompressionUtils.deserializeCompressed(serialized);

// Gzip (Node.js)
const gzipped = await CompressionUtils.gzip(original);
const gunzipped = await CompressionUtils.gunzip(gzipped);

// Deflate (Node.js)
const deflated = await CompressionUtils.deflate(original);
const inflated = await CompressionUtils.inflate(deflated);
```

## Compatibility / Compatibilidad

-   Node.js >= 18 (ESM, `fetch`, `AbortController`, `URL`).
-   Modern browsers (ships optional `cross-fetch` polyfill).

## CLI scaffolding / Generador CLI

**EN:** Install the package globally or invoke it with `npx`. The `sutils` binary provides two powerful commands: scaffolding resource folders with CRUD helpers and generating TypeScript types from API responses.
**ES:** Instalá el paquete globalmente o usalo con `npx`. El binario `sutils` proporciona dos comandos poderosos: crear carpetas de recursos con helpers CRUD y generar tipos TypeScript desde respuestas de API.

### Create Command / Comando Create

```bash
npx sutils create users
```

**What is generated / Qué se genera:**

-   `api/<resource>/index.ts`: typed CRUD helpers built on `bytekit`' `ApiClient`, including shape placeholders, filter helpers, and `list/get/create/update/delete` functions.
-   `hooks/<resource>/use<ResourcePlural>.ts`: Query library hooks (React Query or RTK Query, configurable via `--queryLib`) that invalidate the corresponding queries and wire mutations.
-   `hooks/<resource>/index.ts`: re-exports the generated hooks.

The generator accepts `--apiDir`, `--hooksDir`, `--route`, `--queryLib`, and `--force`; directories default to `api`/`hooks`, the route defaults to the resource name, `--queryLib` defaults to `react-query`, and `--force` overwrites existing files. It also respects nested resource paths like `admin/users`.

**Query Library Options / Opciones de Librería de Queries:**

-   `--queryLib=react-query` (default): Generates hooks using `@tanstack/react-query` (React Query).
-   `--queryLib=rtk-query`: Generates API slice using `@reduxjs/toolkit/query/react` (RTK Query).

**Examples / Ejemplos:**

```bash
# Create with React Query (default)
npx sutils create users

# Create with RTK Query
npx sutils create users --queryLib=rtk-query

# Create with custom directories and RTK Query
npx sutils create payments --apiDir=services --hooksDir=app/hooks --route=/billing/payments --queryLib=rtk-query --force
```

**React Query Setup / Configuración de React Query:**

React Query must be available in the consuming project:

```bash
npm install @tanstack/react-query
```

The generated hooks expect an `ApiClient` instance that you pass as the first argument:

```ts
import { useUsers } from "./hooks/users";
import { apiClient } from "./api/client";

export function UsersList() {
    const { data, isLoading } = useUsers(apiClient);
    // ...
}
```

**RTK Query Setup / Configuración de RTK Query:**

RTK Query must be available in the consuming project:

```bash
npm install @reduxjs/toolkit react-redux
```

The generated API slice should be added to your Redux store:

```ts
import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "./hooks/users";

export const store = configureStore({
    reducer: {
        [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(userApi.middleware),
});
```

Then use the generated hooks in your components:

```ts
import { useListUsersQuery, useCreateUserMutation } from "./hooks/users";

export function UsersList() {
    const { data, isLoading } = useListUsersQuery();
    const [createUser] = useCreateUserMutation();
    // ...
}
```

### Types Command / Comando Types

**EN:** Generate TypeScript type definitions automatically from API responses. Perfect for quickly creating types without manual work.
**ES:** Genera definiciones de tipos TypeScript automáticamente desde respuestas de API. Perfecto para crear tipos rápidamente sin trabajo manual.

```bash
# Generate types from GET endpoint
npx sutils types https://api.example.com/users

# Generate types with custom output and name
npx sutils types https://api.example.com/users --output=user-types.ts --name=User

# Generate types from POST endpoint with custom headers
npx sutils types https://api.example.com/users --method=POST --header=Authorization:Bearer\ token
```

**Options / Opciones:**

-   `--method=<METHOD>`: HTTP method (default: GET). Supports GET, POST, PUT, PATCH, DELETE.
-   `--output=<file>`: Output file path (default: types.ts).
-   `--name=<name>`: Type name (default: ApiResponse).
-   `--header=<key:value>`: Custom header (can be used multiple times).

**Example output / Ejemplo de salida:**

```ts
// Auto-generated types from API response
// Generated at 2024-12-20T10:30:00.000Z

export interface ApiResponse {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}
```

## TypeScript Compatibility / Compatibilidad con TypeScript

**EN:** The package is tested and verified to work with multiple TypeScript versions.  
**ES:** El paquete está testeado y verificado para funcionar con múltiples versiones de TypeScript.

### Supported Versions / Versiones Soportadas

| Version | Status              | Notes                                         |
| ------- | ------------------- | --------------------------------------------- |
| 5.9.3+  | ✅ **Recommended**  | Full ES2023 support, modern module resolution |
| 6.0.0+  | ✅ **Future-proof** | Compatible with upcoming TypeScript versions  |
| 5.6.3   | ⚠️ Partial          | Requires ES2022 target instead of ES2023      |
| < 5.6   | ❌ Not supported    | Missing ES2023 features and modern tooling    |

### Recommended Configuration / Configuración Recomendada

**EN:** Use TypeScript 5.9.3 or later for optimal compatibility and zero deprecation warnings.  
**ES:** Usá TypeScript 5.9.3 o posterior para compatibilidad óptima y sin warnings de deprecación.

```bash
npm install --save-dev typescript@^5.9.3
```

### ES2023 Features Used / Características ES2023 Utilizadas

The package leverages these ES2023 features:

-   `Array.prototype.findLast()` - Find last element matching predicate
-   `Array.prototype.findLastIndex()` - Find last index matching predicate
-   `Array.prototype.at()` - Access array elements with negative indices
-   `String.prototype.at()` - Access string characters with negative indices
-   `Object.hasOwn()` - Check object property ownership
-   Experimental Decorators

### Migration from Older Versions / Migración desde Versiones Antiguas

**From TypeScript 5.6 to 5.9:**

```bash
# 1. Update TypeScript
npm install --save-dev typescript@^5.9.3

# 2. Update tsconfig.json
# Change target from ES2022 to ES2023
# Change moduleResolution from node to bundler

# 3. No code changes needed
npm run build
```

**From TypeScript 5.9 to 6.0+:**

```bash
# 1. Update TypeScript
npm install --save-dev typescript@^6.0.0

# 2. No tsconfig changes needed (already future-proof)

# 3. No code changes needed
npm run build
```

### Testing TypeScript Compatibility / Testeando Compatibilidad

**EN:** Run the test suite to verify TypeScript compatibility:  
**ES:** Ejecutá la suite de tests para verificar compatibilidad con TypeScript:

```bash
npm run test
```

## Migration from @sebamar88/utils / Migración desde @sebamar88/utils

**EN:** If you were using `@sebamar88/utils`, simply update your package name to `bytekit`. No code changes are required—all APIs remain the same.

**ES:** Si estabas usando `@sebamar88/utils`, simplemente actualiza el nombre del paquete a `bytekit`. No se requieren cambios de código—todas las APIs permanecen igual.

### Before / Antes

```bash
npm install @sebamar88/utils
```

```typescript
import { ApiClient, DateUtils } from "@sebamar88/utils";
```

### After / Después

```bash
npm install bytekit
```

```typescript
import { ApiClient, DateUtils } from "bytekit";
```

### Version History / Historial de Versiones

-   **v0.1.10+** - `bytekit` (current)
-   **v0.1.9 and earlier** - `@sebamar88/utils` (deprecated)

**EN:** The package was renamed from `@sebamar88/utils` to `bytekit` starting with v0.1.10. All functionality remains the same.

**ES:** El paquete fue renombrado de `@sebamar88/utils` a `bytekit` a partir de v0.1.10. Toda la funcionalidad permanece igual.

## License / Licencia

MIT © 2024 Sebastián Martinez
