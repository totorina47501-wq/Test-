import test from "node:test";
import assert from "node:assert/strict";
import { commercialRelease, assertPaidSimulationEnabled, publicReleaseStatus, RELEASE_DISABLED } from "../src/commercial-release.js";

// Regression matrix for pre-launch fail-closed behavior. These tests never contact Stripe.
const approvals = [
  "BITGOLD_PAID_SIMULATION_ENABLED",
  "BITGOLD_LEGAL_APPROVED",
  "BITGOLD_SECURITY_APPROVED",
  "BITGOLD_PAYMENTS_APPROVED",
  "BITGOLD_SUPPORT_READY",
];
const approved = Object.fromEntries(approvals.map(key => [key, "true"]));

test("every commercial approval is individually mandatory", () => {
  for (const key of approvals) {
    for (const value of [undefined, "", "false", "TRUE", "1", "yes", " true "]) {
      const env = { ...approved, [key]: value, STRIPE_SECRET_KEY: "sk_live_fake", STRIPE_WEBHOOK_SECRET: "whsec_fake" };
      assert.equal(commercialRelease(env).paidSimulation, false, `${key}=${String(value)}`);
      assert.throws(() => assertPaidSimulationEnabled(env), error =>
        error.code === RELEASE_DISABLED && !/sk_live|whsec/.test(error.message)
      );
    }
  }
});

test("provider and real-money capabilities remain disabled with all approvals", () => {
  const env = { ...approved, CRYPTO_PROVIDER_ENABLED: "true", BITGOLD_REAL_TRADING_ENABLED: "true" };
  const internal = commercialRelease(env);
  const publicStatus = publicReleaseStatus(env);
  assert.equal(internal.simulation, true);
  assert.equal(internal.realCrypto, false);
  assert.equal(internal.providers, "precontract");
  assert.equal(publicStatus.realCrypto, false);
  assert.equal(publicStatus.providers, "not-connected");
  assert.equal(publicStatus.paidSimulation, true);
});

test("public release status never exposes credentials or approval flags", () => {
  const env = { ...approved, STRIPE_SECRET_KEY: "sk_test_secret", STRIPE_WEBHOOK_SECRET: "whsec_secret", PROVIDER_API_KEY: "private" };
  const serialized = JSON.stringify(publicReleaseStatus(env));
  for (const secret of ["sk_test_secret", "whsec_secret", "private", "BITGOLD_LEGAL_APPROVED"]) {
    assert.equal(serialized.includes(secret), false);
  }
  assert.deepEqual(Object.keys(publicReleaseStatus(env)).sort(), ["paidSimulation", "providers", "realCrypto", "simulation"]);
});

test("release status is immutable and independent of subsequent env changes", () => {
  const env = { ...approved };
  const status = commercialRelease(env);
  assert.equal(Object.isFrozen(status), true);
  env.BITGOLD_LEGAL_APPROVED = "false";
  assert.equal(status.paidSimulation, true);
  assert.equal(commercialRelease(env).paidSimulation, false);
  assert.equal(Object.isFrozen(publicReleaseStatus(env)), true);
});

test("commercial gate does not mutate input configuration", () => {
  const env = Object.freeze({ ...approved });
  assert.doesNotThrow(() => commercialRelease(env));
  assert.doesNotThrow(() => publicReleaseStatus(env));
});
