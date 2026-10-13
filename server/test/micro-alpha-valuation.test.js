import test from "node:test";
import assert from "node:assert/strict";
import {scenarioValuation,verifiedMarketValuation} from "../src/micro-alpha-valuation.js";
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

test("fresh CoinGecko BTC quote values paper positions without modifying account",()=>{
 const account=executePaperSignal(createPaperAccount({cash:1000}),{id:"fresh-quote-1",action:"buy",asset:"BTC",amountEur:20,price:50000,timestamp:1000}).account;
 const before=JSON.stringify(account);
 const result=verifiedMarketValuation(account,{symbol:"BTC",price:60000,priceFresh:true,priceUpdatedAt:100000},105000);
 assert.equal(result.marketVerified,true);
 assert.equal(result.valuation,"verified-market-snapshot");
 assert.equal(result.priceSource,"CoinGecko");
 assert.equal(result.priceUpdatedAt,100000);
 assert.ok(result.pnlEur>0);
 assert.equal(JSON.stringify(account),before);
});
test("market valuation fails closed on stale, missing, future, fallback or malformed quotes",()=>{
 const account=createPaperAccount({cash:1000});
 const now=1000000;
 for(const quote of [null,{}, {symbol:"ETH",price:50000,priceFresh:true,priceUpdatedAt:now},{symbol:"BTC",price:50000,priceFresh:false,priceUpdatedAt:now},{symbol:"BTC",price:50000,priceFresh:true,priceUpdatedAt:now-60001},{symbol:"BTC",price:50000,priceFresh:true,priceUpdatedAt:now+1},{symbol:"BTC",price:50000,priceFresh:true,priceUpdatedAt:null},{symbol:"BTC",price:0,priceFresh:true,priceUpdatedAt:now}]){
  assert.throws(()=>verifiedMarketValuation(account,quote,now));
 }
});
