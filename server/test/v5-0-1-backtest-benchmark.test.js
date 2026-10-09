import test from "node:test";
import assert from "node:assert/strict";
import {simulateBacktest,compareBacktests} from "../src/bot-ai-backtest.js";
const histories={BTC:Array.from({length:50},(_,i)=>({timestamp:1000+i*3600000,price:100+i})),ETH:Array.from({length:50},(_,i)=>({timestamp:1000+i*3600000,price:50+i*.2}))};
test("BTC benchmark starts when strategy starts, not during warmup",()=>{
 const result=simulateBacktest({histories,botType:"shield"});
 const expected=(149/114-1)*100;
 assert.ok(Math.abs(result.benchmarkBTC-expected)<.01);
 assert.equal(result.benchmarkPeriod,"same-as-strategy");
 assert.ok(Math.abs(result.excessReturnBTC-(result.totalReturn-result.benchmarkBTC))<.02);
});
test("backtest rejects invalid cash and trading costs",()=>{
 assert.throws(()=>simulateBacktest({histories,initialCash:0}),/Capital initial invalide/);
 assert.throws(()=>simulateBacktest({histories,feeRate:-1}),/Frais ou slippage invalides/);
 assert.throws(()=>simulateBacktest({histories,slippageRate:1}),/Frais ou slippage invalides/);
});
test("comparison reports consistent benchmark and bounded drawdown",()=>{
 const results=compareBacktests({histories,botTypes:["silver","shield","gold"]});
 assert.equal(results.length,3);
 assert.ok(results.every(r=>r.benchmarkBTC===results[0].benchmarkBTC));
 assert.ok(results.every(r=>r.maxDrawdown>=0&&r.maxDrawdown<=100));
});
