

import { FormUtils, createForm, Validators } from "../src/index";

test("FormUtils initializes with correct state", () => {
    const form = new FormUtils({
        initialValues: { email: "", password: "" },
    });

    const state = form.getState();
    assert.deepEqual(state.values, { email: "", password: "" });
    assert.deepEqual(state.errors, {});
    assert.equal(state.isValid, true);
});

test("FormUtils.setValue updates value and marks dirty", () => {
    const form = new FormUtils({
        initialValues: { email: "" },
    });

    form.setValue("email", "test@example.com");
    assert.equal(form.getValue("email"), "test@example.com");
    assert.equal(form.isDirty("email"), true);
});

test("FormUtils.setValues updates multiple values", () => {
    const form = new FormUtils({
        initialValues: { email: "", password: "", name: "" },
    });

    form.setValues({ email: "test@example.com", password: "secret123" });
    assert.equal(form.getValue("email"), "test@example.com");
    assert.equal(form.getValue("password"), "secret123");
    assert.equal(form.getValue("name"), "");
});

test("FormUtils.touchField marks field as touched", () => {
    const form = new FormUtils({
        initialValues: { email: "" },
    });

    assert.equal(form.isTouched("email"), false);
    form.touchField("email");
    assert.equal(form.isTouched("email"), true);
});

test("FormUtils.reset clears all state", () => {
    const form = new FormUtils({
        initialValues: { email: "", password: "" },
    });

    form.setValue("email", "test@example.com");
    form.touchField("email");
    form.reset();

    assert.equal(form.getValue("email"), "");
    assert.equal(form.isTouched("email"), false);
    assert.equal(form.isDirty("email"), false);
});

test("FormUtils validates required field", async () => {
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
    });

    const error = await form.validateField("email");
    assert.ok(error);
    assert.equal(form.hasError("email"), true);
});

test("FormUtils validates email format", async () => {
    const form = new FormUtils({
        initialValues: { email: "invalid" },
        rules: {
            email: { email: true },
        },
    });

    const error = await form.validateField("email");
    assert.ok(error);
});

test("FormUtils validates minLength", async () => {
    const form = new FormUtils({
        initialValues: { password: "short" },
        rules: {
            password: { minLength: 8 },
        },
    });

    const error = await form.validateField("password");
    assert.ok(error);
});

test("FormUtils validates maxLength", async () => {
    const form = new FormUtils({
        initialValues: { username: "verylongusernamethatexceedslimit" },
        rules: {
            username: { maxLength: 20 },
        },
    });

    const error = await form.validateField("username");
    assert.ok(error);
});

test("FormUtils validates number min/max", async () => {
    const form = new FormUtils({
        initialValues: { age: 5 },
        rules: {
            age: { min: 18 },
        },
    });

    const error = await form.validateField("age");
    assert.ok(error);
});

test("FormUtils validates pattern", async () => {
    const form = new FormUtils({
        initialValues: { phone: "123" },
        rules: {
            phone: { pattern: /^\d{10}$/ },
        },
    });

    const error = await form.validateField("phone");
    assert.ok(error);
});

test("FormUtils validates with custom validator", async () => {
    const form = new FormUtils({
        initialValues: { username: "admin" },
        rules: {
            username: {
                custom: (value) => {
                    return value !== "admin"
                        ? true
                        : "Username 'admin' is reserved";
                },
            },
        },
    });

    const error = await form.validateField("username");
    assert.ok(error);
    assert.match(error, /reserved/);
});

test("FormUtils validates with async custom validator", async () => {
    const form = new FormUtils({
        initialValues: { email: "taken@example.com" },
        rules: {
            email: {
                asyncCustom: async (value) => {
                    // Simulate API call
                    const taken = value === "taken@example.com";
                    return !taken ? true : "Email already registered";
                },
            },
        },
    });

    const error = await form.validateField("email");
    assert.ok(error);
    assert.match(error, /already registered/);
});

test("FormUtils.validate checks all fields", async () => {
    const form = new FormUtils({
        initialValues: { email: "", password: "" },
        rules: {
            email: { required: true, email: true },
            password: { required: true, minLength: 8 },
        },
    });

    const errors = await form.validate();
    assert.equal(errors.length, 2);
    assert.equal(form.getState().isValid, false);
});

test("FormUtils.validate passes with valid data", async () => {
    const form = new FormUtils({
        initialValues: { email: "test@example.com", password: "securepass123" },
        rules: {
            email: { required: true, email: true },
            password: { required: true, minLength: 8 },
        },
    });

    const errors = await form.validate();
    assert.equal(errors.length, 0);
    assert.equal(form.getState().isValid, true);
});

test("FormUtils.submit calls onSubmit callback", async () => {
    let submitted = false;
    const form = new FormUtils({
        initialValues: { email: "test@example.com" },
        rules: {
            email: { required: true, email: true },
        },
        onSubmit: async () => {
            submitted = true;
        },
    });

    const result = await form.submit();
    assert.equal(result, true);
    assert.equal(submitted, true);
});

test("FormUtils.submit calls onError callback on validation failure", async () => {
    let errorsCaught = null;
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
        onError: (errors) => {
            errorsCaught = errors;
        },
    });

    const result = await form.submit();
    assert.equal(result, false);
    assert.ok(errorsCaught);
    assert.equal(errorsCaught.length, 1);
});

test("FormUtils.getErrors returns all errors", async () => {
    const form = new FormUtils({
        initialValues: { email: "", password: "" },
        rules: {
            email: { required: true },
            password: { required: true },
        },
    });

    await form.validate();
    const errors = form.getErrors();
    assert.ok(errors.email);
    assert.ok(errors.password);
});

test("FormUtils.clearErrors removes all errors", async () => {
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
    });

    await form.validate();
    assert.ok(form.hasError("email"));
    form.clearErrors();
    assert.equal(form.hasError("email"), false);
});

test("FormUtils.createBinding returns field binding", () => {
    const form = new FormUtils({
        initialValues: { email: "test@example.com" },
    });

    const binding = form.createBinding("email");
    assert.equal(binding.value, "test@example.com");
    assert.equal(typeof binding.onChange, "function");
    assert.equal(typeof binding.onBlur, "function");
});

test("FormUtils.createBindings returns all field bindings", () => {
    const form = new FormUtils({
        initialValues: { email: "", password: "" },
    });

    const bindings = form.createBindings();
    assert.ok(bindings.email);
    assert.ok(bindings.password);
    assert.equal(bindings.email.value, "");
    assert.equal(bindings.password.value, "");
});

test("FormUtils.serialize returns form data", () => {
    const form = new FormUtils({
        initialValues: { email: "test@example.com", password: "secret" },
    });

    const data = form.serialize();
    assert.deepEqual(data, { email: "test@example.com", password: "secret" });
});

test("FormUtils.deserialize loads form data", () => {
    const form = new FormUtils({
        initialValues: { email: "", password: "" },
    });

    form.deserialize({ email: "test@example.com", password: "secret" });
    assert.equal(form.getValue("email"), "test@example.com");
    assert.equal(form.getValue("password"), "secret");
});

test("FormUtils validates on change when enabled", async () => {
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
        validateOnChange: true,
    });

    form.setValue("email", "");
    assert.ok(form.hasError("email"));
});

test("FormUtils validates on blur when enabled", async () => {
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
        validateOnBlur: true,
    });

    form.touchField("email");
    assert.ok(form.hasError("email"));
});

test("Validators.required validates required fields", () => {
    assert.equal(Validators.required("value"), true);
    assert.notEqual(Validators.required(""), true);
    assert.notEqual(Validators.required(null), true);
    assert.notEqual(Validators.required(undefined), true);
});

test("Validators.email validates email format", () => {
    assert.equal(Validators.email("test@example.com"), true);
    assert.notEqual(Validators.email("invalid"), true);
    assert.notEqual(Validators.email("test@"), true);
});

test("Validators.url validates URL format", () => {
    assert.equal(Validators.url("https://example.com"), true);
    assert.notEqual(Validators.url("not a url"), true);
});

test("Validators.pattern validates regex patterns", () => {
    assert.equal(Validators.pattern("12345", /^\d+$/), true);
    assert.notEqual(Validators.pattern("abc", /^\d+$/), true);
});

test("Validators.match validates field matching", () => {
    assert.equal(Validators.match("password", "password"), true);
    assert.notEqual(Validators.match("password", "different"), true);
});

test("createForm factory creates FormUtils instance", () => {
    const form = createForm({
        initialValues: { email: "" },
    });

    assert.ok(form instanceof FormUtils);
});

test("FormUtils validates max value", async () => {
    const form = new FormUtils({
        initialValues: { age: 150 },
        rules: {
            age: { max: 120 },
        },
    });

    const error = await form.validateField("age");
    assert.ok(error);
    assert.match(error, /maximum/i);
});

test("FormUtils validates match rule", async () => {
    const form = new FormUtils({
        initialValues: { password: "secret123", confirmPassword: "different" },
        rules: {
            confirmPassword: { match: "password" },
        },
    });

    const error = await form.validateField("confirmPassword");
    assert.ok(error);
    assert.match(error, /match/i);
});

test("FormUtils handles multiple validation errors", async () => {
    const form = new FormUtils({
        initialValues: { username: "ab" },
        rules: {
            username: {
                required: true,
                minLength: 3,
                maxLength: 20,
            },
        },
    });

    await form.validateField("username");
    assert.ok(form.hasError("username"));
});

test("FormUtils clearError removes specific field error", async () => {
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
    });

    await form.validateField("email");
    assert.ok(form.hasError("email"));

    form.clearError("email");
    assert.ok(!form.hasError("email"));
});

test("FormUtils validates with async custom validator returns error", async () => {
    const form = new FormUtils({
        initialValues: { username: "taken" },
        rules: {
            username: {
                custom: async (value) => {
                    await new Promise((r) => setTimeout(r, 10));
                    return value !== "taken" ? true : "Username is taken";
                },
            },
        },
    });

    const error = await form.validateField("username");
    assert.ok(error);
    assert.match(error, /taken/);
});

test("FormUtils getFieldState returns complete field state", () => {
    const form = new FormUtils({
        initialValues: { email: "test@example.com" },
    });

    form.touchField("email");
    const state = form.getFieldState("email");

    assert.equal(state.value, "test@example.com");
    assert.equal(state.touched, true);
    assert.equal(state.dirty, false);
});

test("FormUtils reset restores initial values", () => {
    const form = new FormUtils({
        initialValues: { email: "old@example.com" },
    });

    form.setValue("email", "new@example.com");
    form.reset();

    assert.equal(form.getValue("email"), "old@example.com");
    assert.equal(form.isDirty("email"), false);
});

test("FormUtils submit with async onSubmit", async () => {
    let submitted = false;
    const form = new FormUtils({
        initialValues: { email: "test@example.com" },
        rules: { email: { email: true } },
        onSubmit: async (values) => {
            await new Promise((r) => setTimeout(r, 10));
            submitted = true;
            assert.deepEqual(values, { email: "test@example.com" });
        },
    });

    await form.submit();
    assert.ok(submitted);
});

test("FormUtils does not validate on change when disabled", async () => {
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
        validateOnChange: false,
    });

    form.setValue("email", "");
    assert.ok(!form.hasError("email"));
});

test("FormUtils does not validate on blur when disabled", async () => {
    const form = new FormUtils({
        initialValues: { email: "" },
        rules: {
            email: { required: true },
        },
        validateOnBlur: false,
    });

    form.touchField("email");
    assert.ok(!form.hasError("email"));
});
