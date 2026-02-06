export class Profiler {
    private stack: { label: string; start: number }[] = [];
    private results: Record<string, Record<string, number>> = {};
    private namespace?: string;

    constructor(namespace?: string) {
        this.namespace = namespace;
    }

    start(label: string) {
        this.stack.push({ label, start: performance.now() });
    }

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
