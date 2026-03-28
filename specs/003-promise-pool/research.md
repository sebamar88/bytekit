# Research: Promise Pool con Concurrencia Controlada

**Feature**: `003-promise-pool`  
**Phase**: 0 — Outline & Research  
**Date**: 28 de marzo de 2026

## Decision 1: Clase vs Función

**Decision**: Implementar como clase `PromisePool` con estado interno (cola FIFO + contador `running`).

**Rationale**: La función `parallel()` existente ya cubre el caso stateless (array + concurrencia). `PromisePool` aporta valor diferencial siendo *reutilizable*: una instancia puede ejecutar múltiples `run()` secuenciales sin reinicializar. Además, la clase facilita extensión futura (ej. `pause()`, `drain()`).

**Alternatives considered**:

- Función stateless similar a `parallel()` — descartado por duplicación de API sin valor añadido.
- Ampliar `parallel()` con `onError` — descartado; `parallel()` lanza en el primer error por diseño (semantics `Promise.all`); cambiar eso sería breaking.

---

## Decision 2: Comportamiento ante Errores

**Decision**: Errores en tasks individuales son capturados, notificados via `onError` callback (opcional), y rejectionados en la promesa correspondiente — sin detener el pool.

**Rationale**: El caso de uso principal (rate-limiting de requests HTTP) requiere que un request fallido no bloquee el resto. Contrasta con `parallel()` que falla-rápido.

**Alternatives considered**:

- Fail-fast (como `parallel()`) — descartado; si quisieras eso, ya tienes `parallel()`.
- Swallow errors silenciosamente — descartado; los errores deben ser observables.

---

## Decision 3: Timeout Implementation

**Decision**: Timeout via `Promise.race` con `setTimeout` + `clearTimeout` en `finally`.

**Rationale**: Zero-deps, isomórfico (funciona en Node y browser), no requiere `AbortController` (más complejo). El timer se limpia correctamente incluso si la task completa antes.

**Alternatives considered**:

- `AbortController` — más potente pero añade complejidad y acoplamiento a `fetch`; reservado para `RequestQueue` (feature 004).
- Node.js `timers/promises` — rompe isomorfismo.

---

## Decision 4: Relación con `parallel()`

**Decision**: `PromisePool` es independiente de `parallel()`. No reutiliza su implementación interna.

**Rationale**: `parallel()` usa el patrón de workers (múltiples co-rutinas compitiendo por índices). `PromisePool` usa cola FIFO explícita, que es más predecible para debugging y permite extensión (prioridad futura). Comparten concepto pero difieren en semántica de errores y ciclo de vida.

**Alternatives considered**:

- Delegar a `parallel()` internamente — descartado; `parallel()` falla-rápido, incompatible con semántica de pool.

---

## Decision 5: API de `run()` — tasks como funciones factory

**Decision**: `run(tasks: Array<() => Promise<T>>)` — tasks son **funciones** que retornan promesas, no promesas directamente.

**Rationale**: Las promesas se ejecutan cuando se crean. Pasar `Promise[]` iniciaría todas simultáneamente antes de que el pool pueda controlar la concurrencia. Las factory functions permiten ejecución lazy y controlada.

**Alternatives considered**:

- `run(promises: Promise<T>[])` — descartado; rompe el control de concurrencia.

---

## Resolución de NEEDS CLARIFICATION

Ninguna. El stack técnico es conocido (TypeScript + Vitest + ESM) y la implementación base ya existe.
