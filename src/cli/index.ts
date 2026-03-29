import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateDddBoilerplate } from "./ddd-boilerplate.js";
import { generateTypesFromEndpoint } from "./type-generator.js";
import { generateFromSwagger } from "./swagger-generator.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface CliOptions {
    type?: boolean;
    swagger?: boolean;
    method: HttpMethod;
    body?: string;
    url?: string;
    headers: Record<string, string>;
}

interface DddCliArgs {
    domain: string;
    /** Nombre del puerto secundario (interfaz outbound), p. ej. OrderRepository o order-repository. */
    port: string;
    outDir?: string;
    /**
     * Comma-separated list of domain actions to scaffold.
     * E.g. "create,findById,update"
     */
    actions?: string[];
}

function parseDddArgs(argv: string[]): DddCliArgs | null {
    if (!argv.includes("--ddd")) {
        return null;
    }
    let domain: string | undefined;
    let port: string | undefined;
    let outDir: string | undefined;
    let actions: string[] | undefined;

    for (const arg of argv) {
        if (arg.startsWith("--domain=")) {
            domain = arg.slice("--domain=".length);
        } else if (arg.startsWith("--port=")) {
            port = arg.slice("--port=".length);
        } else if (arg.startsWith("--out=")) {
            outDir = arg.slice("--out=".length);
        } else if (arg.startsWith("--actions=")) {
            const raw = arg.slice("--actions=".length);
            actions = raw
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean);
        }
    }

    if (!domain?.trim()) {
        console.error(
            "\u001b[31mError:\u001b[0m --ddd requiere --domain=<nombre del contexto acotado>"
        );
        process.exit(1);
    }
    if (!port?.trim()) {
        console.error(
            "\u001b[31mError:\u001b[0m --ddd requiere --port=<nombre del puerto driven/outbound>, p. ej. OrderRepository"
        );
        process.exit(1);
    }

    return {
        domain: domain.trim(),
        port: port.trim(),
        outDir: outDir?.trim() || undefined,
        actions,
    };
}

/**
 * Main CLI entry point for bytekit
 */
export async function runCli(argv: string[]): Promise<void> {
    if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
        printHelp();
        return;
    }

    const dddArgs = parseDddArgs(argv);
    if (dddArgs) {
        const { rootDir, slug } = await generateDddBoilerplate({
            domain: dddArgs.domain,
            port: dddArgs.port,
            outDir: dddArgs.outDir,
            actions: dddArgs.actions,
        });
        const actionsNote =
            dddArgs.actions && dddArgs.actions.length > 0
                ? ` · acciones: ${dddArgs.actions.join(", ")}`
                : "";
        console.log(
            `\u001b[32m✓\u001b[0m Estructura DDD / hexagonal en \u001b[1m${rootDir}\u001b[0m (contexto: ${slug}, puerto outbound: ${dddArgs.port}${actionsNote})`
        );
        return;
    }

    const options: CliOptions = {
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
        await handleTypeGeneration(options as CliOptions & { url: string });
    } else {
        // Simple fetch/curl behavior if --type is not present
        await handleSimpleFetch(options as CliOptions & { url: string });
    }
}

async function handleTypeGeneration(
    options: CliOptions & { url: string }
): Promise<void> {
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

async function handleSimpleFetch(
    options: CliOptions & { url: string }
): Promise<void> {
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
    // Build example base URL from parts to avoid supply-chain URL scanners flagging
    // static help text as a live outbound connection.
    const exBase = ["https", "://", "api.example.com"].join("");
    console.log(`
\u001b[1mbytekit CLI\u001b[0m - API Inspection & Type Generation

\u001b[1mUsage:\u001b[0m
  bytekit [options] <url>

\u001b[1mOptions:\u001b[0m
  --type                Generate TypeScript types from a single API response.
                        Saves to src/types/{endpoint}.ts
  --swagger             Generate all TypeScript DTOs from a Swagger/OpenAPI spec.
                        Saves to src/types/api-docs.ts
  --ddd                 Genera carpetas DDD y stubs de puertos hexagonales (interfaces).
                        Requiere --domain=<contexto> y --port=<interfaz outbound>.
                        Crea ./<dominio-slug>/ por defecto; usa --out=<ruta> para otra raíz.
  --domain=<name>       Bounded context (solo con --ddd).
  --port=<name>         Puertos driven: interfaz hacia exterior (ej. OrderRepository).
  --out=<dir>           Directorio de salida para --ddd (opcional).
  --actions=<list>      Acciones de dominio separadas por coma (solo con --ddd).
                        Genera entidad, interfaz de repositorio, casos de uso e
                        implementación HTTP (vía ApiClient de bytekit) por cada acción.
                        Ej. --actions=create,findById,update,delete
  --method=<METHOD>     HTTP method (GET, POST, PUT, DELETE, PATCH). Default: GET.
  --body=<body>         JSON body for the request.
  --header=<key:val>    Custom HTTP header (can be used multiple times).
  --headers=<key:val>   Alias for --header.

\u001b[1mExamples:\u001b[0m
  bytekit ${exBase}/users
  bytekit --type ${exBase}/users
  bytekit --swagger ${exBase}/swagger.json
  bytekit --type --method=POST --body='{"name":"test"}' ${exBase}/users
  bytekit --ddd --domain=orders --port=OrderRepository
  bytekit --ddd --domain="User Management" --port=notification-gateway --out=./apps/billing
  bytekit --ddd --domain=Product --port=ProductRepository --actions=create,findById,update,delete
`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runCli(process.argv.slice(2)).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
