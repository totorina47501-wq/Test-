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

test("public rate limit and proxy trust remain enabled", () => {
  assert.match(source, /app\.set\("trust proxy", trustedProxyHops\)/);
  assert.match(source, /app\.use\(rateLimit\(\{ windowMs: 60000/);
});
