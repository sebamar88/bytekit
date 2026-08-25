# Gap Analysis: Bytekit vs. Lodash & Radash

**Fecha:** 2026-04-16  
**Versión Bytekit analizada:** 3.1.0  
**Filosofía base:** Zero-Dependency, KISS, TypeScript-first

---

## 1. Inventario actual de Bytekit

### Core (Infraestructura HTTP/API)
| Módulo | Descripción |
|--------|-------------|
| `ApiClient` | Cliente HTTP con reintentos y caché |
| `RetryPolicy` | Políticas de reintento configurable |
| `RequestCache` | Caché de requests |
| `RateLimiter` | Control de tasa de requests |
| `RequestDeduplicator` | Deduplicación de requests simultáneos |
| `ResponseValidator` | Validación de respuestas |
| `ErrorBoundary` | Captura y manejo de errores |
| `SchemaAdapter` | Adaptación de esquemas |
| `Logger` | Logging estructurado |
| `Profiler` | Profiling y métricas |

### Async
| Módulo | Descripción |
|--------|-------------|
| `sleep` | Delay con Promise |
| `timeout / withTimeout` | Timeout en operaciones async |
| `retry` | Reintento con backoff |
| `parallel` | Ejecución paralela limitada |
| `sequential` | Ejecución secuencial |
| `race` | Carrera entre promesas |
| `allSettled` | Espera todas con resultados individuales |
| `debounceAsync` | Debounce para funciones async |
| `throttleAsync` | Throttle para funciones async |
| `PromisePool` | Pool de promesas con concurrencia |
| `RequestQueue` | Cola de requests con prioridades |
| `RequestBatcher` | Batching de requests |
| `Pipeline / pipe / map / filter / reduce` | Pipeline funcional async |

### Helpers
| Módulo | Descripción |
|--------|-------------|
| `CacheManager` | Gestión de caché con TTL |
| `CompressionUtils` | Compresión/descompresión |
| `CryptoUtils` | Hashing y encriptación |
| `DiffUtils` | Diff de estructuras |
| `EnvManager` | Variables de entorno tipadas |
| `EventEmitter` | Evento publisher/subscriber |
| `FileUploadHelper` | Upload de archivos |
| `PollingHelper` | Polling con backoff |
| `StorageUtils` | Abstracción de almacenamiento |
| `StreamingHelper` | Streaming de datos |
| `UrlHelper` | Construcción y parsing de URLs |
| `WebSocketHelper` | Gestión de WebSockets |

---

## 2. Análisis de Lodash 4.x

Lodash agrupa ~300 funciones en estas categorías:

### 2.1 Array
| Función Lodash | Cobertura Bytekit | Prioridad |
|----------------|-------------------|-----------|
| `chunk` | ❌ No existe | Alta |
| `compact` | ❌ No existe | Alta |
| `difference / differenceBy / differenceWith` | ⚠️ `DiffUtils` (estructural) | Media |
| `drop / dropRight / dropWhile` | ❌ No existe | Media |
| `fill` | ❌ No existe | Baja |
| `findIndex / findLastIndex` | ❌ No existe | Alta |
| `flatten / flattenDeep / flattenDepth` | ❌ No existe | Alta |
| `groupBy` | ❌ No existe | **Crítica** |
| `intersection / intersectionBy` | ❌ No existe | Media |
| `keyBy` | ❌ No existe | Alta |
| `orderBy / sortBy` | ❌ No existe | Alta |
| `partition` | ❌ No existe | Alta |
| `take / takeRight / takeWhile` | ❌ No existe | Media |
| `uniq / uniqBy / uniqWith` | ❌ No existe | **Crítica** |
| `union / unionBy` | ❌ No existe | Media |
| `zip / unzip / zipObject` | ❌ No existe | Media |
| `sample / sampleSize / shuffle` | ❌ No existe | Baja |
| `without` | ❌ No existe | Media |
| `xor / xorBy` | ❌ No existe | Baja |

### 2.2 Object
| Función Lodash | Cobertura Bytekit | Prioridad |
|----------------|-------------------|-----------|
| `get / set / has / unset` | ❌ No existe | **Crítica** |
| `pick / pickBy` | ❌ No existe | **Crítica** |
| `omit / omitBy` | ❌ No existe | **Crítica** |
| `merge / mergeWith` | ❌ No existe | Alta |
| `cloneDeep` | ❌ No existe | **Crítica** |
| `mapKeys / mapValues` | ❌ No existe | Alta |
| `defaults / defaultsDeep` | ❌ No existe | Media |
| `assign / assignIn` | ❌ No existe | Media |
| `keys / values / entries` | ❌ Duplica native | Baja |
| `invert` | ❌ No existe | Baja |
| `transform` | ❌ No existe | Baja |
| `toPairs / fromPairs` | ❌ No existe | Media |

### 2.3 String
| Función Lodash | Cobertura Bytekit | Prioridad |
|----------------|-------------------|-----------|
| `camelCase / snakeCase / kebabCase / pascalCase` | ❌ No existe | **Crítica** |
| `capitalize / upperFirst / lowerFirst` | ❌ No existe | Alta |
| `trim / trimStart / trimEnd` | ❌ Duplica native | Baja |
| `truncate` | ❌ No existe | Alta |
| `startsWith / endsWith` | ❌ Duplica native | Baja |
| `pad / padStart / padEnd` | ❌ Duplica native | Baja |
| `repeat` | ❌ Duplica native | Baja |
| `escape / unescape` (HTML) | ❌ No existe | Media |
| `template` | ❌ No existe | Baja |
| `words` | ❌ No existe | Media |

### 2.4 Number
| Función Lodash | Cobertura Bytekit | Prioridad |
|----------------|-------------------|-----------|
| `clamp` | ❌ No existe | Alta |
| `inRange` | ❌ No existe | Media |
| `random` | ❌ No existe | Media |
| `round / ceil / floor` | ❌ Duplica `Math.*` | Baja |

### 2.5 Function
| Función Lodash | Cobertura Bytekit | Prioridad |
|----------------|-------------------|-----------|
| `debounce` (sync) | ⚠️ Solo versión async | **Crítica** |
| `throttle` (sync) | ⚠️ Solo versión async | **Crítica** |
| `memoize` | ⚠️ `CacheManager`/`RequestCache` (HTTP-oriented) | Alta |
| `once` | ❌ No existe | Alta |
| `curry / partial` | ❌ No existe | Media |
| `negate` | ❌ No existe | Media |
| `before / after` | ❌ No existe | Baja |
| `wrap` | ❌ No existe | Baja |

### 2.6 Lang / Type-checking
| Función Lodash | Cobertura Bytekit | Prioridad |
|----------------|-------------------|-----------|
| `isArray / isObject / isString / isNumber / isNil / isEmpty / ...` | ❌ No existe | **Crítica** |
| `isEqual / isEqualWith` | ⚠️ `DiffUtils` (no type-guard) | Alta |
| `castArray` | ❌ No existe | Media |
| `toArray / toNumber / toString` | ❌ No existe | Baja |

### 2.7 Collection
| Función Lodash | Cobertura Bytekit | Prioridad |
|----------------|-------------------|-----------|
| `forEach / map / filter / reduce / find / every / some / includes` | ❌ Duplica native | Baja |
| `countBy` | ❌ No existe | Media |
| `flatMap` | ❌ Duplica native | Baja |
| `invokeMap` | ❌ No existe | Baja |

---

## 3. Análisis de Radash

Radash es una alternativa moderna, TypeScript-first, sin dependencias (~60 funciones).

### 3.1 Gaps de Radash no cubiertos por Bytekit

| Función Radash | Descripción | Prioridad |
|----------------|-------------|-----------|
| `tryit` | Wrapper try/catch funcional → `[error, result]` | **Crítica** |
| `guard` | Guard funcional para async con fallback | **Crítica** |
| `objectify` | Array → Object con key/value mappers | Alta |
| `select` | filter + map en una pasada | Alta |
| `counting` | Contar ocurrencias por valor | Alta |
| `cluster` | Agrupar en chunks de tamaño N | Alta |
| `flat` | Flatten de arrays | Media |
| `intersects` | Intersección de arrays | Media |
| `toggle` | Añadir/quitar elemento de array | Media |
| `diff` | Diferencia entre arrays | Media |
| `alphabetical` | Ordenar por campo string | Media |
| `boil` | Reducir array a elemento extremo | Baja |
| `sum / max / min` | Agregaciones sobre array de objetos | Alta |
| `zipToObject` | Combinar dos arrays en un objeto | Media |
| `listify` | Object → Array con mapper | Media |
| `dash / camel / pascal / snake / title` | Case conversions | **Crítica** |
| `template` | Template strings con objeto | Media |
| `trim` | Trim con custom char | Baja |
| `crush` | Flatten deep de objetos anidados | Alta |
| `construct` | Inverso de crush (reconstruir objeto) | Alta |
| `shake` | Eliminar claves con valor undefined/null | Alta |
| `clone` | Clone shallow de objetos | Alta |
| `assign` | Merge profundo | Media |
| `draw` | Selección aleatoria de array | Baja |
| `iterate` | Iterador n-veces funcional | Media |
| `memo` | Memoization con opciones | Alta |
| `defer` | Defer cleanup pattern | Alta |
| `callable` | Hacer un objeto callable | Baja |
| `uid` | Generación de IDs únicos | Alta |
| `series` | Ejecución async coordinada | ⚠️ Parcial en `sequential` |
| `sleep` | ✅ Ya existe en Bytekit | — |
| `retry` | ✅ Ya existe en Bytekit | — |
| `throttle / debounce` | ⚠️ Solo async en Bytekit | **Crítica** |

---

## 4. Gaps Priorizados (Lista Consolidada)

Criterios de priorización:
- **Frecuencia de uso** en la comunidad (NPM trends, GitHub usage)
- **Bundle size impact** (funciones pequeñas = más impacto por byte)
- **Alineación filosofía** Zero-Dependency/KISS

### Prioridad CRÍTICA — Implementar primero

| # | Gap | Categoría | Justificación |
|---|-----|-----------|---------------|
| 1 | **Type guards** (`isString`, `isNumber`, `isArray`, `isObject`, `isNil`, `isEmpty`, `isDefined`) | Lang | Base de todo tipo-safe code; usados en >80% de codebases TS |
| 2 | **`pick` / `omit`** sobre objetos | Object | Top-3 funciones más usadas en Lodash; tiny footprint |
| 3 | **`get` / `set`** (dot-path access seguro) | Object | Acceso seguro a props anidadas; reduce boilerplate |
| 4 | **`cloneDeep`** | Object | Esencial para inmutabilidad; implementación sin deps posible |
| 5 | **`uniq` / `uniqBy`** | Array | De las funciones más usadas en todo proyecto JS/TS |
| 6 | **`groupBy`** | Array/Collection | Fundamental para renderizado de listas agrupadas |
| 7 | **`tryit` / `guard`** (patrón `[error, result]`) | Error Handling | Radash lo popularizó; elimina try/catch verboso |
| 8 | **`debounce` / `throttle` síncronos** | Function | Versiones sync para event handlers del DOM/UI |
| 9 | **Case conversions** (`camelCase`, `snakeCase`, `kebabCase`, `pascalCase`) | String | Necesarias para serialización API ↔ dominio |
| 10 | **`memoize`** (general-purpose, no HTTP) | Function | CacheManager actual está orientado a HTTP |

### Prioridad ALTA — Segunda iteración

| # | Gap | Categoría | Justificación |
|---|-----|-----------|---------------|
| 11 | `chunk` | Array | Indispensable para paginación y batch processing |
| 12 | `flatten` / `flattenDeep` | Array | Muy común en transformaciones de datos |
| 13 | `orderBy` / `sortBy` | Array | Ordenamiento flexible por múltiples campos |
| 14 | `partition` | Array | Split en dos arrays por predicado |
| 15 | `keyBy` | Array→Object | Indexar colecciones por campo |
| 16 | `merge` (deep) | Object | Merge de configuraciones anidadas |
| 17 | `shake` (eliminar nulos/undefined) | Object | Limpiar objetos antes de enviar a API |
| 18 | `mapValues` / `mapKeys` | Object | Transformar keys/values de un objeto |
| 19 | `once` | Function | Ejecutar función exactamente una vez |
| 20 | `uid` / nanoid-style | String | Generación de IDs sin deps externas |
| 21 | `clamp` | Number | Range clamping para inputs de UI/física |
| 22 | `truncate` | String | Truncado con elipsis para displays |
| 23 | `sum` / `max` / `min` sobre arrays de objetos | Math | Agregaciones comunes sobre colecciones |
| 24 | `countBy` | Collection | Contar ocurrencias por criterio |
| 25 | `defer` (cleanup pattern) | Async | Gestión de recursos con cleanup garantizado |

### Prioridad MEDIA — Backlog planificado

| # | Gap | Categoría |
|---|-----|-----------|
| 26 | `intersection` / `difference` arrays | Array |
| 27 | `zip` / `unzip` / `zipToObject` | Array |
| 28 | `toggle` en arrays | Array |
| 29 | `toPairs` / `fromPairs` | Object |
| 30 | `invert` | Object |
| 31 | `crush` / `construct` (flatten/unflatten de objetos) | Object |
| 32 | `escape` / `unescape` HTML | String |
| 33 | `words` (split en palabras) | String |
| 34 | `capitalize` / `upperFirst` | String |
| 35 | `inRange` | Number |
| 36 | `negate` / `curry` / `partial` | Function |
| 37 | `before` / `after` (fn call guards) | Function |
| 38 | `castArray` | Lang |
| 39 | `objectify` / `listify` | Collection |
| 40 | `select` (filter+map) | Collection |

### Prioridad BAJA — No implementar (duplica native)

- `forEach`, `map`, `filter`, `reduce` — ya en `Array.prototype`
- `keys`, `values`, `entries` — ya en `Object`
- `startsWith`, `endsWith`, `trim`, `padStart`, `padEnd` — ya en `String.prototype`
- `Math.round`, `Math.ceil`, `Math.floor` — ya en `Math`
- `fill`, `repeat`, `template` Lodash — muy low-frequency o niche

---

## 5. Gaps con mayor ROI por Bundle Size

Funciones pequeñas (<1KB minificado) con alto impacto (priorizadas para tree-shakeable exports):

| Función | Size estimado | Impacto |
|---------|--------------|---------|
| `isNil` / `isDefined` | ~50B | Enorme — eliminar `=== null \|\| === undefined` |
| `pick` | ~150B | Muy alto — top usage en Lodash |
| `omit` | ~150B | Muy alto — complementario a `pick` |
| `clamp` | ~80B | Alto — validación inputs |
| `once` | ~100B | Alto — inicialización segura |
| `uniq` | ~120B | Muy alto — limpieza de arrays |
| `chunk` | ~150B | Alto — paginación |
| `tryit` | ~100B | Muy alto — error handling ergonómico |
| `capitalize` | ~80B | Alto — formateo display |
| `uid` | ~200B | Alto — IDs sin deps |

---

## 6. Recomendación de roadmap

### Sprint 1 — Foundations (10 funciones críticas)
Implementar en `/src/utils/core/` o nuevo módulo `/src/utils/data/`:
1. Type guards completos (`isString`, `isNumber`, `isArray`, `isObject`, `isNil`, `isEmpty`, `isDefined`, `isFunction`, `isBoolean`)
2. `pick` / `omit`
3. `get` / `set` con dot-path
4. `cloneDeep` 
5. `uniq` / `uniqBy`
6. `groupBy`
7. `tryit` (patrón `[error, result]`)
8. `debounce` / `throttle` síncronos
9. Case conversions (4 variantes)
10. `memoize` general-purpose

### Sprint 2 — Data Utils (15 funciones alta prioridad)
Arrays: `chunk`, `flatten`, `orderBy`, `partition`, `keyBy`  
Objects: `merge`, `shake`, `mapValues`, `mapKeys`  
Function: `once`, `defer`  
String: `truncate`, `uid`  
Math: `sum`, `min`, `max`, `clamp`, `countBy`

### Sprint 3 — Backlog medio
Funciones de prioridad media según demanda observada en issues del repositorio.

---

## 7. Consideraciones arquitectónicas

1. **Tree-shaking**: Cada función debe ser un archivo individual para máximo tree-shaking. No agrupar en objetos/namespaces.
2. **Nada de dependencias**: Todas las implementaciones deben ser puras TypeScript sin deps externas.
3. **Type-safety**: Tipos strict, sin `any`. Preferir overloads para `get`/`set` con dot-path.
4. **Tests**: 100% cobertura en cada nueva función antes de release.
5. **Estructura sugerida**:
   - `/src/utils/data/` — array + object utils
   - `/src/utils/string/` — string utils
   - `/src/utils/function/` — function utils
   - `/src/utils/lang/` — type guards
   - `/src/utils/math/` — number utils
