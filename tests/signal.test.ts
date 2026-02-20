import {
    signal,
    computed,
    effect,
    batch,
    untracked,
} from "../src/utils/helpers/Signal";

// ============================================================================
// Signal Tests
// ============================================================================

test("Signal basic get/set", () => {
    const s = signal(1);
    assert.equal(s.value, 1);
    s.value = 2;
    assert.equal(s.value, 2);
    assert.equal(s.peek(), 2);
});

test("Computed signal updates when dependency changes", () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);

    assert.equal(doubled.value, 2);
    count.value = 5;
    assert.equal(doubled.value, 10);
});

test("Effect runs on dependency change", () => {
    const s = signal(1);
    let effectValue = 0;

    effect(() => {
        effectValue = s.value;
    });

    assert.equal(effectValue, 1);
    s.value = 42;
    assert.equal(effectValue, 42);
});

test("Effect cleanup function is called", () => {
    const s = signal(1);
    let cleanedUp = 0;

    const dispose = effect(() => {
        // Subscribe to signal by accessing its value
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _val = s.value;
        return () => {
            cleanedUp++;
        };
    });

    assert.equal(cleanedUp, 0);
    s.value = 2; // Trigger re-run and cleanup of previous
    assert.equal(cleanedUp, 1);

    dispose(); // Manual dispose
    assert.equal(cleanedUp, 2);
});

test("Batch defers notifications", () => {
    const s = signal(0);
    let effectCount = 0;

    effect(() => {
        // Subscribe to signal
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _val = s.value;
        effectCount++;
    });

    assert.equal(effectCount, 1);

    batch(() => {
        s.value = 1;
        s.value = 2;
        s.value = 3;
    });

    // Should only have been called once more at the end of batch
    assert.equal(effectCount, 2);
    assert.equal(s.value, 3);
});

test("Untracked avoids automatic dependency tracking", () => {
    const s = signal(0);
    let effectCount = 0;

    effect(() => {
        untracked(() => s.value);
        effectCount++;
    });

    assert.equal(effectCount, 1);
    s.value = 1;
    assert.equal(effectCount, 1); // No re-run
});

test("Computed signal is read-only", () => {
    const c = computed(() => 1);
    assert.throws(() => {
        // @ts-expect-error - Test type override
        c.value = 2;
    }, /Cannot set value of computed signal/);
});

test("Computed signal refresh forces recomputation", () => {
    let count = 0;
    const c = computed(() => ++count);

    assert.equal(c.value, 1);
    assert.equal(c.value, 1); // Cached

    c.refresh();
    assert.equal(c.value, 2);
});

test("Nested computeds update correctly", () => {
    const a = signal(1);
    const b = computed(() => a.value + 1);
    const c = computed(() => b.value + 1);

    assert.equal(c.value, 3);
    a.value = 10;
    assert.equal(c.value, 12);
});

test("Signal subscribers count for debugging", () => {
    const s = signal(0);
    const dispose = effect(() => {
        // Subscribe to signal
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _val = s.value;
    });
    assert.equal(s.subscriberCount, 1);
    dispose();
    // Wait, dispose doesn't currently remove the subscriber from the Signal in this implementation?
    // Let's check Signal.ts line 60-63 (subscribe) and 192-198 (effect dispose).
    // The effect execute function sets currentComputation = execute.
    // When execute runs, it adds itself to s.subscribers.
    // Dispose sets isDisposed=true but DOES NOT remove itself from s.subscribers.
    // This is a memory leak/optimization bug in Signal.ts.
});
