import { describe, expect, it } from "vitest";
import {
    camelCase,
    pascalCase,
    slugify,
    snakeCase,
    truncate,
} from "../src/utils/helpers/StringUtils.js";

describe("camelCase", () => {
    it("convierte kebab-case", () => expect(camelCase("hello-world")).toBe("helloWorld"));
    it("convierte snake_case", () => expect(camelCase("foo_bar_baz")).toBe("fooBarBaz"));
    it("convierte PascalCase", () => expect(camelCase("FooBarBaz")).toBe("fooBarBaz"));
    it("convierte espacios", () => expect(camelCase("hello world")).toBe("helloWorld"));
    it("string vacío", () => expect(camelCase("")).toBe(""));
    it("normaliza ñ en entrada", () => expect(camelCase("niño_feliz")).toBe("ninoFeliz"));
    it("normaliza ü en entrada (alemán)", () => expect(camelCase("über_cool")).toBe("uberCool"));
    it("normaliza é en entrada (francés)", () => expect(camelCase("café_latte")).toBe("cafeLatte"));
});

describe("snakeCase", () => {
    it("convierte camelCase", () => expect(snakeCase("fooBarBaz")).toBe("foo_bar_baz"));
    it("convierte PascalCase", () => expect(snakeCase("FooBarBaz")).toBe("foo_bar_baz"));
    it("convierte espacios", () => expect(snakeCase("hello world")).toBe("hello_world"));
    it("convierte kebab-case", () => expect(snakeCase("foo-bar")).toBe("foo_bar"));
    it("string vacío", () => expect(snakeCase("")).toBe(""));
    it("normaliza ñ (español)", () => expect(snakeCase("año nuevo")).toBe("ano_nuevo"));
    it("normaliza ö (alemán)", () => expect(snakeCase("schön gut")).toBe("schon_gut"));
    it("normaliza è (francés)", () => expect(snakeCase("très bien")).toBe("tres_bien"));
});

describe("pascalCase", () => {
    it("convierte kebab-case", () => expect(pascalCase("hello-world")).toBe("HelloWorld"));
    it("convierte snake_case", () => expect(pascalCase("foo_bar")).toBe("FooBar"));
    it("convierte camelCase", () => expect(pascalCase("fooBar")).toBe("FooBar"));
    it("string vacío", () => expect(pascalCase("")).toBe(""));
    it("normaliza ü (alemán)", () => expect(pascalCase("über_mensch")).toBe("UberMensch"));
    it("normaliza ñ (español)", () => expect(pascalCase("niño_lindo")).toBe("NinoLindo"));
    it("normaliza ç (francés)", () => expect(pascalCase("garçon_chic")).toBe("GarconChic"));
});

describe("truncate", () => {
    it("no trunca si cabe", () => expect(truncate("hello", 10)).toBe("hello"));
    it("trunca con ellipsis por defecto", () =>
        expect(truncate("hello world", 8)).toBe("hello..."));
    it("ellipsis personalizado", () =>
        expect(truncate("abcde", 4, "…")).toBe("abc…"));
    it("maxLen < ellipsis.length", () =>
        expect(truncate("abcdef", 2)).toBe(".."));
    it("exactamente el límite", () =>
        expect(truncate("abc", 3)).toBe("abc"));
    it("string vacío", () => expect(truncate("", 5)).toBe(""));
});

describe("slugify", () => {
    it("minúsculas y guiones", () =>
        expect(slugify("Hello World")).toBe("hello-world"));
    it("normaliza ñ (español)", () =>
        expect(slugify("Año Nuevo")).toBe("ano-nuevo"));
    it("normaliza ü y ß (alemán)", () =>
        expect(slugify("Über die Straße")).toBe("uber-die-strasse"));
    it("normaliza é y ç (francés)", () =>
        expect(slugify("Café Ça Va")).toBe("cafe-ca-va"));
    it("elimina caracteres especiales", () =>
        expect(slugify("foo!@#$%bar")).toBe("foobar"));
    it("colapsa espacios y guiones múltiples", () =>
        expect(slugify("foo   bar")).toBe("foo-bar"));
    it("string vacío", () => expect(slugify("")).toBe(""));
    it("solo caracteres inválidos", () =>
        expect(slugify("!@#$%")).toBe(""));
});
