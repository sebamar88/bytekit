

import { StringUtils } from "../src/utils/helpers/StringUtils";

describe("StringUtils - Case Conversion", () => {
    describe("camelCase", () => {
        it("should convert space-separated words to camelCase", () => {
            assert.equal(StringUtils.camelCase("hello world"), "helloWorld");
        });

        it("should convert hyphenated words to camelCase", () => {
            assert.equal(StringUtils.camelCase("hello-world"), "helloWorld");
        });

        it("should convert snake_case to camelCase", () => {
            assert.equal(StringUtils.camelCase("hello_world"), "helloWorld");
        });

        it("should convert PascalCase to camelCase", () => {
            assert.equal(StringUtils.camelCase("HelloWorld"), "helloWorld");
        });

        it("should handle numbers in strings", () => {
            assert.equal(
                StringUtils.camelCase("hello world 123"),
                "helloWorld123"
            );
        });

        it("should handle empty strings", () => {
            assert.equal(StringUtils.camelCase(""), "");
            assert.equal(StringUtils.camelCase(null), "");
            assert.equal(StringUtils.camelCase(undefined), "");
        });

        it("should handle multiple separators", () => {
            assert.equal(
                StringUtils.camelCase("hello--world__test"),
                "helloWorldTest"
            );
        });
    });

    describe("pascalCase", () => {
        it("should convert space-separated words to PascalCase", () => {
            assert.equal(StringUtils.pascalCase("hello world"), "HelloWorld");
        });

        it("should convert hyphenated words to PascalCase", () => {
            assert.equal(StringUtils.pascalCase("hello-world"), "HelloWorld");
        });

        it("should convert snake_case to PascalCase", () => {
            assert.equal(StringUtils.pascalCase("hello_world"), "HelloWorld");
        });

        it("should convert camelCase to PascalCase", () => {
            assert.equal(StringUtils.pascalCase("helloWorld"), "HelloWorld");
        });

        it("should handle numbers in strings", () => {
            assert.equal(
                StringUtils.pascalCase("hello world 123"),
                "HelloWorld123"
            );
        });

        it("should handle empty strings", () => {
            assert.equal(StringUtils.pascalCase(""), "");
            assert.equal(StringUtils.pascalCase(null), "");
            assert.equal(StringUtils.pascalCase(undefined), "");
        });

        it("should handle UPPERCASE input", () => {
            assert.equal(StringUtils.pascalCase("HELLO_WORLD"), "HelloWorld");
        });
    });

    describe("kebabCase", () => {
        it("should convert camelCase to kebab-case", () => {
            assert.equal(StringUtils.kebabCase("helloWorld"), "hello-world");
        });

        it("should convert PascalCase to kebab-case", () => {
            assert.equal(StringUtils.kebabCase("HelloWorld"), "hello-world");
        });

        it("should convert space-separated words to kebab-case", () => {
            assert.equal(StringUtils.kebabCase("Hello World"), "hello-world");
        });

        it("should convert snake_case to kebab-case", () => {
            assert.equal(StringUtils.kebabCase("hello_world"), "hello-world");
        });

        it("should handle empty strings", () => {
            assert.equal(StringUtils.kebabCase(""), "");
            assert.equal(StringUtils.kebabCase(null), "");
            assert.equal(StringUtils.kebabCase(undefined), "");
        });

        it("should handle numbers", () => {
            assert.equal(
                StringUtils.kebabCase("hello123World"),
                "hello123-world"
            );
        });
    });

    describe("snakeCase", () => {
        it("should convert camelCase to snake_case", () => {
            assert.equal(StringUtils.snakeCase("helloWorld"), "hello_world");
        });

        it("should convert PascalCase to snake_case", () => {
            assert.equal(StringUtils.snakeCase("HelloWorld"), "hello_world");
        });

        it("should convert space-separated words to snake_case", () => {
            assert.equal(StringUtils.snakeCase("Hello World"), "hello_world");
        });

        it("should convert kebab-case to snake_case", () => {
            assert.equal(StringUtils.snakeCase("hello-world"), "hello_world");
        });

        it("should handle empty strings", () => {
            assert.equal(StringUtils.snakeCase(""), "");
            assert.equal(StringUtils.snakeCase(null), "");
            assert.equal(StringUtils.snakeCase(undefined), "");
        });

        it("should handle numbers", () => {
            assert.equal(
                StringUtils.snakeCase("hello123World"),
                "hello123_world"
            );
        });
    });

    describe("Case conversion integration", () => {
        it("should convert through multiple case styles", () => {
            const original = "hello world test";
            const camel = StringUtils.camelCase(original);
            const pascal = StringUtils.pascalCase(camel);
            const kebab = StringUtils.kebabCase(pascal);
            const snake = StringUtils.snakeCase(kebab);

            assert.equal(camel, "helloWorldTest");
            assert.equal(pascal, "HelloWorldTest");
            assert.equal(kebab, "hello-world-test");
            assert.equal(snake, "hello_world_test");
        });

        it("should be reversible (round-trip conversion)", () => {
            const original = "helloWorldTest";

            // camelCase -> kebab-case -> camelCase
            const kebab = StringUtils.kebabCase(original);
            const backToCamel = StringUtils.camelCase(kebab);
            assert.equal(backToCamel, original);

            // PascalCase -> snake_case -> PascalCase
            const pascalOriginal = "HelloWorldTest";
            const snake = StringUtils.snakeCase(pascalOriginal);
            const backToPascal = StringUtils.pascalCase(snake);
            assert.equal(backToPascal, pascalOriginal);
        });
    });
});
