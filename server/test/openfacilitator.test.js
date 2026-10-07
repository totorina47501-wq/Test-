import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=path.resolve(process.cwd());
const index=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
const adapter=fs.readFileSync(path.join(root,"src/openfacilitator.js"),"utf8");
const policy=fs.readFileSync(path.join(root,"src/agent-payment-policy.js"),"utf8");
const env=fs.readFileSync(path.join(root,".env.example"),"utf8");

test("OpenFacilitator x402 is configured as an explicit, disabled-by-default rail",()=>{
  assert.match(index,/createOpenFacilitator/);
  assert.match(index,/X402_FACILITATOR_URL/);
  assert.match(index,/X402_FACILITATOR_ENABLED.*false/);
  assert.match(index,/X402_SETTLEMENT_ENABLED.*false/);
  assert.match(env,/X402_FACILITATOR_URL=https:\/\/pay\.openfacilitator\.io/);
  assert.match(env,/X402_FACILITATOR_ENABLED=false/);
  assert.match(env,/X402_SETTLEMENT_ENABLED=false/);
});

test("OpenFacilitator adapter delegates to x402 verify and settle endpoints",()=>{
  assert.match(adapter,/pay\.openfacilitator\.io/);
  assert.match(adapter,/\/verify/);
  assert.match(adapter,/\/settle/);
  assert.match(adapter,/X402_SETTLEMENT_DISABLED/);
});

test("Agent mandates can select OpenFacilitator without removing simulation",()=>{
  assert.match(policy,/new Set\(\["simulation","x402-prepared","openfacilitator"\]\)/);
  assert.match(index,/\/api\/agent-payments\/x402\/verify/);
  assert.match(index,/\/api\/agent-payments\/x402\/settle/);
  assert.match(index,/X402_SETTLEMENT_DISABLED/);
  assert.match(index,/complianceStatus\.transaction_clear/);
});

test("x402 settlement cannot trust a client-supplied amountEur",()=>{
  assert.match(index,/\/api\/agent-payments\/x402\/quote/);
  assert.match(index,/quoteId, paymentPayload et paymentRequirements sont requis/);
  assert.doesNotMatch(index,/const amountEur=Number\(body\.amountEur\).*agentPayments\.authorize/s);
  assert.match(index,/quote\.amount_eur/);
  assert.match(index,/X402_QUOTE_MISMATCH/);
});

test("x402 quote binds atomic amount and requirements to the server quote",()=>{
  assert.match(index,/amount_atomic TEXT NOT NULL/);
  assert.match(index,/requirements_hash TEXT NOT NULL/);
  assert.match(index,/hashPaymentRequirements\(requirements\)/);
  assert.match(index,/acceptedMatchesRequirements\(body\.paymentPayload,requirements\)/);
});
