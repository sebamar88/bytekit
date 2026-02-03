/**
 * QueryClient Basic Usage Example
 * Demonstrates lifecycle callbacks, state management, and cache
 */

import { createApiClient } from "../dist/utils/core/ApiClient.js";
import { createQueryClient } from "../dist/utils/core/QueryClient.js";

// Create API client
const apiClient = createApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
});

// Create QueryClient with global callbacks
const queryClient = createQueryClient(apiClient, {
    defaultStaleTime: 5000, // 5 seconds
    defaultCacheTime: 60000, // 1 minute
    globalCallbacks: {
        onStart: (context) => {
            console.log(`🚀 [${context.method}] ${context.url}`);
        },
        onSuccess: (data, context) => {
            console.log(`✅ [${context.method}] ${context.url} - Success`);
        },
        onError: (error, context) => {
            console.error(
                `❌ [${context.method}] ${context.url} - Error: ${error.message}`
            );
        },
        onSettled: (data, error, context) => {
            const duration = Date.now() - context.timestamp;
            console.log(
                `🏁 [${context.method}] ${context.url} - Completed in ${duration}ms`
            );
        },
    },
});

// Example 1: Basic query
async function example1() {
    console.log("\n=== Example 1: Basic Query ===");

    const user = await queryClient.query({
        queryKey: ["user", "1"],
        path: "/users/1",
    });

    console.log("User data:", user);
}

// Example 2: Query with callbacks
async function example2() {
    console.log("\n=== Example 2: Query with Per-Request Callbacks ===");

    const posts = await queryClient.query({
        queryKey: ["posts"],
        path: "/posts",
        callbacks: {
            onSuccess: (data) => {
                console.log(`📝 Fetched ${data.length} posts`);
            },
        },
    });

    console.log(`Total posts: ${posts.length}`);
}

// Example 3: Cache demonstration
async function example3() {
    console.log("\n=== Example 3: Cache Demonstration ===");

    // First call - will fetch from API
    console.log("First call (from API):");
    await queryClient.query({
        queryKey: ["user", "2"],
        path: "/users/2",
    });

    // Second call - will return from cache
    console.log("\nSecond call (from cache):");
    await queryClient.query({
        queryKey: ["user", "2"],
        path: "/users/2",
    });

    // Check cache stats
    const stats = queryClient.getCacheStats();
    console.log("\nCache stats:", stats);
}

// Example 4: Mutation with invalidation
async function example4() {
    console.log("\n=== Example 4: Mutation with Cache Invalidation ===");

    // First, fetch users
    await queryClient.query({
        queryKey: ["users"],
        path: "/users",
    });

    // Create a new user (mutation)
    const newUser = await queryClient.mutate({
        path: "/users",
        method: "POST",
        body: {
            name: "John Doe",
            email: "john@example.com",
        },
        invalidateQueries: [["users"]], // Invalidate users cache
        callbacks: {
            onSuccess: (data) => {
                console.log("✨ User created:", data);
            },
        },
    });

    console.log("New user ID:", newUser.id);
}

// Example 5: Event listeners
async function example5() {
    console.log("\n=== Example 5: Event Listeners ===");

    // Subscribe to all query success events
    const unsubscribe = queryClient.on("query:success", ({ data, context }) => {
        console.log(`📊 Query succeeded: ${context.url}`);
    });

    // Make some queries
    await queryClient.query({
        queryKey: ["user", "3"],
        path: "/users/3",
    });

    await queryClient.query({
        queryKey: ["posts", "1"],
        path: "/posts/1",
    });

    // Cleanup
    unsubscribe();
}

// Example 6: State management
async function example6() {
    console.log("\n=== Example 6: State Management ===");

    const queryKey = ["user", "4"];

    // Check initial state
    console.log("Initial state:", queryClient.getQueryState(queryKey));

    // Start query (don't await yet)
    const promise = queryClient.query({
        queryKey,
        path: "/users/4",
    });

    // Check loading state
    setTimeout(() => {
        const state = queryClient.getQueryState(queryKey);
        console.log("Loading state:", {
            status: state?.status,
            isLoading: state?.isLoading,
        });
    }, 10);

    // Wait for completion
    await promise;

    // Check success state
    const finalState = queryClient.getQueryState(queryKey);
    console.log("Final state:", {
        status: finalState?.status,
        isSuccess: finalState?.isSuccess,
        hasData: !!finalState?.data,
    });
}

// Example 7: Manual cache manipulation
async function example7() {
    console.log("\n=== Example 7: Manual Cache Manipulation ===");

    const queryKey = ["user", "manual"];

    // Set data manually
    queryClient.setQueryData(queryKey, {
        id: 999,
        name: "Manual User",
        email: "manual@example.com",
    });

    // Get data from cache
    const data = queryClient.getQueryData(queryKey);
    console.log("Manual data:", data);

    // Invalidate
    queryClient.invalidateQueries(queryKey);
    console.log("After invalidation:", queryClient.getQueryState(queryKey));
}

// Run all examples
async function runExamples() {
    try {
        await example1();
        await example2();
        await example3();
        await example4();
        await example5();
        await example6();
        await example7();

        console.log("\n✅ All examples completed successfully!");
    } catch (error) {
        console.error("\n❌ Error running examples:", error);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await runExamples();
}

export { runExamples };
