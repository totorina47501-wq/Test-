import test from "node:test";
import assert from "node:assert/strict";
import {createPaperAccount,executePaperSignal,paperEquity} from "../src/micro-alpha-paper.js";
const signal={id:"paper-1",action:"buy",asset:"BTC",amountEur:20,price:40000,timestamp:1000};
test("paper buys debit virtual cash and deduplicate",()=>{
 const first=executePaperSignal(createPaperAccount({cash:100}),signal);
 assert.equal(first.executed,true);
 assert.ok(first.account.cash<80);
 assert.equal(first.account.trades[0].simulation,true);
 const duplicate=executePaperSignal(first.account,signal);
 assert.equal(duplicate.executed,false);
 assert.equal(duplicate.account.trades.length,1);
});
test("paper rejects invalid limits and insufficient cash",()=>{
 assert.equal(executePaperSignal(createPaperAccount({cash:10}),signal).reason,"insufficient-cash");
 assert.equal(executePaperSignal(createPaperAccount(),{...signal,amountEur:100}).reason,"order-limit");
 assert.throws(()=>executePaperSignal(createPaperAccount(),{...signal,price:NaN}),/Invalid/);
});
test("drawdown stop blocks purchases, not liquidation",()=>{
 const a=createPaperAccount({cash:100,maxDrawdownPct:10});
 a.positions.BTC=.01;a.cash=0;a.peakEquity=100;
 const blocked=executePaperSignal(a,{...signal,amountEur:10,price:1000},{BTC:1000});
 assert.equal(blocked.reason,"drawdown-stop");
 const sold=executePaperSignal(blocked.account,{...signal,id:"paper-2",action:"sell",amountEur:5,price:1000},{BTC:1000});
 assert.equal(sold.executed,true);
 assert.ok(paperEquity(sold.account,{BTC:1000})>0);
});
