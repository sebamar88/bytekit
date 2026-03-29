# Feature Specification: WebSocket con Reconexión Inteligente y Schema Validation

**Feature Branch**: `005-websocket-advanced`  
**Created**: 28 de marzo de 2026  
**Status**: Draft  
**Input**: Mejorar WebSocketHelper con reconexión automática, heartbeat y validación de mensajes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconexión Automática (Priority: P1)

Como desarrollador, quiero que el WebSocket se reconecte automáticamente si se pierde la conexión.

**Why this priority**: Esencial para apps real-time en redes inestables.

**Independent Test**: Puede probarse desconectando manualmente y verificando reconexión.

**Acceptance Scenarios**:

1. **Given** conexión perdida (cierre inesperado del socket), **When** `onclose` se dispara, **Then** el WebSocket inicia reconexión automática con el backoff configurado.
2. **Given** reconexión fallida, **When** se alcanza `maxReconnectAttempts`, **Then** dispara el callback `onMaxRetriesReached` (no `onError`).

---

### User Story 2 - Validación de Mensajes (Priority: P2)

Como desarrollador, quiero validar mensajes **entrantes** con schemas.

**Why this priority**: Asegura integridad de datos recibidos del servidor.

**Independent Test**: Puede probarse simulando un mensaje entrante inválido y verificando que se rechace.

**Acceptance Scenarios**:

1. **Given** schema registrado para un tipo de mensaje, **When** llega mensaje inválido, **Then** se llama `onValidationError(error, rawMessage)` y el mensaje es descartado (los handlers `on()` no se invocan).
2. **Given** schema registrado para un tipo de mensaje, **When** llega mensaje válido, **Then** `on()` recibe el valor ya parseado/transformado por el schema.

> **Nota**: La validación de mensajes salientes queda fuera de scope — el desarrollador controla los datos que envía con `send()`.

---

### User Story 3 - Heartbeat y Monitoreo (Priority: P3)

Como desarrollador, quiero heartbeats para detectar desconexiones silenciosas.

**Why this priority**: Mejora robustez en conexiones largas.

**Independent Test**: Puede probarse configurando heartbeat y verificando pings.

**Acceptance Scenarios**:

1. **Given** heartbeat=30s, **When** no hay respuesta, **Then** se reconecta.

---

## Technical Requirements

### API Design

Nuevas opciones planas en `WebSocketOptions` (todas opcionales, backward-compatible):

- `backoffStrategy?: "linear" | "exponential" | ((attempt: number) => number)` — default `"linear"`
- `maxReconnectDelayMs?: number` — tope máximo del delay de reconexión (default `30000`)
- `jitter?: boolean` — Full Jitter sobre backoff exponencial (default `false`)
- `heartbeatTimeoutMs?: number` — ms de espera para recibir `pong` tras cada `ping` (default `5000`)
- `schemas?: Record<string, SchemaAdapter>` — validación por tipo de mensaje entrante

Nuevos métodos de suscripción (todos retornan `() => void` para desuscribirse):

- `onReconnect(handler: (attempt: number, delay: number) => void): () => void`
- `onMaxRetriesReached(handler: () => void): () => void`
- `onValidationError(handler: (error: Error, message: WebSocketMessage) => void): () => void`

### Constraints

- Zero dependencies: Usar WebSocket built-in.
- Isomórfico: Funciona en Node y browser.

### Implementation Notes

- Backoff exponencial para reconexión.
- Usar SchemaAdapter para validación.

## Testing Strategy

- Unit tests: Reconexión, validación.
- Integration: Con servidor WebSocket mock.

## Success Metrics

- Reconexión en <5s en promedio.
- Tests passing.
