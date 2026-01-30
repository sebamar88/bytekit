#!/usr/bin/env node

import { ApiClient } from "bytekit";

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY no está definida");
    console.error(
        "Variables disponibles:",
        Object.keys(process.env).filter((key) => key.includes("GROQ"))
    );
    process.exit(1);
}

console.log("\n🧪 Testing bytekit headers with Groq API\n");
console.log("================================================");

const logger = {
    debug: (msg, ...args) => console.log("[DEBUG]", msg, ...args),
    info: (msg, ...args) => console.log("[INFO]", msg, ...args),
    warn: (msg, ...args) => console.log("[WARN]", msg, ...args),
    error: (msg, ...args) => console.log("[ERROR]", msg, ...args),
};

const client = new ApiClient({
    baseURL: "https://api.groq.com/openai/v1",
    defaultHeaders: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
    },
    logger,
    logHeaders: true,
    disableInterceptors: true,
});

const testPayload = {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: 'Say "test successful" in Spanish' }],
    max_tokens: 50,
};

console.log("\n📝 Test with header logging (interceptors disabled)");
try {
    const response = await client.post("/chat/completions", testPayload, {
        logHeaders: true,
        skipInterceptors: true,
    });
    console.log("✅ Success:", response);
} catch (error) {
    console.log("❌ Error:", error.message);
    console.log("Status:", error.status);
}

console.log("\n================================================\n");
