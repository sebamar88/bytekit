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
                "src/index.ts",
                "node_modules/**",
                "dist/**",
                "tests/**",
            ],
            all: true,
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
        setupFiles: ["./tests/setup.ts"],
        testTimeout: 10000,
        hookTimeout: 10000,
        pool: "forks",
        poolOptions: {
            forks: {
                singleFork: false,
            },
        },
    },
    resolve: {
        alias: {
            "#core": resolve(__dirname, "./src/utils/core"),
            "#utils": resolve(__dirname, "./src/utils"),
            "#helpers": resolve(__dirname, "./src/utils/helpers"),
        },
    },
});
