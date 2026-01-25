/**
 * Simple test to verify QueryClient works
 */

import { createApiClient } from "../dist/utils/core/ApiClient.js";
import { createQueryClient } from "../dist/utils/core/QueryClient.js";
import { strict as assert } from "node:assert";

console.log("🧪 Testing QueryClient...\n");

// Create instances
const apiClient = createApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
});

const queryClient = createQueryClient(apiClient, {
    defaultStaleTime: 5000,
    defaultCacheTime: 60000,
});

console.log("✅ QueryClient created successfully");

// Test 1: Basic query
console.log("\n📝 Test 1: Basic Query");
try {
    const user = await queryClient.query({
        queryKey: ["user", "1"],
        path: "/users/1",
    });

    assert.ok(user, "User data should exist");
    assert.ok(user.id, "User should have an ID");
    console.log("✅ Basic query works - User ID:", user.id);
} catch (error) {
    console.error("❌ Basic query failed:", error.message);
    process.exit(1);
}

// Test 2: Cache
console.log("\n📝 Test 2: Cache");
try {
    const start1 = Date.now();
    await queryClient.query({
        queryKey: ["user", "2"],
        path: "/users/2",
    });
    const duration1 = Date.now() - start1;

    const start2 = Date.now();
    await queryClient.query({
        queryKey: ["user", "2"],
        path: "/users/2",
    });
    const duration2 = Date.now() - start2;

    console.log(`First call: ${duration1}ms, Second call (cached): ${duration2}ms`);
    assert.ok(duration2 < duration1, "Cached call should be faster");
    console.log("✅ Cache works correctly");
} catch (error) {
    console.error("❌ Cache test failed:", error.message);
    process.exit(1);
}

// Test 3: State management
console.log("\n📝 Test 3: State Management");
try {
    const queryKey = ["user", "3"];

    await queryClient.query({
        queryKey,
        path: "/users/3",
    });

    const state = queryClient.getQueryState(queryKey);
    assert.ok(state, "State should exist");
    assert.equal(state.status, "success", "Status should be success");
    assert.ok(state.isSuccess, "isSuccess should be true");
    assert.ok(!state.isLoading, "isLoading should be false");
    assert.ok(!state.isError, "isError should be false");

    console.log("✅ State management works - Status:", state.status);
} catch (error) {
    console.error("❌ State management test failed:", error.message);
    process.exit(1);
}

// Test 4: Callbacks
console.log("\n📝 Test 4: Lifecycle Callbacks");
try {
    let startCalled = false;
    let successCalled = false;
    let settledCalled = false;

    await queryClient.query({
        queryKey: ["user", "4"],
        path: "/users/4",
        callbacks: {
            onStart: () => {
                startCalled = true;
            },
            onSuccess: () => {
                successCalled = true;
            },
            onSettled: () => {
                settledCalled = true;
            },
        },
    });

    assert.ok(startCalled, "onStart should be called");
    assert.ok(successCalled, "onSuccess should be called");
    assert.ok(settledCalled, "onSettled should be called");

    console.log("✅ Lifecycle callbacks work correctly");
} catch (error) {
    console.error("❌ Callbacks test failed:", error.message);
    process.exit(1);
}

// Test 5: Events
console.log("\n📝 Test 5: Event Emission");
try {
    let eventReceived = false;

    const unsubscribe = queryClient.on("query:success", () => {
        eventReceived = true;
    });

    await queryClient.query({
        queryKey: ["user", "5"],
        path: "/users/5",
    });

    assert.ok(eventReceived, "Event should be received");
    unsubscribe();

    console.log("✅ Event emission works correctly");
} catch (error) {
    console.error("❌ Event test failed:", error.message);
    process.exit(1);
}

// Test 6: Mutation
console.log("\n📝 Test 6: Mutation");
try {
    const newUser = await queryClient.mutate({
        path: "/users",
        method: "POST",
        body: {
            name: "Test User",
            email: "test@example.com",
        },
    });

    assert.ok(newUser, "Mutation should return data");
    console.log("✅ Mutation works - Created user ID:", newUser.id);
} catch (error) {
    console.error("❌ Mutation test failed:", error.message);
    process.exit(1);
}

// Test 7: Cache invalidation
console.log("\n📝 Test 7: Cache Invalidation");
try {
    const queryKey = ["user", "6"];

    await queryClient.query({
        queryKey,
        path: "/users/6",
    });

    let stateBefore = queryClient.getQueryState(queryKey);
    assert.equal(stateBefore.status, "success", "Should be success before invalidation");

    queryClient.invalidateQueries(queryKey);

    let stateAfter = queryClient.getQueryState(queryKey);
    assert.equal(stateAfter.status, "idle", "Should be idle after invalidation");

    console.log("✅ Cache invalidation works correctly");
} catch (error) {
    console.error("❌ Invalidation test failed:", error.message);
    process.exit(1);
}

// Test 8: Manual cache manipulation
console.log("\n📝 Test 8: Manual Cache Manipulation");
try {
    const queryKey = ["manual", "data"];
    const testData = { id: 999, name: "Manual" };

    queryClient.setQueryData(queryKey, testData);

    const retrieved = queryClient.getQueryData(queryKey);
    assert.deepEqual(retrieved, testData, "Retrieved data should match set data");

    console.log("✅ Manual cache manipulation works correctly");
} catch (error) {
    console.error("❌ Manual cache test failed:", error.message);
    process.exit(1);
}

// All tests passed
console.log("\n🎉 All tests passed successfully!");
console.log("\nCache stats:", queryClient.getCacheStats());
