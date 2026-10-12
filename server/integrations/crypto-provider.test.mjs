import test from "node:test";
import assert from "node:assert/strict";
import {PROVIDERS, LIVE_DISABLED, providerConfig, createProviderAdapter, assertRealTradingDisabled} from "./crypto-provider.mjs";
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
