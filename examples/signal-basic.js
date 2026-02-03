/**
 * Signal System - Basic Usage Examples
 * Framework-agnostic signal demonstration
 */

import {
    signal,
    computed,
    effect,
    batch,
    untracked,
} from "../dist/utils/helpers/Signal.js";

console.log("🎯 Signal System Examples\n");

// Example 1: Basic Signal
console.log("=== Example 1: Basic Signal ===");
const count = signal(0);
console.log("Initial:", count.value); // 0

count.value = 5;
console.log("After update:", count.value); // 5

// Example 2: Computed Signals
console.log("\n=== Example 2: Computed Signals ===");
const price = signal(100);
const quantity = signal(2);
const total = computed(() => price.value * quantity.value);

console.log("Total:", total.value); // 200

price.value = 150;
console.log("Total after price change:", total.value); // 300

// Example 3: Effects
console.log("\n=== Example 3: Effects ===");
const name = signal("World");

effect(() => {
    console.log(`Hello, ${name.value}!`);
});

name.value = "Signals";
// Logs: "Hello, Signals!"

// Example 4: Batch Updates
console.log("\n=== Example 4: Batch Updates ===");
const firstName = signal("John");
const lastName = signal("Doe");
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

let updateCount = 0;
effect(() => {
    void fullName.value; // Access to track
    updateCount++;
});

console.log("Updates before batch:", updateCount); // 1 (initial)

batch(() => {
    firstName.value = "Jane";
    lastName.value = "Smith";
});

console.log("Updates after batch:", updateCount); // 2 (only one more update)
console.log("Full name:", fullName.value); // "Jane Smith"

// Example 5: Untracked Reads
console.log("\n=== Example 5: Untracked Reads ===");
const counter = signal(0);
let effectRuns = 0;

effect(() => {
    const current = untracked(() => counter.value);
    console.log(`Effect ran (counter is ${current})`);
    effectRuns++;
});

counter.value = 10; // Effect won't run again
console.log("Effect runs:", effectRuns); // Still 1

// Example 6: Complex Dependencies
console.log("\n=== Example 6: Complex Dependencies ===");
const celsius = signal(0);
const fahrenheit = computed(() => (celsius.value * 9) / 5 + 32);
const description = computed(() => {
    const temp = fahrenheit.value;
    if (temp < 32) return "Freezing";
    if (temp < 70) return "Cold";
    if (temp < 90) return "Warm";
    return "Hot";
});

console.log(
    `${celsius.value}°C = ${fahrenheit.value}°F (${description.value})`
);

celsius.value = 25;
console.log(
    `${celsius.value}°C = ${fahrenheit.value}°F (${description.value})`
);

celsius.value = 100;
console.log(
    `${celsius.value}°C = ${fahrenheit.value}°F (${description.value})`
);

console.log("\n✅ All examples completed!");
