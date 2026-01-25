# PollingHelper

> **Categoría:** Utilities | **[⬅️ Volver al índice](Home)**

## Descripción

`PollingHelper` es una utilidad avanzada para realizar polling (sondeo repetitivo) con backoff inteligente, jitter, timeouts configurables y métricas de rendimiento. Ideal para verificar estados, esperar por webhooks, o cualquier operación que requiera reintentos.

## API

### Clase PollingHelper

```typescript
class PollingHelper<T = unknown> {
    constructor(fn: () => Promise<T>, options?: PollingOptions<T>);
    async start(): Promise<PollingResult<T>>;
    async startWithAbort(): Promise<PollingResult<T>>;
    abort(): void;
}
```

### Opciones de Configuración

```typescript
interface PollingOptions<T = unknown> {
    interval?: number;                // Intervalo base en ms (default: 1000)
    maxAttempts?: number;             // Máximo de intentos (default: Infinity)
    maxDuration?: number;             // Duración máxima en ms (default: Infinity)
    backoffMultiplier?: number;       // Multiplicador de backoff (default: 1)
    maxBackoffInterval?: number;      // Intervalo máximo de backoff (default: 30000)
    stopCondition?: (result: T) => boolean;  // Condición de parada (default: () => true)
    onAttempt?: (attempt: number, result?: T, error?: Error) => void;
    onSuccess?: (result: T, attempts: number) => void;
    onError?: (error: Error, attempts: number) => void;
    
    // 🆕 Nuevas opciones
    jitter?: boolean | number;        // Jitter aleatorio (true = 10%, número = % personalizado)
    attemptTimeout?: number;          // Timeout por intento en ms
    retryOnError?: boolean;           // Reintentar en error (default: true)
    exponentialBase?: number;         // Base para backoff exponencial (default: 2)
}
```

### Resultado

```typescript
interface PollingResult<T = unknown> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
    duration: number;
    metrics?: {                       // 🆕 Métricas de rendimiento
        minResponseTime: number;
        maxResponseTime: number;
        avgResponseTime: number;
    };
}
```

## Ejemplos de Uso

### Polling Básico

```typescript
import { PollingHelper } from "bytekit/polling-helper";

const poller = new PollingHelper(
    async () => {
        const response = await fetch('/api/status');
        return response.json();
    },
    {
        interval: 1000,
        maxAttempts: 10,
        stopCondition: (result) => result.status === 'complete'
    }
);

const result = await poller.start();
if (result.success) {
    console.log('Completado:', result.result);
}
```

### 🆕 Polling con Abort Controller

```typescript
const poller = new PollingHelper(
    async () => checkJobStatus(),
    { interval: 2000 }
);

const promise = poller.startWithAbort();

// Cancelar después de 10 segundos
setTimeout(() => poller.abort(), 10000);

const result = await promise;
// result.error.message === "Polling aborted"
```

### 🆕 Polling con Jitter (Sistemas Distribuidos)

```typescript
// Evita el "thundering herd problem"
const poller = new PollingHelper(
    async () => checkResource(),
    {
        interval: 1000,
        jitter: 20,  // ±20% de variación aleatoria
        maxAttempts: 5
    }
);
```

### 🆕 Timeout por Intento

```typescript
const poller = new PollingHelper(
    async () => slowApiCall(),
    {
        interval: 1000,
        attemptTimeout: 5000,  // Cada intento timeout a 5s
        maxAttempts: 3
    }
);
```

### 🆕 Sin Reintentos en Error

```typescript
const poller = new PollingHelper(
    async () => criticalOperation(),
    {
        interval: 1000,
        retryOnError: false,  // Falla inmediatamente en error
        maxAttempts: 5
    }
);
```

### Backoff Exponencial

```typescript
const result = await PollingHelper.pollWithBackoff(
    async () => checkStatus(),
    {
        interval: 1000,        // Comienza en 1s
        backoffMultiplier: 2,  // Duplica cada vez: 1s, 2s, 4s, 8s...
        maxBackoffInterval: 30000,
        maxAttempts: 10
    }
);
```

### 🆕 Con Métricas de Rendimiento

```typescript
const result = await poller.start();

if (result.success && result.metrics) {
    console.log(`Min: ${result.metrics.minResponseTime}ms`);
    console.log(`Max: ${result.metrics.maxResponseTime}ms`);
    console.log(`Avg: ${result.metrics.avgResponseTime}ms`);
}
```

## Métodos Estáticos

### `poll()`

Polling simple con configuración por defecto:

```typescript
const result = await PollingHelper.poll(
    async () => checkCondition(),
    { interval: 1000, maxAttempts: 5 }
);
```

### `pollWithBackoff()`

Polling con backoff exponencial (multiplicador = 2):

```typescript
const result = await PollingHelper.pollWithBackoff(
    async () => checkCondition(),
    { interval: 1000, maxAttempts: 10 }
);
```

### `pollWithLinearBackoff()`

Polling con backoff lineal (multiplicador = 1.5):

```typescript
const result = await PollingHelper.pollWithLinearBackoff(
    async () => checkCondition(),
    { interval: 1000, maxAttempts: 10 }
);
```

## Factory Function

```typescript
import { createPoller } from "bytekit/polling-helper";

const poller = createPoller(
    async () => checkStatus(),
    { interval: 2000 }
);

const result = await poller.start();
```

## Validación de Opciones

El constructor valida automáticamente las opciones:

- `interval` debe ser > 0
- `maxAttempts` debe ser > 0
- `maxDuration` debe ser > 0
- `backoffMultiplier` debe ser >= 1
- `maxBackoffInterval` debe ser >= `interval`
- `jitter` (si es número) debe estar entre 0 y 100
- `attemptTimeout` debe ser > 0
- `exponentialBase` debe ser >= 1

## Instalación

```bash
npm install bytekit
```

## Importación

```typescript
// Importación específica (recomendado)
import { PollingHelper, createPoller } from "bytekit/polling-helper";

// Importación desde el índice principal
import { PollingHelper, createPoller } from "bytekit";
```

---

## Enlaces Relacionados

- **[📚 Documentación Principal](https://github.com/sebamar88/bytekit#readme)**
- **[🏠 Índice de Wiki](Home)**
- **[📦 Módulos Utilities](Utilities)**

---

**💡 ¿Encontraste un error o tienes una sugerencia?** [Abre un issue](https://github.com/sebamar88/bytekit/issues) o contribuye al proyecto.
