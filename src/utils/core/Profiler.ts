/**
 * Lightweight performance profiler for measuring execution durations.
 *
 * Supports optional namespacing so that results from multiple profiler
 * instances can be distinguished in a shared metrics report.
 *
 * @example
 * ```typescript
 * const profiler = new Profiler('db');
 * profiler.start('query');
 * await runQuery();
 * profiler.end('query');
 * console.log(profiler.summary()); // { db: { query: 12.34 } }
 * ```
 */
export class Profiler {
    private stack: { label: string; start: number }[] = [];
    private results: Record<string, Record<string, number>> = {};
    private namespace?: string;

    /**
     * Creates a new `Profiler` instance.
     *
     * @param namespace - Optional label used to group results in the
     *   {@link Profiler.summary} output. When omitted, results are flat.
     */
    constructor(namespace?: string) {
        this.namespace = namespace;
        /**
         * Returns all recorded durations.
         *
         * When a namespace was provided to the constructor, results are grouped
         * under that key. Without a namespace, a flat `Record<string, number>`
         * is returned for backwards compatibility.
         *
         * @returns A map of label → duration (ms), optionally nested by namespace.
         *
         * @example
         * ```typescript
         * // Without namespace:
         * profiler.summary(); // { query: 12.34, render: 5.67 }
         *
         * // With namespace 'db':
         * profiler.summary(); // { db: { query: 12.34 } }
         * ```
         */
    }

    /**
     * Records the start time for a named measurement.
     *
     * @param label - Unique name for the measurement being started.
     */
    start(label: string) {
        this.stack.push({ label, start: performance.now() });
    }

    /**
     * Records the end time for a named measurement and stores the duration.
     *
     * Uses `performance.now()` for high-resolution timing. Silently ignored
     * when no matching {@link Profiler.start} call exists for `label`.
     *
     * @param label - Name of the measurement to complete.
     *
     * @example
     * ```typescript
     * profiler.start('render');
     * render();
     * profiler.end('render');
     * ```
     */
    end(label: string) {
        // Compatible con ES2020: usar slice().reverse() en lugar de findLast
        const entry = this.stack
            .slice()
            .reverse()
            .find((e: { label: string; start: number }) => e.label === label);
        if (!entry) return;
        const duration = performance.now() - entry.start;
        const key = this.namespace || "_default";
        if (!this.results[key]) {
            this.results[key] = {};
        }
        this.results[key][label] = duration;
    }

    summary() {
        // Si no hay namespace, devolver los resultados planos para mantener compatibilidad
        if (!this.namespace && this.results["_default"]) {
            return this.results["_default"];
        }
        return this.results;
    }
}
