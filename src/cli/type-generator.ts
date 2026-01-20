import fs from "node:fs/promises";
import path from "node:path";

export interface TypeGeneratorOptions {
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    output?: string;
    name?: string;
    headers?: Record<string, string>;
}

/**
 * Generate TypeScript types from API response
 */
export async function generateTypesFromEndpoint(
    options: TypeGeneratorOptions
): Promise<void> {
    const {
        endpoint,
        method = "GET",
        output = "types.ts",
        name = "ApiResponse",
        headers = {},
    } = options;

    console.log(`\n📡 Fetching ${method} ${endpoint}...`);

    try {
        const response = await fetch(endpoint, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const typeDefinition = generateTypeFromData(data, name);

        const outputPath = path.join(process.cwd(), output);
        await fs.writeFile(outputPath, typeDefinition, "utf8");

        console.log(`✅ Types generated successfully!`);
        console.log(`📝 Output: ${outputPath}\n`);
        console.log("Generated types:");
        console.log("─".repeat(50));
        console.log(typeDefinition);
        console.log("─".repeat(50));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error: ${message}`);
        process.exit(1);
    }
}

/**
 * Generate TypeScript type definition from data
 */
function generateTypeFromData(data: unknown, typeName: string): string {
    const typeDefinition = inferType(data, typeName);
    return `// Auto-generated types from API response\n// Generated at ${new Date().toISOString()}\n\n${typeDefinition}\n`;
}

/**
 * Infer TypeScript type from data
 */
function inferType(data: unknown, name: string, depth = 0): string {
    if (data === null) {
        return `type ${name} = null;`;
    }

    if (data === undefined) {
        return `type ${name} = undefined;`;
    }

    const type = typeof data;

    if (type === "boolean") {
        return `type ${name} = boolean;`;
    }

    if (type === "number") {
        return `type ${name} = number;`;
    }

    if (type === "string") {
        return `type ${name} = string;`;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return `type ${name} = unknown[];`;
        }
        const elementType = inferArrayElementType(data, depth);
        return `type ${name} = ${elementType}[];`;
    }

    if (type === "object") {
        return generateObjectType(data as Record<string, unknown>, name, depth);
    }

    return `type ${name} = unknown;`;
}

/**
 * Generate object type definition
 */
function generateObjectType(
    obj: Record<string, unknown>,
    name: string,
    depth: number
): string {
    const indent = "  ".repeat(depth);
    const innerIndent = "  ".repeat(depth + 1);

    const properties = Object.entries(obj)
        .map(([key, value]) => {
            const fieldType = inferInlineType(value, depth + 1);
            const isOptional = value === null || value === undefined ? "?" : "";
            return `${innerIndent}${key}${isOptional}: ${fieldType};`;
        })
        .join("\n");

    return `export interface ${name} {\n${properties}\n${indent}}`;
}

function inferInlineType(value: unknown, depth: number): string {
    if (value === null) {
        return "null";
    }

    if (value === undefined) {
        return "undefined";
    }

    const type = typeof value;

    if (type === "boolean") {
        return "boolean";
    }

    if (type === "number") {
        return "number";
    }

    if (type === "string") {
        return "string";
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return "unknown[]";
        }
        const elementType = inferArrayElementType(value, depth);
        return `${elementType}[]`;
    }

    if (type === "object") {
        return buildInlineObjectType(value as Record<string, unknown>, depth);
    }

    return "unknown";
}

function inferArrayElementType(values: unknown[], depth: number): string {
    const types = values.map((value) => inferInlineType(value, depth));
    const uniqueTypes = Array.from(new Set(types));
    if (uniqueTypes.length === 0) {
        return "unknown";
    }
    if (uniqueTypes.length === 1) {
        return uniqueTypes[0];
    }
    return `(${uniqueTypes.join(" | ")})`;
}

function buildInlineObjectType(
    obj: Record<string, unknown>,
    depth: number
): string {
    const indent = "  ".repeat(depth);
    const innerIndent = "  ".repeat(depth + 1);
    const properties = Object.entries(obj)
        .map(([key, value]) => {
            const fieldType = inferInlineType(value, depth + 1);
            const isOptional = value === null || value === undefined ? "?" : "";
            return `${innerIndent}${key}${isOptional}: ${fieldType};`;
        })
        .join("\n");

    if (!properties) {
        return "{}";
    }

    return `{\n${properties}\n${indent}}`;
}
