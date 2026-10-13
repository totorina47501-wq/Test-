import test from "node:test";
import assert from "node:assert/strict";
import {commercialRelease,assertPaidSimulationEnabled,publicReleaseStatus,RELEASE_DISABLED} from "../src/commercial-release.js";
const approved={BITGOLD_PAID_SIMULATION_ENABLED:"true",BITGOLD_LEGAL_APPROVED:"true",BITGOLD_SECURITY_APPROVED:"true",BITGOLD_PAYMENTS_APPROVED:"true",BITGOLD_SUPPORT_READY:"true"};
test("default release gates fail closed even when Stripe credentials are present",()=>{
 const env={STRIPE_SECRET_KEY:"sk_test_placeholder"};
 assert.equal(commercialRelease(env).paidSimulation,false);
 assert.throws(()=>assertPaidSimulationEnabled(env),{code:RELEASE_DISABLED});
 assert.equal(publicReleaseStatus(env).realCrypto,false);
});
test("all approvals required for paid simulation",()=>{
 for(const key of Object.keys(approved)){
  const env={...approved,[key]:"false"};
  assert.equal(commercialRelease(env).paidSimulation,false,key);
 }
 assert.equal(commercialRelease(approved).paidSimulation,true);
 assert.doesNotThrow(()=>assertPaidSimulationEnabled(approved));
 assert.equal(commercialRelease({...approved,BITGOLD_LEGAL_APPROVED:"TRUE"}).paidSimulation,false);
});
test("commercial approval cannot enable real crypto or providers",()=>{
 const status=publicReleaseStatus(approved);
 assert.equal(status.realCrypto,false);
 assert.equal(status.providers,"not-connected");
});
