import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateTypesFromEndpoint } from "./type-generator.js";

const DEFAULT_API_DIR = "api";
const DEFAULT_HOOKS_DIR = "hooks";

type CreateFlags = {
    apiDir?: string;
    hooksDir?: string;
    route?: string;
    force?: boolean;
    queryLib?: "react-query" | "rtk-query";
};

type ResourceConfig = {
    apiDir: string;
    hooksDir: string;
    force: boolean;
    resourceSegments: string[];
    route: string;
    queryLib: "react-query" | "rtk-query";
};

export async function runCli(argv: string[]): Promise<void> {
    if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
        printHelp();
        return;
    }

    const [command, target, ...rest] = argv;

    if (command === "create") {
        await handleCreate(target, rest);
    } else if (command === "types") {
        await handleTypes(target, rest);
    } else {
        console.error(`\u001b[31mUnknown command:\u001b[0m ${command}`);
        printHelp();
        process.exit(1);
    }
}

async function handleCreate(
    resource: string | undefined,
    args: string[]
): Promise<void> {
    if (!resource || resource.startsWith("--")) {
        console.error("\u001b[31mMissing resource name.\u001b[0m");
        printCreateHelp();
        process.exit(1);
    }

    const flags = parseCreateFlags(args);
    const resourceSegments = resource.split("/").filter(Boolean);
    if (resourceSegments.length === 0) {
        console.error("\u001b[31mResource name cannot be empty.\u001b[0m");
        process.exit(1);
    }

    const config: ResourceConfig = {
        apiDir: flags.apiDir ?? DEFAULT_API_DIR,
        hooksDir: flags.hooksDir ?? DEFAULT_HOOKS_DIR,
        force: Boolean(flags.force),
        route: flags.route ?? `/${resourceSegments.join("/")}`,
        resourceSegments,
        queryLib: flags.queryLib ?? "react-query",
    };

    await createResourceFiles(config);
}

async function handleTypes(
    endpoint: string | undefined,
    args: string[]
): Promise<void> {
    if (!endpoint) {
        console.error("\u001b[31mMissing endpoint URL.\u001b[0m");
        printTypesHelp();
        process.exit(1);
    }

    const flags = parseTypesFlags(args);

    await generateTypesFromEndpoint({
        endpoint,
        method: (flags.method ?? "GET") as
            | "GET"
            | "POST"
            | "PUT"
            | "PATCH"
            | "DELETE",
        output: flags.output,
        name: flags.name,
        headers: flags.headers,
    });
}

function parseCreateFlags(args: string[]): CreateFlags {
    const flags: CreateFlags = {};

    for (const arg of args) {
        if (!arg.startsWith("--")) {
            console.warn(`Ignoring unexpected argument "${arg}".`);
            continue;
        }

        const withoutDashes = arg.slice(2);
        const [rawKey, rawValue] = withoutDashes.split("=", 2);
        const key = rawKey.trim();

        if (key === "force") {
            flags.force = rawValue === undefined ? true : rawValue === "true";
            continue;
        }

        if (rawValue === undefined) {
            console.warn(`Flag "--${key}" requires a value; ignoring.`);
            continue;
        }

        switch (key) {
            case "apiDir":
                flags.apiDir = rawValue;
                break;
            case "hooksDir":
                flags.hooksDir = rawValue;
                break;
            case "route":
                flags.route = rawValue;
                break;
            case "queryLib":
                if (rawValue === "react-query" || rawValue === "rtk-query") {
                    flags.queryLib = rawValue;
                } else {
                    console.warn(
                        `Invalid queryLib value "${rawValue}". Use "react-query" or "rtk-query".`
                    );
                }
                break;
            default:
                console.warn(`Unrecognized flag "--${key}"; ignoring.`);
        }
    }

    return flags;
}

function parseTypesFlags(args: string[]): {
    method?: string;
    output?: string;
    name?: string;
    headers: Record<string, string>;
} {
    const flags: {
        method?: string;
        output?: string;
        name?: string;
        headers: Record<string, string>;
    } = { headers: {} };

    for (const arg of args) {
        if (!arg.startsWith("--")) {
            console.warn(`Ignoring unexpected argument "${arg}".`);
            continue;
        }

        const withoutDashes = arg.slice(2);
        const [rawKey, rawValue] = withoutDashes.split("=", 2);
        const key = rawKey.trim();

        if (rawValue === undefined) {
            console.warn(`Flag "--${key}" requires a value; ignoring.`);
            continue;
        }

        switch (key) {
            case "method":
                flags.method = rawValue.toUpperCase();
                break;
            case "output":
                flags.output = rawValue;
                break;
            case "name":
                flags.name = rawValue;
                break;
            case "header": {
                const [headerKey, headerValue] = rawValue.split(":", 2);
                if (headerKey && headerValue) {
                    flags.headers[headerKey.trim()] = headerValue.trim();
                }
                break;
            }
            default:
                console.warn(`Unrecognized flag "--${key}"; ignoring.`);
        }
    }

    return flags;
}

async function createResourceFiles(config: ResourceConfig): Promise<void> {
    const { apiDir, hooksDir, force, resourceSegments, route } = config;
    const lastSegment = resourceSegments[resourceSegments.length - 1];
    const pascalPlural = toPascalCase(lastSegment);
    const singularSegment = toSingular(lastSegment);
    const pascalSingular = toPascalCase(singularSegment);
    const resolvedRoute = route.startsWith("/") ? route : `/${route}`;
    const resourceKey = resourceSegments.join("/");

    const apiResourceDir = path.join(
        process.cwd(),
        apiDir,
        ...resourceSegments
    );
    const hooksResourceDir = path.join(
        process.cwd(),
        hooksDir,
        ...resourceSegments
    );
    await fs.mkdir(apiResourceDir, { recursive: true });
    await fs.mkdir(hooksResourceDir, { recursive: true });

    const apiFilePath = path.join(apiResourceDir, "index.ts");
    const hooksFilePath = path.join(hooksResourceDir, `use${pascalPlural}.ts`);
    const hooksIndexPath = path.join(hooksResourceDir, "index.ts");
    const apiImportPath = buildImportPath(hooksResourceDir, apiResourceDir);

    await writeFileIfAllowed(
        apiFilePath,
        buildApiTemplate({
            pluralPascal: pascalPlural,
            singularPascal: pascalSingular,
            route: resolvedRoute,
        }),
        force
    );

    await writeFileIfAllowed(
        hooksFilePath,
        config.queryLib === "rtk-query"
            ? buildRtkQueryHooksTemplate({
                  pascalPlural,
                  pascalSingular,
                  resourceKey,
                  apiImportPath,
              })
            : buildHooksTemplate({
                  pascalPlural,
                  pascalSingular,
                  resourceKey,
                  apiImportPath,
              }),
        force
    );

    await writeFileIfAllowed(
        hooksIndexPath,
        `export * from "./use${pascalPlural}";\n`,
        force
    );

    console.log(
        `Scaffolded "${resourceKey}" under "${apiDir}" and "${hooksDir}".`
    );
}

function buildImportPath(fromDir: string, toDir: string): string {
    const relativePath = path.relative(fromDir, toDir).replace(/\\/g, "/");
    if (!relativePath.startsWith(".")) {
        return `./${relativePath}`;
    }

    return relativePath;
}

async function writeFileIfAllowed(
    filePath: string,
    content: string,
    force: boolean
): Promise<void> {
    try {
        await fs.access(filePath);
        if (!force) {
            console.warn(`Skipping existing file: ${filePath}`);
            return;
        }
    } catch {
        // file does not exist
    }

    await fs.writeFile(filePath, content, "utf8");
    console.log(`Generated ${filePath}`);
}

function buildApiTemplate(options: {
    pluralPascal: string;
    singularPascal: string;
    route: string;
}): string {
    const { pluralPascal, singularPascal, route } = options;
    return `import type { ApiClient } from "bytekit";

const RESOURCE_PATH = "${route}";

export interface ${singularPascal}Dto {
    id: string;
    /** Extend with the fields returned by the API. */
}

export type Create${singularPascal}Dto = Omit<${singularPascal}Dto, "id">;
export type Update${singularPascal}Dto = Partial<Omit<${singularPascal}Dto, "id">>;

export type ${singularPascal}Filters = Record<string, string | number | boolean | undefined>;

export const list${pluralPascal} = (
    client: ApiClient,
    filters?: ${singularPascal}Filters
) => client.get<${singularPascal}Dto[]>(RESOURCE_PATH, { searchParams: filters });

export const get${singularPascal} = (client: ApiClient, id: string) =>
    client.get<${singularPascal}Dto>(RESOURCE_PATH + "/" + id);

export const create${singularPascal} = (client: ApiClient, payload: Create${singularPascal}Dto) =>
    client.post<${singularPascal}Dto>(RESOURCE_PATH, { body: payload });

export const update${singularPascal} = (
    client: ApiClient,
    id: string,
    payload: Update${singularPascal}Dto
) => client.patch<${singularPascal}Dto>(RESOURCE_PATH + "/" + id, { body: payload });

export const delete${singularPascal} = (client: ApiClient, id: string) =>
    client.delete<void>(RESOURCE_PATH + "/" + id);

`;
}

function buildRtkQueryHooksTemplate(options: {
    pascalPlural: string;
    pascalSingular: string;
    resourceKey: string;
    apiImportPath: string;
}): string {
    const { pascalPlural, pascalSingular, resourceKey, apiImportPath } =
        options;

    return `import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ApiClient } from "bytekit";
import {
    list${pascalPlural},
    get${pascalSingular},
    create${pascalSingular},
    update${pascalSingular},
    delete${pascalSingular},
    type ${pascalSingular}Dto,
    type Create${pascalSingular}Dto,
    type Update${pascalSingular}Dto,
    type ${pascalSingular}Filters,
} from "${apiImportPath}";

const resourceKey = "${resourceKey}";

export const ${pascalSingular.toLowerCase()}Api = createApi({
    reducerPath: "${pascalSingular.toLowerCase()}Api",
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.REACT_APP_API_URL || "",
    }),
    tagTypes: ["${pascalSingular}"],
    endpoints: (builder) => ({
        list${pascalPlural}: builder.query<${pascalSingular}Dto[], ${pascalSingular}Filters | undefined>({
            query: (filters) => ({
                url: resourceKey,
                params: filters,
            }),
            providesTags: ["${pascalSingular}"],
        }),
        get${pascalSingular}: builder.query<${pascalSingular}Dto, string>({
            query: (id) => \`\${resourceKey}/\${id}\`,
            providesTags: (result, error, id) => [{ type: "${pascalSingular}", id }],
        }),
        create${pascalSingular}: builder.mutation<${pascalSingular}Dto, Create${pascalSingular}Dto>({
            query: (payload) => ({
                url: resourceKey,
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["${pascalSingular}"],
        }),
        update${pascalSingular}: builder.mutation<
            ${pascalSingular}Dto,
            { id: string; payload: Update${pascalSingular}Dto }
        >({
            query: ({ id, payload }) => ({
                url: \`\${resourceKey}/\${id}\`,
                method: "PATCH",
                body: payload,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "${pascalSingular}", id },
                "${pascalSingular}",
            ],
        }),
        delete${pascalSingular}: builder.mutation<void, string>({
            query: (id) => ({
                url: \`\${resourceKey}/\${id}\`,
                method: "DELETE",
            }),
            invalidatesTags: ["${pascalSingular}"],
        }),
    }),
});

export const {
    useList${pascalPlural}Query,
    useGet${pascalSingular}Query,
    useCreate${pascalSingular}Mutation,
    useUpdate${pascalSingular}Mutation,
    useDelete${pascalSingular}Mutation,
} = ${pascalSingular.toLowerCase()}Api;

`;
}

function buildHooksTemplate(options: {
    pascalPlural: string;
    pascalSingular: string;
    resourceKey: string;
    apiImportPath: string;
}): string {
    const { pascalPlural, pascalSingular, resourceKey, apiImportPath } =
        options;

    return `import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from "@tanstack/react-query";
import type { ApiClient } from "bytekit";
import {
    list${pascalPlural},
    get${pascalSingular},
    create${pascalSingular},
    update${pascalSingular},
    delete${pascalSingular},
    type ${pascalSingular}Dto,
    type Create${pascalSingular}Dto,
    type Update${pascalSingular}Dto,
    type ${pascalSingular}Filters,
} from "${apiImportPath}";

const resourceKey = ["${resourceKey}"] as const;

export const ${pascalSingular.toLowerCase()}Keys = {
    all: resourceKey,
    detail: (id: string) => [...resourceKey, id] as const,
};

export const use${pascalPlural} = (
    client: ApiClient,
    filters?: ${pascalSingular}Filters,
    options?: UseQueryOptions<${pascalSingular}Dto[], Error>
) =>
    useQuery({
        queryKey: filters ? [...resourceKey, filters] : resourceKey,
        queryFn: () => list${pascalPlural}(client, filters),
        ...options,
    });

export const use${pascalSingular} = (
    client: ApiClient,
    id?: string,
    options?: UseQueryOptions<${pascalSingular}Dto, Error>
) =>
    useQuery({
        queryKey: id ? [...resourceKey, id] : [...resourceKey, "detail"],
        queryFn: () => {
            if (!id) {
                throw new Error("${pascalSingular} id is required");
            }

            return get${pascalSingular}(client, id);
        },
        enabled: Boolean(id),
        ...options,
    });

type CreateMutationVars = Create${pascalSingular}Dto;
type UpdateMutationVars = {
    id: string;
    payload: Update${pascalSingular}Dto;
};
type DeleteMutationVars = {
    id: string;
};

export const useCreate${pascalSingular} = (
    client: ApiClient,
    options?: UseMutationOptions<${pascalSingular}Dto, unknown, CreateMutationVars>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => create${pascalSingular}(client, payload),
        ...options,
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(resourceKey);
            options?.onSuccess?.(data, variables, context);
        },
    });
};

export const useUpdate${pascalSingular} = (
    client: ApiClient,
    options?: UseMutationOptions<${pascalSingular}Dto, unknown, UpdateMutationVars>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }) => update${pascalSingular}(client, id, payload),
        ...options,
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(resourceKey);
            if (variables?.id) {
                queryClient.invalidateQueries(${pascalSingular.toLowerCase()}Keys.detail(variables.id));
            }
            options?.onSuccess?.(data, variables, context);
        },
    });
};

export const useDelete${pascalSingular} = (
    client: ApiClient,
    options?: UseMutationOptions<void, unknown, DeleteMutationVars>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }) => delete${pascalSingular}(client, id),
        ...options,
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(resourceKey);
            if (variables?.id) {
                queryClient.invalidateQueries(${pascalSingular.toLowerCase()}Keys.detail(variables.id));
            }
            options?.onSuccess?.(data, variables, context);
        },
    });
};

`;
}

function toPascalCase(value: string): string {
    return value
        .split(/[^a-zA-Z0-9]/)
        .filter(Boolean)
        .map(
            (segment) =>
                segment[0].toUpperCase() + segment.slice(1).toLowerCase()
        )
        .join("");
}

function toSingular(value: string): string {
    const lower = value.toLowerCase();
    if (lower.endsWith("ies")) {
        return `${value.slice(0, -3)}y`;
    }

    if (
        lower.endsWith("ses") ||
        lower.endsWith("xes") ||
        lower.endsWith("zes") ||
        lower.endsWith("ches") ||
        lower.endsWith("shes")
    ) {
        return value.slice(0, -2);
    }

    if (lower.endsWith("s")) {
        return value.slice(0, -1);
    }

    return value;
}

function printHelp(): void {
    console.log(`sutils <command> [args]

Commands
  create <resource>         Scaffold API + hooks for a resource.
  types <endpoint>          Generate TypeScript types from API response.

Run \`sutils create --help\` or \`sutils types --help\` for details.
`);
}

function printCreateHelp(): void {
    console.log(`sutils create <resource> [options]

Options
  --apiDir=<dir>            Base directory for API files (default: api).
  --hooksDir=<dir>          Base directory for hooks (default: hooks).
  --route=</path>           API route path (default: derived from resource).
  --queryLib=<lib>          Query library: "react-query" or "rtk-query" (default: react-query).
  --force                   Overwrite existing files.

Examples
  sutils create users
  sutils create users --queryLib=rtk-query
  sutils create posts --apiDir=src/api --hooksDir=src/hooks --force
`);
}

function printTypesHelp(): void {
    console.log(`sutils types <endpoint> [options]

Options
  --method=<METHOD>         HTTP method (default: GET).
  --output=<file>           Output file path (default: types.ts).
  --name=<name>             Type name (default: ApiResponse).
  --header=<key:value>      Custom header (can be used multiple times).

Examples
  sutils types https://api.example.com/users
  sutils types https://api.example.com/users --output=user-types.ts --name=User
  sutils types https://api.example.com/users --method=POST --header=Authorization:Bearer token
`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runCli(process.argv.slice(2)).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
