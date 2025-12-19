import test from "node:test";
import assert from "node:assert/strict";
import { Validator } from "../dist/index.js";

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
