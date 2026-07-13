import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

const TEST_SECRET = "test-jwt-secret-minimum-32-characters-long!!";

describe("JWT_SECRET validation", () => {
  const original = process.env.JWT_SECRET;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = original;
    }
  });

  it("throws when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;
    const { getJwtSecret } = await import("../src/lib/env.ts");
    assert.throws(() => getJwtSecret(), /Missing JWT_SECRET/);
  });

  it("throws when JWT_SECRET is too short", async () => {
    process.env.JWT_SECRET = "short";
    const { getJwtSecret } = await import("../src/lib/env.ts");
    assert.throws(() => getJwtSecret(), /at least 32 characters/);
  });

  it("throws when JWT_SECRET uses placeholder", async () => {
    process.env.JWT_SECRET = "your-secret-key-change-in-production";
    const { getJwtSecret } = await import("../src/lib/env.ts");
    assert.throws(() => getJwtSecret(), /placeholder/);
  });

  it("accepts a strong secret", async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    const { getJwtSecret } = await import("../src/lib/env.ts");
    assert.equal(getJwtSecret(), TEST_SECRET);
  });
});

describe("sanitizeArticleHtml", () => {
  it("strips script tags", async () => {
    const { sanitizeArticleHtml } = await import("../src/lib/sanitizeArticleHtml.ts");
    const result = sanitizeArticleHtml('<p>Hi</p><script>alert(1)</script>');
    assert.ok(!result.includes("<script"));
    assert.ok(result.includes("Hi"));
  });

  it("strips event handlers", async () => {
    const { sanitizeArticleHtml } = await import("../src/lib/sanitizeArticleHtml.ts");
    const result = sanitizeArticleHtml('<img src="https://evil.test/x" onerror="alert(1)" />');
    assert.ok(!result.includes("onerror"));
  });
});

describe("getClientIp", () => {
  it("reads x-forwarded-for first hop", async () => {
    const { getClientIp } = await import("../src/lib/request.ts");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    assert.equal(getClientIp(req), "1.2.3.4");
  });
});
