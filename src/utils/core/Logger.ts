/* eslint-disable no-console */

/**
 * Ordered severity levels for the logger.
 *
 * Levels from lowest to highest priority: `debug` < `info` < `warn` < `error`.
 * Setting the level to `"silent"` suppresses all output.
 */
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

/**
 * A single structured log entry passed to every {@link LogTransport}.
 *
 * @template TContext - Shape of the optional context object attached to the entry.
 */
export interface LogEntry<
    TContext extends Record<string, unknown> = Record<string, unknown>,
> {
    /** Severity level of the log entry. */
    level: LogLevel;
    /** Human-readable log message. */
    message: string;
    /** Optional dot-separated namespace of the logger that emitted the entry. */
    namespace?: string;
    /** Exact time the entry was created. */
    timestamp: Date;
    /** Optional structured context payload for machine-readable metadata. */
    context?: TContext;
    /** Optional `Error` object associated with the log entry. */
    error?: Error;
}

/**
 * A function that receives a {@link LogEntry} and writes it to an output
 * destination. Transports may be synchronous or asynchronous.
 *
 * Uncaught rejections from async transports are caught by the {@link Logger}
 * and reported to `console.error`.
 */
export type LogTransport = (entry: LogEntry) => void | Promise<void>;

/** Configuration options for the {@link Logger} constructor. */
export interface LoggerOptions {
    /** Dot-separated namespace prepended to every log message (e.g., `"app:db"`). */
    namespace?: string;
    /**
     * Minimum severity level to emit.
     * Defaults to `"debug"` in development and `"info"` in production.
     */
    level?: LogLevel;
    /**
     * Custom transport functions to use instead of the default console transport.
     * When omitted, a console transport is selected automatically based on runtime.
     */
    transports?: LogTransport[];
    /**
     * Whether to prefix log entries with an ISO 8601 timestamp in the default
     * console transport. Defaults to `true`.
     */
    includeTimestamp?: boolean;
}

// ------------------------------------
// Config & Constants
// ------------------------------------
const LEVEL_PRIORITY: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
};

const DEFAULT_LEVEL: LogLevel =
    typeof process !== "undefined" && process?.env?.NODE_ENV === "production"
        ? "info"
        : "debug";

const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

// ------------------------------------
// Transports
// ------------------------------------

/**
 * Creates a transport that writes coloured log entries to the Node.js console
 * using ANSI escape codes.
 *
 * Each severity level is rendered in a distinct colour: red (error),
 * yellow (warn), green (info), and grey (debug).
 *
 * @param options - Transport configuration.
 * @param options.includeTimestamp - Prefix each entry with an ISO 8601
 *   timestamp. Defaults to `true`.
 * @returns A {@link LogTransport} for use in Node.js environments.
 *
 * @example
 * ```typescript
 * const logger = new Logger({
 *     transports: [consoleTransportNode({ includeTimestamp: false })],
 * });
 * logger.info('Server started');
 * ```
 */
export const consoleTransportNode = ({
    includeTimestamp = true,
}: { includeTimestamp?: boolean } = {}): LogTransport => {
    const COLORS: Record<LogLevel, string> = {
        error: "\x1b[31m", // rojo
        warn: "\x1b[33m", // amarillo
        info: "\x1b[32m", // verde
        debug: "\x1b[90m", // gris tenue
        silent: "",
    };
    const RESET = "\x1b[0m";

    return (entry) => {
        const { level, message, namespace, timestamp, context, error } = entry;
        const color = COLORS[level] ?? "";
        const prefixParts: string[] = [];

        if (includeTimestamp) prefixParts.push(timestamp.toISOString());
        prefixParts.push(color + level.toUpperCase() + RESET);
        if (namespace) prefixParts.push(`[${namespace}]`);

        const prefix = prefixParts.join(" ");
        const payload: unknown[] = [`${prefix} ${message}`.trim()];

        if (context && Object.keys(context).length > 0) payload.push(context);
        if (error) payload.push(error);

        const method =
            level === "error"
                ? console.error
                : level === "warn"
                  ? console.warn
                  : console.log;

        method(...payload);
    };
};

/**
 * Creates a transport that writes styled log entries to the browser console
 * using `%c` CSS colour formatting.
 *
 * Each severity level is rendered in a distinct colour: red (error),
 * orange (warn), green (info), and grey (debug).
 *
 * @param options - Transport configuration.
 * @param options.includeTimestamp - Prefix each entry with an ISO 8601
 *   timestamp. Defaults to `true`.
 * @returns A {@link LogTransport} for use in browser environments.
 *
 * @example
 * ```typescript
 * const logger = new Logger({
 *     transports: [consoleTransportBrowser()],
 * });
 * logger.warn('Low memory');
 * ```
 */
export const consoleTransportBrowser = ({
    includeTimestamp = true,
}: { includeTimestamp?: boolean } = {}): LogTransport => {
    const COLORS: Record<LogLevel, string> = {
        error: "color: red",
        warn: "color: orange",
        info: "color: green",
        debug: "color: gray",
        silent: "",
    };

    return (entry) => {
        const { level, message, namespace, timestamp, context, error } = entry;
        const color = COLORS[level] ?? "";
        const prefixParts: string[] = [];

        if (includeTimestamp) prefixParts.push(timestamp.toISOString());
        prefixParts.push(`${level.toUpperCase()}`);
        if (namespace) prefixParts.push(`[${namespace}]`);

        const prefix = prefixParts.join(" ");
        const payload: unknown[] = [`%c${prefix} ${message}`.trim(), color];

        if (context && Object.keys(context).length > 0) payload.push(context);
        if (error) payload.push(error);

        const method =
            level === "error"
                ? console.error
                : level === "warn"
                  ? console.warn
                  : console.log;

        method(...payload);
    };
};

// ------------------------------------
// Logger Class
// ------------------------------------

/**
 * Structured, transport-based logger with namespace and level filtering.
 *
 * Automatically selects a console transport based on the runtime environment
 * (Node.js or browser) when no custom transports are provided. Supports
 * child loggers for hierarchical namespacing.
 *
 * @template TContext - Shape of the structured context object attached to
 *   log entries.
 *
 * @example
 * ```typescript
 * const logger = new Logger({ namespace: 'app', level: 'info' });
 * logger.info('Server started', { port: 3000 });
 *
 * const dbLogger = logger.child('db');
 * dbLogger.debug('Query executed', { sql: 'SELECT 1' });
 * ```
 */
export class Logger<
    TContext extends Record<string, unknown> = Record<string, unknown>,
> {
    private readonly namespace?: string;
    private readonly transports: LogTransport[];
    private level: LogLevel;

    /**
     * Creates a new `Logger` instance.
     *
     * @param options - Logger configuration. All fields are optional.
     */
    constructor({
        namespace,
        level = DEFAULT_LEVEL,
        transports,
        includeTimestamp,
    }: LoggerOptions = {}) {
        this.namespace = namespace;
        this.level = level;

        // Usa el transporte correcto según entorno si no se pasó uno custom
        this.transports =
            transports?.length && transports.length > 0
                ? transports
                : [
                      isBrowser
                          ? consoleTransportBrowser({ includeTimestamp })
                          : consoleTransportNode({ includeTimestamp }),
                  ];
    }

    /**
     * Updates the minimum log level at runtime.
     *
     * @param level - The new minimum severity level to emit.
     */
    setLevel(level: LogLevel) {
        this.level = level;
    }

    /**
     * Creates a child logger that inherits this logger's level and transports.
     *
     * The child's namespace is formed by appending `namespace` to the parent's
     * namespace with a colon separator (e.g., `"app"` → `"app:db"`).
     *
     * @param namespace - Namespace segment to append.
     * @returns A new `Logger` instance scoped to the child namespace.
     *
     * @example
     * ```typescript
     * const child = logger.child('db');
     * child.debug('Connected'); // emits "[app:db] Connected"
     * ```
     */
    child(namespace: string) {
        const childNamespace = this.namespace
            ? `${this.namespace}:${namespace}`
            : namespace;
        return new Logger<TContext>({
            namespace: childNamespace,
            level: this.level,
            transports: this.transports,
        });
    }

    /**
     * Emits a `debug`-level log entry.
     *
     * @param message - Human-readable description of the event.
     * @param context - Optional structured metadata to attach.
     */
    debug(message: string, context?: TContext) {
        this.log("debug", message, context);
    }

    /**
     * Emits an `info`-level log entry.
     *
     * @param message - Human-readable description of the event.
     * @param context - Optional structured metadata to attach.
     */
    info(message: string, context?: TContext) {
        this.log("info", message, context);
    }

    /**
     * Emits a `warn`-level log entry.
     *
     * @param message - Human-readable description of the event.
     * @param context - Optional structured metadata to attach.
     */
    warn(message: string, context?: TContext) {
        this.log("warn", message, context);
    }

    /**
     * Emits an `error`-level log entry.
     *
     * @param message - Human-readable description of the event.
     * @param context - Optional structured metadata to attach.
     * @param error - Optional `Error` object to include in the entry.
     */
    error(message: string, context?: TContext, error?: Error) {
        this.log("error", message, context, error);
    }

    /**
     * Low-level method to emit a log entry at any level.
     *
     * Skips emission when `level` is below the configured minimum.
     * Transport failures are caught and reported to `console.error`.
     *
     * @param level - Severity level for the entry.
     * @param message - Human-readable description of the event.
     * @param context - Optional structured metadata to attach.
     * @param error - Optional `Error` object to include in the entry.
     *
     * @example
     * ```typescript
     * logger.log('info', 'Custom event', { traceId: 'abc' });
     * ```
     */
    log(level: LogLevel, message: string, context?: TContext, error?: Error) {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry<TContext> = {
            level,
            message,
            namespace: this.namespace,
            timestamp: new Date(),
            context,
            error,
        };

        for (const transport of this.transports) {
            Promise.resolve(transport(entry)).catch((err) =>
                console.error("[Logger] Transport failure", err)
            );
        }
    }

    /** @internal */
    private shouldLog(level: LogLevel) {
        if (this.level === "silent") return false;
        return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[this.level];
    }

    /**
     * Creates a `Logger` that suppresses all output.
     *
     * Useful for disabling logging in test environments.
     *
     * @returns A new `Logger` configured with level `"silent"`.
     *
     * @example
     * ```typescript
     * const logger = Logger.silent();
     * logger.debug('This is never printed');
     * ```
     */
    static silent() {
        return new Logger({ level: "silent" });
    }
}

// ------------------------------------
// Factory
// ------------------------------------

/**
 * Factory function that creates a new {@link Logger} instance.
 *
 * A convenience wrapper around `new Logger(options)`.
 *
 * @param options - Logger configuration. All fields are optional.
 * @returns A configured `Logger` instance.
 *
 * @example
 * ```typescript
 * const logger = createLogger({ namespace: 'api', level: 'warn' });
 * logger.warn('Rate limit approaching');
 * ```
 */
export const createLogger = (options?: LoggerOptions) => new Logger(options);
