import fs from "node:fs/promises";
import path from "node:path";

export interface SwaggerOptions {
    url: string;
    output?: string;
}

/**
 * Generate TypeScript interfaces from an OpenAPI/Swagger specification
 */
export async function generateFromSwagger(options: SwaggerOptions): Promise<void> {
    let { url, output = "src/types/api-docs.ts" } = options;

    console.log(`\n📖 Attempting to resolve Swagger/OpenAPI spec from ${url}...`);

    try {
        let spec: any;
        let response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        
        // If it's HTML (likely Swagger UI), try to guess the JSON location
        if (contentType.includes("text/html")) {
            console.log("🔍 URL looks like a documentation page, trying to find spec JSON...");
            
            // Try to find the spec by replacing /docs or adding common paths
            const baseUrl = url.replace(/\/docs\/?$/, "").replace(/\/swagger-ui\/?$/, "");
            const commonPaths = ["/openapi.json", "/swagger.json", "/v2/api-docs", "/api-docs"];
            
            let found = false;
            for (const p of commonPaths) {
                const tryUrl = baseUrl.endsWith("/") ? `${baseUrl}${p.slice(1)}` : `${baseUrl}${p}`;
                try {
                    const tryRes = await fetch(tryUrl);
                    if (tryRes.ok && (tryRes.headers.get("content-type") || "").includes("json")) {
                        console.log(`✨ Found spec at: ${tryUrl}`);
                        spec = await tryRes.json();
                        found = true;
                        break;
                    }
                } catch {
                    continue;
                }
            }

            if (!found) {
                throw new Error("Could not automatically find the OpenAPI/Swagger JSON from the documentation page. Please provide the direct JSON URL.");
            }
        } else {
            spec = await response.json();
        }

        const schemas = spec.components?.schemas || spec.definitions || {};
        
        if (Object.keys(schemas).length === 0) {
            console.warn("⚠️ No schemas or definitions found in the specification.");
            return;
        }

        let typeDefinitions = `/**\n * Auto-generated types from Swagger/OpenAPI\n * Generated at ${new Date().toISOString()}\n */\n\n`;

        for (const [name, schema] of Object.entries(schemas)) {
            typeDefinitions += generateInterface(name, schema as any) + "\n\n";
        }

        const outputPath = path.join(process.cwd(), output);
        const outputDir = path.dirname(outputPath);
        
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputPath, typeDefinitions, "utf8");

        console.log(`✅ Successfully generated ${Object.keys(schemas).length} types!`);
        console.log(`📝 Output: ${outputPath}\n`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Swagger Error: ${message}`);
        process.exit(1);
    }
}

function generateInterface(name: string, schema: any): string {
    // Sanitize name (remove invalid characters)
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "");
    
    if (schema.type === "object" || schema.properties) {
        const properties = schema.properties || {};
        const required = schema.required || [];
        
        const props = Object.entries(properties)
            .map(([propName, propSchema]: [string, any]) => {
                const isRequired = required.includes(propName);
                const type = mapOpenApiToTs(propSchema);
                return `  ${propName}${isRequired ? "" : "?"}: ${type};`;
            })
            .join("\n");

        return `export interface ${sanitizedName} {\n${props}\n}`;
    }

    if (schema.enum) {
        const values = schema.enum.map((v: any) => typeof v === "string" ? `'${v}'` : v).join(" | ");
        return `export type ${sanitizedName} = ${values};`;
    }

    return `export type ${sanitizedName} = ${mapOpenApiToTs(schema)};`;
}

function mapOpenApiToTs(schema: any): string {
    if (!schema) return "any";

    // Handle references
    if (schema.$ref) {
        const refName = schema.$ref.split("/").pop();
        return refName ? refName.replace(/[^a-zA-Z0-9]/g, "") : "any";
    }

    // Handle basic types
    switch (schema.type) {
        case "string":
            if (schema.format === "date" || schema.format === "date-time") return "string | Date";
            return "string";
        case "integer":
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        case "array":
            const itemType = mapOpenApiToTs(schema.items);
            return `${itemType}[]`;
        case "object":
            if (schema.additionalProperties) {
                return `Record<string, ${mapOpenApiToTs(schema.additionalProperties)}>`;
            }
            return "Record<string, any>";
        default:
            // Handle combinations (oneOf, anyOf, allOf)
            if (schema.oneOf || schema.anyOf) {
                const types = (schema.oneOf || schema.anyOf).map((s: any) => mapOpenApiToTs(s));
                return `(${types.join(" | ")})`;
            }
            if (schema.allOf) {
                const types = schema.allOf.map((s: any) => mapOpenApiToTs(s));
                return `(${types.join(" & ")})`;
            }
            return "any";
    }
}
