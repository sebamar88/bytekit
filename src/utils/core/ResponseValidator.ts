export interface ValidationSchema {
    type?: "object" | "array" | "string" | "number" | "boolean";
    required?: boolean;
    properties?: Record<string, ValidationSchema>;
    items?: ValidationSchema;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: RegExp | string;
    enum?: unknown[];
    custom?: (value: unknown) => boolean | string;
}

export interface ValidationError {
    path: string;
    message: string;
    value?: unknown;
}

export class ResponseValidator {
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
        if (schema.type) {
            const actualType = Array.isArray(data)
                ? "array"
                : typeof data;
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
        if (schema.type === "object" && typeof data === "object" && !Array.isArray(data)) {
            errors.push(...this.validateObject(data as Record<string, unknown>, schema, path));
        } else if (schema.type === "array" && Array.isArray(data)) {
            errors.push(...this.validateArray(data, schema, path));
        } else if (schema.type === "string" && typeof data === "string") {
            errors.push(...this.validateString(data, schema, path));
        } else if (schema.type === "number" && typeof data === "number") {
            errors.push(...this.validateNumber(data, schema, path));
        } else if (schema.type === "boolean" && typeof data === "boolean") {
            errors.push(...this.validateBoolean(data, schema, path));
        }

        // Custom validation
        if (schema.custom) {
            const result = schema.custom(data);
            if (result !== true) {
                errors.push({
                    path,
                    message: typeof result === "string" ? result : "Custom validation failed",
                    value: data,
                });
            }
        }

        return errors;
    }

    private static validateObject(
        obj: Record<string, unknown>,
        schema: ValidationSchema,
        path: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

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
