/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs/promises";
import path from "node:path";
import {
    assertResponseUrl,
    assertSafeOutputPath,
    assertSecureRemoteUrl,
    formatPropertyKey,
    readResponseWithLimit,
    sanitizeTypeName,
} from "./security.js";

interface SwaggerOptions {
    url: string | URL;
    output?: string;
}

/**
 * Generate TypeScript interfaces from an OpenAPI/Swagger specification
 */
export async function generateFromSwagger(
    options: SwaggerOptions
): Promise<void> {
    const { url, output = "src/types/api-docs.ts" } = options;
    const secureUrl = assertSecureRemoteUrl(
        url,
        "Swagger/OpenAPI type generation"
    );
    const urlStr = secureUrl.toString();

    console.log(
        `\n📖 Attempting to resolve Swagger/OpenAPI spec from ${urlStr}...`
    );

    try {
        let spec: any;
        const response = await fetch(secureUrl);

        assertResponseUrl(response, "Swagger/OpenAPI type generation");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        /* v8 ignore next */
        const contentType = response.headers.get("content-type") || "";

        // If it's HTML (likely Swagger UI), try to guess the JSON location
        if (contentType.includes("text/html")) {
            console.log(
                "🔍 URL looks like a documentation page, trying to find spec JSON..."
            );

            // Try to find the spec by replacing /docs or adding common paths
            const baseUrl = urlStr
                .replace(/\/docs\/?$/, "")
                .replace(/\/swagger-ui\/?$/, "");
            const commonPaths = [
                "/openapi.json",
                "/swagger.json",
                "/v2/api-docs",
                "/api-docs",
            ];

            let found = false;
            for (const p of commonPaths) {
                const tryUrl = baseUrl.endsWith("/")
                    ? `${baseUrl}${p.slice(1)}`
                    : `${baseUrl}${p}`;
                try {
                    const tryRes = await fetch(
                        assertSecureRemoteUrl(
                            tryUrl,
                            "Swagger/OpenAPI type generation"
                        )
                    );
                    assertResponseUrl(tryRes, "Swagger/OpenAPI type generation");
                    if (
                        tryRes.ok &&
                        /* v8 ignore next */
                        (tryRes.headers.get("content-type") || "").includes(
                            "json"
                        )
                    ) {
                        console.log(`✨ Found spec at: ${tryUrl}`);
                        const tryText = await readResponseWithLimit(tryRes);
                        spec = JSON.parse(tryText);
                        found = true;
                        break;
                    }
                } catch {
                    continue;
                }
            }

            if (!found) {
                throw new Error(
                    "Could not automatically find the OpenAPI/Swagger JSON from the documentation page. Please provide the direct JSON URL."
                );
            }
        } else {
            const text = await readResponseWithLimit(response);
            spec = JSON.parse(text);
        }

        const schemas = spec.components?.schemas || spec.definitions || {};

        if (Object.keys(schemas).length === 0) {
            console.warn(
                "⚠️ No schemas or definitions found in the specification."
            );
            return;
        }

        const typeDefinitionsArray = [
            `/**\n * Auto-generated types from Swagger/OpenAPI\n * Generated at ${new Date().toISOString()}\n */`,
        ];

        for (const [name, schema] of Object.entries(schemas)) {
            typeDefinitionsArray.push(generateInterface(name, schema as any));
        }

        const typeDefinitions = typeDefinitionsArray.join("\n\n") + "\n\n";

        const outputPath = assertSafeOutputPath(output);
        const outputDir = path.dirname(outputPath);

        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputPath, typeDefinitions, "utf8");

        console.log(
            `✅ Successfully generated ${Object.keys(schemas).length} types!`
        );
        console.log(`📝 Output: ${outputPath}\n`);
    } catch (error) {
        /* v8 ignore next */
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Swagger Error: ${message}`);
        process.exit(1);
    }
}

function generateInterface(name: string, schema: any): string {
    // Sanitize name (remove invalid characters)
    const sanitizedName = sanitizeTypeName(name, "GeneratedSchema");

    if (
        schema.type === "object" ||
        schema.properties ||
        schema.additionalProperties
    ) {
        if (schema.additionalProperties && !schema.properties) {
            return `export type ${sanitizedName} = Record<string, ${mapOpenApiToTs(schema.additionalProperties)}>;`;
        }

        /* v8 ignore next */
        const properties = schema.properties || {};
        /* v8 ignore start */
        const required = schema.required || [];
        /* v8 ignore end */

        const props = Object.entries(properties)
            .map(([propName, propSchema]: [string, any]) => {
                const isRequired = required.includes(propName);
                const type = mapOpenApiToTs(propSchema);
                return `  ${formatPropertyKey(propName)}${isRequired ? "" : "?"}: ${type};`;
            })
            .join("\n");

        if (schema.additionalProperties) {
            return `export interface ${sanitizedName} extends Record<string, ${mapOpenApiToTs(schema.additionalProperties)}> {\n${props}\n}`;
        }
        /* v8 ignore next */
        return `export interface ${sanitizedName} {\n${props}\n}`;
    }
    /* v8 ignore next */
    if (schema.enum) {
        const values = schema.enum
            .map((v: any) => (typeof v === "string" ? `'${v}'` : v))
            .join(" | ");
        return `export type ${sanitizedName} = ${values};`;
    }

    return `export type ${sanitizedName} = ${mapOpenApiToTs(schema)};`;
}

const MAX_SCHEMA_DEPTH = 20;

function mapOpenApiToTs(schema: any, depth = 0, visitedRefs = new Set<string>()): string {
    if (!schema) return "any";
    if (depth > MAX_SCHEMA_DEPTH) return "any /* max depth exceeded */";

    // Handle references
    if (schema.$ref) {
        if (visitedRefs.has(schema.$ref)) {
            const refName = schema.$ref.split("/").pop();
            return refName ? sanitizeTypeName(refName, "ReferencedSchema") : "any";
        }
        visitedRefs.add(schema.$ref);
        const refName = schema.$ref.split("/").pop();
        /* v8 ignore next */
        return refName ? sanitizeTypeName(refName, "ReferencedSchema") : "any";
    }

    // Handle basic types
    switch (schema.type) {
        case "string":
            if (schema.format === "date" || schema.format === "date-time")
                return "string | Date";
            return "string";
        case "integer":
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        case "array": {
            const itemType = mapOpenApiToTs(schema.items, depth + 1, visitedRefs);
            return `${itemType}[]`;
        }
        case "object":
            if (schema.additionalProperties) {
                return `Record<string, ${mapOpenApiToTs(schema.additionalProperties, depth + 1, visitedRefs)}>`;
            }
            return "Record<string, any>";
        default:
            // Handle combinations (oneOf, anyOf, allOf)
            if (schema.oneOf || schema.anyOf) {
                const types = (schema.oneOf || schema.anyOf).map((s: any) =>
                    mapOpenApiToTs(s, depth + 1, visitedRefs)
                );
                return `(${types.join(" | ")})`;
            }
            if (schema.allOf) {
                const types = schema.allOf.map((s: any) => mapOpenApiToTs(s, depth + 1, visitedRefs));
                return `(${types.join(" & ")})`;
            }
            return "any";
    }
}
