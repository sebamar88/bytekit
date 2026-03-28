# Feature Specification: Promise Pool con Concurrencia Controlada

**Feature Branch**: `003-promise-pool`  
**Created**: 28 de marzo de 2026  
**Status**: Draft  
**Input**: Añadir un módulo PromisePool zero-deps para limitar concurrencia en promesas, útil para evitar sobrecargar APIs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ejecutar Promesas con Límite de Concurrencia (Priority: P1)

Como desarrollador, quiero ejecutar un array de promesas con un límite de concurrencia para evitar sobrecargar un servidor o API con demasiadas requests simultáneas.

**Why this priority**: Es el caso de uso principal y más común; permite un MVP básico que ya añade valor inmediato.

**Independent Test**: Puede probarse ejecutando 10 promesas con concurrency=2, verificando que nunca más de 2 se ejecuten al mismo tiempo.

**Acceptance Scenarios**:

1. **Given** un array de 5 promesas y concurrency=2, **When** se ejecuta `pool.run(promises)`, **Then** se ejecutan máximo 2 promesas simultáneamente, y todas completan correctamente.
2. **Given** una task falla, **When** se ejecuta con concurrency=1, **Then** esa task's promise rechaza con el error original pero el pool continúa ejecutando las tasks restantes en la cola. *(Nota: el callback `onError` es una feature adicional de P2; P1 sólo requiere que el pool no se detenga ante un fallo individual.)*

---

### User Story 2 - Configurar Timeout por Task y Callbacks de Error (Priority: P2)

Como desarrollador avanzado, quiero configurar un timeout por task individual y un callback de error para manejar fallos sin detener el pool.

**Why this priority**: Añade flexibilidad sin ser esencial para el core; puede implementarse después del P1.

**Independent Test**: Puede probarse configurando `timeout: 500ms` y verificando que una task que tarda 600ms falle con `PoolTimeoutError` mientras las demás continúan.

**Acceptance Scenarios**:

1. **Given** concurrency=3 y timeout=500ms, **When** una task tarda 600ms, **Then** esa task falla con `PoolTimeoutError` (no un `Error` genérico), pero las demás continúan.
2. **Given** un callback onError, **When** una promesa falla, **Then** el callback se ejecuta con el error, sin detener el pool.

---

### User Story 3 - Integración con ApiClient (Priority: P3)

Como usuario de Bytekit, quiero que el PromisePool se integre automáticamente en requests paralelos del ApiClient.

**Why this priority**: Mejora la experiencia, pero no es core; puede ser un enhancement posterior.

**Independent Test**: Puede probarse haciendo requests paralelos con ApiClient configurado con pool interno.

**Acceptance Scenarios**:

1. **Given** ApiClient con opción pool activada, **When** se hacen 10 requests paralelos, **Then** se respeta el límite de concurrencia configurado.
2. **Given** ApiClient **sin** opción pool, **When** se hacen requests, **Then** el comportamiento es idéntico al ApiClient actual sin ninguna regresión.

---

## Technical Requirements

### API Design

- Clase `PromisePool` con constructor: `new PromisePool(options: { concurrency: number, timeout?: number, onError?: (error: Error, taskIndex: number) => void })`
- Método `run<T>(tasks: (() => Promise<T>)[]): Promise<T[]>`
- Tipos TS estrictos, compatibles con el resto de Bytekit.

### Constraints

- Zero dependencies: Solo usar built-ins (Promise, Array como cola).
- Isomórfico: Funciona en Node.js 18+ y browsers modernos.
- Performance: Mínimo overhead en bundle size.

### Implementation Notes

- Usar una cola FIFO para tasks pendientes.
- Ejecutar hasta `concurrency` en paralelo.
- Usar `Promise.all` sobre promesas de control internas + array de resultados preallocado para preservar orden.
- Los errores individuales son capturados por task (no fail-fast); el pool continúa procesando tareas pendientes.

## Testing Strategy

- Unit tests con Vitest: Cobertura >95%.
- Edge cases: Cola vacía, concurrency=0, errores en tasks.
- Integration: Probar con ApiClient.

## Success Metrics

- Bundle size increase < 1KB gzipped (verificado con `npm run build` post-merge).
- Tests passing en CI con cobertura ≥95%.
- Sin regresiones en el suite de tests de `ApiClient` (US3).
