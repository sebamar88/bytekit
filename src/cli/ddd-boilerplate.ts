import fs from "node:fs/promises";
import path from "node:path";

export interface DddBoilerplateOptions {
    /** Bounded context / módulo de dominio (nombre legible o slug). */
    domain: string;
    /**
     * Nombre del puerto secundario (driven): persistencia, APIs externas, mensajería, etc.
     * Se genera como interfaz TypeScript en `application/ports/outbound/`.
     */
    port: string;
    /** Directorio base de salida (por defecto: `./<dominio-slug>`). */
    outDir?: string;
    /**
     * Domain actions to scaffold. For each action a use case class is generated and a method
     * is added to the repository interface and the HTTP infrastructure adapter.
     * Supported: create · findById · findAll · update · patch · delete — plus any custom name.
     */
    actions?: string[];
}

const DDD_RELATIVE_DIRS = [
    "domain/entities",
    "domain/value-objects",
    "domain/aggregates",
    "domain/events",
    "domain/repositories",
    "domain/services",
    "application/use-cases",
    "application/dto",
    "application/ports/inbound",
    "application/ports/outbound",
    "infrastructure/persistence",
    "infrastructure/config",
    "presentation/http/routes",
    "presentation/http/controllers",
] as const;

const PORT_DIRS_SKIP_GITKEEP = new Set<string>([
    "application/ports/inbound",
    "application/ports/outbound",
]);

/**
 * Normaliza el nombre del dominio a kebab-case para rutas y carpetas.
 */
export function slugifyDomain(domain: string): string {
    const trimmed = domain.trim();
    if (!trimmed) {
        return "domain";
    }
    return trimmed
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
}

/**
 * Convierte un slug kebab-case a identificador PascalCase.
 */
export function pascalFromKebabSlug(slug: string): string {
    return slug
        .split("-")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
}

// ─── Action inference helpers ────────────────────────────────────────────────

type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ActionConfig {
    action: string;
    verb: HttpVerb;
    params: Array<{ name: string; type: string }>;
    returnType: string;
    /** Whether the URL includes a trailing `/${id}` segment. */
    hasIdSegment: boolean;
    /** Name of the argument to JSON-serialize as the request body, if any. */
    bodyArg?: string;
}

function inferHttpVerb(action: string): HttpVerb {
    const a = action.toLowerCase();
    if (/^(create|add|save|insert)/.test(a)) return "POST";
    if (/^(update|replace)/.test(a)) return "PUT";
    if (/^patch/.test(a)) return "PATCH";
    if (/^(delete|remove|destroy)/.test(a)) return "DELETE";
    return "GET";
}

function resolveActionConfig(action: string, pascal: string): ActionConfig {
    const verb = inferHttpVerb(action);
    const isList = /all|many|list|search/.test(action.toLowerCase());

    switch (verb) {
        case "POST":
            return {
                action,
                verb,
                params: [{ name: "entity", type: `${pascal}Entity` }],
                returnType: `${pascal}Entity`,
                hasIdSegment: false,
                bodyArg: "entity",
            };
        case "PUT":
            return {
                action,
                verb,
                params: [
                    { name: "id", type: "string" },
                    { name: "entity", type: `${pascal}Entity` },
                ],
                returnType: `${pascal}Entity`,
                hasIdSegment: true,
                bodyArg: "entity",
            };
        case "PATCH":
            return {
                action,
                verb,
                params: [
                    { name: "id", type: "string" },
                    { name: "data", type: `Partial<${pascal}EntityProps>` },
                ],
                returnType: `${pascal}Entity`,
                hasIdSegment: true,
                bodyArg: "data",
            };
        case "DELETE":
            return {
                action,
                verb,
                params: [{ name: "id", type: "string" }],
                returnType: "void",
                hasIdSegment: true,
            };
        default: // GET
            return {
                action,
                verb,
                params: isList ? [] : [{ name: "id", type: "string" }],
                returnType: isList
                    ? `${pascal}Entity[]`
                    : `${pascal}Entity | null`,
                hasIdSegment: !isList,
            };
    }
}

// ─── Source generators ────────────────────────────────────────────────────────

function generateEntitySource(slug: string, pascal: string): string {
    return `/**
 * Aggregate root entity for the ${pascal} bounded context.
 * Contains core domain invariants — keep business rules here, not in use cases.
 *
 * @generated bytekit --ddd
 */
export class ${pascal}Entity {
    readonly id: string;
    readonly createdAt: Date;

    constructor(props: ${pascal}EntityProps) {
        if (!props.id?.trim()) {
            throw new Error("${pascal}Entity: 'id' is required and cannot be empty.");
        }
        this.id = props.id.trim();
        this.createdAt = props.createdAt ?? new Date();
    }
}

/** Constructor properties for {@link ${pascal}Entity}. */
export interface ${pascal}EntityProps {
    id: string;
    createdAt?: Date;
}
`;
}

function generateRepoInterfaceSource(
    slug: string,
    pascal: string,
    configs: ActionConfig[]
): string {
    const needsProps = configs.some((c) =>
        c.params.some((p) => p.type.includes("Props"))
    );
    const entityImport = needsProps
        ? `import type { ${pascal}Entity, ${pascal}EntityProps } from "../entities/${slug}.entity.js";`
        : `import type { ${pascal}Entity } from "../entities/${slug}.entity.js";`;

    const methods = configs
        .map((c) => {
            const sig = c.params.map((p) => `${p.name}: ${p.type}`).join(", ");
            return `    ${c.action}(${sig}): Promise<${c.returnType}>;`;
        })
        .join("\n");

    return `${entityImport}

/**
 * Outbound port (secondary): persistence and data-access contract for ${pascal}.
 * Domain and application layers depend on this interface — never on its implementations.
 *
 * @generated bytekit --ddd
 */
export interface I${pascal}Repository {
${methods}
}
`;
}

function generateUseCaseSource(
    config: ActionConfig,
    slug: string,
    pascal: string
): string {
    const actionPascal =
        config.action.charAt(0).toUpperCase() + config.action.slice(1);
    const paramStr = config.params
        .map((p) => `${p.name}: ${p.type}`)
        .join(", ");
    const callArgs = config.params.map((p) => p.name).join(", ");

    const needsEntity =
        config.params.some((p) => p.type.includes(`${pascal}Entity`)) ||
        config.returnType.includes(`${pascal}Entity`);
    const needsProps = config.params.some((p) =>
        p.type.includes(`${pascal}EntityProps`)
    );

    const namedImports = [
        needsEntity ? `${pascal}Entity` : "",
        needsProps ? `${pascal}EntityProps` : "",
    ]
        .filter(Boolean)
        .join(", ");

    const entityImportLine = namedImports
        ? `import type { ${namedImports} } from "../../domain/entities/${slug}.entity.js";\n`
        : "";

    return `import type { I${pascal}Repository } from "../../domain/repositories/i-${slug}.repository.js";
${entityImportLine}
/**
 * Use case: ${actionPascal} ${pascal}.
 * Orchestrates domain logic without containing it — delegates to the repository port.
 *
 * @generated bytekit --ddd
 */
export class ${actionPascal}${pascal}UseCase {
    constructor(private readonly repository: I${pascal}Repository) {}

    async execute(${paramStr}): Promise<${config.returnType}> {
        return this.repository.${config.action}(${callArgs});
    }
}
`;
}

function generateHttpRepoSource(
    slug: string,
    pascal: string,
    configs: ActionConfig[]
): string {
    const needsProps = configs.some((c) =>
        c.params.some((p) => p.type.includes("Props"))
    );
    const entityImportParts = [
        `${pascal}Entity`,
        needsProps ? `${pascal}EntityProps` : "",
    ]
        .filter(Boolean)
        .join(", ");

    const header = [
        `import { ApiClient } from "bytekit/api-client";`,
        `import type { ${entityImportParts} } from "../../domain/entities/${slug}.entity.js";`,
        `import type { I${pascal}Repository } from "../../domain/repositories/i-${slug}.repository.js";`,
    ].join("\n");

    const methods = configs
        .map((c) => generateHttpMethod(c, slug, pascal))
        .join("\n\n");

    return `${header}

/**
 * HTTP adapter: implements {@link I${pascal}Repository} using {@link ApiClient} from bytekit.
 * Lives in the infrastructure layer — domain and application layers must not import this class.
 *
 * @generated bytekit --ddd
 */
export class Http${pascal}Repository implements I${pascal}Repository {
    constructor(private readonly client: ApiClient) {}

${methods}
}
`;
}

function generateHttpMethod(
    c: ActionConfig,
    slug: string,
    _pascal: string
): string {
    const paramStr = c.params.map((p) => `${p.name}: ${p.type}`).join(", ");
    const urlPath = c.hasIdSegment ? `/${slug}/\${id}` : `/${slug}`;
    const clientUrl = c.hasIdSegment ? `\`${urlPath}\`` : `"${urlPath}"`;

    if (c.verb === "DELETE") {
        return `    async ${c.action}(${paramStr}): Promise<${c.returnType}> {\n        await this.client.delete<void>(${clientUrl});\n    }`;
    }
    if (c.bodyArg) {
        const method = c.verb.toLowerCase();
        return `    async ${c.action}(${paramStr}): Promise<${c.returnType}> {\n        return this.client.${method}<${c.returnType}>(${clientUrl}, ${c.bodyArg});\n    }`;
    }
    return `    async ${c.action}(${paramStr}): Promise<${c.returnType}> {\n        return this.client.get<${c.returnType}>(${clientUrl});\n    }`;
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Crea la estructura de carpetas DDD + interfaces de puertos hexagonales
 * (primario en inbound, secundario en outbound).
 */
export async function generateDddBoilerplate(
    options: DddBoilerplateOptions
): Promise<{ rootDir: string; slug: string }> {
    const slug = slugifyDomain(options.domain);
    if (!options.domain.trim()) {
        throw new Error("El dominio no puede estar vacío.");
    }
    const portLabel = options.port.trim();
    if (!portLabel) {
        throw new Error(
            "El puerto (interfaz driven/outbound) no puede estar vacío."
        );
    }

    const rootDir = path.resolve(process.cwd(), options.outDir?.trim() || slug);

    const contextPascal = pascalFromKebabSlug(slug);
    const outboundSlug = slugifyDomain(portLabel);
    const outboundPascal = pascalFromKebabSlug(outboundSlug);

    for (const rel of DDD_RELATIVE_DIRS) {
        await fs.mkdir(path.join(rootDir, rel), { recursive: true });
    }

    for (const rel of DDD_RELATIVE_DIRS) {
        if (PORT_DIRS_SKIP_GITKEEP.has(rel)) {
            continue;
        }
        const gitkeep = path.join(rootDir, rel, ".gitkeep");
        try {
            await fs.writeFile(gitkeep, "", { flag: "wx" });
        } catch (e) {
            if (
                e instanceof Error &&
                "code" in e &&
                (e as NodeJS.ErrnoException).code === "EEXIST"
            ) {
                continue;
            }
            throw e;
        }
    }

    const inboundFile = path.join(
        rootDir,
        "application",
        "ports",
        "inbound",
        `${slug}-primary.port.ts`
    );
    const inboundSource = `/**
 * Puerto primario (driving): contrato por el que el mundo exterior invoca la aplicación
 * (HTTP, CLI, jobs, mensajes, etc.). Los adaptadores de entrada lo implementan o llaman a los casos de uso.
 *
 * Contexto: ${slug}
 * Generado por bytekit --ddd
 */
export interface ${contextPascal}PrimaryPort {
    // Ej.: firmas que exponen comandos o consultas hacia el dominio / casos de uso
}
`;

    const outboundFile = path.join(
        rootDir,
        "application",
        "ports",
        "outbound",
        `${outboundSlug}.port.ts`
    );
    const outboundSource = `/**
 * Puerto secundario (driven): contrato que la aplicación define para hablar con el exterior
 * (persistencia, APIs de terceros, sistema de archivos, colas, etc.).
 * Las implementaciones viven en infrastructure/.
 *
 * Puerto: ${outboundPascal}
 * Contexto: ${slug}
 * Generado por bytekit --ddd
 */
export interface ${outboundPascal} {
    // Ej.: guardar o recuperar agregados, publicar eventos, llamar a un servicio externo
}
`;

    await fs.writeFile(inboundFile, inboundSource, "utf8");
    await fs.writeFile(outboundFile, outboundSource, "utf8");

    // ── DDD full-layer generation (requires --actions) ────────────────────────
    if (options.actions && options.actions.length > 0) {
        const normalizedActions = options.actions
            .map((a) => a.trim())
            .filter(Boolean);
        const configs = normalizedActions.map((a) =>
            resolveActionConfig(a, contextPascal)
        );

        // 1. Entity
        const entityFile = path.join(
            rootDir,
            "domain",
            "entities",
            `${slug}.entity.ts`
        );
        await fs.writeFile(
            entityFile,
            generateEntitySource(slug, contextPascal),
            "utf8"
        );

        // 2. Repository interface
        const repoInterfaceFile = path.join(
            rootDir,
            "domain",
            "repositories",
            `i-${slug}.repository.ts`
        );
        await fs.writeFile(
            repoInterfaceFile,
            generateRepoInterfaceSource(slug, contextPascal, configs),
            "utf8"
        );

        // 3. Use cases (one file per action)
        for (const config of configs) {
            const actionSlug = slugifyDomain(config.action);
            const useCaseFile = path.join(
                rootDir,
                "application",
                "use-cases",
                `${actionSlug}-${slug}.use-case.ts`
            );
            await fs.writeFile(
                useCaseFile,
                generateUseCaseSource(config, slug, contextPascal),
                "utf8"
            );
        }

        // 4. HTTP infrastructure repository
        const httpRepoFile = path.join(
            rootDir,
            "infrastructure",
            "persistence",
            `http-${slug}.repository.ts`
        );
        await fs.writeFile(
            httpRepoFile,
            generateHttpRepoSource(slug, contextPascal, configs),
            "utf8"
        );
    }

    return { rootDir, slug };
}
