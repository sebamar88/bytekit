const accentsMap: [RegExp, string][] = [
    [/[àáâãäå]/g, "a"],
    [/æ/g, "ae"],
    [/ç/g, "c"],
    [/[èéêë]/g, "e"],
    [/[ìíîï]/g, "i"],
    [/ñ/g, "n"],
    [/[òóôõö]/g, "o"],
    [/œ/g, "oe"],
    [/[ùúûü]/g, "u"],
    [/[ýÿ]/g, "y"],
    [/ß/g, "ss"],
    [/[ÀÁÂÃÄÅ]/g, "a"],
    [/Æ/g, "ae"],
    [/Ç/g, "c"],
    [/[ÈÉÊË]/g, "e"],
    [/[ÌÍÎÏ]/g, "i"],
    [/Ñ/g, "n"],
    [/[ÒÓÔÕÖ]/g, "o"],
    [/Œ/g, "oe"],
    [/[ÙÚÛÜ]/g, "u"],
    [/[ÝŸ]/g, "y"],
];

function normalizeUnicode(str: string): string {
    let result = str;
    for (const [pattern, replacement] of accentsMap) {
        result = result.replace(pattern, replacement);
    }
    return result;
}

function toWords(str: string): string[] {
    const normalized = normalizeUnicode(str);
    return normalized
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .split(/[\s\-_./]+/)
        .filter((w) => w.length > 0);
}

export function camelCase(str: string): string {
    const words = toWords(str);
    return words
        .map((w, i) =>
            i === 0
                ? w.toLowerCase()
                : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join("");
}

export function snakeCase(str: string): string {
    return toWords(str)
        .map((w) => w.toLowerCase())
        .join("_");
}

export function pascalCase(str: string): string {
    return toWords(str)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
}

export function truncate(
    str: string,
    maxLen: number,
    ellipsis = "...",
): string {
    if (str.length <= maxLen) return str;
    const cutAt = maxLen - ellipsis.length;
    if (cutAt <= 0) return ellipsis.slice(0, maxLen);
    return str.slice(0, cutAt) + ellipsis;
}

export function slugify(str: string): string {
    return normalizeUnicode(str)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/[\s]+/g, "-")
        .replace(/-+/g, "-");
}
