import test from "node:test";
import assert from "node:assert/strict";
import { ResponseValidator } from "../dist/index.js";

test("ResponseValidator validates object structure", () => {
    const schema = {
        type: "object",
        properties: {
            id: { type: "number", required: true },
            name: { type: "string", required: true },
            email: { type: "string", pattern: /.+@.+\..+/ },
        },
    };

    const validData = { id: 1, name: "John", email: "john@example.com" };
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);
});

test("ResponseValidator detects missing required fields", () => {
    const schema = {
        type: "object",
        properties: {
            id: { type: "number", required: true },
            name: { type: "string", required: true },
        },
    };

    const invalidData = { id: 1 };
    const errors = ResponseValidator.validate(invalidData, schema);
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /required/i);
});

test("ResponseValidator validates array items", () => {
    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "number", required: true },
                status: { type: "string", enum: ["active", "inactive"] },
            },
        },
    };

    const validData = [
        { id: 1, status: "active" },
        { id: 2, status: "inactive" },
    ];
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);
});

test("ResponseValidator validates string patterns", () => {
    const schema = {
        type: "string",
        pattern: /^[A-Z][a-z]+$/,
    };

    const validData = "John";
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);

    const invalidData = "john";
    const invalidErrors = ResponseValidator.validate(invalidData, schema);
    assert.equal(invalidErrors.length, 1);
});

test("ResponseValidator validates number ranges", () => {
    const schema = {
        type: "number",
        minimum: 0,
        maximum: 100,
    };

    const validData = 50;
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);

    const invalidData = 150;
    const invalidErrors = ResponseValidator.validate(invalidData, schema);
    assert.equal(invalidErrors.length, 1);
});

test("ResponseValidator supports custom validation", () => {
    const schema = {
        type: "object",
        properties: {
            password: {
                type: "string",
                custom: (value) => {
                    if (typeof value === "string" && value.length >= 8) {
                        return true;
                    }
                    return "Password must be at least 8 characters";
                },
            },
        },
    };

    const validData = { password: "securepass123" };
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);

    const invalidData = { password: "short" };
    const invalidErrors = ResponseValidator.validate(invalidData, schema);
    assert.equal(invalidErrors.length, 1);
    assert.match(invalidErrors[0].message, /at least 8 characters/);
});

test("ResponseValidator validates string length and enum", () => {
    const schema = {
        type: "string",
        minLength: 2,
        maxLength: 5,
        enum: ["ab", "abc", "abcd"],
    };

    const validData = "abc";
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);

    const tooShort = "a";
    const shortErrors = ResponseValidator.validate(tooShort, schema);
    assert.equal(shortErrors.length, 2);

    const tooLong = "abcdef";
    const longErrors = ResponseValidator.validate(tooLong, schema);
    assert.equal(longErrors.length, 2);
});

test("ResponseValidator validates pattern when provided as string", () => {
    const schema = {
        type: "string",
        pattern: "^[0-9]{3}-[0-9]{2}$",
    };

    const validData = "123-45";
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);

    const invalidData = "abc-45";
    const invalidErrors = ResponseValidator.validate(invalidData, schema);
    assert.equal(invalidErrors.length, 1);
    assert.match(invalidErrors[0].message, /pattern/);
});

test("ResponseValidator validates boolean enum values", () => {
    const schema = {
        type: "boolean",
        enum: [true],
    };

    const validData = true;
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);

    const invalidData = false;
    const invalidErrors = ResponseValidator.validate(invalidData, schema);
    assert.equal(invalidErrors.length, 1);
    assert.match(invalidErrors[0].message, /one of/);
});

test("ResponseValidator validates number enum values", () => {
    const schema = {
        type: "number",
        enum: [1, 2, 3],
    };

    const validData = 2;
    const errors = ResponseValidator.validate(validData, schema);
    assert.equal(errors.length, 0);

    const invalidData = 4;
    const invalidErrors = ResponseValidator.validate(invalidData, schema);
    assert.equal(invalidErrors.length, 1);
    assert.match(invalidErrors[0].message, /one of/);
});

test("ResponseValidator reports nested array paths", () => {
    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "number", required: true },
            },
        },
    };

    const data = [{ id: 1 }, { id: undefined }];
    const errors = ResponseValidator.validate(data, schema);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].path, "root[1].id");
});

test("ResponseValidator respects required at root", () => {
    const schema = { type: "string", required: true };
    const errors = ResponseValidator.validate(null, schema);
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /required/i);
});

test("ResponseValidator reports type mismatch", () => {
    const schema = { type: "number" };
    const errors = ResponseValidator.validate("not-number", schema);
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /Expected type number/);
});
