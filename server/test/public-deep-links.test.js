import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("public deep links redirect to existing hash sections", () => {
  assert.match(source, /app\.get\(\/\^\\\/\(\?:bots-ia\|faq\|portefeuille\)/);
  for (const mapping of ['"bots-ia":"bots"', 'faq:"faq"', 'portefeuille:"dashboard"']) {
    assert.ok(source.includes(mapping), `Missing route mapping: ${mapping}`);
  }
});

test("API throttling spares public assets and retains auth protections", () => {
  assert.ok(source.includes('app.use("/api", rateLimit({ windowMs: 60000'));
  assert.ok(!source.includes("app.use(rateLimit({ windowMs: 60000"));
  assert.ok(source.includes("const authRateLimit = rateLimit("));
  assert.ok(source.includes("const twoFactorRateLimit = rateLimit("));
  assert.ok(source.includes('app.set("trust proxy", trustedProxyHops)'));
});
