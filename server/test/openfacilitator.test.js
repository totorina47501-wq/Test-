import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildPaymentRequirements, hashPaymentRequirements, acceptedMatchesRequirements } from "../src/x402-quote.js";

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
  const settleRoute=index.slice(index.indexOf('app.post("/api/agent-payments/x402/settle"'));
  assert.doesNotMatch(settleRoute,/body\.amountEur/);
  assert.match(settleRoute,/quote\.amount_eur/);
  assert.match(index,/X402_QUOTE_MISMATCH/);
});

test("x402 quote binds atomic amount and requirements to the server quote",()=>{
  assert.match(index,/amount_atomic TEXT NOT NULL/);
  assert.match(index,/requirements_hash TEXT NOT NULL/);
  assert.match(index,/hashPaymentRequirements\(requirements\)/);
  assert.match(index,/acceptedMatchesRequirements\(body\.paymentPayload,requirements\)/);
});

test("x402 quote helper binds amount, network, asset and recipient",()=>{
  const requirements=buildPaymentRequirements({
    protocolVersion:2,
    network:"eip155:84532",
    amountAtomic:"1000000",
    asset:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo:"0x1111111111111111111111111111111111111111"
  });
  assert.equal(requirements.amount,"1000000");
  assert.equal(hashPaymentRequirements(requirements),hashPaymentRequirements({...requirements}));
  assert.notEqual(hashPaymentRequirements(requirements),hashPaymentRequirements({...requirements,amount:"2000000"}));
  assert.equal(acceptedMatchesRequirements({accepted:requirements},requirements),true);
  assert.equal(acceptedMatchesRequirements({accepted:{...requirements,network:"eip155:1"}},requirements),false);
});


test("x402 quote is fail-closed behind a server allowlist",()=>{
  assert.match(index,/X402_ALLOWED_NETWORK/);
  assert.match(index,/X402_ALLOWED_ASSET/);
  assert.match(index,/X402_ALLOWED_ASSET_SYMBOL/);
  assert.match(index,/X402_PAY_TO/);
  assert.match(index,/X402_ALLOWLIST_NOT_CONFIGURED/);
  assert.match(index,/X402_TARGET_DENIED/);
});

test("x402 settlement requires idempotency and audits lifecycle states",()=>{
  assert.match(index,/Idempotency-Key requis/);
  assert.match(index,/idempotency_key TEXT/);
  assert.match(index,/status='verified'/);
  assert.match(index,/status='settled',settled_at=CURRENT_TIMESTAMP/);
  assert.match(index,/status='failed',failed_at=CURRENT_TIMESTAMP/);
  assert.match(index,/quote\.status==="settled"&&quote\.idempotency_key===idempotencyKey/);
});
