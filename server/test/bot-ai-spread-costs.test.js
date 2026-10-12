import test from "node:test";
import assert from "node:assert/strict";
import {simulateBacktest,compareBacktests} from "../src/bot-ai-backtest.js";

const start=Date.UTC(2026,0,1);
const histories={BTC:Array.from({length:100},(_,i)=>({timestamp:start+i*86400000,price:40000+i*200})),ETH:Array.from({length:100},(_,i)=>({timestamp:start+i*86400000,price:2000+i*15}))};
test("spread never improves simulated equity for identical signals",()=>{
 const base={histories,botType:"adaptive-ai",initialCash:10000};
 const without=simulateBacktest({...base,spreadRate:0});
 const withSpread=simulateBacktest({...base,spreadRate:.003});
 assert.ok(withSpread.finalEquity<=without.finalEquity+0.01);
 assert.equal(withSpread.executionCosts.spreadRate,.003);
});
test("invalid spread is rejected",()=>{
 for(const spreadRate of [-.01,1,NaN])assert.throws(()=>simulateBacktest({histories,spreadRate}),/Spread/);
});
test("comparator forwards spread rate",()=>{
 const [row]=compareBacktests({histories,botTypes:["adaptive-ai"],spreadRate:.002});
 assert.equal(row.executionCosts.spreadRate,.002);
});
