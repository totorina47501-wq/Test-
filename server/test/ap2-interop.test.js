import test from "node:test";
import assert from "node:assert/strict";
import { AP2_INTEROP_STATUS,mapBitGoldMandateToAp2,signAp2Boundary,validateAp2Boundary } from "../src/ap2-interop.js";

const mandate={
  vct:"bitgold.agent-payment-mandate.0.2",user_id:7,bot_id:"dca",allowed_assets:["USDC"],
  max_transaction_eur:100,daily_budget_eur:500,human_approval_threshold_eur:75,
  rail_mode:"openfacilitator",issued_at:"2026-01-01T00:00:00.000Z",expires_at:"2026-01-02T00:00:00.000Z"
};

test("maps BitGold authorization into separate checkout and payment mandates",()=>{
  const mapped=mapBitGoldMandateToAp2(mandate);
  assert.equal(mapped.checkoutMandate.type,"checkout_mandate");
  assert.equal(mapped.paymentMandate.type,"payment_mandate");
  assert.equal(mapped.paymentMandate.rail.protocol,"x402");
  assert.equal(mapped.paymentMandate.compliance.provider,"bitgold");
  assert.equal(validateAp2Boundary(mapped).valid,true);
});

test("payment mandate is cryptographically bound to checkout mandate",()=>{
  const mapped=mapBitGoldMandateToAp2(mandate);
  mapped.checkoutMandate.constraints.maxTransactionEur=999;
  assert.deepEqual(validateAp2Boundary(mapped),{valid:false,reason:"AP2_MANDATE_BINDING"});
});

test("AP2 mapping keeps compliance owned by BitGold",()=>{
  const mapped=mapBitGoldMandateToAp2(mandate);
  mapped.paymentMandate.compliance.provider="rail";
  assert.deepEqual(validateAp2Boundary(mapped),{valid:false,reason:"AP2_COMPLIANCE_BOUNDARY"});
});

test("current integration explicitly does not claim complete AP2 compliance",()=>{
  assert.equal(AP2_INTEROP_STATUS.completeImplementation,false);
  assert.match(AP2_INTEROP_STATUS.note,/aucune revendication/i);
});


test("signed AP2 boundary detects tampering when signature verification is required",()=>{
  const secret="test-only-secret-with-at-least-32-characters";
  const mapped=mapBitGoldMandateToAp2(mandate);
  const signature=signAp2Boundary(mapped,secret);
  assert.equal(validateAp2Boundary({...mapped,signature},{requireSignature:true,secret}).valid,true);
  const tampered={...mapped,paymentMandate:{...mapped.paymentMandate,rail:{type:"simulation",protocol:"internal"}}};
  assert.deepEqual(validateAp2Boundary({...tampered,signature},{requireSignature:true,secret}),{valid:false,reason:"AP2_SIGNATURE_INVALID"});
});
