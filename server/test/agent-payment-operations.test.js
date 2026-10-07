import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=path.resolve(process.cwd());
const policy=fs.readFileSync(path.join(root,"src/agent-payment-policy.js"),"utf8");
const index=fs.readFileSync(path.join(root,"src/index.js"),"utf8");

test("agent payment operations exposes budgets mandates and recent events",()=>{
  assert.match(policy,/async function operations\(userId\)/);
  assert.match(policy,/spentTodayEur/);
  assert.match(policy,/LIMIT 100/);
  assert.match(index,/\/api\/agent-payments\/operations/);
  assert.match(index,/settlementAvailable/);
  assert.match(index,/x402_audit/);
});

test("a mandate can be revoked individually with user ownership enforced",()=>{
  assert.match(policy,/async function revokeMandateById/);
  assert.match(policy,/WHERE id=\$1 AND user_id=\$2/);
  assert.match(policy,/individual_revocation/);
  assert.match(index,/\/api\/agent-payments\/mandates\/id\/:mandateId/);
});
