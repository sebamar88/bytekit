#!/usr/bin/env node
import { glob } from "glob";
import { spawn } from "child_process";
import path from "path";

const testFiles = await glob("tests/*.test.js");

if (testFiles.length === 0) {
    console.error("No test files found");
    process.exit(1);
}

// Normalize paths for cross-platform compatibility (especially Windows)
const normalizedFiles = testFiles.map((file) => path.normalize(file));

const args = [
    "--reporter=lcov",
    "--reporter=text",
    "--exclude=scripts/**",
    "--exclude=tests/**",
    "--exclude=examples/**",
    "--exclude=node_modules/**",
    "--exclude=src/cli/**",
    "--exclude=dist/cli/**",
    "--include=dist/**",
    "--src=src",
    "--all",
    "node",
    "--test",
    ...normalizedFiles,
];

const proc = spawn("npx", ["c8", ...args], { stdio: "inherit" });

proc.on("error", (error) => {
    console.error("Failed to start test process:", error);
    process.exit(1);
});

proc.on("exit", (code) => {
    process.exit(code ?? 1);
});
