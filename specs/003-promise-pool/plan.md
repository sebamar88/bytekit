# Implementation Plan: Promise Pool con Concurrencia Controlada

**Branch**: `003-promise-pool` | **Date**: 28 de marzo de 2026 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-promise-pool/spec.md`

## Summary

Añadir `PromisePool` — una clase reutilizable con estado que ejecuta arrays de tareas asíncronas respetando un límite de concurrencia configurable. A diferencia de la función `parallel()` existente (sin estado, falla en el primer error), `PromisePool` mantiene una cola FIFO interna, soporta timeout por task, callback `onError` para errores no-fatales, y puede reutilizarse entre múltiples invocaciones. La implementación base ya existe en `src/utils/async/promise-pool.ts`; esta fase formaliza contratos, tests y documentación.

## Technical Context

**Language/Version**: TypeScript 5.x strict, ESM  
**Primary Dependencies**: Ninguna (zero-deps — built-ins: `Promise`, `setTimeout`, `clearTimeout`)  
**Storage**: N/A  
**Testing**: Vitest 3.x  
**Target Platform**: Node.js 18+ y browsers modernos (isomórfico)  
**Project Type**: Library — módulo async dentro de `bytekit/async`  
**Performance Goals**: Overhead mínimo vs `Promise.all`; <1KB gzipped de bundle impact  
**Constraints**: Cero dependencias runtime; compatible ESM tree-shakeable; strict TS sin `any`  
**Scale/Scope**: Módulo standalone; reutilizable en otros módulos (RequestQueue, ApiClient)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
| --------- | ------ | ----- |
| I. Zero-Dependency | ✅ PASS | Solo `Promise`, `setTimeout`, `clearTimeout` built-in |
| II. Framework Agnostic | ✅ PASS | Sin imports de Node.js específicos; isomórfico |
| III. TypeScript-First & ESM Native | ✅ PASS | Strict TS, ESM, tipos exportados, sin `any` |
| IV. High Reliability & 95%+ Coverage | ✅ PASS | Tests requeridos: P1 edge cases, timeout, errores |
| V. Isomorphic & Performance-Oriented | ✅ PASS | Usa solo Web Platform APIs disponibles en ambos entornos |

**Veredicto**: ✅ Sin violaciones. Se puede proceder a Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-promise-pool/
├── plan.md              ✅ Este archivo
├── research.md          ✅ Phase 0 output
├── data-model.md        ✅ Phase 1 output
├── quickstart.md        ✅ Phase 1 output
├── contracts/
│   └── promise-pool.md  ✅ Phase 1 output
└── tasks.md             ✅ Completo
```

### Source Code (repository root)

```text
src/utils/async/
├── promise-pool.ts      ✅ Implementación base (ya creada)
└── index.ts             ✅ Export añadido

tests/
└── async/
    └── promise-pool.test.ts   ⏳ Por crear (Phase 2)
```

**Structure Decision**: Single project — módulo dentro del async toolkit existente. Sin nuevas carpetas de nivel superior.

## Complexity Tracking

No hay violaciones a la constitución. Tabla no aplica.
