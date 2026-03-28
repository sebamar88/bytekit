# Data Model: Promise Pool

**Feature**: `003-promise-pool`  
**Phase**: 1 — Design & Contracts  
**Date**: 28 de marzo de 2026

## Entities

### `PromisePoolOptions`

Configuración de la instancia del pool.

| Campo | Tipo | Requerido | Descripción |
| ----- | ---- | --------- | ----------- |
| `concurrency` | `number` | ✅ | Máximo de tareas simultáneas. Mínimo: 1. |
| `timeout` | `number` | ❌ | Timeout en ms por task. Si se excede, la task falla con `PoolTimeoutError`. |
| `onError` | `(error: Error, taskIndex: number) => void` | ❌ | Callback invocado cuando una task falla. No detiene el pool. |

**Validation rules**:

- `concurrency < 1` → `TypeError("concurrency must be at least 1")`
- `timeout <= 0` → `TypeError("timeout must be a positive number")`

---

### `QueueItem<T>` *(interno)*

Representa una task encolada esperando ejecución.

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `task` | `() => Promise<unknown>` | Factory function de la tarea. |
| `resolve` | `(value: unknown) => void` | Resolver de la promesa de control. |
| `reject` | `(reason: unknown) => void` | Rejecter de la promesa de control. |
| `index` | `number` | Índice original en el array de input (para mantener orden). |

---

### `PromisePool` *(clase)*

Gestor del pool con estado.

| Propiedad | Tipo | Descripción |
| --------- | ---- | ----------- |
| `options` | `PromisePoolOptions` | Configuración inmutable de la instancia. |
| `running` | `number` | Contador de tasks actualmente en ejecución. |
| `queue` | `QueueItem[]` | Cola FIFO de tasks pendientes. |

**State transitions**:

```text
IDLE ──── run(tasks) ──── PROCESSING ──── all tasks done ──── IDLE
                               │
                    task starts │ task ends
                               ▼
                          running++  →  running--  →  dequeue next
```

---

## Error Types

| Error | Cuándo | Tipo |
| ----- | ------ | ---- |
| `TypeError` | `concurrency < 1` o `tasks` no es array | Construcción / `run()` |
| `PoolTimeoutError extends Error` | Task supera `timeout` ms | Durante ejecución |
| Error original de la task | Task rechaza | Re-lanzado via `onError` + reject individual |
