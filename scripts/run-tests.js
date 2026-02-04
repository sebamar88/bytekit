#!/usr/bin/env node
import { glob } from "glob";
import { spawn } from "child_process";

const testFiles = await glob("tests/*.test.js");

if (testFiles.length === 0) {
    console.error("No test files found");
    process.exit(1);
}

const args = ["--test", ...testFiles];
const proc = spawn("node", args, { stdio: "inherit" });

proc.on("exit", (code) => {
    process.exit(code);
});
