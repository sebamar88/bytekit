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

// ─── fetch-based SSE types ───────────────────────────────────────────────────

/**
 * A single Server-Sent Event parsed from the stream.
 *
 * @template T  The type of the parsed `data` field (defaults to `unknown`).
 */
export interface SSEEvent<T = unknown> {
    /** Event type — defaults to `"message"` when the server omits the `event:` field. */
    event: string;
    /** Parsed data payload (JSON-parsed when possible, raw string otherwise). */
    data: T | string;
    /** Optional `id:` field sent by the server. */
    id?: string;
    /** Optional `retry:` field (ms) sent by the server. */
    retry?: number;
}

/**
 * Options for {@link StreamingHelper.fetchSSE}.
 */
export interface FetchSSEOptions {
    /** HTTP method (default `"GET"`). Use `"POST"` when sending a body. */
    method?: string;
    /** Request body — automatically JSON-stringified if it is an object. */
    body?: BodyInit | Record<string, unknown> | unknown;
    /** Custom request headers. `Accept: text/event-stream` is always set. */
    headers?: Record<string, string>;
    /**
     * AbortSignal for cancellation.
     *
     * @example
     * const ac = new AbortController();
     * for await (const ev of StreamingHelper.fetchSSE(url, { signal: ac.signal })) { … }
     * ac.abort(); // cancels the stream
     */
    signal?: AbortSignal;
    /**
     * Event types to emit. When omitted **all** event types are yielded.
     * Pass e.g. `["data", "log", "heartbeat"]` to restrict.
     */
    eventTypes?: string[];
    /**
     * If `true`, every `data:` field is returned as a raw string.
     * If `false` (default), the helper tries `JSON.parse` first.
     */
    raw?: boolean;
}

export class StreamingHelper {
    /**
     * Process remaining buffer content
     */
    private static processRemainingBuffer<T>(
        buffer: string,
        data: T[],
        onChunk?: (chunk: string) => void
    ): void {
        if (buffer.trim()) {
            try {
                const item = JSON.parse(buffer) as T;
                data.push(item);
                /* v8 ignore next */
                onChunk?.(buffer);
            } catch {
                console.warn("Failed to parse final buffer:", buffer);
            }
        }
    }

    /**
     * Process complete lines from stream
     */
    private static processLines<T>(
        lines: string[],
        data: T[],
        onChunk?: (chunk: string) => void
    ): void {
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            /* v8 ignore next */
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
    }

    /**
     * Stream JSON lines from an endpoint (NDJSON).
     *
     * Use this method to process large JSON datasets without loading the entire response into memory.
     * Each line in the response must be a valid JSON object.
     *
     * @example
     * await StreamingHelper.streamJsonLines("http://localhost:3000/large-data", {
     *   onChunk: (item) => console.log("Processed item:", item),
     *   onComplete: () => console.log("Done!")
     * });
     *
     * @param endpoint The URL to fetch from
     * @param options Stream options including callbacks and timeout
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
                    this.processRemainingBuffer(buffer, data, onChunk);
                    complete = true;
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");

                // Process complete lines
                this.processLines(lines, data, onChunk);

                // Keep incomplete line in buffer
                buffer = lines.at(-1)!;
            }

            onComplete?.();
        } catch (err) {
            /* v8 ignore next */
            error = err instanceof Error ? err : new Error(String(err));
            onError?.(error);
        }

        return { data, complete, error };
    }

    /**
     * Stream Server-Sent Events (SSE).
     *
     * Establishes a persistent connection to receive real-time updates from the server.
     * Automatically parses incoming data as JSON.
     *
     * @example
     * const stream = StreamingHelper.streamSSE("http://localhost:3000/events");
     * const unsubscribe = stream.subscribe((data) => {
     *   console.log("New real-time data:", data);
     * });
     *
     * // To close:
     * // stream.close();
     *
     * @param endpoint The SSE endpoint URL
     * @param options Subscription options and custom event type
     */
    static streamSSE<T>(
        endpoint: string,
        options: StreamOptions & { eventType?: string } = {}
    ): {
        subscribe: (callback: (data: T) => void) => () => void;
        close: () => void;
    } {
        const { onError, onComplete, eventType = "message" } = options;

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
                const err =
                    error instanceof Error ? error : new Error(String(error));
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

    // ─── fetch-based SSE (resolves POST, AbortSignal, multi-event, async generator) ──

    /**
     * Consume a Server-Sent Events endpoint via `fetch` + `ReadableStream`.
     *
     * Unlike {@link streamSSE} (which wraps the native `EventSource` API and is
     * limited to GET requests), this method supports **any HTTP method**, request
     * **bodies**, **AbortSignal** cancellation, **multiple event types**, and
     * returns an **`AsyncIterable`** so you can use `for await … of`.
     *
     * @template T  The expected shape of each event's `data` field.
     *
     * @example
     * // POST with body + cancellation + multi-event
     * const ac = new AbortController();
     *
     * for await (const ev of StreamingHelper.fetchSSE<PipelineChunk>(
     *   "/bff/ai/orchestrator-stream",
     *   {
     *     method: "POST",
     *     body: { prompt: "Explain DDD", model: "gpt-4o" },
     *     signal: ac.signal,
     *     eventTypes: ["data", "log", "heartbeat"],
     *   }
     * )) {
     *   switch (ev.event) {
     *     case "data":      renderToken(ev.data); break;
     *     case "log":       console.debug(ev.data); break;
     *     case "heartbeat": break; // keep-alive, ignore
     *   }
     * }
     */
    static async *fetchSSE<T = unknown>(
        endpoint: string,
        options: FetchSSEOptions = {}
    ): AsyncGenerator<SSEEvent<T>, void, undefined> {
        const {
            method = "GET",
            body,
            headers = {},
            signal,
            eventTypes,
            raw = false,
        } = options;

        // Build the request body
        let requestBody: BodyInit | undefined;
        if (body !== undefined && body !== null) {
            if (
                typeof body === "string" ||
                body instanceof ArrayBuffer ||
                body instanceof FormData ||
                body instanceof URLSearchParams ||
                body instanceof Blob ||
                (typeof ReadableStream !== "undefined" &&
                    body instanceof ReadableStream)
            ) {
                requestBody = body as BodyInit;
            } else {
                // Assume JSON-serializable object
                requestBody = JSON.stringify(body);
                /* v8 ignore next */
                if (!headers["Content-Type"] && !headers["content-type"]) {
                    headers["Content-Type"] = "application/json";
                }
            }
        }

        const response = await fetch(endpoint, {
            method,
            headers: {
                Accept: "text/event-stream",
                ...headers,
            },
            body: requestBody,
            signal,
        });

        if (!response.ok) {
            throw new Error(
                `SSE request failed with status ${response.status}: ${response.statusText}`
            );
        }

        if (!response.body) {
            throw new Error("Response body is empty — cannot read SSE stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Current event being assembled (SSE events are separated by blank lines)
        let currentEvent = "";
        let currentData: string[] = [];
        let currentId: string | undefined;
        let currentRetry: number | undefined;

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Flush any partial event left in the buffer
                    const flushed = this.flushSSEEvent<T>(
                        currentEvent,
                        currentData,
                        currentId,
                        currentRetry,
                        eventTypes,
                        raw
                    );
                    /* v8 ignore next */
                    if (flushed) yield flushed;
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                // SSE spec: events are separated by one or more blank lines (\n\n)
                const segments = buffer.split("\n");
                // Keep the last segment (may be incomplete)
                /* v8 ignore next */
                buffer = segments.pop()!;

                for (const line of segments) {
                    if (line === "" || line === "\r") {
                        // Blank line → dispatch current event
                        const evt = this.flushSSEEvent<T>(
                            currentEvent,
                            currentData,
                            currentId,
                            currentRetry,
                            eventTypes,
                            raw
                        );
                        if (evt) yield evt;

                        // Reset for next event
                        currentEvent = "";
                        currentData = [];
                        currentId = undefined;
                        currentRetry = undefined;
                        continue;
                    }

                    const cleaned = line.endsWith("\r")
                        ? line.slice(0, -1)
                        : line;

                    // Lines starting with ':' are comments (keep-alive) — skip
                    if (cleaned.startsWith(":")) continue;

                    const colonIdx = cleaned.indexOf(":");
                    let field: string;
                    let val: string;

                    if (colonIdx === -1) {
                        field = cleaned;
                        val = "";
                    } else {
                        field = cleaned.slice(0, colonIdx);
                        // The spec says: if the first character after ':' is a space, strip it
                        val =
                            cleaned[colonIdx + 1] === " "
                                ? cleaned.slice(colonIdx + 2)
                                : cleaned.slice(colonIdx + 1);
                    }

                    switch (field) {
                        case "event":
                            currentEvent = val;
                            break;
                        case "data":
                            currentData.push(val);
                            break;
                        case "id":
                            currentId = val;
                            break;
                        case "retry": {
                            const n = parseInt(val, 10);
                            /* v8 ignore next */
                            if (!isNaN(n)) currentRetry = n;
                            break;
                        }
                        // Unknown fields are ignored per spec
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Assemble a parsed SSE event from accumulated fields.
     * Returns `null` when the event should be skipped (no data, or filtered out).
     * @internal
     */
    private static flushSSEEvent<T>(
        eventType: string,
        dataLines: string[],
        id: string | undefined,
        retry: number | undefined,
        allowedTypes: string[] | undefined,
        raw: boolean
    ): SSEEvent<T> | null {
        if (dataLines.length === 0) return null;

        const type = eventType || "message";

        // Filter by allowed event types
        if (
            allowedTypes &&
            allowedTypes.length > 0 &&
            !allowedTypes.includes(type)
        ) {
            return null;
        }

        // Per spec, multiple `data:` lines are joined with \n
        const rawData = dataLines.join("\n");

        let parsed: T | string;
        if (raw) {
            parsed = rawData;
        } else {
            try {
                parsed = JSON.parse(rawData) as T;
            } catch {
                parsed = rawData;
            }
        }

        const evt: SSEEvent<T> = { event: type, data: parsed };
        if (id !== undefined) evt.id = id;
        if (retry !== undefined) evt.retry = retry;
        return evt;
    }

    /**
     * Download file as stream with progress tracking
     */
    static async downloadStream(
        endpoint: string,
        options: StreamOptions & {
            onProgress?: (progress: number) => void;
        } = {}
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
                throw new Error(
                    `Download failed with status ${response.status}`
                );
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
            const err =
                /* v8 ignore next */
                error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            throw err;
        }
    }
}
