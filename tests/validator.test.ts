import { Validator } from "../src/index";

const buildValidCuit = (prefix, dni) => {
    const digits = `${prefix}${dni}`.padStart(10, "0");
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const checksum = digits
        .split("")
        .reduce((acc, digit, idx) => acc + Number(digit) * weights[idx], 0);
    const remainder = 11 - (checksum % 11);
    const checkDigit = remainder === 11 ? 0 : remainder === 10 ? 9 : remainder;
    return `${digits}${checkDigit}`;
};

test("Validator.isEmail validates typical addresses", () => {
    assert.ok(Validator.isEmail("user@example.com"));
    assert.ok(!Validator.isEmail("invalid-email"));
});

test("Validator.isStrongPassword enforces custom requirements", () => {
    assert.ok(Validator.isStrongPassword("SecurePass!2024", { minLength: 10 }));
    assert.ok(
        !Validator.isStrongPassword("weakpass", {
            requireNumber: true,
            requireSpecial: true,
        })
    );
});

test("Validator.isLocalPhone matches locale-aware patterns", () => {
    assert.ok(Validator.isLocalPhone("11 5555-7777", "es-AR"));
    assert.ok(!Validator.isLocalPhone("123", "es-AR"));
});

test("Validator.isCuit validates checksum correctly", () => {
    const valid = buildValidCuit("20", "12345678");
    assert.ok(Validator.isCuit(valid));
    assert.ok(!Validator.isCuit(valid.slice(0, -1) + "0"));
});

test("Validator.isDateRange and isOneTimeCode behave as expected", () => {
    assert.ok(Validator.isDateRange("2024-01-01", "2024-01-31"));
    assert.ok(!Validator.isDateRange("2024-01-31", "2024-01-01"));
    assert.ok(Validator.isOneTimeCode("123456"));
    assert.ok(!Validator.isOneTimeCode("12 34"));
});

test("Validator.isEmpty and length helpers", () => {
    assert.ok(Validator.isEmpty(""));
    assert.ok(Validator.isEmpty([]));
    assert.ok(Validator.isEmpty({}));
    assert.ok(!Validator.isEmpty("text"));

    assert.ok(Validator.minLength("hello", 3));
    assert.ok(!Validator.minLength("hi", 3));
    assert.ok(Validator.maxLength("hi", 3));
    assert.ok(!Validator.maxLength("hello", 3));
});

test("Validator.matches and isUrl", () => {
    assert.ok(Validator.matches("ABC", /^[A-Z]+$/));
    assert.ok(!Validator.matches("abc", /^[A-Z]+$/));

    assert.ok(Validator.isUrl("https://example.com"));
    assert.ok(!Validator.isUrl("not-a-url"));
});

test("Validator phone helpers", () => {
    assert.ok(Validator.isInternationalPhone("+5491155557777"));
    assert.ok(!Validator.isInternationalPhone("1155557777"));

    assert.ok(Validator.isPhoneE164("+12025550123"));
    assert.ok(Validator.isPhoneE164("12025550123"));
    assert.ok(!Validator.isPhoneE164("001"));
});

test("Validator UUID, DNI, and local phone fallback", () => {
    assert.ok(Validator.isUUIDv4("550e8400-e29b-41d4-a716-446655440000"));
    assert.ok(!Validator.isUUIDv4("not-uuid"));

    assert.ok(Validator.isDni("12345678"));
    assert.ok(!Validator.isDni("123"));

    assert.ok(Validator.isLocalPhone("123456", "xx-XX"));
    assert.ok(
        !Validator.isLocalPhone("123456", "xx-XX", { fallbackToGeneric: false })
    );
});

test("Validator CBU validation", () => {
    const calculateCheckDigit = (digits, weights) => {
        const sum = digits
            .split("")
            .reduce((acc, digit, idx) => acc + Number(digit) * weights[idx], 0);
        return (10 - (sum % 10)) % 10;
    };

    const firstBlock = "2850590";
    const firstCheck = calculateCheckDigit(firstBlock, [7, 1, 3, 9, 7, 1, 3]);
    const secondBlock = "0409418135201";
    const secondCheck = calculateCheckDigit(
        secondBlock,
        [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]
    );

    const validCbu = `${firstBlock}${firstCheck}${secondBlock}${secondCheck}`;
    assert.ok(Validator.isCbu(validCbu));
    assert.ok(!Validator.isCbu(validCbu.slice(0, -1) + "0"));
});
