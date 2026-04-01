/** Schema definition used by {@link ResponseValidator.validate}. */
export interface ValidationSchema {
    /** Expected data type of the value being validated. */
    type?: "object" | "array" | "string" | "number" | "boolean";
    /** When `true`, a `null` or `undefined` value is reported as an error. */
    required?: boolean;
    /**
     * Schemas for named properties of an object. Only evaluated when
     * `type` is `"object"`.
     */
    properties?: Record<string, ValidationSchema>;
    /**
     * Schema applied to every element of an array. Only evaluated when
     * `type` is `"array"`.
     */
    items?: ValidationSchema;
    /** Minimum string length (inclusive). Only evaluated when `type` is `"string"`. */
    minLength?: number;
    /** Maximum string length (inclusive). Only evaluated when `type` is `"string"`. */
    maxLength?: number;
    /** Minimum numeric value (inclusive). Only evaluated when `type` is `"number"`. */
    minimum?: number;
    /** Maximum numeric value (inclusive). Only evaluated when `type` is `"number"`. */
    maximum?: number;
    /**
     * Regular expression (or pattern string) that string values must match.
     * Only evaluated when `type` is `"string"`.
     */
    pattern?: RegExp | string;
    /** Set of allowed values; validated using strict equality (`===`). */
    enum?: unknown[];
    /**
     * Custom validation function. Return `true` to pass, `false` to fail with
     * a generic message, or a `string` to fail with that message.
     */
    custom?: (value: unknown) => boolean | string;
}

/** Describes a single validation failure produced by {@link ResponseValidator.validate}. */
export interface ValidationError {
    /** Dot-notation path to the invalid field (e.g., `"order.item.quantity"`). */
    path: string;
    /** Human-readable description of why the value failed validation. */
    message: string;
    /** The actual value that failed validation, if captured. */
    value?: unknown;
}

export class ResponseValidator {
    /**
     * Validates type-specific data
     */
    private static validateByType(
        data: unknown,
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        if (
            schema.type === "object" &&
            typeof data === "object" &&
            !Array.isArray(data)
        ) {
            errors.push(
                ...this.validateObject(
                    data as Record<string, unknown>,
                    schema,
                    path
                )
            );
        } else if (schema.type === "array" && Array.isArray(data)) {
            errors.push(...this.validateArray(data, schema, path));
        } else if (schema.type === "string" && typeof data === "string") {
            errors.push(...this.validateString(data, schema, path));
        } else if (schema.type === "number" && typeof data === "number") {
            errors.push(...this.validateNumber(data, schema, path));
            /* v8 ignore start */
        } else if (schema.type === "boolean" && typeof data === "boolean") {
            errors.push(...this.validateBoolean(data, schema, path));
            /* v8 ignore end */
        }

        return errors;
    }

    /**
     * Validates custom validation rules
     */
    private static validateCustom(
        data: unknown,
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.custom) {
            const result = schema.custom(data);
            if (result !== true) {
                errors.push({
                    path,
                    message:
                        typeof result === "string"
                            ? result
                            : "Custom validation failed",
                    value: data,
                });
            }
        }

        return errors;
    }

    /**
     * Validates `data` against a {@link ValidationSchema} and returns all
     * validation errors found.
     *
     * Performs a recursive deep validation of objects and arrays. Returns an
     * empty array when `data` is fully valid.
     *
     * @param data - The value to validate (any type).
     * @param schema - Schema describing the expected shape and constraints.
     * @param path - Dot-notation path prefix used in error messages.
     *   Defaults to `"root"`.
     * @returns An array of {@link ValidationError} objects; empty when valid.
     *
     * @example
     * ```typescript
     * const errors = ResponseValidator.validate(
     *     { name: 'Alice', age: -1 },
     *     {
     *         type: 'object',
     *         properties: {
     *             name: { type: 'string', required: true },
     *             age: { type: 'number', minimum: 0 },
     *         },
     *     },
     * );
     * // [{ path: 'root.age', message: 'Number must be at least 0', value: -1 }]
     * ```
     */
    static validate(
        data: unknown,
        schema: ValidationSchema,
        path = "root"
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check required
        if (schema.required && (data === null || data === undefined)) {
            errors.push({
                path,
                message: "Value is required",
                value: data,
            });
            return errors;
        }

        if (data === null || data === undefined) {
            return errors;
        }

        // Check type
        /* v8 ignore next */
        if (schema.type) {
            const actualType = Array.isArray(data) ? "array" : typeof data;
            if (actualType !== schema.type) {
                errors.push({
                    path,
                    message: `Expected type ${schema.type}, got ${actualType}`,
                    value: data,
                });
                return errors;
            }
        }

        // Validate based on type
        errors.push(...this.validateByType(data, schema, path));

        // Custom validation
        errors.push(...this.validateCustom(data, schema, path));

        return errors;
    }

    private static validateObject(
        obj: Record<string, unknown>,
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        /* v8 ignore next */
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                const value = obj[key];
                const propPath = `${path}.${key}`;
                errors.push(...this.validate(value, propSchema, propPath));
            }
        }

        return errors;
    }

    private static validateArray(
        arr: unknown[],
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        /* v8 ignore next */
        if (schema.items) {
            arr.forEach((item, index) => {
                const itemPath = `${path}[${index}]`;
                errors.push(...this.validate(item, schema.items!, itemPath));
            });
        }

        return errors;
    }

    private static validateString(
        str: string,
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.minLength !== undefined && str.length < schema.minLength) {
            errors.push({
                path,
                message: `String length must be at least ${schema.minLength}`,
                value: str,
            });
        }

        if (schema.maxLength !== undefined && str.length > schema.maxLength) {
            errors.push({
                path,
                message: `String length must be at most ${schema.maxLength}`,
                value: str,
            });
        }

        if (schema.pattern) {
            const regex =
                schema.pattern instanceof RegExp
                    ? schema.pattern
                    : new RegExp(schema.pattern);
            if (!regex.test(str)) {
                errors.push({
                    path,
                    message: `String does not match pattern ${schema.pattern}`,
                    value: str,
                });
            }
        }

        if (schema.enum && !schema.enum.includes(str)) {
            errors.push({
                path,
                message: `Value must be one of: ${schema.enum.join(", ")}`,
                value: str,
            });
        }

        return errors;
    }

    private static validateNumber(
        num: number,
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.minimum !== undefined && num < schema.minimum) {
            errors.push({
                path,
                message: `Number must be at least ${schema.minimum}`,
                value: num,
            });
        }

        if (schema.maximum !== undefined && num > schema.maximum) {
            errors.push({
                path,
                message: `Number must be at most ${schema.maximum}`,
                value: num,
            });
        }

        if (schema.enum && !schema.enum.includes(num)) {
            errors.push({
                path,
                message: `Value must be one of: ${schema.enum.join(", ")}`,
                value: num,
            });
        }

        return errors;
    }

    private static validateBoolean(
        value: boolean,
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.enum && !schema.enum.includes(value)) {
            errors.push({
                path,
                message: `Value must be one of: ${schema.enum.join(", ")}`,
                value,
            });
        }

        return errors;
    }
}
