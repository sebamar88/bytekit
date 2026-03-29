/**
 * pipeline-example.ts
 *
 * Demonstrates all Pipeline features: sync composition, async operators,
 * immutability, the builder pattern, and ApiClient integration.
 */
import { pipe, map, filter, reduce, Pipeline } from "bytekit/pipeline";
import { ApiClient } from "bytekit";

// ── Example 1: Sync composition (filter + map + reduce) ───────────────────────

interface Product {
    id: number;
    name: string;
    priceCents: number;
    inStock: boolean;
}

const products: Product[] = [
    { id: 1, name: "Widget A", priceCents: 999, inStock: true },
    { id: 2, name: "Widget B", priceCents: 1499, inStock: false },
    { id: 3, name: "Widget C", priceCents: 599, inStock: true },
    { id: 4, name: "Widget D", priceCents: 2999, inStock: true },
];

const totalRevenuePipeline = pipe(
    filter<Product>((p) => p.inStock),                      // keep in-stock only
    map<Product, number>((p) => p.priceCents),              // extract price
    reduce<number, number>((acc, price) => acc + price, 0)  // sum
);

const totalCents = await totalRevenuePipeline.process(products);
console.log(`Total revenue (in-stock): $${(totalCents / 100).toFixed(2)}`);
// → Total revenue (in-stock): $45.97

// ── Example 2: Immutable builder — reuse base pipeline ────────────────────────

const inStockPipeline = pipe(filter<Product>((p) => p.inStock));

// Extend without mutating base
const namesPipeline = inStockPipeline.pipe(map<Product, string>((p) => p.name));
const pricePipeline = inStockPipeline.pipe(map<Product, number>((p) => p.priceCents / 100));

const names = await namesPipeline.process(products);
const prices = await pricePipeline.process(products);
console.log("In-stock names:", names);   // ["Widget A", "Widget C", "Widget D"]
console.log("In-stock prices:", prices); // [9.99, 5.99, 29.99]

// ── Example 3: Async map (enrichment) ─────────────────────────────────────────

interface Order {
    id: string;
    userId: string;
    amount: number;
}

interface EnrichedOrder extends Order {
    userName: string;
}

// Simulated async lookup
const userNames: Record<string, string> = { u1: "Alice", u2: "Bob" };
const fetchUserName = async (userId: string): Promise<string> =>
    new Promise((res) => setTimeout(() => res(userNames[userId] ?? "Unknown"), 5));

const orders: Order[] = [
    { id: "o1", userId: "u1", amount: 100 },
    { id: "o2", userId: "u2", amount: 200 },
    { id: "o3", userId: "u1", amount: 50 },
];

const enrichPipeline = pipe(
    filter<Order>((o) => o.amount >= 100),               // drop small orders
    map<Order, EnrichedOrder>(async (order) => ({         // enrich concurrently
        ...order,
        userName: await fetchUserName(order.userId),
    }))
);

const enriched = await enrichPipeline.process(orders);
console.log("Enriched orders:", enriched);
// [{ id: "o1", userId: "u1", amount: 100, userName: "Alice" },
//  { id: "o2", userId: "u2", amount: 200, userName: "Bob" }]

// ── Example 4: Async reduce (sequential DB writes) ────────────────────────────

const ids = ["id-1", "id-2", "id-3"];

const deleteAllPipeline = pipe(
    reduce<string, string[]>(
        async (acc, id) => {
            // Sequential: each deletion awaits the previous
            await new Promise<void>((res) => setTimeout(res, 2));
            console.log(`Deleted ${id}`);
            return [...acc, id];
        },
        []
    )
);

const deleted = await deleteAllPipeline.process(ids);
console.log("Deleted:", deleted); // ["id-1", "id-2", "id-3"]

// ── Example 5: Dynamic pipeline construction (runtime builder) ────────────────

type Op = "onlyPositive" | "double" | "stringify";

function buildDynamic(steps: Op[]): Pipeline<number[], unknown> {
    // Start with an identity-like pipeline via Pipeline constructor
    let p: Pipeline<number[], unknown> = new Pipeline([]);

    for (const step of steps) {
        if (step === "onlyPositive") {
            p = p.pipe(filter<number>((n) => n > 0)) as Pipeline<number[], unknown>;
        } else if (step === "double") {
            p = p.pipe(map<number, number>((n) => n * 2)) as Pipeline<number[], unknown>;
        } else if (step === "stringify") {
            p = p.pipe(map<number, string>((n) => `${n}!`)) as Pipeline<number[], unknown>;
        }
    }

    return p;
}

const dynamic = buildDynamic(["onlyPositive", "double", "stringify"]);
const dynResult = await dynamic.process([3, -1, 5]);
console.log("Dynamic:", dynResult); // ["6!", "10!"]

// ── Example 6: ApiClient integration ─────────────────────────────────────────

interface RawProductApi {
    id: number;
    name: string;
    price_cents: number;
    active: boolean;
}

interface ClientProduct {
    id: number;
    name: string;
    price: number;
}

const client = new ApiClient({ baseUrl: "https://api.example.com" });

// The pipeline transforms the raw API shape to the client model automatically.
// Applied after response parsing and validateResponse (if any).
const clientProducts = await client
    .get<RawProductApi[]>("/products", {
        pipeline: pipe(
            filter<RawProductApi>((p) => p.active),
            map<RawProductApi, ClientProduct>((p) => ({
                id: p.id,
                name: p.name,
                price: p.price_cents / 100,
            }))
        ),
    })
    .catch(() => [] as ClientProduct[]); // ignore network error in example

console.log("Client products:", clientProducts);
