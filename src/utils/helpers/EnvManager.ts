/**
 * Isomorphic environment variable accessor.
 *
 * Reads from `import.meta.env` in browser environments (Vite / bundlers)
 * and from `process.env` in Node.js, providing a unified API across runtimes.
 *
 * @example
 * ```typescript
 * const env = new EnvManager();
 * const apiUrl = env.require('API_URL');
 * console.log(env.isProd()); // true in production
 * ```
 */
export class EnvManager {
    private readonly isBrowser = typeof window !== "undefined";

    /**
     * Reads an environment variable by name.
     *
     * @param name - The environment variable name (e.g., `"API_URL"`).
     * @returns The variable's string value, or `undefined` if not set.
     */
    get(name: string): string | undefined {
        if (this.isBrowser) {
            const meta = import.meta as unknown as {
                env: Record<string, string>;
            };
            return meta.env?.[name];
        }
        return process?.env?.[name];
    }

    /**
     * Reads a required environment variable, throwing if absent.
     *
     * @param name - The environment variable name.
     * @returns The variable's string value.
     * @throws {Error} If the variable is not set in the current environment.
     *
     * @example
     * ```typescript
     * const secret = env.require('API_SECRET');
     * ```
     */
    require(name: string): string {
        const value = this.get(name);
        if (!value) throw new Error(`Missing environment variable: ${name}`);
        return value;
    }

    /**
     * Returns `true` when running in production mode.
     *
     * Checks `NODE_ENV` (Node.js) or `MODE` (Vite) for the value
     * `"production"`.
     *
     * @returns `true` if the environment is production, `false` otherwise.
     *
     * @example
     * ```typescript
     * if (env.isProd()) {
     *     logger.setLevel('warn');
     * }
     * ```
     */
    isProd() {
        const mode = this.get("NODE_ENV") || this.get("MODE");
        return mode === "production";
    }
}
