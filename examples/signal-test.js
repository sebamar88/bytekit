/**
 * Signal System - Basic Usage Examples
 * Framework-agnostic signal demonstration
 */

import { signal, computed, effect, batch } from "../dist/utils/helpers/Signal.js";
import { strict as assert } from "node:assert";

console.log("🧪 Testing Signal System...\n");

// Test 1: Basic Signal
console.log("📝 Test 1: Basic Signal");
try {
    const count = signal(0);
    
    assert.equal(count.value, 0, "Initial value should be 0");
    
    count.value = 5;
    assert.equal(count.value, 5, "Value should update to 5");
    
    console.log("✅ Basic signal works");
} catch (error) {
    console.error("❌ Basic signal failed:", error.message);
    process.exit(1);
}

// Test 2: Signal Subscriptions
console.log("\n📝 Test 2: Signal Subscriptions");
try {
    const count = signal(0);
    let notificationCount = 0;
    
    const unsubscribe = count.subscribe(() => {
        notificationCount++;
    });
    
    count.value = 1;
    count.value = 2;
    count.value = 3;
    
    assert.equal(notificationCount, 3, "Should receive 3 notifications");
    
    unsubscribe();
    count.value = 4;
    
    assert.equal(notificationCount, 3, "Should not receive notification after unsubscribe");
    
    console.log("✅ Subscriptions work correctly");
} catch (error) {
    console.error("❌ Subscriptions failed:", error.message);
    process.exit(1);
}

// Test 3: Computed Signals
console.log("\n📝 Test 3: Computed Signals");
try {
    const count = signal(5);
    const double = computed(() => count.value * 2);
    
    assert.equal(double.value, 10, "Computed should be 10");
    
    count.value = 10;
    assert.equal(double.value, 20, "Computed should auto-update to 20");
    
    console.log("✅ Computed signals work correctly");
} catch (error) {
    console.error("❌ Computed signals failed:", error.message);
    process.exit(1);
}

// Test 4: Nested Computed
console.log("\n📝 Test 4: Nested Computed");
try {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.value + b.value);
    const product = computed(() => sum.value * 2);
    
    assert.equal(sum.value, 5, "Sum should be 5");
    assert.equal(product.value, 10, "Product should be 10");
    
    a.value = 5;
    assert.equal(sum.value, 8, "Sum should update to 8");
    assert.equal(product.value, 16, "Product should update to 16");
    
    console.log("✅ Nested computed signals work correctly");
} catch (error) {
    console.error("❌ Nested computed failed:", error.message);
    process.exit(1);
}

// Test 5: Effects
console.log("\n📝 Test 5: Effects");
try {
    const count = signal(0);
    let effectRuns = 0;
    let lastValue = -1;
    
    const dispose = effect(() => {
        effectRuns++;
        lastValue = count.value;
    });
    
    assert.equal(effectRuns, 1, "Effect should run immediately");
    assert.equal(lastValue, 0, "Effect should see initial value");
    
    count.value = 5;
    assert.equal(effectRuns, 2, "Effect should run on change");
    assert.equal(lastValue, 5, "Effect should see new value");
    
    dispose();
    count.value = 10;
    assert.equal(effectRuns, 2, "Effect should not run after dispose");
    
    console.log("✅ Effects work correctly");
} catch (error) {
    console.error("❌ Effects failed:", error.message);
    process.exit(1);
}

// Test 6: Effect Cleanup
console.log("\n📝 Test 6: Effect Cleanup");
try {
    const count = signal(0);
    let cleanupCalls = 0;
    
    const dispose = effect(() => {
        void count.value; // Access to track dependency
        return () => {
            cleanupCalls++;
        };
    });
    
    count.value = 1;
    assert.equal(cleanupCalls, 1, "Cleanup should run before re-execution");
    
    count.value = 2;
    assert.equal(cleanupCalls, 2, "Cleanup should run again");
    
    dispose();
    assert.equal(cleanupCalls, 3, "Cleanup should run on dispose");
    
    console.log("✅ Effect cleanup works correctly");
} catch (error) {
    console.error("❌ Effect cleanup failed:", error.message);
    process.exit(1);
}

// Test 7: Batch Updates
console.log("\n📝 Test 7: Batch Updates");
try {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);
    let notificationCount = 0;
    
    sum.subscribe(() => {
        notificationCount++;
    });
    
    // Without batch - 2 notifications
    a.value = 5;
    b.value = 10;
    assert.equal(notificationCount, 2, "Should receive 2 notifications without batch");
    
    // With batch - 1 notification
    batch(() => {
        a.value = 20;
        b.value = 30;
    });
    assert.equal(notificationCount, 3, "Should receive only 1 more notification with batch");
    assert.equal(sum.value, 50, "Sum should be correct after batch");
    
    console.log("✅ Batch updates work correctly");
} catch (error) {
    console.error("❌ Batch updates failed:", error.message);
    process.exit(1);
}

// Test 8: Peek (read without subscribing)
console.log("\n📝 Test 8: Peek");
try {
    const count = signal(5);
    let effectRuns = 0;
    
    effect(() => {
        count.peek(); // Read without subscribing
        effectRuns++;
    });
    
    assert.equal(effectRuns, 1, "Effect should run once initially");
    
    count.value = 10;
    assert.equal(effectRuns, 1, "Effect should not run again (peek doesn't subscribe)");
    
    console.log("✅ Peek works correctly");
} catch (error) {
    console.error("❌ Peek failed:", error.message);
    process.exit(1);
}

// Test 9: No unnecessary updates
console.log("\n📝 Test 9: No Unnecessary Updates");
try {
    const count = signal(5);
    let notificationCount = 0;
    
    count.subscribe(() => {
        notificationCount++;
    });
    
    count.value = 5; // Same value
    assert.equal(notificationCount, 0, "Should not notify for same value");
    
    count.value = 10; // Different value
    assert.equal(notificationCount, 1, "Should notify for different value");
    
    console.log("✅ No unnecessary updates");
} catch (error) {
    console.error("❌ Unnecessary updates test failed:", error.message);
    process.exit(1);
}

// Test 10: Complex dependency graph
console.log("\n📝 Test 10: Complex Dependency Graph");
try {
    const firstName = signal("John");
    const lastName = signal("Doe");
    const fullName = computed(() => `${firstName.value} ${lastName.value}`);
    const greeting = computed(() => `Hello, ${fullName.value}!`);
    
    assert.equal(greeting.value, "Hello, John Doe!");
    
    firstName.value = "Jane";
    assert.equal(greeting.value, "Hello, Jane Doe!");
    
    batch(() => {
        firstName.value = "Bob";
        lastName.value = "Smith";
    });
    assert.equal(greeting.value, "Hello, Bob Smith!");
    
    console.log("✅ Complex dependency graph works correctly");
} catch (error) {
    console.error("❌ Complex dependency graph failed:", error.message);
    process.exit(1);
}

// All tests passed
console.log("\n🎉 All signal tests passed successfully!");
console.log("\n📊 Summary:");
console.log("  - Basic signals: ✅");
console.log("  - Subscriptions: ✅");
console.log("  - Computed signals: ✅");
console.log("  - Nested computed: ✅");
console.log("  - Effects: ✅");
console.log("  - Effect cleanup: ✅");
console.log("  - Batch updates: ✅");
console.log("  - Peek (untracked): ✅");
console.log("  - No unnecessary updates: ✅");
console.log("  - Complex dependencies: ✅");
