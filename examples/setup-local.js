#!/usr/bin/env node

/**
 * Setup script for testing examples locally with npm link
 * Run: node examples/setup-local.js
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examples = ["react-app", "vue-app", "svelte-app"];

// Define a secure PATH with only system directories
const securePath = "/usr/local/bin:/usr/bin:/bin";

console.log("🚀 Setting up examples for local testing...\n");

// Step 1: Link bytekit globally
console.log("📦 Linking bytekit globally...");
try {
    execSync("npm link", {
        cwd: join(__dirname, ".."),
        stdio: "inherit",
        env: { ...process.env, PATH: securePath },
    });
    console.log("✅ bytekit linked globally\n");
} catch (error) {
    console.error("❌ Failed to link bytekit");
    process.exit(1);
}

// Step 2: Setup each example
for (const example of examples) {
    const examplePath = join(__dirname, example);

    console.log(`\n📁 Setting up ${example}...`);

    if (!existsSync(examplePath)) {
        console.log(`⚠️  ${example} directory not found, skipping`);
        continue;
    }

    try {
        // Install dependencies
        console.log(`  Installing dependencies...`);
        execSync("npm install", {
            cwd: examplePath,
            stdio: "inherit",
            env: { ...process.env, PATH: securePath },
        });

        // Link bytekit
        console.log(`  Linking bytekit...`);
        execSync("npm link bytekit", {
            cwd: examplePath,
            stdio: "inherit",
            env: { ...process.env, PATH: securePath },
        });

        console.log(`✅ ${example} ready!`);
    } catch (error) {
        console.error(`❌ Failed to setup ${example}`);
    }
}

console.log("\n\n🎉 Setup complete! You can now run:");
console.log("");
examples.forEach((example) => {
    console.log(`  cd examples/${example} && npm run dev`);
});
console.log("");
