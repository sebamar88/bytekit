# Feature Specification: Request Queue & Batching System

**Feature Branch**: `004-request-queue-batching`  
**Created**: 28 de marzo de 2026  
**Status**: Draft  
**Input**: Fusión de Parallel Queue (002) y Batching System. Un sistema unificado para encolar requests HTTP con concurrencia controlada, priorización, cancelación y agrupación inteligente de requests similares.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cola de Requests con Concurrencia Controlada (Priority: P1)

Como desarrollador, quiero encolar requests HTTP con un límite de concurrencia para no sobrecargar el servidor.

**Why this priority**: Es el caso de uso más inmediato y universal; funciona standalone sin necesitar batching.

**Independent Test**: Puede probarse enviando 20 requests con concurrency=3 y verificando que nunca más de 3 se ejecuten simultáneamente.

**Acceptance Scenarios**:

1. **Given** 20 requests y concurrency=3, **When** se ejecutan, **Then** máximo 3 corren en paralelo y todos completan correctamente.
2. **Given** una cola con requests fallidos, **When** uno falla, **Then** los demás continúan procesándose sin bloquearse.

---

### User Story 2 - Priorización y Cancelación de Requests (Priority: P2)

Como desarrollador, quiero asignar prioridades a requests y cancelar los que ya no necesito.

**Why this priority**: Esencial para UIs donde nuevas interacciones invalidan requests previos (ej. búsqueda en tiempo real).

**Independent Test**: Puede probarse encolando requests con distintas prioridades y verificando el orden de ejecución.

**Acceptance Scenarios**:

1. **Given** requests con priority `high` y `low` en cola, **When** hay slot disponible, **Then** se ejecutan los `high` primero.
2. **Given** un request encolado, **When** se llama a `cancel(id)`, **Then** se elimina de la cola sin ejecutarse.
3. **Given** un request ya en ejecución, **When** se cancela, **Then** se aborta via `AbortController`.

---

### User Story 3 - Agrupación Inteligente (Batching) (Priority: P2)

Como desarrollador, quiero que requests similares a la misma URL se agrupen en un solo batch para reducir round-trips.

**Why this priority**: Gran impacto en APIs de alta frecuencia; complementa la cola con optimización de red.

**Independent Test**: Puede probarse enviando múltiples GET a la misma URL en una ventana de tiempo.

**Acceptance Scenarios**:

1. **Given** 5 requests GET a la misma endpoint en 100ms, **When** batching activo, **Then** se envían en 1 request.
2. **Given** delay=200ms, **When** llegan requests en intervalos de 50ms, **Then** se acumulan hasta el delay.
3. **Given** requests con diferentes payloads, **When** se intenta batch, **Then** no se agrupan si no son compatibles.

---

### User Story 4 - Integración con ApiClient (Priority: P3)

Como usuario de Bytekit, quiero que la cola y el batching se integren transparentemente en ApiClient.

**Why this priority**: Mejora DX sin cambios en el código de consumo.

**Independent Test**: Puede probarse configurando ApiClient con opciones de queue/batch.

**Acceptance Scenarios**:

1. **Given** ApiClient con `queue: { concurrency: 5 }`, **When** se hacen requests, **Then** se respeta el límite automáticamente.
2. **Given** ApiClient con `batch: { delay: 100 }`, **When** requests simultáneos a la misma URL, **Then** se agrupan sin intervención manual.

---

## Technical Requirements

### API Design

- Clase `RequestQueue` con constructor: `new RequestQueue(options: { concurrency: number, batch?: { delay: number, maxSize?: number } })`
- Método `add(request: () => Promise<T>, options?: { priority?: 'high' | 'normal' | 'low' }): { promise: Promise<T>, cancel: () => void }`
- Método `flush(): Promise<void>` para forzar envío de batches pendientes.
- Integración con `PromisePool` internamente para concurrencia.
- Integración con `ApiClient` via opción `queue`.

### Constraints

- Zero dependencies: Usar `AbortController`, timers y `Map` built-in.
- Isomórfico: Funciona en Node.js 18+ y browsers modernos.
- Construido sobre `PromisePool` (003) para reutilizar lógica de concurrencia.

### Implementation Notes

- Cola con prioridad usando 3 sub-colas (high/normal/low).
- Batching via `Map<url, pendingRequests[]>` con timer por ventana.
- Cancelación con `AbortController` nativo.
- Estado de la cola observable (size, running, pending).

## Testing Strategy

- Unit tests: Cola, priorización, cancelación, batching, timing.
- Integration: Con `ApiClient` y `PromisePool`.
- Edge cases: Cola vacía, cancelar en ejecución, batch overflow.

## Success Metrics

- Reducción de requests >50% en escenarios de alta frecuencia con batching.
- Cancelación funciona en >99% de casos antes de ejecución.
- Tests passing con >95% coverage.
