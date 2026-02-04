/**
 * Form validation and management utilities
 * Framework-agnostic form handling with built-in validators
 */

export type ValidatorFn<T = unknown> = (value: T) => boolean | string;
export type AsyncValidatorFn<T = unknown> = (
    value: T
) => Promise<boolean | string>;

export interface FieldRule<T = unknown> {
    required?: boolean | string;
    minLength?: number | string;
    maxLength?: number | string;
    min?: number | string;
    max?: number | string;
    pattern?: RegExp | string;
    email?: boolean | string;
    url?: boolean | string;
    custom?: ValidatorFn<T> | ValidatorFn<T>[];
    asyncCustom?: AsyncValidatorFn<T> | AsyncValidatorFn<T>[];
}

export interface FieldError {
    field: string;
    message: string;
    rule?: string;
}

export interface FormState<
    T extends Record<string, unknown> = Record<string, unknown>,
> {
    values: T;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    dirty: Record<string, boolean>;
    isValidating: boolean;
    isValid: boolean;
}

export interface FormConfig<
    T extends Record<string, unknown> = Record<string, unknown>,
> {
    initialValues: T;
    rules?: Record<keyof T, FieldRule>;
    onSubmit?: (values: T) => void | Promise<void>;
    onError?: (errors: FieldError[]) => void;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
}

/**
 * Built-in validators
 */
export const Validators = {
    required: (
        value: unknown,
        message = "This field is required"
    ): boolean | string => {
        if (value === null || value === undefined || value === "") {
            return message;
        }
        if (Array.isArray(value) && value.length === 0) {
            return message;
        }
        return true;
    },

    minLength: (
        value: unknown,
        min: number,
        message?: string
    ): boolean | string => {
        if (typeof value !== "string") return true;
        if (value.length < min) {
            return message || `Minimum length is ${min}`;
        }
        return true;
    },

    maxLength: (
        value: unknown,
        max: number,
        message?: string
    ): boolean | string => {
        if (typeof value !== "string") return true;
        if (value.length > max) {
            return message || `Maximum length is ${max}`;
        }
        return true;
    },

    min: (value: unknown, min: number, message?: string): boolean | string => {
        if (typeof value !== "number") return true;
        if (value < min) {
            return message || `Minimum value is ${min}`;
        }
        return true;
    },

    max: (value: unknown, max: number, message?: string): boolean | string => {
        if (typeof value !== "number") return true;
        if (value > max) {
            return message || `Maximum value is ${max}`;
        }
        return true;
    },

    email: (
        value: unknown,
        message = "Invalid email address"
    ): boolean | string => {
        if (typeof value !== "string" || !value) return true;

        // Safe email validation without ReDoS vulnerability
        const trimmed = value.trim();
        if (trimmed !== value || trimmed.length === 0) return message;

        const atIndex = trimmed.indexOf("@");
        if (atIndex <= 0 || atIndex === trimmed.length - 1) return message;
        if (trimmed.slice(atIndex + 1).includes("@")) return message; // Multiple @

        const domain = trimmed.slice(atIndex + 1);
        const dotIndex = domain.indexOf(".");
        if (dotIndex <= 0 || dotIndex === domain.length - 1) return message;

        // Check for whitespace
        if (trimmed.includes(" ")) return message;

        return true;
    },

    url: (value: unknown, message = "Invalid URL"): boolean | string => {
        if (typeof value !== "string" || !value) return true;
        try {
            new URL(value);
            return true;
        } catch {
            return message;
        }
    },

    pattern: (
        value: unknown,
        pattern: RegExp,
        message?: string
    ): boolean | string => {
        if (typeof value !== "string" || !value) return true;
        return pattern.test(value) ? true : message || "Invalid format";
    },

    match: (
        value: unknown,
        other: unknown,
        message = "Fields do not match"
    ): boolean | string => {
        return value === other ? true : message;
    },
};

/**
 * Form validation and state management
 */
export class FormUtils<
    T extends Record<string, unknown> = Record<string, unknown>,
> {
    private state: FormState<T>;
    private rules: Record<keyof T, FieldRule>;
    private config: FormConfig<T>;
    private validationTimeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(config: FormConfig<T>) {
        this.config = config;
        this.rules = config.rules ?? ({} as Record<keyof T, FieldRule>);
        this.state = {
            values: { ...config.initialValues },
            errors: {},
            touched: {},
            dirty: {},
            isValidating: false,
            isValid: true,
        };
    }

    /**
     * Get current form state
     */
    getState(): FormState<T> {
        return { ...this.state };
    }

    /**
     * Get field value
     */
    getValue<K extends keyof T>(field: K): T[K] {
        return this.state.values[field];
    }

    /**
     * Set field value
     */
    setValue<K extends keyof T>(field: K, value: T[K]): void {
        this.state.values[field] = value;
        this.state.dirty[field as string] = true;

        if (this.config.validateOnChange) {
            this.validateField(field);
        }
    }

    /**
     * Set multiple values
     */
    setValues(values: Partial<T>): void {
        this.state.values = { ...this.state.values, ...values };
        Object.keys(values).forEach((field) => {
            this.state.dirty[field] = true;
        });

        if (this.config.validateOnChange) {
            Object.keys(values).forEach((field) => {
                this.validateField(field as keyof T);
            });
        }
    }

    /**
     * Mark field as touched
     */
    touchField<K extends keyof T>(field: K): void {
        this.state.touched[field as string] = true;

        if (this.config.validateOnBlur) {
            this.validateField(field);
        }
    }

    /**
     * Reset form to initial state
     */
    reset(): void {
        this.state = {
            values: { ...this.config.initialValues },
            errors: {},
            touched: {},
            dirty: {},
            isValidating: false,
            isValid: true,
        };
        this.validationTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.validationTimeouts.clear();
    }

    /**
     * Validate single field
     */
    async validateField<K extends keyof T>(field: K): Promise<string | null> {
        const rule = this.rules[field];
        if (!rule) return null;

        const value = this.state.values[field];
        const errors: string[] = [];

        // Required validation
        if (rule.required) {
            const result = Validators.required(
                value,
                typeof rule.required === "string" ? rule.required : undefined
            );
            if (result !== true) {
                errors.push(result as string);
            }
        }

        // String validations
        if (typeof value === "string") {
            if (rule.minLength !== undefined) {
                const result = Validators.minLength(
                    value,
                    typeof rule.minLength === "number"
                        ? rule.minLength
                        : Number.parseInt(rule.minLength as string),
                    typeof rule.minLength === "string"
                        ? rule.minLength
                        : undefined
                );
                if (result !== true) errors.push(result as string);
            }

            if (rule.maxLength !== undefined) {
                const result = Validators.maxLength(
                    value,
                    typeof rule.maxLength === "number"
                        ? rule.maxLength
                        : Number.parseInt(rule.maxLength as string),
                    typeof rule.maxLength === "string"
                        ? rule.maxLength
                        : undefined
                );
                if (result !== true) errors.push(result as string);
            }

            if (rule.email) {
                const result = Validators.email(
                    value,
                    typeof rule.email === "string" ? rule.email : undefined
                );
                if (result !== true) errors.push(result as string);
            }

            if (rule.url) {
                const result = Validators.url(
                    value,
                    typeof rule.url === "string" ? rule.url : undefined
                );
                if (result !== true) errors.push(result as string);
            }

            if (rule.pattern) {
                const pattern =
                    typeof rule.pattern === "string"
                        ? new RegExp(rule.pattern)
                        : rule.pattern;
                const result = Validators.pattern(value, pattern);
                if (result !== true) errors.push(result as string);
            }
        }

        // Number validations
        if (typeof value === "number") {
            if (rule.min !== undefined) {
                const result = Validators.min(
                    value,
                    typeof rule.min === "number"
                        ? rule.min
                        : Number.parseInt(rule.min as string),
                    typeof rule.min === "string" ? rule.min : undefined
                );
                if (result !== true) errors.push(result as string);
            }

            if (rule.max !== undefined) {
                const result = Validators.max(
                    value,
                    typeof rule.max === "number"
                        ? rule.max
                        : Number.parseInt(rule.max as string),
                    typeof rule.max === "string" ? rule.max : undefined
                );
                if (result !== true) errors.push(result as string);
            }
        }

        // Custom validators
        if (rule.custom) {
            const validators = Array.isArray(rule.custom)
                ? rule.custom
                : [rule.custom];
            for (const validator of validators) {
                const result = validator(value);
                if (result !== true) {
                    errors.push(result as string);
                }
            }
        }

        // Async custom validators
        if (rule.asyncCustom) {
            const asyncValidators = Array.isArray(rule.asyncCustom)
                ? rule.asyncCustom
                : [rule.asyncCustom];
            for (const validator of asyncValidators) {
                const result = await validator(value);
                if (result !== true) {
                    errors.push(result as string);
                }
            }
        }

        const error = errors[0] || null;
        this.state.errors[field as string] = error || "";

        return error;
    }

    /**
     * Validate all fields
     */
    async validate(): Promise<FieldError[]> {
        this.state.isValidating = true;
        const fieldErrors: FieldError[] = [];

        for (const field of Object.keys(this.rules) as (keyof T)[]) {
            const error = await this.validateField(field);
            if (error) {
                fieldErrors.push({
                    field: field as string,
                    message: error,
                });
            }
        }

        this.state.isValid = fieldErrors.length === 0;
        this.state.isValidating = false;

        if (fieldErrors.length > 0 && this.config.onError) {
            this.config.onError(fieldErrors);
        }

        return fieldErrors;
    }

    /**
     * Submit form
     */
    async submit(): Promise<boolean> {
        const errors = await this.validate();

        if (errors.length === 0 && this.config.onSubmit) {
            try {
                await this.config.onSubmit(this.state.values);
                return true;
            } catch {
                return false;
            }
        }

        return errors.length === 0;
    }

    /**
     * Get field error
     */
    getFieldError<K extends keyof T>(field: K): string {
        return this.state.errors[field as string] || "";
    }

    /**
     * Check if field has error
     */
    hasError<K extends keyof T>(field: K): boolean {
        return !!this.state.errors[field as string];
    }

    /**
     * Check if field is touched
     */
    isTouched<K extends keyof T>(field: K): boolean {
        return !!this.state.touched[field as string];
    }

    /**
     * Check if field is dirty
     */
    isDirty<K extends keyof T>(field: K): boolean {
        return !!this.state.dirty[field as string];
    }

    /**
     * Get all errors
     */
    getErrors(): Record<string, string> {
        return { ...this.state.errors };
    }

    /**
     * Clear field error
     */
    clearFieldError<K extends keyof T>(field: K): void {
        this.state.errors[field as string] = "";
    }

    /**
     * Clear all errors
     */
    clearErrors(): void {
        this.state.errors = {};
    }

    /**
     * Serialize form data
     */
    serialize(): T {
        return { ...this.state.values };
    }

    /**
     * Deserialize form data
     */
    deserialize(data: Partial<T>): void {
        this.setValues(data);
    }

    /**
     * Create form binding for framework integration
     */
    createBinding<K extends keyof T>(field: K) {
        return {
            value: this.getValue(field),
            onChange: (value: T[K]) => this.setValue(field, value),
            onBlur: () => this.touchField(field),
            error: this.getFieldError(field),
            touched: this.isTouched(field),
            dirty: this.isDirty(field),
        };
    }

    /**
     * Create form bindings for all fields
     */
    createBindings() {
        const bindings: Record<
            string,
            ReturnType<typeof this.createBinding>
        > = {};
        for (const field of Object.keys(this.state.values) as (keyof T)[]) {
            bindings[field as string] = this.createBinding(field);
        }
        return bindings;
    }
}

/**
 * Factory function for creating forms
 */
export function createForm<
    T extends Record<string, unknown> = Record<string, unknown>,
>(config: FormConfig<T>): FormUtils<T> {
    return new FormUtils(config);
}
