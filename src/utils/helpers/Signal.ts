/**
 * Signal-based reactive state management
 * Provides fine-grained reactivity without full component re-renders
 * Similar to Preact Signals
 */

// Global context for dependency tracking
let currentComputation: (() => void) | null = null;
let batchDepth = 0;
const batchedUpdates: Set<() => void> = new Set();

/**
 * Core Signal class
 * Holds a reactive value that notifies subscribers on changes
 */
export class Signal<T> {
    protected _value: T;
    protected subscribers: Set<() => void> = new Set();

    constructor(initialValue: T) {
        this._value = initialValue;
    }

    /**
     * Get the current value
     * Automatically subscribes the current computation if any
     */
    get value(): T {
        // Auto-subscribe if there's an active computation
        if (currentComputation) {
            this.subscribers.add(currentComputation);
        }
        return this._value;
    }

    /**
     * Set a new value
     * Notifies all subscribers if the value changed
     */
    set value(newValue: T) {
        if (!Object.is(this._value, newValue)) {
            this._value = newValue;
            this.notify();
        }
    }

    /**
     * Get value without subscribing
     */
    peek(): T {
        return this._value;
    }

    /**
     * Subscribe to changes
     * @returns Unsubscribe function
     */
    subscribe(callback: () => void): () => void {
        this.subscribers.add(callback);
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Notify all subscribers
     */
    protected notify(): void {
        if (batchDepth > 0) {
            // Defer notifications during batch
            this.subscribers.forEach((sub) => batchedUpdates.add(sub));
        } else {
            // Immediate notification
            this.subscribers.forEach((sub) => sub());
        }
    }

    /**
     * Get number of subscribers (for debugging)
     */
    get subscriberCount(): number {
        return this.subscribers.size;
    }
}

/**
 * Computed signal (derived state)
 * Automatically updates when dependencies change
 */
export class Computed<T> extends Signal<T> {
    private compute: () => T;
    private dirty = true;
    private dependencies: Set<() => void> = new Set();

    constructor(compute: () => T) {
        super(undefined as T);
        this.compute = compute;
    }

    /**
     * Get computed value
     * Re-computes if dirty, otherwise returns cached value
     */
    get value(): T {
        if (this.dirty) {
            this.recompute();
        }

        // Subscribe caller to this computed
        if (currentComputation) {
            this.subscribers.add(currentComputation);
        }

        return this._value;
    }

    /**
     * Computed signals are read-only
     */
    set value(_: T) {
        throw new Error("Cannot set value of computed signal");
    }

    /**
     * Recompute the value
     */
    private recompute(): void {
        // Clear old dependencies
        this.dependencies.clear();

        // Track new dependencies
        const prevComputation = currentComputation;
        currentComputation = () => {
            this.dirty = true;
            this.notify();
        };

        // Store cleanup for dependencies
        this.dependencies.add(currentComputation);

        try {
            this._value = this.compute();
            this.dirty = false;
        } finally {
            currentComputation = prevComputation;
        }
    }

    /**
     * Force recomputation
     */
    refresh(): void {
        this.dirty = true;
        this.recompute();
    }
}

/**
 * Effect - runs side effects when dependencies change
 * @param callback Effect callback, can return cleanup function
 * @returns Cleanup function
 */
export function effect(
    callback: () => void | (() => void)
): () => void {
    let cleanup: (() => void) | void;
    let isDisposed = false;

    const execute = () => {
        if (isDisposed) return;

        // Run cleanup from previous execution
        if (cleanup) {
            cleanup();
        }

        // Execute effect
        const prevComputation = currentComputation;
        currentComputation = execute;

        try {
            cleanup = callback();
        } finally {
            currentComputation = prevComputation;
        }
    };

    // Initial execution
    execute();

    // Return dispose function
    return () => {
        isDisposed = true;
        if (cleanup) {
            cleanup();
        }
    };
}

/**
 * Batch multiple signal updates
 * Defers notifications until batch completes
 */
export function batch(callback: () => void): void {
    batchDepth++;
    try {
        callback();
    } finally {
        batchDepth--;
        if (batchDepth === 0) {
            // Execute all batched updates
            const updates = Array.from(batchedUpdates);
            batchedUpdates.clear();
            updates.forEach((update) => update());
        }
    }
}

/**
 * Create a signal
 */
export function signal<T>(initialValue: T): Signal<T> {
    return new Signal(initialValue);
}

/**
 * Create a computed signal
 */
export function computed<T>(compute: () => T): Computed<T> {
    return new Computed(compute);
}

/**
 * Untracked - access signals without subscribing
 */
export function untracked<T>(callback: () => T): T {
    const prevComputation = currentComputation;
    currentComputation = null;
    try {
        return callback();
    } finally {
        currentComputation = prevComputation;
    }
}
