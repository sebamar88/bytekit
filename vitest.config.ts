import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html", "lcov"],
            include: ["src/**/*.ts"],
            exclude: [
                "src/**/*.d.ts",
                "src/**/*.test.ts",
                "src/**/*.spec.ts",
                // Root barrel re-exports (logic-free, no executable statements)
                "src/index.ts",
                "src/api-client.ts",
                "src/debug.ts",
                "src/env-manager.ts",
                "src/file-upload.ts",
                "src/logger.ts",
                "src/profiler.ts",
                "src/response-validator.ts",
                "src/retry-policy.ts",
                "src/storage-utils.ts",
                "src/streaming.ts",
                "src/websocket.ts",
                // Sub-package barrel re-exports (logic-free)
                "src/utils/index.ts",
                "src/utils/core/index.ts",
                "src/utils/helpers/index.ts",
                "src/utils/async/index.ts",
                // Pure TypeScript type/interface definitions — compile to empty JS, no executable code
                "src/utils/async/types.ts",
                // CLI module self-invocation guard (unreachable via test runner)
                "src/cli/index.ts",
                "node_modules/**",
                "dist/**",
                "tests/**",
            ],
            all: true,
            thresholds: {
                lines: 99,
                functions: 97,
                branches: 95,
                statements: 99,
            },
        },
        setupFiles: ["./tests/setup.ts"],
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            "#core": resolve(__dirname, "./src/utils/core"),
            "#utils": resolve(__dirname, "./src/utils"),
            "#helpers": resolve(__dirname, "./src/utils/helpers"),
        },
    },
});
