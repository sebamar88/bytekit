export class Profiler {
    private stack: { label: string; start: number }[] = [];
    private results: Record<string, number> = {};

    start(label: string) {
        this.stack.push({ label, start: performance.now() });
    }

    end(label: string) {
        // Compatible con ES2020: usar slice().reverse() en lugar de findLast
        const entry = this.stack.slice().reverse().find((e: { label: string; start: number }) => e.label === label);
        if (!entry) return;
        const duration = performance.now() - entry.start;
        this.results[label] = duration;
    }

    summary() {
        return this.results;
    }
}
