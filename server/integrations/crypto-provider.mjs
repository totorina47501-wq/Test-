// Pre-contract interface. No provider network calls, credentials or real orders.
export const PROVIDERS = Object.freeze(["venga", "bitpanda"]);
export const LIVE_DISABLED = "LIVE_CRYPTO_NOT_AUTHORIZED";
export function providerConfig(env = process.env) {
  const selected = env.CRYPTO_PROVIDER || "none";
  if (!["none", ...PROVIDERS].includes(selected)) throw new Error("Invalid crypto provider");
  return Object.freeze({ selected, enabled: false, mode: "precontract" });
}
export function createProviderAdapter(provider, options = {}) {
  if (!PROVIDERS.includes(provider)) throw new Error("Unsupported crypto provider");
  const failClosed = async () => { throw Object.assign(new Error("Real crypto operations are disabled pending partner contract, compliance approval and audited integration"), { code: LIVE_DISABLED }); };
  return Object.freeze({
    provider, mode: "precontract", capabilities: Object.freeze({
      userProvisioning: "unverified", kyc: "unverified", custody: "unverified",
      fiatDeposits: "unverified", fiatWithdrawals: "unverified",
      quote: "unverified", buy: "unverified", sell: "unverified",
      swaps: "unverified", webhook: "unverified"
    }),
    createCustomer: failClosed, startKyc: failClosed, getBalances: failClosed,
    getQuote: failClosed, submitOrder: failClosed, getOrder: failClosed,
    getTransactions: failClosed, createDeposit: failClosed,
    requestWithdrawal: failClosed, processWebhook: failClosed
  });
}
export function assertRealTradingDisabled() {
  throw Object.assign(new Error("Real-money crypto trading is not available"), { code: LIVE_DISABLED });
}
