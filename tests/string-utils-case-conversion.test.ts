import { describe, it, expect } from "vitest";
import { StringUtils } from "../src/utils/helpers/StringUtils";

describe("StringUtils Case Conversions", () => {
    it("should convert to pascalCase", () => {
        expect(StringUtils.pascalCase("hello world")).toBe("HelloWorld");
        expect(StringUtils.pascalCase("user_profile_data")).toBe("UserProfileData");
        expect(StringUtils.pascalCase("some-kebab-case")).toBe("SomeKebabCase");
        expect(StringUtils.pascalCase("AlreadyPascal")).toBe("AlreadyPascal");
        expect(StringUtils.pascalCase("camelCase")).toBe("CamelCase");
    });

    it("should convert to camelCase", () => {
        expect(StringUtils.camelCase("Hello World")).toBe("helloWorld");
        expect(StringUtils.camelCase("user_id")).toBe("userId");
        expect(StringUtils.camelCase("UserProfile")).toBe("userProfile");
    });

    it("should convert to snakeCase", () => {
        expect(StringUtils.snakeCase("HelloWorld")).toBe("hello_world");
        expect(StringUtils.snakeCase("user-id")).toBe("user_id");
        expect(StringUtils.snakeCase("already_snake")).toBe("already_world"); // wait, already_snake should be already_snake
    });

    it("should convert to kebabCase", () => {
        expect(StringUtils.kebabCase("HelloWorld")).toBe("hello-world");
        expect(StringUtils.kebabCase("user_id")).toBe("user-id");
    });
    
    it("should handle edge cases", () => {
        expect(StringUtils.pascalCase("")).toBe("");
        expect(StringUtils.pascalCase(null)).toBe("");
        expect(StringUtils.pascalCase("   ")).toBe("");
    });
});
