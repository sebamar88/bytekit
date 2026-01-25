/**
 * Event emitter for pub/sub pattern
 * Framework-agnostic event system
 */

export type EventListener<T = unknown> = (data: T) => void | Promise<void>;
export type EventListenerWithError<T = unknown> = (
    data: T,
    error?: Error
) => void | Promise<void>;

export interface EventEmitterOptions {
    maxListeners?: number;
    captureRejections?: boolean;
}

/**
 * Event emitter for pub/sub communication
 */
export class EventEmitter<
    Events extends Record<string, unknown> = Record<string, unknown>
> {
    private eventMap: Map<string, Set<EventListener>> = new Map();
    private onceMap: Map<string, Set<EventListener>> = new Map();
    private maxListeners: number;
    private captureRejections: boolean;
    private errorHandlers: Set<EventListenerWithError> = new Set();

    constructor(options: EventEmitterOptions = {}) {
        this.maxListeners = options.maxListeners ?? 10;
        this.captureRejections = options.captureRejections ?? false;
    }

    /**
     * Register event listener
     */
    on<K extends keyof Events>(
        event: K,
        listener: EventListener<Events[K]>
    ): this {
        if (!this.eventMap.has(event as string)) {
            this.eventMap.set(event as string, new Set());
        }

        const handlers = this.eventMap.get(event as string)!;
        if (handlers.size >= this.maxListeners) {
            console.warn(
                `MaxListenersExceededWarning: ${
                    handlers.size + 1
                } listeners added for event "${String(event)}"`
            );
        }

        handlers.add(listener as EventListener);
        return this;
    }

    /**
     * Register one-time event listener
     */
    once<K extends keyof Events>(
        event: K,
        listener: EventListener<Events[K]>
    ): this {
        if (!this.onceMap.has(event as string)) {
            this.onceMap.set(event as string, new Set());
        }

        const onceListener: any = async (data: unknown) => {
            await listener(data as Events[K]);
            this.off(event, onceListener);
        };

        // Attach original listener to allow removal by off()
        onceListener._originalListener = listener;

        if (!this.onceMap.has(event as string)) {
            this.onceMap.set(event as string, new Set());
        }
        this.onceMap.get(event as string)!.add(onceListener);

        return this.on(event, onceListener);
    }

    /**
     * Remove event listener
     */
    off<K extends keyof Events>(
        event: K,
        listener: EventListener<Events[K]>
    ): this {
        const handlers = this.eventMap.get(event as string);
        if (!handlers) return this;

        // Find the listener (either direct or wrapped in once)
        for (const handler of handlers) {
            if (
                handler === listener ||
                (handler as any)._originalListener === listener
            ) {
                handlers.delete(handler);
                break;
            }
        }

        const onceHandlers = this.onceMap.get(event as string);
        if (onceHandlers) {
            for (const handler of onceHandlers) {
                if (
                    handler === listener ||
                    (handler as any)._originalListener === listener
                ) {
                    onceHandlers.delete(handler);
                    break;
                }
            }
        }

        return this;
    }

    /**
     * Remove all listeners for event
     */
    removeAllListeners<K extends keyof Events>(event?: K): this {
        if (event) {
            this.eventMap.delete(event as string);
            this.onceMap.delete(event as string);
        } else {
            this.eventMap.clear();
            this.onceMap.clear();
        }
        return this;
    }

    /**
     * Emit event
     */
    async emit<K extends keyof Events>(
        event: K,
        data: Events[K]
    ): Promise<boolean> {
        const handlers = this.eventMap.get(event as string);
        if (!handlers || handlers.size === 0) {
            return false;
        }

        const promises: Promise<void>[] = [];
        for (const handler of handlers) {
            try {
                const result = handler(data);
                if (result instanceof Promise) {
                    promises.push(result);
                }
            } catch (error) {
                if (this.captureRejections) {
                    this.handleError(error as Error, data);
                } else {
                    throw error;
                }
            }
        }

        if (promises.length > 0) {
            try {
                await Promise.all(promises);
            } catch (error) {
                if (this.captureRejections) {
                    this.handleError(error as Error, data);
                } else {
                    throw error;
                }
            }
        }

        return true;
    }

    /**
     * Emit event synchronously
     */
    emitSync<K extends keyof Events>(event: K, data: Events[K]): boolean {
        const handlers = this.eventMap.get(event as string);
        if (!handlers || handlers.size === 0) {
            return false;
        }

        for (const handler of handlers) {
            try {
                handler(data);
            } catch (error) {
                if (this.captureRejections) {
                    this.handleError(error as Error, data);
                } else {
                    throw error;
                }
            }
        }

        return true;
    }

    /**
     * Register error handler
     */
    onError(listener: EventListenerWithError): this {
        this.errorHandlers.add(listener);
        return this;
    }

    /**
     * Handle error
     */
    private handleError(error: Error, data: unknown): void {
        for (const handler of this.errorHandlers) {
            try {
                handler(data, error);
            } catch {
                // Ignore errors in error handlers
            }
        }
    }

    /**
     * Get listener count for event
     */
    listenerCount<K extends keyof Events>(event: K): number {
        const handlers = this.eventMap.get(event as string);
        return handlers ? handlers.size : 0;
    }

    /**
     * Get all listeners for event
     */
    getListeners<K extends keyof Events>(event: K): EventListener<Events[K]>[] {
        const handlers = this.eventMap.get(event as string);
        return handlers
            ? (Array.from(handlers) as EventListener<Events[K]>[])
            : [];
    }

    /**
     * Get all event names
     */
    eventNames(): (keyof Events)[] {
        return Array.from(this.eventMap.keys()) as (keyof Events)[];
    }

    /**
     * Set max listeners
     */
    setMaxListeners(n: number): this {
        this.maxListeners = n;
        return this;
    }

    /**
     * Get max listeners
     */
    getMaxListeners(): number {
        return this.maxListeners;
    }
}

/**
 * Factory function for creating event emitters
 */
export function createEventEmitter<
    Events extends Record<string, unknown> = Record<string, unknown>
>(options?: EventEmitterOptions): EventEmitter<Events> {
    return new EventEmitter(options);
}
