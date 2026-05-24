import test from "node:test";
import assert from "node:assert/strict";
import worker, { handleRequest, validateApiKeyRequest } from "./index.js";

test("validateApiKeyRequest allows requests when API_KEY is not configured", () => {
    const request = new Request("https://example.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    });

    assert.equal(validateApiKeyRequest(request, {}), null);
});

test("speech route returns 401 when API_KEY is configured but missing", async () => {
    const response = await worker.fetch(new Request("https://example.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }), { API_KEY: "secret-key" });

    assert.equal(response.status, 401);
    assert.equal(response.headers.get("content-type"), "application/json");
    const payload = await response.json();
    assert.equal(payload.error.code, "invalid_api_key");
});

test("speech route accepts x-api-key when API_KEY matches", async () => {
    const response = await worker.fetch(new Request("https://example.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": "secret-key"
        },
        body: JSON.stringify({
            input: "Hello from auth test"
        })
    }), { API_KEY: "secret-key" });

    assert.notEqual(response.status, 401);
});

test("transcriptions route accepts Authorization bearer when API_KEY matches", async () => {
    const response = await handleRequest(new Request("https://example.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            Authorization: "Bearer secret-key",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }), { API_KEY: "secret-key" });

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.error.code, "invalid_content_type");
});
