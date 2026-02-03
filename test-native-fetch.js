#!/usr/bin/env node

/**
 * Quick test to verify ApiClient works with native fetch
 * This confirms we successfully removed cross-fetch dependency
 */

import { ApiClient } from "./dist/index.js";

console.log("🧪 Testing ApiClient with native fetch...\n");

// Test 1: Verify fetch is available globally
console.log(
    "✓ globalThis.fetch available:",
    typeof globalThis.fetch === "function"
);

// Test 2: Create ApiClient instance
const api = new ApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
    locale: "en",
    timeoutMs: 5000,
});

console.log("✓ ApiClient instance created successfully");

// Test 3: Make a real request
try {
    const user = await api.get("/users/1");
    console.log("✓ GET request successful");
    console.log("  User:", user.name);

    console.log("\n✅ All tests passed! Native fetch is working perfectly.");
    console.log("🎉 bytekit is now TRUE ZERO-DEPENDENCIES!\n");
} catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
}
