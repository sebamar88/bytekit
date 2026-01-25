export interface StreamOptions {
    timeout?: number;
    headers?: Record<string, string>;
    onChunk?: (chunk: string) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
}

export interface StreamResponse<T> {
    data: T[];
    complete: boolean;
    error?: Error;
}

export class StreamingHelper {
    /**
     * Stream JSON lines from an endpoint
     * Each line should be a valid JSON object
     */
    static async streamJsonLines<T>(
        endpoint: string,
        options: StreamOptions = {}
    ): Promise<StreamResponse<T>> {
        const {
            timeout = 30000,
            headers = {},
            onChunk,
            onError,
            onComplete,
        } = options;

        const data: T[] = [];
        let complete = false;
        let error: Error | undefined;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    Accept: "application/x-ndjson",
                    ...headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Stream failed with status ${response.status}`);
            }

            if (!response.body) {
                throw new Error("Response body is empty");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Process any remaining data in buffer
                    if (buffer.trim()) {
                        try {
                            const item = JSON.parse(buffer) as T;
                            data.push(item);
                            onChunk?.(buffer);
                        } catch {
                            console.warn("Failed to parse final buffer:", buffer);
                        }
                    }
                    complete = true;
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");

                // Process complete lines
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        try {
                            const item = JSON.parse(line) as T;
                            data.push(item);
                            onChunk?.(line);
                        } catch {
                            console.warn("Failed to parse line:", line);
                        }
                    }
                }

                // Keep incomplete line in buffer
                buffer = lines[lines.length - 1];
            }

            onComplete?.();
        } catch (err) {
            error = err instanceof Error ? err : new Error(String(err));
            onError?.(error);
        }

        return { data, complete, error };
    }

    /**
     * Stream Server-Sent Events (SSE)
     */
    static streamSSE<T>(
        endpoint: string,
        options: StreamOptions & { eventType?: string } = {}
    ): {
        subscribe: (callback: (data: T) => void) => () => void;
        close: () => void;
    } {
        const {
            onError,
            onComplete,
            eventType = "message",
        } = options;

        let eventSource: EventSource | null = null;
        const subscribers: Set<(data: T) => void> = new Set();

        const connect = () => {
            try {
                eventSource = new EventSource(endpoint);

                eventSource.addEventListener(eventType, (event) => {
                    try {
                        const data = JSON.parse(event.data) as T;
                        subscribers.forEach((callback) => callback(data));
                    } catch {
                        console.warn("Failed to parse SSE data:", event.data);
                    }
                });

                eventSource.addEventListener("error", () => {
                    const error = new Error("SSE connection error");
                    onError?.(error);
                    close();
                });
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                onError?.(err);
            }
        };

        const close = () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            onComplete?.();
        };

        connect();

        return {
            subscribe: (callback: (data: T) => void) => {
                subscribers.add(callback);
                return () => subscribers.delete(callback);
            },
            close,
        };
    }

    /**
     * Download file as stream with progress tracking
     */
    static async downloadStream(
        endpoint: string,
        options: StreamOptions & { onProgress?: (progress: number) => void } = {}
    ): Promise<Blob> {
        const {
            timeout: _timeout = 30000, // Renamed to _timeout as it's not directly used after this destructuring
            headers: _headers = {}, // Renamed to _headers as it's not directly used after this destructuring
            onProgress,
            onError,
            onComplete,
        } = options;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), _timeout); // Use _timeout here

            const response = await fetch(endpoint, {
                method: "GET",
                headers: _headers, // Use _headers here
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Download failed with status ${response.status}`);
            }

            const contentLength = response.headers.get("content-length");
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            if (!response.body) {
                throw new Error("Response body is empty");
            }

            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let loaded = 0;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                loaded += value.length;

                if (total > 0 && onProgress) {
                    onProgress(Math.round((loaded / total) * 100));
                }
            }

            onComplete?.();
            return new Blob(chunks as BlobPart[]);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            throw err;
        }
    }
}
