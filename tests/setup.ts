/**
 * Jest setup file for wiki documentation system tests
 * Configures property-based testing with fast-check
 */

import fc from "fast-check";

// Configure fast-check for property-based testing
fc.configureGlobal({
    numRuns: 100, // Minimum 100 iterations per property test as specified in design
    verbose: true,
    seed: 42, // Reproducible tests
});

// Global test utilities for wiki system
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            toBeValidWikiStructure(): R;
            toPreserveBilingualContent(): R;
        }
    }
}

// Custom matchers for wiki-specific assertions
expect.extend({
    // ... (keep existing)
});

// Polyfill node:assert for vitest compatibility
const assertShim = {
    strictEqual: (a: any, b: any) => expect(a).toBe(b),
    deepStrictEqual: (a: any, b: any) => expect(a).toEqual(b),
    deepEqual: (a: any, b: any) => expect(a).toEqual(b),
    ok: (a: any) => expect(a).toBeTruthy(),
    equal: (a: any, b: any) => expect(a).toBe(b),
    notEqual: (a: any, b: any) => expect(a).not.toBe(b),
    notDeepEqual: (a: any, b: any) => expect(a).not.toEqual(b),
    notStrictEqual: (a: any, b: any) => expect(a).not.toBe(b),
    throws: (fn: () => any, reg?: RegExp | object) =>
        expect(fn).toThrow(reg instanceof RegExp ? reg : undefined),
    rejects: (promise: Promise<any>, reg?: RegExp | object) =>
        expect(promise).rejects.toThrow(
            reg instanceof RegExp ? reg : undefined
        ),
    match: (a: string, b: RegExp) => expect(a).toMatch(b),
    fail: (msg?: string) => {
        throw new Error(msg || "Assertion failed");
    },
};

(globalThis as any).assert = assertShim;

export {};
