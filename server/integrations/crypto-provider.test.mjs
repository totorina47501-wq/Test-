import test from "node:test";
import assert from "node:assert/strict";
import {PROVIDERS, LIVE_DISABLED, providerConfig, createProviderAdapter, assertRealTradingDisabled,createContractFixture} from "./crypto-provider.mjs";
test("providers are explicitly enumerated and disabled", () => {
  assert.deepEqual(PROVIDERS, ["venga", "bitpanda"]);
  for (const name of PROVIDERS) {
    const adapter = createProviderAdapter(name);
    assert.equal(adapter.mode, "precontract");
    assert.equal(adapter.capabilities.buy, "unverified");
    assert.equal(adapter.capabilities.kyc, "unverified");
  }
});
test("all financial and onboarding actions fail closed for both partners", async () => {
  for (const name of PROVIDERS) {
    const adapter = createProviderAdapter(name);
    for (const action of ["createCustomer","startKyc","getBalances","getQuote","submitOrder","getOrder","getTransactions","createDeposit","requestWithdrawal","processWebhook"]) {
      await assert.rejects(adapter[action]({userId: "test", amount: 10}), {code: LIVE_DISABLED});
    }
  }
});
test("config cannot enable live trading by environment variable", () => {
  assert.deepEqual(providerConfig({CRYPTO_PROVIDER:"venga", CRYPTO_LIVE_ENABLED:"true"}), {selected:"venga", enabled:false, mode:"precontract"});
  assert.throws(() => providerConfig({CRYPTO_PROVIDER:"unknown"}), /Invalid/);
  assert.throws(assertRealTradingDisabled, {code:LIVE_DISABLED});
  assert.throws(() => createProviderAdapter("other"), /Unsupported/);
});

test("fixture isolates users, rejects expired quotes and prevents duplicate orders",()=>{
 let now=1000;const fixture=createContractFixture({clock:()=>now});
 const q=fixture.previewQuote({userId:"user_one",asset:"BTC",side:"buy",amount:100});
 const first=fixture.submitOrder({userId:"user_one",idempotencyKey:"request_one",quote:q});
 assert.deepEqual(fixture.submitOrder({userId:"user_one",idempotencyKey:"request_one",quote:q}),first);
 assert.throws(()=>fixture.reconcile({userId:"user_two",orderId:first.id}),{code:"FIXTURE_ORDER_UNKNOWN"});
 assert.throws(()=>fixture.submitOrder({userId:"user_one",idempotencyKey:"request_one",quote:{...q,amount:200}}),{code:"FIXTURE_CONFLICT"});
 assert.throws(()=>fixture.ingestEvent({eventId:"event_one",orderId:first.id,userId:"user_one",status:"settled"}),{code:"FIXTURE_EVENT_REJECTED"});
 assert.deepEqual(fixture.ingestEvent({eventId:"event_one",orderId:first.id,userId:"user_one",status:"settled",signatureVerified:true}),{duplicate:false,applied:true,status:"settled",synthetic:true});
 assert.equal(fixture.ingestEvent({eventId:"event_one",orderId:first.id,userId:"user_one",status:"settled",signatureVerified:true}).duplicate,true);
 assert.equal(fixture.reconcile({userId:"user_one",orderId:first.id}).status,"settled");
 now+=31000;assert.throws(()=>fixture.submitOrder({userId:"user_one",idempotencyKey:"request_two",quote:q}),{code:"FIXTURE_QUOTE_EXPIRED"});
});
