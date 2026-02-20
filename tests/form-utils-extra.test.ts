import { describe, it, expect } from "vitest";
import { createForm } from "../src/utils/helpers/FormUtils";

describe("FormUtils Extra Coverage", () => {
    it("should handle value setting with dots", () => {
        const form = createForm({ email: "" });
        form.setValue("user.name", "Juan");
        expect(form.getValue("user.name")).toBe("Juan");
    });

    it("should cover validation branches", async () => {
        // Debemos pasar las reglas dentro del objeto de configuración
        const form = createForm({
            initialValues: { email: "", age: 0 },
            rules: {
                email: { required: true, email: true },
                age: { min: 18 },
            },
            validateOnBlur: true,
        });

        await form.validate();
        expect(form.hasError("email")).toBe(true);

        form.touchField("age");
        expect(form.isTouched("age")).toBe(true);

        form.reset();
        expect(form.isTouched("age")).toBe(false);
    });

    it("should return null when validating non-existent field", async () => {
        const form = createForm({ initialValues: { a: 1 } });
        // @ts-expect-error - testing invalid field
        const result = await form.validateField("non-existent");
        expect(result).toBeNull();
    });
});
