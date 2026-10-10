import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
test("Northflank trusted proxy is bounded and configured before rate limiters",()=>{
  assert.match(source,/TRUST_PROXY_HOPS/);
  assert.match(source,/Number\.isSafeInteger\(trustedProxyHops\)/);
  assert.match(source,/trustedProxyHops < 0 \|\| trustedProxyHops > 5/);
  assert.match(source,/app\.set\("trust proxy", trustedProxyHops\)/);
  const proxyIndex = source.indexOf('app.set("trust proxy", trustedProxyHops)');
  const apiLimiterIndex = source.indexOf('app.use("/api", rateLimit(');
  assert.ok(proxyIndex >= 0 && apiLimiterIndex > proxyIndex, "Trusted proxy must be configured before API throttling");
  assert.doesNotMatch(source,/app\.set\(["']trust proxy["'],\s*true\)/);
});
