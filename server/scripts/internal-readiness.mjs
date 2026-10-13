#!/usr/bin/env node
// Fail-closed internal release evidence audit. Does not activate paid or real trading.
import {readFile,access} from "node:fs/promises";
import {join} from "node:path";
const root=new URL("../",import.meta.url);
const checks=[
 ["commercial release gate","src/commercial-release.js"],
 ["Stripe signed webhook regression","test/stripe-webhook-gate.test.js"],
 ["Stripe event replay regression","test/stripe-webhook-idempotency.test.js"],
 ["JWT / 2FA security regression","test/security-v34.test.js"],
 ["Bot historical valuation regression","test/bot-observability-contract.test.js"],
 ["Production desktop/mobile guest E2E","e2e/production-smoke.spec.mjs"],
 ["Production authenticated E2E","e2e/production-auth-readonly.spec.mjs"],
 ["Production profile / 2FA / backtest E2E","e2e/production-auth-profile-backtest.spec.mjs"],
 ["Deployment provenance script","scripts/production-evidence.mjs"],
 ["Commercial sign-off checklist","../docs/COMMERCIAL_RELEASE_GATES.md"]
];
const result={checkedAt:new Date().toISOString(),scope:"internal-evidence",checks:[],commercialApproval:false};
for(const [name,path] of checks){
 let exists=true;
 try{await access(new URL(path,root))}catch{exists=false}
 result.checks.push({name,exists});
}
const release=await readFile(new URL("../docs/COMMERCIAL_RELEASE_GATES.md",root),"utf8").catch(()=>"");
result.commercialApproval=!release.includes("NOT APPROVED")&&release.includes("APPROVED BY PRODUCT, SECURITY, LEGAL, PAYMENTS, OPS");
result.missing=result.checks.filter(c=>!c.exists).map(c=>c.name);
result.externalEvidenceRequired=["signed Stripe sandbox replay/refund/chargeback","production Northflank deployed SHA","backup restore drill","security and legal sign-off","live 2FA and recovery exercise","production latency/429 evidence","SEO indexing and consent analytics evidence"];
console.log(JSON.stringify(result,null,2));
if(result.missing.length)process.exitCode=1;
if(process.env.BITGOLD_REQUIRE_COMMERCIAL_APPROVAL==="true"&&!result.commercialApproval)process.exitCode=2;
