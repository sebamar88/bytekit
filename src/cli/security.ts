import path from "node:path";

const RESERVED_TS_WORDS = new Set([
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "as",
    "implements",
    "interface",
    "let",
    "package",
    "private",
    "protected",
    "public",
    "static",
    "await",
    "any",
    "boolean",
    "constructor",
    "declare",
    "get",
    "module",
    "require",
    "number",
    "set",
    "string",
    "symbol",
    "type",
    "from",
    "of",
]);

export function assertSecureRemoteUrl(
    input: string | URL,
    purpose: string
): URL {
    const url = input instanceof URL ? input : new URL(String(input));

    if (url.username || url.password) {
        throw new Error(
            `${purpose} does not allow URLs with embedded credentials.`
        );
    }

    if (url.protocol === "https:") {
        return url;
    }

    if (url.protocol === "http:" && isLoopbackHost(url.hostname)) {
        return url;
    }

    throw new Error(
        `${purpose} requires https:// for remote hosts. Plain http:// is only allowed for localhost or loopback addresses.`
    );
}

export function sanitizeTypeName(
    input: string,
    fallback = "GeneratedType"
): string {
    const segments = input
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

    let sanitized = segments.join("");
    if (!sanitized) sanitized = fallback;
    if (!/^[A-Za-z_]/.test(sanitized)) sanitized = `${fallback}${sanitized}`;
    if (RESERVED_TS_WORDS.has(sanitized.toLowerCase())) {
        sanitized = `${sanitized}Type`;
    }
    return sanitized;
}

export function formatPropertyKey(key: string): string {
    if (isSafeTsIdentifier(key)) {
        return key;
    }
    return JSON.stringify(key);
}

export function assertSafeOutputPath(output: string): string {
    const cwd = process.cwd();
    const resolved = path.resolve(cwd, output);
    if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
        throw new Error(
            `Output path "${output}" resolves outside the current working directory. ` +
                `Resolved: ${resolved}`
        );
    }
    return resolved;
}

export function sanitizeFileSegment(input: string, fallback = "api"): string {
    const cleaned = input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return cleaned || fallback;
}

/**
 * Maximum response body size for CLI-initiated fetches (50 MB).
 * Prevents OOM when a remote endpoint returns an unexpectedly large payload.
 */
export const MAX_CLI_RESPONSE_BYTES = 50 * 1024 * 1024;

/**
 * Re-validates the final URL of a fetch response to prevent SSRF via redirect.
 * Call this after `fetch()` to ensure the redirect chain did not land on an
 * insecure or internal host.
 */
export function assertResponseUrl(
    response: Response,
    purpose: string
): void {
    const finalUrl = response.url;
    if (finalUrl) {
        assertSecureRemoteUrl(finalUrl, purpose);
    }
}

/**
 * Reads a fetch response body as text, enforcing a byte-size limit.
 * @throws if the body exceeds `maxBytes`.
 */
export async function readResponseWithLimit(
    response: Response,
    maxBytes = MAX_CLI_RESPONSE_BYTES
): Promise<string> {
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) {
        throw new Error(
            `Response body too large: ${contentLength} bytes (limit: ${maxBytes} bytes)`
        );
    }

    const reader = response.body?.getReader();
    if (!reader) {
        return await response.text();
    }

    const decoder = new TextDecoder();
    let total = 0;
    let result = "";
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
            reader.cancel();
            throw new Error(
                `Response body too large: exceeded ${maxBytes} byte limit`
            );
        }
        result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return result;
}

function isLoopbackHost(hostname: string): boolean {
    const normalized = hostname.toLowerCase();
    return (
        normalized === "localhost" ||
        normalized === "::1" ||
        normalized === "[::1]" ||
        normalized === "127.0.0.1" ||
        normalized.startsWith("127.")
    );
}

function isSafeTsIdentifier(value: string): boolean {
    return (
        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) &&
        !RESERVED_TS_WORDS.has(value)
    );
}
