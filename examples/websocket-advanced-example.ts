import { WebSocketHelper } from "bytekit/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Example 1: Exponential backoff with onReconnect / onMaxRetriesReached
// ─────────────────────────────────────────────────────────────────────────────

export async function example1_smartReconnection() {
    const ws = new WebSocketHelper("wss://api.example.com/stream", {
        reconnect: true,
        maxReconnectAttempts: 8,

        // Exponential backoff: 1s, 2s, 4s, 8s, …, capped at 30s
        reconnectDelayMs: 1000,
        backoffStrategy: "exponential",
        maxReconnectDelayMs: 30000,
        jitter: true, // spread reconnects (AWS Full Jitter) to avoid thundering herd
    });

    // Observe the reconnect lifecycle — no string-matching on error messages needed
    const unsubReconnect = ws.onReconnect((attempt, delay) => {
        console.log(`⟳ Reconnecting… attempt ${attempt} in ${delay}ms`);
    });

    const unsubMaxRetries = ws.onMaxRetriesReached(() => {
        console.error("✗ All reconnect attempts exhausted. Connection permanently lost.");
        // e.g., show a "Reload page" banner to the user
    });

    ws.on("price", (data) => {
        console.log("Price update:", data);
    });

    ws.onError((err) => {
        console.error("Network error:", err.message);
    });

    await ws.connect();
    ws.send("subscribe", { channel: "prices" });

    // Cleanup
    ws.close();
    unsubReconnect();
    unsubMaxRetries();
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 2: Custom backoff function (Fibonacci-style)
// ─────────────────────────────────────────────────────────────────────────────

export async function example2_customBackoff() {
    const fibonacci = [1000, 1000, 2000, 3000, 5000, 8000, 13000];

    const ws = new WebSocketHelper("wss://api.example.com/stream", {
        reconnect: true,
        maxReconnectAttempts: fibonacci.length,
        backoffStrategy: (attempt) =>
            fibonacci[Math.min(attempt - 1, fibonacci.length - 1)],
    });

    ws.onReconnect((attempt, delay) => {
        console.log(`Fibonacci delay: ${delay}ms (attempt ${attempt})`);
    });

    await ws.connect();
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 3: Schema validation with a mock SchemaAdapter
//
// In a real project you would use zodAdapter(schema) or valibotAdapter(schema, parse)
// from "bytekit/core" — both produce a SchemaAdapter that can be used here.
// ─────────────────────────────────────────────────────────────────────────────

export async function example3_schemaValidation() {
    // Minimal mock SchemaAdapter (no external dependencies)
    function strictSchema<T>(validator: (data: unknown) => data is T) {
        return {
            parse(data: unknown): T {
                if (!validator(data)) {
                    throw new Error(`Validation failed: ${JSON.stringify(data)}`);
                }
                return data;
            },
        };
    }

    type Trade = { symbol: string; price: number; quantity: number };
    const tradeSchema = strictSchema<Trade>(
        (d): d is Trade =>
            typeof d === "object" &&
            d !== null &&
            typeof (d as Trade).symbol === "string" &&
            typeof (d as Trade).price === "number" &&
            typeof (d as Trade).quantity === "number"
    );

    const ws = new WebSocketHelper("wss://exchange.example.com/ws", {
        schemas: {
            trade: tradeSchema,
            // Messages with types NOT listed here pass through unvalidated
        },
    });

    // Validation errors come here — the bad message is dropped, session stays alive
    ws.onValidationError((error, rawMessage) => {
        console.error(
            `✗ Invalid "${rawMessage.type}" message:`,
            error.message,
            "\n  Raw data:",
            rawMessage.data
        );
    });

    // Handlers only receive fully-validated data
    ws.on<Trade>("trade", (trade) => {
        console.log(`${trade.symbol} @ ${trade.price} × ${trade.quantity}`);
    });

    await ws.connect();
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 4: Pong detection — detect silent connection drops
// ─────────────────────────────────────────────────────────────────────────────

export async function example4_heartbeatPongDetection() {
    const ws = new WebSocketHelper("wss://api.example.com/stream", {
        heartbeatIntervalMs: 15_000, // ping every 15 s
        heartbeatTimeoutMs: 5_000,   // reconnect if no message within 5 s of ping
        reconnect: true,
        backoffStrategy: "exponential",
        maxReconnectAttempts: 5,
    });

    ws.onReconnect((attempt, delay) => {
        // This fires when heartbeat timeout detects a silent disconnect
        console.log(`Heartbeat timeout — reconnecting (attempt ${attempt}, delay ${delay}ms)`);
    });

    await ws.connect();

    // The server MUST respond with { "type": "pong", "data": {} } (or any message)
    // within heartbeatTimeoutMs of each ping, otherwise the connection is
    // treated as dead and reconnect is triggered automatically.
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 5: All features combined
// ─────────────────────────────────────────────────────────────────────────────

export async function example5_allFeatures() {
    // Simple structural validator (replace with zodAdapter/valibotAdapter in production)
    const priceSchema = {
        parse(data: unknown) {
            const d = data as { pair: string; bid: number; ask: number };
            if (!d.pair || typeof d.bid !== "number") {
                throw new Error("Invalid price update");
            }
            return d;
        },
    };

    const ws = new WebSocketHelper("wss://api.example.com/ws", {
        // Reconnect
        reconnect: true,
        maxReconnectAttempts: 8,
        reconnectDelayMs: 1000,
        backoffStrategy: "exponential",
        maxReconnectDelayMs: 30_000,
        jitter: true,

        // Heartbeat + pong detection
        heartbeatIntervalMs: 20_000,
        heartbeatTimeoutMs: 5_000,

        // Schema validation
        schemas: { price: priceSchema },
    });

    ws.onReconnect((attempt, delay) => {
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${attempt})`);
    });

    ws.onMaxRetriesReached(() => {
        console.error("[WS] Connection permanently lost. Please reload.");
    });

    ws.onValidationError((err, msg) => {
        console.warn(`[WS] Bad "${msg.type}" message:`, err.message);
    });

    ws.on("price", (update) => {
        console.log("Price:", update);
    });

    ws.onError((err) => {
        console.error("[WS] Network error:", err);
    });

    await ws.connect();
    ws.send("subscribe", { channel: "prices" });
}

// Run examples (comment/uncomment as needed)
// example1_smartReconnection();
// example2_customBackoff();
// example3_schemaValidation();
// example4_heartbeatPongDetection();
// example5_allFeatures();
