#!/usr/bin/env tsx
/**
 * Test de las mejoras a post/put/patch
 * Ahora soportan body directo y RequestOptions
 */

import { ApiClient } from "../src/utils/core/ApiClient.js";

console.log("🧪 Testing improved post/put/patch signatures\n");
console.log("=".repeat(70));

const client = new ApiClient({
    baseUrl: "https://httpbin.org",
});

const userData = {
    name: "John Doe",
    email: "john@example.com",
    age: 30,
};

// ====================================================
// Test 1: POST con body directo (forma simple)
// ====================================================
console.log("\n✅ Test 1: POST con body directo");
console.log("=".repeat(70));
console.log('Code: client.post("/post", userData)');

try {
    const response = await client.post<any>("/post", userData);
    console.log("✅ Success!");
    console.log("Body recibido:", JSON.stringify(response.json, null, 2));
} catch (error: any) {
    console.log("❌ Error:", error.message);
}

// ====================================================
// Test 2: POST con RequestOptions (forma avanzada)
// ====================================================
console.log("\n✅ Test 2: POST con RequestOptions completo");
console.log("=".repeat(70));
console.log(
    'Code: client.post("/post", { body: userData, searchParams: {...} })'
);

try {
    const response = await client.post<any>("/post", {
        body: userData,
        searchParams: { api_version: "v2" },
    });
    console.log("✅ Success!");
    console.log("URL:", response.url);
    console.log("Body recibido:", JSON.stringify(response.json, null, 2));
} catch (error: any) {
    console.log("❌ Error:", error.message);
}

// ====================================================
// Test 3: PUT con body directo
// ====================================================
console.log("\n✅ Test 3: PUT con body directo");
console.log("=".repeat(70));

try {
    const response = await client.put<any>("/put", { ...userData, age: 31 });
    console.log("✅ Success!");
    console.log("Body recibido:", JSON.stringify(response.json, null, 2));
} catch (error: any) {
    console.log("❌ Error:", error.message);
}

// ====================================================
// Test 4: PATCH con body directo
// ====================================================
console.log("\n✅ Test 4: PATCH con body directo");
console.log("=".repeat(70));

try {
    const response = await client.patch<any>("/patch", { age: 32 });
    console.log("✅ Success!");
    console.log("Body recibido:", JSON.stringify(response.json, null, 2));
} catch (error: any) {
    console.log("❌ Error:", error.message);
}

// ====================================================
// Test 5: POST con objeto que parece RequestOptions
// ====================================================
console.log(
    "\n✅ Test 5: POST con objeto que tiene 'body' como propiedad de datos"
);
console.log("=".repeat(70));
console.log("Caso edge: ¿Qué pasa si tu data tiene un campo llamado 'body'?");

const edgeCaseData = {
    body: "Este es el contenido del mensaje", // campo llamado 'body'
    title: "Mensaje importante",
};

console.log("\nData:", JSON.stringify(edgeCaseData, null, 2));

try {
    // Esto debería enviarse como body directo
    const response = await client.post<any>("/post", edgeCaseData);
    console.log("✅ Success!");
    console.log("Body recibido:", JSON.stringify(response.json, null, 2));

    if (response.json?.body === edgeCaseData.body) {
        console.log(
            "✅ Correcto: 'body' se trató como un campo de datos, no como RequestOptions"
        );
    } else {
        console.log("⚠️  Advertencia: Posible confusión con RequestOptions");
    }
} catch (error: any) {
    console.log("❌ Error:", error.message);
}

// ====================================================
// Test 6: POST con headers personalizados
// ====================================================
console.log("\n✅ Test 6: POST con headers personalizados (RequestOptions)");
console.log("=".repeat(70));

try {
    const response = await client.post<any>("/post", {
        body: userData,
        headers: {
            "X-Custom-Header": "test-value",
            "X-Request-ID": "12345",
        },
    });
    console.log("✅ Success!");
    console.log("Headers enviados:", JSON.stringify(response.headers, null, 2));
} catch (error: any) {
    console.log("❌ Error:", error.message);
}

// ====================================================
// Resumen
// ====================================================
console.log("\n" + "=".repeat(70));
console.log("📊 RESUMEN");
console.log("=".repeat(70));
console.log("\n✅ Ahora soportamos 2 formas:");
console.log("\n1. Body directo (como axios/fetch):");
console.log("   await client.post(path, data)");
console.log("\n2. RequestOptions (para casos avanzados):");
console.log("   await client.post(path, { body: data, headers: {...} })");
console.log("\n💡 La API detecta automáticamente cuál estás usando.");
console.log("\n");
