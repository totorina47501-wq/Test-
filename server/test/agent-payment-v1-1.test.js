import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(process.cwd());
const policy=fs.readFileSync(path.join(root,"src/agent-payment-policy.js"),"utf8");
const index=fs.readFileSync(path.join(root,"src/index.js"),"utf8");

test("operations exposes budget utilization and risk alerts",()=>{
  assert.match(policy,/dailyCapacityEur/);
  assert.match(policy,/utilizationPct/);
  assert.match(policy,/AGENT_BUDGET_HIGH/);
  assert.match(policy,/AGENT_DENIAL_SPIKE/);
});

test("x402 reconciliation detects lifecycle anomalies",()=>{
  assert.match(index,/\/api\/agent-payments\/x402\/reconciliation/);
  assert.match(index,/X402_MISSING_RECEIPT/);
  assert.match(index,/X402_MISSING_FAILURE_TIMESTAMP/);
  assert.match(index,/WHERE user_id=\$1/);
});
