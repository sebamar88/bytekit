export interface WebSocketMessage<T = unknown> {
    type: string;
    data: T;
    timestamp?: number;
}

export interface WebSocketOptions {
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelayMs?: number;
    heartbeatIntervalMs?: number;
    messageTimeout?: number;
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

    constructor(url: string, options: WebSocketOptions = {}) {
        this.url = url;
        this.options = {
            reconnect: options.reconnect ?? true,
            maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
            reconnectDelayMs: options.reconnectDelayMs ?? 3000,
            heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30000,
            messageTimeout: options.messageTimeout ?? 5000,
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
        try {
            const message = JSON.parse(rawData) as WebSocketMessage;
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
                } catch {
                    // Heartbeat failed, connection will be handled by onclose
                }
            }
        }, this.options.heartbeatIntervalMs);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            const error = new Error("Max reconnection attempts reached");
            this.notifyError(error);
            return;
        }

        this.reconnectAttempts++;
        const delay = this.options.reconnectDelayMs * this.reconnectAttempts;

        setTimeout(() => {
            this.connect().catch((error) => {
                this.notifyError(error);
            });
        }, delay);
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
}
