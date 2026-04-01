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

export function sanitizeFileSegment(input: string, fallback = "api"): string {
    const cleaned = input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return cleaned || fallback;
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
