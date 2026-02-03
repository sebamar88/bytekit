# Performance Monitoring: Profiler vs withTiming

> **Categoría:** Core | **[⬅️ Volver al índice](Home)**

## 📊 Choosing the Right Tool

Bytekit provides two complementary approaches for performance monitoring:

- **`withTiming`**: Quick, scoped timing for single operations
- **`Profiler`**: Stateful profiler for complex, nested operations

## When to Use `withTiming`

**Prefer `withTiming` when you need:**

✅ **Simple, self-contained measurements** - Single async operation timing  
✅ **Automatic cleanup** - No manual start/end tracking required  
✅ **Integrated logging** - Built-in logger support for immediate output  
✅ **Minimal boilerplate** - Wrap and measure in one call  
✅ **Isolated operations** - No complex call hierarchies to track

### Ideal Scenarios for `withTiming`:

1. **API call monitoring**
2. **Database query timing**
3. **File I/O operations**
4. **Cache operations**
5. **External service requests**
6. **One-off performance checks**

---

## When to Use `Profiler`

**Prefer `Profiler` when you need:**

✅ **Multiple measurements** across different code sections  
✅ **Nested operation tracking** - Parent/child operation hierarchies  
✅ **Aggregated statistics** - Collect all timings and analyze together  
✅ **Manual control** - Explicit start/end calls for flexibility  
✅ **Complex workflows** - Multi-step processes with interdependencies

### Ideal Scenarios for `Profiler`:

1. **Request/response pipelines** (parsing → validation → processing → formatting)
2. **Batch operations** with multiple phases
3. **Nested function calls** requiring granular timing
4. **Performance regression testing**
5. **System-wide performance audits**

---

## API Reference

### Profiler

```ts
class Profiler {
    start(label: string): void;
    end(label: string): void;
    summary(): Record<string, number>;
}
```

### withTiming

```ts
async function withTiming<T>(
    label: string,
    fn: () => Promise<T> | T,
    options?: StopwatchOptions
): Promise<T>;

interface StopwatchOptions {
    label?: string;
    logger?: Logger;
    precision?: number; // decimals in logs (default: 2)
    autoLog?: boolean; // auto-log on stop
    namespace?: string; // logger child namespace
}
```

---

## Examples

### Example 1: `withTiming` for Async Database Query

**Scenario:** Measure a single asynchronous database operation with automatic logging.

```typescript
import { withTiming } from "bytekit/debug";
import { createLogger } from "bytekit/logger";

const logger = createLogger({ level: "debug" });

async function fetchUserData(userId: string) {
    return await withTiming(
        "Database Query: fetchUserById",
        async () => {
            const response = await fetch(
                `https://api.example.com/users/${userId}`
            );
            return await response.json();
        },
        { logger, precision: 3 }
    );
}

// Usage
const userData = await fetchUserData("123");
// Logs: "Database Query: fetchUserById took 245.123ms"
```

**Why `withTiming` here?**

- ✅ Single async operation
- ✅ Automatic timing and logging
- ✅ No need to track start/end manually
- ✅ Clean, readable code

---

### Example 2: `Profiler` for Complex Multi-Step Processing

**Scenario:** Track multiple nested operations in a data processing pipeline.

```typescript
import { Profiler } from "bytekit/profiler";

async function processUserDataPipeline(rawData: string) {
    const profiler = new Profiler();

    // Step 1: Parse data
    profiler.start("parsing");
    const parsed = JSON.parse(rawData);
    profiler.end("parsing");

    // Step 2: Validate
    profiler.start("validation");
    const isValid = await validateData(parsed);
    profiler.end("validation");

    if (isValid) {
        // Step 3: Transform
        profiler.start("transformation");
        const transformed = await transformData(parsed);
        profiler.end("transformation");

        // Step 4: Persist
        profiler.start("database-write");
        await saveToDatabase(transformed);
        profiler.end("database-write");
    }

    // Get complete performance summary
    const stats = profiler.summary();
    console.log("Pipeline Performance:", stats);
    // {
    //   parsing: 12.4,
    //   validation: 45.8,
    //   transformation: 123.6,
    //   "database-write": 234.2
    // }

    return stats;
}
```

**Why `Profiler` here?**

- ✅ Multiple independent measurements
- ✅ Conditional execution paths (if/else)
- ✅ Aggregated summary needed
- ✅ Manual control over timing points

---

### Example 3: `withTiming` for API Request with Error Handling

**Scenario:** Measure API call duration including error cases.

```typescript
import { withTiming } from "bytekit/debug";
import { createLogger } from "bytekit/logger";

const logger = createLogger({ level: "info" });

async function callExternalAPI(endpoint: string, payload: object) {
    try {
        const result = await withTiming(
            `API Call: ${endpoint}`,
            async () => {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return await response.json();
            },
            { logger, namespace: "external-api" }
        );

        return { success: true, data: result };
    } catch (error) {
        logger.error("API call failed", { error, endpoint });
        return { success: false, error };
    }
}

// Usage
await callExternalAPI("https://api.example.com/process", { userId: 123 });
// Logs: "[external-api] API Call: https://api.example.com/process took 523.45ms"
```

**Why `withTiming` here?**

- ✅ Single async operation scope
- ✅ Automatic timing regardless of success/failure
- ✅ Logger integration for structured output
- ✅ Namespace support for log organization

---

### Example 4: Combining Both Approaches

**Scenario:** Use `Profiler` for high-level workflow and `withTiming` for specific async steps.

```typescript
import { Profiler } from "bytekit/profiler";
import { withTiming } from "bytekit/debug";
import { createLogger } from "bytekit/logger";

const logger = createLogger({ level: "debug" });

async function complexDataIngestion(files: string[]) {
    const profiler = new Profiler();

    profiler.start("overall-ingestion");

    // Use withTiming for individual file processing
    const results = [];
    for (const file of files) {
        const data = await withTiming(
            `Process file: ${file}`,
            async () => {
                const content = await readFile(file);
                return await parseAndValidate(content);
            },
            { logger }
        );
        results.push(data);
    }

    // Use Profiler for aggregate operations
    profiler.start("batch-storage");
    await storeBatch(results);
    profiler.end("batch-storage");

    profiler.end("overall-ingestion");

    const stats = profiler.summary();
    logger.info("Ingestion complete", { stats, filesProcessed: files.length });

    return { results, performance: stats };
}
```

**Why combine them?**

- ✅ `withTiming` for granular per-file logging
- ✅ `Profiler` for overall workflow metrics
- ✅ Best of both: automatic + manual control

---

## Comparison Table

| Feature                | `withTiming`      | `Profiler`           |
| ---------------------- | ----------------- | -------------------- |
| **Boilerplate**        | Minimal           | Moderate             |
| **Automatic Cleanup**  | ✅ Yes            | ❌ Manual            |
| **Logger Integration** | ✅ Built-in       | ❌ Manual            |
| **Nested Timing**      | ❌ No             | ✅ Yes               |
| **Aggregated Stats**   | ❌ Single value   | ✅ Full summary      |
| **Error Safety**       | ✅ finally block  | ⚠️ Manual            |
| **Best For**           | Single operations | Multi-step workflows |

---

## Performance Tips

### ✅ Do:

- Use `withTiming` for most async operations (API, DB, I/O)
- Use `Profiler` when you need cross-cutting performance analysis
- Combine both in complex systems (high-level + granular)
- Set appropriate `precision` to reduce log noise

### ❌ Don't:

- Use `Profiler` for simple single operations (overkill)
- Forget to call `end()` in `Profiler` (memory leak)
- Use `withTiming` for nested call hierarchies (loses context)

---

## Installation

```bash
npm install bytekit
```

## Importación

```typescript
// withTiming and debug utilities
import { withTiming, measureAsync, createStopwatch } from "bytekit/debug";

// Profiler
import { Profiler } from "bytekit/profiler";

// Logger for withTiming
import { createLogger } from "bytekit/logger";
```

---

## Related Documentation

- **[📚 Logger](Logger)** - Structured logging for withTiming integration
- **[🏠 Wiki Home](Home)**
- **[📦 Core Modules](Core)**

---

**💡 ¿Encontraste un error o tienes una sugerencia?** [Abre un issue](https://github.com/sebamar88/bytekit/issues) o contribuye al proyecto.
