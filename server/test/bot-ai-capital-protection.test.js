import test from "node:test";
import assert from "node:assert/strict";
import {simulateBacktest,compareBacktests} from "../src/bot-ai-backtest.js";
const start=Date.UTC(2026,0,1);
const histories={BTC:Array.from({length:90},(_,i)=>({timestamp:start+i*86400000,price:40000+i*160})),ETH:Array.from({length:90},(_,i)=>({timestamp:start+i*86400000,price:2000+i*11}))};
test("full cash reserve blocks purchases",()=>{
 const result=simulateBacktest({histories,initialCash:200,minCashPct:100});
 assert.equal(result.buyTrades,0);
 assert.equal(result.finalEquity,200);
});
test("risk settings validated and forwarded by comparator",()=>{
 for(const settings of [{minCashPct:-1},{minCashPct:101},{maxDrawdownStopPct:0},{maxDrawdownStopPct:101}]){
  assert.throws(()=>simulateBacktest({histories,...settings}),/Limites de risque/);
 }
 const [row]=compareBacktests({histories,botTypes:["adaptive-ai"],minCashPct:25,maxDrawdownStopPct:5});
 assert.equal(row.riskControls.minCashPct,25);
 assert.equal(row.riskControls.maxDrawdownStopPct,5);
});
