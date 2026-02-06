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
    "--test",
    "--test-reporter=spec",
    "--test-reporter-destination=stdout",
    "--test-reporter=junit",
    "--test-reporter-destination=test-report.junit.xml",
    ...normalizedFiles,
];

const proc = spawn("node", args, { stdio: "inherit" });

proc.on("error", (error) => {
    console.error("Failed to start test process:", error);
    process.exit(1);
});

proc.on("exit", (code) => {
    process.exit(code ?? 1);
});
