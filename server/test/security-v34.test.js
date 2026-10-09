import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(root,"src/index.js"),"utf8");

test("production cannot self-upgrade to Pro or Elite through demo plan endpoint",()=>{
  const start=source.indexOf('app.post("/api/plan/demo"');
  const end=source.indexOf('app.get("/api/plans/demo"',start);
  assert.ok(start>=0&&end>start);
  const route=source.slice(start,end);
  assert.match(route,/if\(isProduction\)return res\.status\(403\)/);
  assert.ok(route.indexOf("if(isProduction)")<route.indexOf("UPDATE users SET plan"),"deny before writes");
  assert.match(route,/DEMO_PLAN_DISABLED/);
});

test("queued bot signals re-check active subscription and current plan under row lock",()=>{
  const start=source.indexOf("async function executeBotDecision(");
  const end=source.indexOf("async function runBots(",start);
  assert.ok(start>=0&&end>start);
  const handler=source.slice(start,end);
  assert.match(handler,/SELECT \* FROM bot_subscriptions WHERE id=\$1 AND user_id=\$2 FOR UPDATE/);
  assert.match(handler,/if\(!current\?\.active\)\{await client\.query\("ROLLBACK"\);return;\}/);
  assert.match(handler,/botEntitlement\(currentPlan,current\.bot_type\)/);
  assert.match(handler,/subscription=current/);
  assert.ok(handler.indexOf("subscription=current")<handler.indexOf("UPDATE wallets SET cash"),"current risk limits before trade");
});
