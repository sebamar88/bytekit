import type { SchemaAdapter } from "../core/SchemaAdapter.js";

// ── New exported types ────────────────────────────────────────────────────────

export type BackoffStrategy =
    | "linear"
    | "exponential"
    | ((attempt: number) => number);

export type WebSocketReconnectHandler = (
    attempt: number,
    delay: number
) => void;

export type WebSocketMaxRetriesHandler = () => void;

export type WebSocketValidationErrorHandler = (
    error: Error,
    message: WebSocketMessage
) => void;

// ── Existing types (unchanged) ────────────────────────────────────────────────

export interface WebSocketMessage<T = unknown> {
    type: string;
    data: T;
    timestamp?: number;
}

export interface WebSocketOptions {
    // ── Existing options (unchanged defaults) ─────────────────────────────────
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelayMs?: number;
    heartbeatIntervalMs?: number;
    messageTimeout?: number;
    // ── New options ────────────────────────────────────────────────────────────
    backoffStrategy?: BackoffStrategy;
    maxReconnectDelayMs?: number;
    jitter?: boolean;
    heartbeatTimeoutMs?: number;
    schemas?: Record<string, SchemaAdapter>;
}

export type WebSocketEventHandler<T = unknown> = (data: T) => void;
export type WebSocketErrorHandler = (error: Error) => void;

export class WebSocketHelper {
    private ws: WebSocket | null = null;
    private url: string;
    private options: Required<WebSocketOptions>;
    private messageHandlers: Map<string, Set<WebSocketEventHandler>> =
        new Map();
    private errorHandlers: Set<WebSocketErrorHandler> = new Set();
    private reconnectAttempts = 0;
    private heartbeatTimer?: NodeJS.Timeout;
    private isIntentionallyClosed = false;
    private reconnectHandlers: Set<WebSocketReconnectHandler> = new Set();
    private maxRetriesHandlers: Set<WebSocketMaxRetriesHandler> = new Set();
    private validationErrorHandlers: Set<WebSocketValidationErrorHandler> =
        new Set();
    private pongTimeoutTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(url: string, options: WebSocketOptions = {}) {
        this.url = url;
        this.options = {
            reconnect: options.reconnect ?? true,
            maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
            reconnectDelayMs: options.reconnectDelayMs ?? 3000,
            heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30000,
            messageTimeout: options.messageTimeout ?? 5000,
            backoffStrategy: options.backoffStrategy ?? "linear",
            maxReconnectDelayMs: options.maxReconnectDelayMs ?? 30000,
            jitter: options.jitter ?? false,
            heartbeatTimeoutMs: options.heartbeatTimeoutMs ?? 5000,
            schemas: options.schemas ?? {},
        };
    }

    /**
     * Connect to WebSocket
     */
    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = () => {
                    const error = new Error("WebSocket error");
                    this.notifyError(error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    this.stopHeartbeat();
                    if (!this.isIntentionallyClosed && this.options.reconnect) {
                        this.attemptReconnect();
                    }
                };
            } catch (error) {
                reject(
                    error instanceof Error ? error : new Error(String(error))
                );
            }
        });
    }

    /**
     * Send a message
     */
    send<T = unknown>(type: string, data: T): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }

        const message: WebSocketMessage<T> = {
            type,
            data,
            timestamp: Date.now(),
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Subscribe to a message type
     */
    on<T = unknown>(
        type: string,
        handler: WebSocketEventHandler<T>
    ): () => void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }

        this.messageHandlers.get(type)!.add(handler as WebSocketEventHandler);

        // Return unsubscribe function
        return () => {
            const handlers = this.messageHandlers.get(type);
            if (handlers) {
                handlers.delete(handler as WebSocketEventHandler);
            }
        };
    }

    /**
     * Subscribe to errors
     */
    onError(handler: WebSocketErrorHandler): () => void {
        this.errorHandlers.add(handler);
        return () => this.errorHandlers.delete(handler);
    }

    /**
     * Subscribe to reconnect attempts.
     * Fires just before each reconnect delay begins.
     */
    onReconnect(handler: WebSocketReconnectHandler): () => void {
        this.reconnectHandlers.add(handler);
        return () => this.reconnectHandlers.delete(handler);
    }

    /**
     * Subscribe to terminal failure when all reconnect attempts are exhausted.
     */
    onMaxRetriesReached(handler: WebSocketMaxRetriesHandler): () => void {
        this.maxRetriesHandlers.add(handler);
        return () => this.maxRetriesHandlers.delete(handler);
    }

    /**
     * Subscribe to incoming message validation errors.
     * The offending message is dropped (on() handlers are NOT called).
     */
    onValidationError(handler: WebSocketValidationErrorHandler): () => void {
        this.validationErrorHandlers.add(handler);
        return () => this.validationErrorHandlers.delete(handler);
    }

    /**
     * Send a message and wait for response
     */
    async request<TRequest, TResponse>(
        type: string,
        data: TRequest,
        responseType?: string
    ): Promise<TResponse> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                unsubscribe();
                reject(new Error(`Request timeout for type: ${type}`));
            }, this.options.messageTimeout);

            const unsubscribe = this.on<TResponse>(
                responseType || `${type}:response`,
                (response) => {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(response);
                }
            );

            try {
                this.send(type, data);
            } catch (error) {
                clearTimeout(timeout);
                unsubscribe();
                reject(error);
            }
        });
    }

    /**
     * Close connection
     */
    close(): void {
        this.isIntentionallyClosed = true;
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Get connection state
     */
    getState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    private handleMessage(rawData: string): void {
        clearTimeout(this.pongTimeoutTimer);
        this.pongTimeoutTimer = undefined;

        try {
            const message = JSON.parse(rawData) as WebSocketMessage;

            // Schema validation — US2
            const schema = this.options.schemas[message.type];
            if (schema) {
                try {
                    message.data = schema.parse(message.data);
                } catch (error) {
                    this.notifyValidationError(
                        error instanceof Error
                            ? error
                            : new Error(String(error)),
                        message
                    );
                    return; // drop message
                }
            }

            const handlers = this.messageHandlers.get(message.type);

            if (handlers) {
                handlers.forEach((handler) => {
                    try {
                        handler(message.data);
                    } catch (error) {
                        this.notifyError(
                            error instanceof Error
                                ? error
                                : new Error(String(error))
                        );
                    }
                });
            }
        } catch (error) {
            this.notifyError(
                error instanceof Error ? error : new Error(String(error))
            );
        }
    }

    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected()) {
                try {
                    this.send("ping", {});
                    this.pongTimeoutTimer = setTimeout(() => {
                        this.ws?.close();
                    }, this.options.heartbeatTimeoutMs);
                } catch {
                    // Heartbeat failed, connection will be handled by onclose
                }
            }
        }, this.options.heartbeatIntervalMs);
    }

    private stopHeartbeat(): void {
        clearTimeout(this.pongTimeoutTimer);
        this.pongTimeoutTimer = undefined;
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            this.maxRetriesHandlers.forEach((handler) => {
                try {
                    handler();
                } catch (e) {
                    console.error("Error in maxRetriesReached handler:", e);
                }
            });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.computeDelay(this.reconnectAttempts);

        this.reconnectHandlers.forEach((handler) => {
            try {
                handler(this.reconnectAttempts, delay);
            } catch (e) {
                console.error("Error in reconnect handler:", e);
            }
        });

        setTimeout(() => {
            this.connect().catch((error) => {
                this.notifyError(error);
            });
        }, delay);
    }

    private computeDelay(attempt: number): number {
        const strategy = this.options.backoffStrategy;
        if (typeof strategy === "function") {
            return strategy(attempt);
        }
        if (strategy === "exponential") {
            const cap = Math.min(
                this.options.maxReconnectDelayMs,
                this.options.reconnectDelayMs * Math.pow(2, attempt - 1)
            );
            return this.options.jitter ? Math.random() * cap : cap;
        }
        // "linear" (default)
        return this.options.reconnectDelayMs * attempt;
    }

    private notifyError(error: Error): void {
        this.errorHandlers.forEach((handler) => {
            try {
                handler(error);
            } catch (e) {
                console.error("Error in error handler:", e);
            }
        });
    }

    private notifyValidationError(
        error: Error,
        message: WebSocketMessage
    ): void {
        this.validationErrorHandlers.forEach((handler) => {
            try {
                handler(error, message);
            } catch (e) {
                console.error("Error in validation error handler:", e);
            }
        });
    }
}
