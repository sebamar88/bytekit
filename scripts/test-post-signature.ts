#!/usr/bin/env tsx
/**
 * Test para demostrar el problema de la firma de post()
 */

import { ApiClient } from "../src/utils/core/ApiClient.js";

console.log("🧪 Testing ApiClient.post() signature\n");
console.log("=".repeat(70));

const client = new ApiClient({
    baseUrl: "https://httpbin.org",
});

const testData = {
    model: "test-model",
    messages: [{ role: "user", content: "hello" }],
    temperature: 0.1,
};

console.log("\n📝 Test data:");
console.log(JSON.stringify(testData, null, 2));

// ====================================================
// PROBLEMA: Forma intuitiva (como otros HTTP clients)
// ====================================================
console.log("\n" + "=".repeat(70));
console.log("❌ FORMA INTUITIVA (como axios/fetch):");
console.log("=".repeat(70));
console.log("\nCódigo:");
console.log('await client.post("/post", testData)');
console.log("\nQué esperarías: testData se envía como body JSON");
console.log("Qué pasa realmente: testData se trata como RequestOptions");

try {
    const response = await client.post<any>("/post", testData);
    console.log("\n✅ Response OK");
    console.log("Body recibido por httpbin:", response.json);
} catch (error: any) {
    console.log("\n⚠️  Probablemente falló o envió algo inesperado");
    console.log("Error:", error.message);
}

// ====================================================
// SOLUCIÓN ACTUAL: Usar options.body
// ====================================================
console.log("\n" + "=".repeat(70));
console.log("✅ FORMA CORRECTA ACTUAL (usando options):");
console.log("=".repeat(70));
console.log("\nCódigo:");
console.log('await client.post("/post", { body: testData })');
console.log("\nQué pasa: testData se envía correctamente como JSON");

try {
    const response = await client.post<any>("/post", { body: testData });
    console.log("\n✅ Response OK");
    console.log("Body enviado:", JSON.stringify(response.json, null, 2));
    console.log("\n✅ Funciona correctamente!");
} catch (error: any) {
    console.log("\n❌ Error:", error.message);
}

// ====================================================
// RECOMENDACIÓN
// ====================================================
console.log("\n" + "=".repeat(70));
console.log("💡 RECOMENDACIÓN: Sobrecarga de firma");
console.log("=".repeat(70));
console.log("\nDeberían funcionar AMBAS formas:");
console.log(
    "  1. post(path, body)           // Para compatibilidad con axios/fetch"
);
console.log("  2. post(path, options)        // Para casos avanzados");
console.log("\nEjemplo de firma mejorada:");
console.log(`
async post<T>(path: string, bodyOrOptions?: unknown | RequestOptions): Promise<T> {
  // Si bodyOrOptions tiene propiedades de RequestOptions (searchParams, headers, etc.)
  // tratarlo como options, sino como body
  const options = isRequestOptions(bodyOrOptions) 
    ? bodyOrOptions 
    : { body: bodyOrOptions };
  
  return this.request<T>(path, { ...options, method: "POST" });
}
`);
console.log("\n");
