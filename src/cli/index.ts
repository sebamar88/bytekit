import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateTypesFromEndpoint } from "./type-generator.js";
import { generateFromSwagger } from "./swagger-generator.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Main CLI entry point for bytekit
 */
export async function runCli(argv: string[]): Promise<void> {
    if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
        printHelp();
        return;
    }

    const options: {
        type?: boolean;
        swagger?: boolean;
        method: HttpMethod;
        body?: string;
        url?: string;
        headers: Record<string, string>;
    } = {
        method: "GET",
        headers: {},
    };

    const VALID_METHODS: HttpMethod[] = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
    ];

    // Simple argument parser
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--type") {
            options.type = true;
        } else if (arg === "--swagger") {
            options.swagger = true;
        } else if (arg.startsWith("--method=")) {
            const inputMethod = arg.split("=")[1].toUpperCase();
            if (VALID_METHODS.includes(inputMethod as HttpMethod)) {
                options.method = inputMethod as HttpMethod;
            }
        } else if (arg.startsWith("--body=")) {
            options.body = arg.split("=")[1];
        } else if (
            arg.startsWith("--header=") ||
            arg.startsWith("--headers=")
        ) {
            const fullValue = arg.split("=")[1];
            // Split only on the first colon to support values like "Authorization: Bearer key:123"
            const firstColonIndex = fullValue.indexOf(":");
            if (firstColonIndex !== -1) {
                const key = fullValue.slice(0, firstColonIndex).trim();
                const value = fullValue.slice(firstColonIndex + 1).trim();
                options.headers[key] = value;
            }
        } else if (!arg.startsWith("-")) {
            options.url = arg;
        }
    }

    if (!options.url) {
        console.error("\u001b[31mError: Missing URL\u001b[0m");
        process.exit(1);
    }

    if (options.swagger) {
        await generateFromSwagger({ url: options.url });
    } else if (options.type) {
        await handleTypeGeneration(options);
    } else {
        // Simple fetch/curl behavior if --type is not present
        await handleSimpleFetch(options);
    }
}

async function handleTypeGeneration(options: any): Promise<void> {
    const url = new URL(options.url);
    const endpointName = url.pathname.split("/").filter(Boolean).pop() || "api";

    // Create src/types directory if it doesn't exist
    const typesDir = path.join(process.cwd(), "src", "types");
    await fs.mkdir(typesDir, { recursive: true });

    const outputPath = path.join("src", "types", `${endpointName}.ts`);
    const interfaceName =
        endpointName.charAt(0).toUpperCase() + endpointName.slice(1);

    await generateTypesFromEndpoint({
        endpoint: options.url,
        method: options.method,
        body: options.body,
        headers: options.headers,
        output: outputPath,
        name: interfaceName,
    });
}

async function handleSimpleFetch(options: any): Promise<void> {
    console.log(`\n📡 Fetching ${options.method} ${options.url}...`);
    try {
        const response = await fetch(options.url, {
            method: options.method,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            body: options.body,
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(
            `\u001b[31mError:\u001b[0m ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
    }
}

function printHelp(): void {
    console.log(`
\u001b[1mbytekit CLI\u001b[0m - API Inspection & Type Generation

\u001b[1mUsage:\u001b[0m
  bytekit [options] <url>

\u001b[1mOptions:\u001b[0m
  --type                Generate TypeScript types from a single API response.
                        Saves to src/types/{endpoint}.ts
  --swagger             Generate all TypeScript DTOs from a Swagger/OpenAPI spec.
                        Saves to src/types/api-docs.ts
  --method=<METHOD>     HTTP method (GET, POST, PUT, DELETE, PATCH). Default: GET.
  --body=<body>         JSON body for the request.
  --header=<key:val>    Custom HTTP header (can be used multiple times).
  --headers=<key:val>   Alias for --header.

\u001b[1mExamples:\u001b[0m
  bytekit https://api.example.com/users
  bytekit --type https://api.example.com/users
  bytekit --swagger https://api.example.com/swagger.json
  bytekit --type --method=POST --body='{"name":"test"}' https://api.example.com/users
`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runCli(process.argv.slice(2)).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
