# Quickstart: Typed Data Pipelines

**Feature**: `006-typed-pipelines`
**Module**: `bytekit/pipeline` | `bytekit`
**Branch**: `006-typed-pipelines`

---

## Install / Import

```typescript
// Named import from root entry
import { pipe, map, filter, reduce } from "bytekit";

// Or from the dedicated sub-entry (tree-shakeable)
import { pipe, map, filter, reduce, Pipeline } from "bytekit/pipeline";
```

---

## US1 — Compose Transformations (sync + async)

### Basic map + filter pipeline

```typescript
import { pipe, map, filter } from "bytekit/pipeline";

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

const pipeline = pipe(
  filter<Product>((p) => p.inStock),          // keep only in-stock items
  map<Product, string>((p) => p.name)         // extract name
);

const names = await pipeline.process(products);
// Type: string[]
```

### pipeline with reduce (aggregation)

```typescript
import { pipe, map, filter, reduce } from "bytekit/pipeline";

const totalRevenue = await pipe(
  filter<Product>((p) => p.inStock),
  map<Product, number>((p) => p.price),
  reduce<number, number>((acc, price) => acc + price, 0)
).process(products);
// Type: number
```

### Reusing and extending pipelines (immutable builder)

```typescript
const base = pipe(
  filter<Product>((p) => p.inStock),
  map<Product, number>((p) => p.price)
);

// base is not mutated
const sumPipeline = base.pipe(reduce<number, number>((a, b) => a + b, 0));
const maxPipeline = base.pipe(reduce<number, number>((a, b) => Math.max(a, b), -Infinity));

const [total, max] = await Promise.all([
  sumPipeline.process(products),
  maxPipeline.process(products),
]);
```

---

## US2 — Async Operators

### Async map (e.g., enriching items with external data)

```typescript
import { pipe, map, filter } from "bytekit/pipeline";

interface Order {
  id: string;
  userId: string;
  amount: number;
}

interface EnrichedOrder extends Order {
  userName: string;
}

async function fetchUserName(userId: string): Promise<string> {
  const res = await fetch(`/api/users/${userId}`);
  const user = await res.json();
  return user.name as string;
}

const pipeline = pipe(
  filter<Order>((o) => o.amount > 100),
  map<Order, EnrichedOrder>(async (order) => ({
    ...order,
    userName: await fetchUserName(order.userId),
  }))
);

const enriched = await pipeline.process(orders);
// Type: EnrichedOrder[] — all async map calls run concurrently
```

### Async filter (e.g., feature flags or remote checks)

```typescript
import { pipe, filter, map } from "bytekit/pipeline";

const pipeline = pipe(
  filter<string>(async (id) => {
    const res = await fetch(`/api/items/${id}/active`);
    return res.ok;
  }),
  map<string, string>((id) => id.toUpperCase())
);

const activeIds = await pipeline.process(allIds);
```

### Async reduce (e.g., sequential DB writes)

```typescript
import { pipe, reduce } from "bytekit/pipeline";

interface WriteResult { id: string; success: boolean }

const pipeline = pipe(
  reduce<string, WriteResult[]>(
    async (acc, id) => {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      return [...acc, { id, success: res.ok }];
    },
    []
  )
);

const results = await pipeline.process(idsToDelete);
// Sequential: each delete awaits the previous
```

---

## US3 — ApiClient Integration

Post-process API responses automatically using a pipeline option on individual requests.

```typescript
import { ApiClient, pipe, map, filter } from "bytekit";

interface RawProduct {
  id: number;
  name: string;
  price_cents: number;
  active: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

const client = new ApiClient({ baseUrl: "https://api.example.com" });

const products = await client.get<RawProduct[]>("/products", {
  pipeline: pipe(
    filter<RawProduct>((p) => p.active),
    map<RawProduct, Product>((p) => ({
      id: p.id,
      name: p.name,
      price: p.price_cents / 100,
    }))
  ),
});
// products is the pipeline output (Product[])
```

---

## Error Handling

Errors thrown inside operators propagate out of `process()`:

```typescript
import { pipe, map } from "bytekit/pipeline";

const pipeline = pipe(
  map<number, number>((n) => {
    if (n < 0) throw new RangeError("Negative value");
    return Math.sqrt(n);
  })
);

try {
  await pipeline.process([4, 9, -1]);
} catch (err) {
  // err is RangeError("Negative value")
}
```

---

## Dynamic / Runtime Pipeline Construction

For cases where operators are added programmatically at runtime:

```typescript
import { Pipeline, map, filter } from "bytekit/pipeline";

function buildPipeline(ops: string[]): Pipeline<number[], unknown> {
  let p: Pipeline<number[], unknown> = new Pipeline([]);

  for (const op of ops) {
    if (op === "double") {
      p = p.pipe(map<number, number>((n) => n * 2)) as Pipeline<number[], unknown>;
    } else if (op === "positiveOnly") {
      p = p.pipe(filter<number>((n) => n > 0)) as Pipeline<number[], unknown>;
    }
  }

  return p;
}

const result = await buildPipeline(["double", "positiveOnly"]).process([1, -2, 3]);
// [2, 6]
```

---

## Type Inference Reference

```typescript
pipe(
  map<number, string>((n) => String(n)),      // PipelineOp<number[], string[]>
  filter<string>((s) => s.length > 1),        // PipelineOp<string[], string[]>
  reduce<string, number>((acc, s) => acc + s.length, 0)  // PipelineOp<string[], number>
)
// Inferred: Pipeline<number[], number>
// process(data: number[]) → Promise<number>
```
