import { ApiClient } from "./dist/index.js";

console.log("✅ Testing header handling in ApiClient...\n");

// Mock fetch para capturar los headers
const mockResponses = [];
let callCount = 0;

const mockFetch = async (url, init) => {
    callCount++;
    mockResponses.push({ url, init });

    console.log(`📤 Request #${callCount}:`);
    console.log(`   URL: ${url}`);
    console.log(`   Method: ${init.method}`);
    console.log(`   Headers type: ${typeof init.headers}`);
    console.log(
        `   Headers is Object: ${init.headers && typeof init.headers === "object" && !(init.headers instanceof Headers)}`
    );
    console.log(`   Headers:`, init.headers);
    console.log("");

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// Test 1: Headers con Authorization
console.log("🧪 Test 1: GET request con Authorization header");
const client1 = new ApiClient({
    baseURL: "https://api.groq.com/openai/v1",
    defaultHeaders: {
        Authorization: "Bearer test-key-123",
        "X-Custom": "value",
    },
    fetchImpl: mockFetch,
});

await client1.get("/chat/completions");

// Test 2: POST con Content-Type personalizado
console.log("🧪 Test 2: POST request con Content-Type personalizado");
const client2 = new ApiClient({
    baseURL: "https://api.example.com",
    defaultHeaders: {
        "Content-Type": "text/plain",
    },
    fetchImpl: mockFetch,
});

await client2.post("/data", { text: "hello" });

// Test 3: POST sin Content-Type (debería auto-setearse)
console.log("🧪 Test 3: POST request sin Content-Type (auto-set)");
const client3 = new ApiClient({
    baseURL: "https://api.example.com",
    defaultHeaders: {
        Authorization: "Bearer token",
    },
    fetchImpl: mockFetch,
});

await client3.post("/api/users", { name: "John" });

// Verificaciones
console.log("");
console.log("📊 RESULTADOS:");
console.log("================");

let passed = 0;
let failed = 0;

// Verificar Test 1
const test1Headers = mockResponses[0].init.headers;
if (typeof test1Headers === "object" && !(test1Headers instanceof Headers)) {
    console.log("✅ Test 1: Headers es objeto plano");
    passed++;
} else {
    console.log("❌ Test 1: Headers NO es objeto plano");
    failed++;
}

// Los headers se normalizan a minúsculas (estándar HTTP)
if (test1Headers["authorization"] === "Bearer test-key-123") {
    console.log("✅ Test 1: Authorization header preservado");
    passed++;
} else {
    console.log("❌ Test 1: Authorization header NO preservado");
    console.log("   Esperado: Bearer test-key-123");
    console.log("   Recibido:", test1Headers["authorization"]);
    failed++;
}

// Verificar Test 2
const test2Headers = mockResponses[1].init.headers;
if (test2Headers["content-type"] === "text/plain") {
    console.log("✅ Test 2: Content-Type personalizado respetado");
    passed++;
} else {
    console.log("❌ Test 2: Content-Type personalizado NO respetado");
    console.log("   Esperado: text/plain");
    console.log("   Recibido:", test2Headers["content-type"]);
    failed++;
}

// Verificar Test 3
const test3Headers = mockResponses[2].init.headers;
if (test3Headers["content-type"] === "application/json") {
    console.log("✅ Test 3: Content-Type auto-seteado correctamente");
    passed++;
} else {
    console.log("❌ Test 3: Content-Type NO auto-seteado");
    console.log("   Esperado: application/json");
    console.log("   Recibido:", test3Headers["content-type"]);
    failed++;
}

console.log("");
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log("");

if (failed === 0) {
    console.log(
        "🎉 ¡Todos los tests pasaron! La corrección funciona correctamente."
    );
    process.exit(0);
} else {
    console.log("⚠️  Algunos tests fallaron. Revisar la implementación.");
    process.exit(1);
}
