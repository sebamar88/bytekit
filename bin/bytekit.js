#!/usr/bin/env node
import { runCli } from "../dist/cli/index.js";

runCli(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exit(1);
});
