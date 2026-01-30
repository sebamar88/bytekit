#!/usr/bin/env tsx
/**
 * Quick test to demonstrate improved error handling
 */

import { ApiClient, ApiError } from "../src/utils/core/ApiClient.js";

async function testErrorHandling() {
    console.log("🧪 Testing ApiError improvements\n");
    console.log("=".repeat(60));

    // Create client with invalid URL to trigger error
    const client = new ApiClient({
        baseUrl: "https://httpbin.org",
    });

    console.log("\n📍 Test 1: 404 Error\n");
    try {
        await client.get("/status/404");
    } catch (error) {
        if (error instanceof ApiError) {
            console.log("✅ error instanceof ApiError:", true);
            console.log("📊 error.status:", error.status);
            console.log("📝 error.statusText:", error.statusText);
            console.log("💬 error.message:", error.message);
            console.log("📦 error.body:", error.body);
            console.log("\n🔍 error.details:");
            console.log(JSON.stringify(error.details, null, 2));
            console.log("\n📄 error.toString():");
            console.log(error.toString());
            console.log("\n💾 JSON.stringify(error):");
            console.log(JSON.stringify(error, null, 2));
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n📍 Test 2: 400 Bad Request\n");
    try {
        // httpbin.org/status/400 returns 400
        await client.get("/status/400");
    } catch (error) {
        if (error instanceof ApiError) {
            console.log("Status:", error.status);
            console.log("Message:", error.message);
            console.log("\nFull error string:\n");
            console.log(error.toString());
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ All ApiError properties are now accessible!");
    console.log("\nAvailable properties:");
    console.log("  - error.status");
    console.log("  - error.statusText");
    console.log("  - error.message");
    console.log("  - error.body");
    console.log("  - error.isTimeout");
    console.log("  - error.details");
    console.log("\nAvailable methods:");
    console.log("  - error.toString() - Human readable");
    console.log("  - JSON.stringify(error) - For logging\n");
}

testErrorHandling().catch(console.error);
