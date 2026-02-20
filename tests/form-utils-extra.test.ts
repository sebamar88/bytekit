import { describe, it, expect } from "vitest";
import { createForm } from "../src/utils/helpers/FormUtils";

describe("FormUtils Extra Coverage", () => {
    it("should handle value setting with dots", () => {
        const form = createForm({ email: "" });
        form.setValue("user.name", "Juan");
        expect(form.getValue("user.name")).toBe("Juan");
    });

    it("should cover validation branches", async () => {
        // Debemos pasar las reglas como segundo argumento
        const form = createForm({ email: "" }, {
            email: { required: true }
        });
        
        await form.validate();
        expect(form.hasError("email")).toBe(true);
    });
});
