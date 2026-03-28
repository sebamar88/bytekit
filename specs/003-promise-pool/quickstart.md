# Quickstart: PromisePool

**Feature**: `003-promise-pool`  
**Module**: `bytekit/async`

## Installation

```bash
npm install bytekit
```

## Basic Usage — Limit Concurrency

```typescript
import { PromisePool } from "bytekit/async";

const pool = new PromisePool({ concurrency: 3 });

const urls = ["/api/1", "/api/2", "/api/3", "/api/4", "/api/5"];

const results = await pool.run(
  urls.map(url => () => fetch(url).then(r => r.json()))
);
// Maximum 3 fetches run at the same time.
// Results are in the same order as the input array.
console.log(results); // [data1, data2, data3, data4, data5]
```

## With Timeout per Task

```typescript
const pool = new PromisePool({ concurrency: 5, timeout: 3000 });

try {
  const results = await pool.run([
    () => slowApi(),   // if > 3000ms → PoolTimeoutError
    () => fastApi(),
  ]);
} catch (err) {
  console.error(err.name); // "PoolTimeoutError"
}
```

## Isolating Errors (Non-Fatal)

```typescript
const errors: Array<{ index: number; error: Error }> = [];

const pool = new PromisePool({
  concurrency: 4,
  onError: (error, index) => {
    errors.push({ index, error });
  },
});

// Even if some tasks fail, the pool continues executing the rest.
const results = await pool.run(tasks).catch(() => []);
```

## Reuse the Same Instance

```typescript
const pool = new PromisePool({ concurrency: 2 });

// First batch
const batch1 = await pool.run([...tasks1]);

// Second batch — same concurrency config, new execution
const batch2 = await pool.run([...tasks2]);
```

## Differences vs `parallel()`

| | `parallel()` | `PromisePool` |
| - | ------------ | ------------- |
| API | Function | Class (stateful) |
| Error behaviour | Fail-fast (`Promise.all`) | Isolated per task |
| Timeout | ❌ | ✅ per task |
| Reusable | ❌ | ✅ |
| Use case | One-shot execution | Long-lived rate-limiting |

---

## JavaScript (CommonJS) Examples

```javascript
const { PromisePool, PoolTimeoutError } = require("bytekit/async");

// Basic concurrency limit
const pool = new PromisePool({ concurrency: 3 });

pool
  .run([
    () => fetch("/api/1").then((r) => r.json()),
    () => fetch("/api/2").then((r) => r.json()),
    () => fetch("/api/3").then((r) => r.json()),
  ])
  .then((results) => console.log(results))
  .catch(console.error);
```

```javascript
const { PromisePool, PoolTimeoutError } = require("bytekit/async");

// Timeout + onError
const pool = new PromisePool({
  concurrency: 2,
  timeout: 5000,
  onError(error, taskIndex) {
    if (error instanceof PoolTimeoutError) {
      console.warn("Task", taskIndex, "timed out");
    } else {
      console.error("Task", taskIndex, "failed:", error.message);
    }
  },
});

pool
  .run(urls.map((url) => () => fetch(url).then((r) => r.json())))
  .then((results) => console.log(results))
  .catch(console.error);
```

## JavaScript (ESM) Examples

```javascript
import { PromisePool, PoolTimeoutError } from "bytekit/async";

const pool = new PromisePool({ concurrency: 3, timeout: 3000 });

const results = await pool.run(
  files.map((file) => () => uploadFile(file))
);

console.log("Uploaded:", results);
```
