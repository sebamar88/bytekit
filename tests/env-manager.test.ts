import { EnvManager } from "../src/index";

test("EnvManager.get reads from process.env in Node", () => {
    process.env.TEST_KEY = "from-node";
    const env = new EnvManager();
    assert.equal(env.get("TEST_KEY"), "from-node");
    delete process.env.TEST_KEY;
});

test("EnvManager.require throws when missing", () => {
    const env = new EnvManager();
    assert.throws(
        () => env.require("MISSING_KEY"),
        /Missing environment variable/
    );
});

test("EnvManager.isProd checks NODE_ENV and MODE flags", () => {
    const env = new EnvManager();
    process.env.NODE_ENV = "production";
    assert.ok(env.isProd());
    delete process.env.NODE_ENV;

    process.env.MODE = "production";
    assert.ok(env.isProd());
    delete process.env.MODE;
});

test("EnvManager.get uses import.meta.env in browser mode", () => {
    // Simulate browser environment
    globalThis.window = {};
    // @ts-expect-error - Testing error handling
    globalThis.document = {};

    const env = new EnvManager();
    const value = env.get("BROWSER_ONLY");
    assert.equal(value, undefined);

    delete globalThis.window;
    // @ts-expect-error - Testing error handling
    delete globalThis.document;
});
