import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(process.cwd());
const server=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
const policy=fs.readFileSync(path.join(root,"src/agent-payment-policy.js"),"utf8");
const env=fs.readFileSync(path.join(root,".env.example"),"utf8");
test("agent payment authorization is wired into bot execution",()=>{
  assert.match(server,/createAgentPayments/);
  assert.match(server,/agentPayments\.authorize/);
  assert.match(server,/\/api\/agent-payments\/mandate/);
  assert.match(policy,/bitgold\.agent-payment-mandate\.0\.2/);
  assert.match(policy,/AGENT_PLAN_POLICY/);
});
test("Free stays simulation-only while Pro and Elite have bounded autonomy",()=>{
  assert.match(policy,/free:\{label:"Free",simulationOnly:true/);
  assert.match(policy,/pro:\{label:"Pro",simulationOnly:false/);
  assert.match(policy,/elite:\{label:"Elite",simulationOnly:false/);
  assert.match(policy,/maxTransactionEur:1000/);
  assert.match(policy,/maxTransactionEur:5000/);
});
test("mandates are signed, expiring and revocable",()=>{
  assert.match(policy,/createHmac\("sha256",secret\)/);
  assert.match(policy,/expires_at/);
  assert.match(policy,/revoked_at/);
  assert.match(policy,/mandate_revoked/);
  assert.match(policy,/AGENT_MANDATE_REQUIRED/);
});
test("production agent authorization stays behind KYC/AML and human limits",()=>{
  assert.match(policy,/transaction_clear/);
  assert.match(policy,/AGENT_HUMAN_APPROVAL_REQUIRED/);
  assert.match(policy,/AGENT_DAILY_BUDGET/);
  assert.match(env,/AGENT_PAYMENT_ENFORCEMENT=/);
  assert.match(env,/AGENT_PAYMENT_MANDATE_SECRET=/);
  assert.match(env,/PAYMENT_RAIL_MODE=/);
});
