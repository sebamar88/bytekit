import test from "node:test";
import assert from "node:assert/strict";
import { ApiClient, ApiError } from "../dist/index.js";

const jsonResponse = (body, init = {}) => {
  const payload = JSON.stringify(body);
  const headers = new Headers({
    "content-type": "application/json",
    "content-length": String(Buffer.byteLength(payload)),
  });
  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  return new Response(payload, {
    status: 200,
    ...init,
    headers,
  });
};

test("ApiClient builds URLs with search params and returns JSON bodies", async () => {
  let capturedUrl = "";
  const fetchImpl = async (url) => {
    capturedUrl = url;
    return jsonResponse({ ok: true });
  };

  const client = new ApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl,
    locale: "en",
  });

  const result = await client.get("/users", {
    searchParams: { tags: ["lab", "team"] },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(capturedUrl, "https://api.example.com/users?tags=lab&tags=team");
});

test("ApiClient serializes JSON bodies and merges headers", async () => {
  let capturedInit;
  const fetchImpl = async (_url, init) => {
    capturedInit = init;
    return jsonResponse({ created: true }, { status: 201 });
  };

  const client = new ApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl,
    defaultHeaders: { "X-App": "utils" },
    locale: "en",
  });

  const payload = { name: "Juan" };
  const response = await client.post("/users", { body: payload });
  assert.deepEqual(response, { created: true });

  assert.equal(capturedInit.headers.get("X-App"), "utils");
  assert.equal(capturedInit.headers.get("Content-Type"), "application/json");
  assert.equal(capturedInit.body, JSON.stringify(payload));
});

test("ApiClient throws ApiError with localized message on HTTP errors", async () => {
  const fetchImpl = async () =>
    jsonResponse(
      { error: "not found" },
      { status: 404, statusText: "Not Found" }
    );

  const client = new ApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl,
    locale: "en",
  });

  await assert.rejects(
    () => client.get("/missing"),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.equal(error.message, "Resource not found.");
      assert.deepEqual(error.body, { error: "not found" });
      return true;
    }
  );
});

test("ApiClient rejects with timeout errors when exceeding deadline", async () => {
  const fetchImpl = () =>
    new Promise(() => {
      /* never resolves */
    });

  const client = new ApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl,
    timeoutMs: 10,
    locale: "en",
  });

  await assert.rejects(
    () => client.get("/slow"),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 408);
      assert.equal(error.isTimeout, true);
      return true;
    }
  );
});
