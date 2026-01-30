#!/usr/bin/env node

import { ApiClient } from "./src/utils/core/ApiClient.ts";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY no está definida");
    process.exit(1);
}

console.log("\n🧪 Testing bytekit headers with Groq API\n");
console.log("================================================");

// Crear el cliente con headers
const client = new ApiClient({
    baseURL: "https://api.groq.com/openai/v1",
    defaultHeaders: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
    },
});

// Interceptor para ver qué headers se están enviando
const clientWithInterceptor = new ApiClient({
    baseURL: "https://api.groq.com/openai/v1",
    defaultHeaders: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
    },
    interceptors: {
        request: (url, init) => {
            console.log("\n📤 Headers being sent:");
            console.log("URL:", url);
            console.log("Headers type:", init.headers?.constructor.name);
            console.log("Headers:", init.headers);

            // Convertir Headers a objeto plano si es necesario
            if (init.headers instanceof Headers) {
                const headersObj = {};
                init.headers.forEach((value, key) => {
                    headersObj[key] = value;
                });
                console.log("Headers as object:", headersObj);
            }

            return [url, init];
        },
    },
});

const testPayload = {
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: 'Say "test successful" in Spanish' }],
    max_tokens: 50,
};

console.log("\n📝 Test without interceptor");
try {
    const response = await client.post("/chat/completions", testPayload);
    console.log("✅ Success:", response);
} catch (error) {
    console.log("❌ Error:", error.message);
    console.log("Status:", error.status);
}

console.log("\n📝 Test with interceptor");
try {
    const response = await clientWithInterceptor.post(
        "/chat/completions",
        testPayload
    );
    console.log("✅ Success:", response);
} catch (error) {
    console.log("❌ Error:", error.message);
    console.log("Status:", error.status);
}

console.log("\n================================================\n");
