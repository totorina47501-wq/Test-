import test from "node:test";
import assert from "node:assert/strict";
import {scenarioValuation} from "../src/micro-alpha-valuation.js";
import {createPaperAccount,executePaperSignal} from "../src/micro-alpha-paper.js";
test("scenario valuation computes hypothetical BTC exposure, equity and PnL",()=>{
 const start=createPaperAccount({cash:1000});
 const result=executePaperSignal(start,{id:"scenario-0001",action:"buy",asset:"BTC",amountEur:20,price:50000,timestamp:1000});
 const valuation=scenarioValuation(result.account,60000);
 assert.equal(valuation.valuation,"manual-scenario-only");
 assert.equal(valuation.marketVerified,false);
 assert.equal(valuation.priceSource,"user-input");
 assert.ok(Math.abs(valuation.exposureEur-24)<1e-8);
 assert.ok(Math.abs(valuation.equityEur-1003.97)<1e-8);
 assert.ok(Math.abs(valuation.pnlEur-3.97)<1e-8);
});
test("scenario valuation never labels manual prices as live or market verified",()=>{
 const valuation=scenarioValuation(createPaperAccount({cash:1000}),50000);
 assert.equal(valuation.marketVerified,false);
 assert.equal(valuation.simulation,true);
 assert.equal(valuation.pnlPct,0);
});
test("scenario valuation refuses missing, invalid, negative and extreme prices",()=>{
 const account=createPaperAccount({cash:1000});
 for(const price of [undefined,null,"50000",0,-1,NaN,Infinity,10000001])assert.throws(()=>scenarioValuation(account,price));
});
test("scenario valuation rejects unsupported assets and malformed account state",()=>{
 const account=createPaperAccount({cash:1000});
 assert.throws(()=>scenarioValuation({...account,positions:{ETH:1}},50000));
 assert.throws(()=>scenarioValuation({...account,positions:{BTC:-1}},50000));
 assert.throws(()=>scenarioValuation({...account,cash:Infinity},50000));
});
