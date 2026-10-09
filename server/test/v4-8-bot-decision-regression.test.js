import test from "node:test";
import assert from "node:assert/strict";
import {baseDecision,evaluateBot} from "../src/bot-ai-engine.js";

const features={BTC:{momentum7d:5,volatility:2,rsi:58}};
const optimistic={upProbability:0.9};
const pessimistic={upProbability:0.1};
const calm={name:"bullish"};
const riskOff={name:"risk-off"};
const risk={score:20,cashPct:80};
const holdings=[{asset:"BTC",quantity:1,allocation:10}];

test("Shield, Silver and Gold only propose bounded simulated orders",()=>{
 for(const type of ["shield","silver","gold"]){
  const buy=baseDecision(type,"BTC",features,optimistic,calm,risk,[]);
  assert.equal(buy.action,"buy",type);
  assert.equal(buy.asset,"BTC");
  assert.ok(buy.fraction>0&&buy.fraction<=0.04,type);
  const sell=baseDecision(type,"BTC",features,pessimistic,riskOff,risk,holdings);
  assert.equal(sell.action,"sell",type);
  assert.ok(sell.fraction>0&&sell.fraction<=0.15,type);
  assert.equal(baseDecision(type,"BTC",features,pessimistic,riskOff,risk,[]).action,"hold",type+" cannot sell absent holdings");
 }
});

test("Gold cannot buy under risk-off or weak momentum",()=>{
 assert.equal(baseDecision("gold","BTC",features,optimistic,riskOff,risk,[]).action,"hold");
 assert.equal(baseDecision("gold","BTC",{BTC:{...features.BTC,momentum7d:1}},optimistic,calm,risk,[]).action,"hold");
});

test("portfolio risk and cash guards veto simulated purchases",async()=>{
 const prices=[100,103,106,109,112,115].map((price,timestamp)=>({price,timestamp}));
 const input={type:"gold",market:[{symbol:"BTC",price:115,change24h:9}],histories:{BTC:prices}};
 for(const portfolio of [
  {cash:1000,total:1000,positions:[]},
  {cash:10,total:1000,positions:[]}
 ]){
  const decision=await evaluateBot({...input,portfolio,subscription:{min_cash_pct:101}});
  assert.equal(decision.action,"hold");
  assert.equal(decision.fraction,0);
  assert.ok(["risk_limit","strategy_hold"].includes(decision.decisionReason));
 }
});

test("ineligible crypto quotes fail closed without orders",async()=>{
 for(const type of ["shield","silver","gold"]){
  const decision=await evaluateBot({type,market:[{symbol:"BTC",price:-1}],portfolio:{total:1000,cash:1000,positions:[]}});
  assert.equal(decision.action,"hold");
  assert.equal(decision.fraction,0);
  assert.equal(decision.decisionReason,"no_eligible_market_data");
 }
});
