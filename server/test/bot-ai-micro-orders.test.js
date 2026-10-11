import test from "node:test";
import assert from "node:assert/strict";
import {simulateBacktest,compareBacktests} from "../src/bot-ai-backtest.js";

const start=Date.UTC(2026,0,1);
const histories={
 BTC:Array.from({length:80},(_,i)=>({timestamp:start+i*86400000,price:40000+i*180})),
 ETH:Array.from({length:80},(_,i)=>({timestamp:start+i*86400000,price:2000+i*10}))
};
test("micro-order cap and minimum are enforced for every simulated purchase",()=>{
 const result=simulateBacktest({botType:"adaptive-ai",histories,initialCash:200,minOrderEur:10,maxOrderEur:20});
 for(const order of result.decisionHistory.filter(x=>x.action==="buy")){
  const gross=order.quantity*order.price;
  assert.ok(gross>=9.99,"order below minimum");
  assert.ok(gross<=20.01,"order above cap");
 }
 assert.ok(result.finalEquity>=0);
});
test("invalid order limits are rejected",()=>{
 assert.throws(()=>simulateBacktest({histories,minOrderEur:25,maxOrderEur:20}),/Limites/);
 assert.throws(()=>simulateBacktest({histories,minOrderEur:-1}),/Limites/);
});
test("comparison forwards micro-order constraints",()=>{
 const rows=compareBacktests({histories,botTypes:["adaptive-ai"],initialCash:200,minOrderEur:10,maxOrderEur:20});
 assert.equal(rows.length,1);
 assert.ok(rows[0].decisionHistory.filter(x=>x.action==="buy").every(x=>x.quantity*x.price<=20.01));
});
