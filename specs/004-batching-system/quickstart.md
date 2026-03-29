# Quickstart: RequestQueue & RequestBatcher

**Feature**: `004-batching-system`  
**Module**: `bytekit/async`

## Installation

```bash
npm install bytekit
```

## Basic Usage — Concurrency-Limited Queue

```typescript
import { RequestQueue } from "bytekit/async";

const queue = new RequestQueue({ concurrency: 3 });

const urls = ["/api/1", "/api/2", "/api/3", "/api/4", "/api/5"];

const results = await Promise.all(
  urls.map((url) =>
    queue.add(() => fetch(url).then((r) => r.json()))
  )
);
// Maximum 3 fetches run at the same time.
// All 5 complete; results in arrival-resolution order.
```

## Priority Lanes

```typescript
const queue = new RequestQueue({ concurrency: 2 });

// High-priority tasks start before normal/low tasks with free slots
queue.add(() => fetchCriticalData(), { priority: "high" });
queue.add(() => fetchAnalytics(), { priority: "low" });
queue.add(() => fetchUser(), { priority: "normal" });

// Execution order: critical → user → analytics
```

## Cancellation

### Cancel a queued task

```typescript
import { RequestQueue, QueueAbortError } from "bytekit/async";

const queue = new RequestQueue({ concurrency: 1 });

// Keep track of the cancel function returned alongside the promise
let cancelSearch!: (id: string) => boolean;

// A helper that records the task id and allows external cancel
function addCancellable<T>(task: (signal: AbortSignal) => Promise<T>) {
  // Note: a real implementation can return the id from add() via metadata;
  // for now, use an AbortController externally:
  const controller = new AbortController();
  const promise = queue.add(task, { signal: controller.signal });
  return { promise, abort: () => controller.abort() };
}

const { promise, abort } = addCancellable((signal) =>
  fetch("/api/search?q=foo", { signal }).then((r) => r.json())
);

// User types something new — cancel the previous search
abort();

try {
  await promise;
} catch (err) {
  if (err instanceof QueueAbortError) {
    console.log("Search cancelled — no stale results");
  }
}
```

### Cancel via external AbortSignal (timeout)

```typescript
const queue = new RequestQueue({ concurrency: 2 });
const controller = new AbortController();

// Cancel all tasks from this controller after 5 seconds
setTimeout(() => controller.abort(), 5000);

const result = await queue.add(
  (signal) => fetch("/api/slow", { signal }).then((r) => r.json()),
  { signal: controller.signal }
);
```

## Error Isolation with `onError`

```typescript
const queue = new RequestQueue({
  concurrency: 3,
  onError(error, id) {
    console.warn(`Task ${id} failed:`, error.message);
    // Queue continues — other tasks are unaffected
  },
});

const results = await Promise.allSettled(
  endpoints.map((url) =>
    queue.add(() => fetch(url).then((r) => r.json()))
  )
);

const succeeded = results.filter((r) => r.status === "fulfilled");
```

## Batching — Coalesce Simultaneous Requests

```typescript
import { RequestBatcher } from "bytekit/async";

const batcher = new RequestBatcher({ windowMs: 100 });

// 5 components call this simultaneously — only 1 fetch fires
async function getUser(id: number) {
  return batcher.add(
    `/api/users/${id}`,
    { method: "GET" },
    (url, init) => fetch(url, init).then((r) => r.json())
  );
}

const [u1, u2, u3] = await Promise.all([getUser(1), getUser(2), getUser(3)]);
```

## Batching with `maxSize` and sliding window

```typescript
const batcher = new RequestBatcher({
  windowMs: 200,
  maxSize: 10,    // flush early when 10 requests accumulate
  sliding: false, // fixed window (default)
});
```

## ApiClient Integration

```typescript
import { ApiClient } from "bytekit";

// Transparent queue — all requests routed through the queue
const api = new ApiClient({
  baseUrl: "https://api.example.com",
  queue: { concurrency: 5 },
});

// All requests respect the concurrency limit automatically
const [users, posts] = await Promise.all([
  api.get("/users"),
  api.get("/posts"),
]);
```

```typescript
// Transparent batching — simultaneous requests to same endpoint coalesce
const api = new ApiClient({
  baseUrl: "https://api.example.com",
  batch: { windowMs: 100 },
});

// These fire simultaneously → 1 actual HTTP request
const [a, b, c] = await Promise.all([
  api.get("/data"),
  api.get("/data"),
  api.get("/data"),
]);
```

## `RequestQueue` vs `PromisePool` vs `parallel()`

| | `parallel()` | `PromisePool` | `RequestQueue` |
|---|---|---|---|
| API | Function (one-shot) | Class (reusable) | Class (reusable) |
| Priority lanes | ❌ | ❌ | ✅ high / normal / low |
| Cancellation | ❌ | ❌ | ✅ per-task |
| Error isolation | ❌ (fail-fast) | ✅ `onError` | ✅ `onError` |
| Observable state | ❌ | ❌ | ✅ `size`, `running`, `pending` |
| `flush()` | ❌ | ❌ | ✅ |
| Use case | One-shot lists | Batch processing | Request orchestration, UI queues |

## JavaScript (CommonJS) Examples

```javascript
const { RequestQueue, RequestBatcher, QueueAbortError } = require("bytekit/async");

const queue = new RequestQueue({ concurrency: 3 });

queue
  .add(() => fetch("/api/data").then((r) => r.json()))
  .then((data) => console.log(data))
  .catch((err) => {
    if (err instanceof QueueAbortError) console.log("Cancelled");
    else console.error(err);
  });
```

## JavaScript (ESM) Examples

```javascript
import { RequestQueue } from "bytekit/async";

const queue = new RequestQueue({ concurrency: 2 });

const result = await queue.add(() =>
  fetch("/api/hello").then((r) => r.json())
);
console.log(result);
```
