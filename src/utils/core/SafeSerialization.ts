const DEFAULT_SENSITIVE_KEYS = [
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "token",
    "access-token",
    "refresh-token",
    "id-token",
    "secret",
    "password",
    "passwd",
    "pwd",
    "api-key",
    "apikey",
    "x-api-key",
    "client-secret",
    "session",
] as const;

export interface SafeSerializeOptions {
    sensitiveKeys?: string[];
    maxDepth?: number;
    maxStringLength?: number;
}

/* v8 ignore next */
export function createSensitiveKeySet(keys?: string[]): Set<string> {
    return new Set((keys ?? DEFAULT_SENSITIVE_KEYS).map(normalizeSensitiveKey));
}

export function safeSerialize(
    value: unknown,
    options: SafeSerializeOptions = {}
): unknown {
    const {
        sensitiveKeys = [...DEFAULT_SENSITIVE_KEYS],
        maxDepth = 4,
        maxStringLength = 240,
    } = options;
    const sensitiveKeySet = createSensitiveKeySet(sensitiveKeys);
    const seen = new WeakSet<object>();

    const visit = (input: unknown, depth: number, parentKey?: string): unknown => {
        if (parentKey && isSensitiveKey(parentKey, sensitiveKeySet)) {
            return "[REDACTED]";
        }

        if (typeof input === "string") {
            if (input.length <= maxStringLength) {
                return input;
            }
            return `${input.slice(0, maxStringLength)}…[truncated ${input.length - maxStringLength} chars]`;
        }

        if (
            input === null ||
            input === undefined ||
            typeof input === "number" ||
            typeof input === "boolean" ||
            typeof input === "bigint"
        ) {
            return input;
        }

        /* v8 ignore next */
        if (typeof input === "function") {
            return `[Function ${input.name || "anonymous"}]`;
        }

        if (input instanceof Date) {
            return input.toISOString();
        }

        if (input instanceof Error) {
            return {
                name: input.name,
                message: input.message,
                stack: input.stack,
            };
        }

        if (Array.isArray(input)) {
            if (depth >= maxDepth) return "[Array]";
            return input.map((item) => visit(item, depth + 1));
        }

        if (typeof input === "object") {
            if (seen.has(input)) {
                return "[Circular]";
            }

            /* v8 ignore next */
            if (depth >= maxDepth) {
                return `[${input.constructor?.name || "Object"}]`;
            }

            seen.add(input);
            const output: Record<string, unknown> = {};
            for (const [key, nested] of Object.entries(input)) {
                output[key] = visit(nested, depth + 1, key);
            }
            return output;
        }

        return String(input);
    };

    return visit(value, 0);
}

function normalizeSensitiveKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key: string, sensitiveKeySet: Set<string>): boolean {
    const normalized = normalizeSensitiveKey(key);
    for (const candidate of sensitiveKeySet) {
        if (normalized === candidate || normalized.includes(candidate)) {
            return true;
        }
    }
    return false;
}
