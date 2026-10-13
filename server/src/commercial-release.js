// Release controls are server-owned, fail-closed and separate from provider configuration.
// A configured Stripe key is never sufficient to activate subscriptions.
const truthy = value => value === "true";
export const RELEASE_DISABLED = "COMMERCIAL_RELEASE_DISABLED";
export function commercialRelease(env = process.env) {
 const payments = truthy(env.BITGOLD_PAID_SIMULATION_ENABLED) &&
   truthy(env.BITGOLD_LEGAL_APPROVED) &&
   truthy(env.BITGOLD_SECURITY_APPROVED) &&
   truthy(env.BITGOLD_PAYMENTS_APPROVED) &&
   truthy(env.BITGOLD_SUPPORT_READY);
 // The provider adapter itself rejects all real operations irrespective of this flag.
 return Object.freeze({simulation:true,paidSimulation:payments,realCrypto:false,
   providers:"precontract",growthAnalytics:"local-consent-only",support:"manual",
   blockers:payments?[]:["Paid simulation requires separate legal, security, payment and support approvals"]});
}
export function assertPaidSimulationEnabled(env=process.env){
 if(!commercialRelease(env).paidSimulation){
   const err=new Error("Paid subscriptions are not available yet");
   err.code=RELEASE_DISABLED;throw err;
 }
}
export function publicReleaseStatus(env=process.env){
 const status=commercialRelease(env);
 return Object.freeze({simulation:status.simulation,paidSimulation:status.paidSimulation,realCrypto:false,providers:"not-connected"});
}
