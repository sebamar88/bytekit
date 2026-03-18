/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generic interface for schema validation adapters (e.g., Zod, Valibot, ArkType)
 */
export interface SchemaAdapter<T = unknown> {
    /**
     * Parses and validates the data. Should throw an error if validation fails.
     * Returns the validated (and potentially transformed) data.
     */
    parse: (data: unknown) => T;
}

/**
 * Adapter for Zod schemas.
 * Since Zod schemas already have a `parse` method, this just provides type safety,
 * but you can also pass a Zod schema directly to `validateResponse`.
 */
export function zodAdapter<T>(schema: {
    parse: (data: unknown) => T;
}): SchemaAdapter<T> {
    return {
        parse: (data: unknown) => schema.parse(data),
    };
}

/**
 * Adapter for Valibot schemas.
 * Wraps Valibot's `parse` function and schema into a SchemaAdapter.
 *
 * @example
 * import { object, string } from "valibot";
 * import { valibotAdapter } from "bytekit";
 *
 * const schema = object({ name: string() });
 * const adapter = valibotAdapter(schema, parse);
 */
export function valibotAdapter<T>(
    schema: unknown,
    parseFn: (schema: any, data: unknown) => T
): SchemaAdapter<T> {
    return {
        parse: (data: unknown) => parseFn(schema, data),
    };
}

/**
 * Type guard to check if an object is a SchemaAdapter
 */
export function isSchemaAdapter(obj: unknown): obj is SchemaAdapter {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "parse" in obj &&
        typeof (obj as Record<string, unknown>).parse === "function"
    );
}
