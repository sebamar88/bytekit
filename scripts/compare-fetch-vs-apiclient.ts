#!/usr/bin/env tsx
/**
 * Comparación detallada: fetch nativo vs ApiClient
 * Para identificar qué está causando el error
 */

import { ApiClient, ApiError } from "../src/utils/core/ApiClient.js";
import { Logger } from "../src/utils/core/Logger.js";

const API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = "https://api.groq.com/openai/v1";

const REQUEST_BODY = {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "Say hello in JSON" }],
    response_format: { type: "json_object" },
    temperature: 0.1,
};

// =====================================================
// Test 1: fetch nativo (FUNCIONA)
// =====================================================
async function testNativeFetch() {
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TEST 1: fetch nativo");
    console.log("=".repeat(70));

    const url = `${BASE_URL}/chat/completions`;
    const headers = {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
    };
    const body = JSON.stringify(REQUEST_BODY);

    console.log("\n📤 REQUEST:");
    console.log("URL:", url);
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("Body:", body);
    console.log("Body length:", body.length);
    console.log("Body type:", typeof body);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body,
        });

        console.log("\n📥 RESPONSE:");
        console.log("Status:", response.status, response.statusText);
        console.log(
            "Headers:",
            JSON.stringify(
                Object.fromEntries(response.headers.entries()),
                null,
                2
            )
        );

        if (!response.ok) {
            const text = await response.text();
            console.log("❌ Error Body:", text);
            return false;
        }

        const data = await response.json();
        console.log("✅ Success!");
        console.log(
            "Response:",
            data.choices[0].message.content.substring(0, 100)
        );
        return true;
    } catch (error) {
        console.log("❌ Exception:", error);
        return false;
    }
}

// =====================================================
// Test 2: ApiClient SIN logger (para ver el error base)
// =====================================================
async function testApiClientBasic() {
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TEST 2: ApiClient (sin logger)");
    console.log("=".repeat(70));

    const client = new ApiClient({
        baseUrl: BASE_URL,
        defaultHeaders: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
    });

    console.log("\n📤 REQUEST:");
    console.log("baseUrl:", BASE_URL);
    console.log("path:", "/chat/completions");
    console.log("body:", JSON.stringify(REQUEST_BODY, null, 2));

    try {
        const data = await client.post<any>("/chat/completions", REQUEST_BODY);
        console.log("✅ Success!");
        console.log(
            "Response:",
            data.choices[0].message.content.substring(0, 100)
        );
        return true;
    } catch (error) {
        if (error instanceof ApiError) {
            console.log("\n❌ ApiError:");
            console.log("Status:", error.status, error.statusText);
            console.log("Message:", error.message);
            console.log("Body:", JSON.stringify(error.body, null, 2));
            console.log("\nFull details:");
            console.log(error.toString());
        } else {
            console.log("❌ Unknown error:", error);
        }
        return false;
    }
}

// =====================================================
// Test 3: ApiClient CON logger detallado
// =====================================================
async function testApiClientWithLogger() {
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TEST 3: ApiClient (CON logger detallado)");
    console.log("=".repeat(70));

    const logger = new Logger({
        level: "debug",
        pretty: true,
    });

    const client = new ApiClient({
        baseUrl: BASE_URL,
        defaultHeaders: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        logger,
    });

    try {
        const data = await client.post<any>("/chat/completions", REQUEST_BODY);
        console.log("✅ Success!");
        console.log(
            "Response:",
            data.choices[0].message.content.substring(0, 100)
        );
        return true;
    } catch (error) {
        if (error instanceof ApiError) {
            console.log("\n❌ ApiError:");
            console.log(error.toString());
        }
        return false;
    }
}

// =====================================================
// Test 4: ApiClient con body como OPTIONS object
// =====================================================
async function testApiClientWithOptions() {
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TEST 4: ApiClient (body en options.body)");
    console.log("=".repeat(70));

    const client = new ApiClient({
        baseUrl: BASE_URL,
        defaultHeaders: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });

    try {
        const data = await client.post<any>("/chat/completions", {
            body: REQUEST_BODY,
        });
        console.log("✅ Success!");
        return true;
    } catch (error) {
        if (error instanceof ApiError) {
            console.log("❌ Error:", error.status, error.message);
            console.log("Body:", JSON.stringify(error.body, null, 2));
        }
        return false;
    }
}

// =====================================================
// Main
// =====================================================
async function runComparison() {
    if (!API_KEY) {
        console.error("❌ Error: GROQ_API_KEY not set");
        process.exit(1);
    }

    const results = {
        nativeFetch: false,
        apiClientBasic: false,
        apiClientLogger: false,
        apiClientOptions: false,
    };

    results.nativeFetch = await testNativeFetch();
    await sleep(2000);

    results.apiClientBasic = await testApiClientBasic();
    await sleep(2000);

    results.apiClientLogger = await testApiClientWithLogger();
    await sleep(2000);

    results.apiClientOptions = await testApiClientWithOptions();

    // Resumen final
    console.log("\n" + "=".repeat(70));
    console.log("📊 RESUMEN FINAL");
    console.log("=".repeat(70));
    console.log("\n");
    console.log(
        "fetch nativo:              ",
        results.nativeFetch ? "✅ OK" : "❌ FAIL"
    );
    console.log(
        "ApiClient (básico):        ",
        results.apiClientBasic ? "✅ OK" : "❌ FAIL"
    );
    console.log(
        "ApiClient (con logger):    ",
        results.apiClientLogger ? "✅ OK" : "❌ FAIL"
    );
    console.log(
        "ApiClient (body en opts):  ",
        results.apiClientOptions ? "✅ OK" : "❌ FAIL"
    );

    console.log("\n");
    if (!results.apiClientBasic && results.nativeFetch) {
        console.log("🔍 DIAGNÓSTICO:");
        console.log(
            "fetch funciona pero ApiClient falla → hay un bug en bytekit"
        );
        console.log("\nPosibles causas:");
        console.log("  1. Double JSON.stringify() del body");
        console.log("  2. Headers automáticos incorrectos");
        console.log("  3. URL encoding problemático");
        console.log("  4. Interceptors modificando el request");
        console.log(
            "\nRevisa los logs de arriba para comparar los requests exactos.\n"
        );
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

runComparison().catch(console.error);
