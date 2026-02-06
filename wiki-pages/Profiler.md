# Profiler

> **Categoría:** Core | **[⬅️ Volver al índice](Home)**

#### Clase `Profiler`

La clase `Profiler` es una solución sencilla para medir tiempos de ejecución mediante etiquetas. Puedes iniciar y finalizar secciones de código y, al finalizar, obtener un resumen de todas las mediciones realizadas.

**Nota sobre `namespace`:** El namespace permite agrupar y aislar mediciones en espacios lógicos separados. Esto es útil cuando trabajas con múltiples componentes o módulos que necesitan mantener sus propias métricas de rendimiento sin interferir con otras. Al crear un `Profiler` con namespace, sus mediciones se almacenan bajo ese namespace, facilitando la lectura y el análisis posterior.

### Características

- **Mediciones etiquetadas**: `start(label)` inicia una medición con la etiqueta indicada y devuelve una función que puedes invocar para detenerla. También puedes llamar a `end(label)` para terminar la última medición con esa etiqueta.
- **Alta precisión**: utiliza `performance.now()` para calcular la diferencia de tiempo con precisión de milisegundos y microsegundos.
- **Resumen agregado**: `summary()` devuelve un array de objetos con la etiqueta, el número de ejecuciones, la duración total y la media. Ideal para imprimir con `console.table`.
- **Agrupación de mediciones**: si repites una etiqueta, el profiler acumula las duraciones para darte estadísticas útiles (suma total y promedio).

### Uso básico

```ts
import { Profiler } from "bytekit";

// crea una instancia del profiler sin namespace
const profiler = new Profiler();

// o con namespace para aislar mediciones
const profileComponentA = new Profiler("component-a");

// mide una operación etiquetada
const finish = profiler.start("carga de datos");
// … código a medir …
finish();

// también puedes iniciar y finalizar con end()
profiler.start("renderizado");
// … código …
profiler.end("renderizado");

// al final obtén el resumen
console.table(profiler.summary());
```

### Namespace en Profiler

El parámetro `namespace` en el constructor es opcional y actúa como identificador para agrupar mediciones:

```ts
// sin namespace, las mediciones se almacenan con la clave "_default"
const globalProfiler = new Profiler();

// con namespace, las mediciones se asocian a ese espacio
const apiProfiler = new Profiler("api");
const dbProfiler = new Profiler("database");

// cada profiler mantiene sus propias mediciones independientes
apiProfiler.start("fetch");
await fetchData();
apiProfiler.end("fetch");

dbProfiler.start("query");
await queryDB();
dbProfiler.end("query");

// al obtener el resumen, ves las mediciones organizadas por namespace
console.log(apiProfiler.summary()); // mediciones del namespace "api"
console.log(dbProfiler.summary()); // mediciones del namespace "database"
```

## Utilidades de temporización (`debug.ts`)

Además de `Profiler`, Bytekit proporciona funciones para medir tiempos de manera granular y con integración opcional con el logger.

### `createStopwatch(options)`

Crea un cronómetro que registra el tiempo transcurrido desde su creación y ofrece métodos para detenerlo y registrar el resultado. Devuelve un objeto con:

- `elapsed()` – devuelve el tiempo transcurrido en milisegundos hasta el momento de la llamada.
- `stop()` – devuelve la duración total y detiene el cronómetro, evitando mediciones posteriores.
- `log(context?)` – si pasas un `logger` y `namespace` en las opciones, registra la duración automáticamente utilizando el logger.

Opciones (`StopwatchOptions`) incluyen:

- `label`: etiqueta para el log.
- `logger`: instancia de `Logger` para registrar la medición.
- `precision`: número de decimales a mostrar (por defecto 2).
- `autoLog`: si es `true`, la medición se registrará al detenerse.
- `namespace`: cadena que se añadirá al namespace del logger para agrupar las mediciones. Si el logger tiene esta capacidad, crea un logger hijo con ese namespace para registros separados.

**Nota sobre namespace en logs:** El parámetro `namespace` interactúa con el logger para crear un contexto jerárquico. Si proporcionas tanto `logger` como `namespace`, el stopwatch usa `logger.child(namespace)` para crear un logger hijo, lo que permite que los logs de esa medición aparezcan bajo un namespace específico en la salida del logger.

Ejemplo:

```ts
const stopwatch = createStopwatch({
    label: "procesamiento",
    logger,
    namespace: "app:heavy-task",
});
doWork();
stopwatch.stop(); // devuelve la duración
stopwatch.log({ id: 123 }); // registra con contexto adicional bajo el namespace "app:heavy-task"
```

### `withTiming(label, fn, options)`

Ejecuta la función `fn` y devuelve su resultado, midiendo el tiempo de ejecución. Si proporcionas un `logger`, registra la duración de manera automática. La función admite tanto funciones sincrónicas como asíncronas. La precisión y el namespace pueden configurarse mediante las opciones.

El parámetro `namespace` en `withTiming` actúa de forma similar a `createStopwatch`: si proporcionas `namespace` junto con `logger`, se crea un logger hijo para que los logs de esa medición aparezcan organizados bajo ese namespace.

```ts
const result = await withTiming("consulta API", () => fetchUser(userId), {
    logger,
    namespace: "app:api", // los logs aparecerán bajo el namespace "app:api"
    precision: 1,
});

// También sin namespace, para logs genéricos
const data = await withTiming("carga datos", () => fetchData(), { logger });
```

### `measureSync` y `measureAsync`

Devuelven un objeto con el resultado de la función y la duración en milisegundos. `measureSync` sirve para funciones sincrónicas, mientras que `measureAsync` sirve para promesas o funciones `async`.

```ts
const { result, ms } = measureSync("suma rápida", () => 1 + 1);
const { result: users, ms: duration } = await measureAsync(
    "carga usuarios",
    () => fetchUsers()
);
```

### `captureDebug`

Función auxiliar que ejecuta `fn`, mide el tiempo y devuelve `{ result, ms }` sin realizar logs. Útil para medir en pruebas o cuando no se quiere contaminar los logs.

## Ejemplo completo

El siguiente fragmento combina las utilidades anteriores para medir tanto tareas sincrónicas como asíncronas, utilizando namespaces para organizar las mediciones y registrar automáticamente con un logger:

```ts
import { createLogger } from "bytekit";
import { createStopwatch, withTiming, measureAsync, Profiler } from "bytekit";

// crea un logger con namespace y nivel
const logger = createLogger({ namespace: "app:perf", level: "info" });

// profiler global para componentes
const componentProfiler = new Profiler("components");

// profiler específico para APIs
const apiProfiler = new Profiler("api");

// mide una operación sincrónica con stopwatch
const watch = createStopwatch({
    label: "cálculo",
    logger,
    namespace: "app:math",
    autoLog: true,
});
realizaCalculoIntensivo();
watch.stop(); // auto-log activado bajo el namespace "app:math"

// mide una llamada asíncrona con namespace de API
await withTiming("fetch usuarios", () => fetchUsers(), {
    logger,
    namespace: "app:api",
});

// usa un profiler específico para APIs
apiProfiler.start("fetch productos");
const productos = await fetchProductos();
apiProfiler.end("fetch productos");

// mide en el profiler de componentes
componentProfiler.start("renderizado");
renderComponent();
componentProfiler.end("renderizado");

// mide y obtiene resultado + duración sin log automático
const { result, durationMs } = await measureAsync(
    "sleep",
    () => new Promise((r) => setTimeout(() => r("ok"), 500))
);

// resume mediciones por namespace
console.table(apiProfiler.summary()); // mediciones del namespace "api"
console.table(componentProfiler.summary()); // mediciones del namespace "components"
```

En el ejemplo:

- El cronómetro se detiene y registra automáticamente bajo el namespace `app:math`.
- `withTiming` genera un log con la etiqueta y duración bajo el namespace `app:api`.
- Los profilers `apiProfiler` y `componentProfiler` acumulan mediciones por namespace para análisis separado.
- El namespace permite organizar y filtrar logs por categoría funcional, facilitando el debugging y el análisis de rendimiento.

## Buenas prácticas y consejos

- Usa `Profiler` con namespace cuando necesites medir múltiples secciones de código en diferentes módulos o componentes con etiquetas repetidas.
- El namespace de `Profiler` (en constructor) aisla completamente las mediciones; cada instancia mantiene su propio conjunto de resultados.
- El namespace en `createStopwatch` y `withTiming` se usa para crear un logger hijo, útil para organizar logs en la salida sin afectar las mediciones.
- Prefiere `createStopwatch` y `withTiming` para mediciones puntuales que necesitan ser registradas en logs con contexto jerárquico.
- Combina namespace en profiler y namespace en logger para obtener visibilidad completa: un profiler por componente y logs organizados por categoría funcional.
- Pasa una instancia de `Logger` con `namespace` para que las mediciones aparezcan integradas en el mismo espacio de nombres y nivel de log.
- Ajusta el parámetro `precision` según la magnitud esperada de tus tareas; para tareas largas bastan 0 o 1 decimales.
- Evita activar `autoLog` si vas a llamar a `stop()` repetidas veces; el cronómetro se invalida después de detenerse.
- En entornos Node y navegador, las utilidades usan `performance.now()` o `Date.now()` dependiendo de la disponibilidad, asegurando alta resolución sin necesidad de dependencias externas.

## Importación

Puedes importar todas las utilidades desde la raíz de Bytekit o desde sus submódulos:

```ts
import {
    Profiler,
    createStopwatch,
    withTiming,
    measureSync,
    measureAsync,
    captureDebug,
} from "bytekit";
```

o bien:

```ts
import { Profiler } from "bytekit/profiler";
import { createStopwatch, withTiming } from "bytekit/utils/core/debug";
```

---

Con estas herramientas tendrás un sistema de medición robusto y flexible para optimizar el rendimiento de tus aplicaciones. Explota la combinación de `Logger` y `Profiler` para obtener visibilidad en tiempo real de los tiempos de ejecución y detectar fácilmente puntos de mejora.
