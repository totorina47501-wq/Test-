import test from "node:test";
import assert from "node:assert/strict";
import {baseDecision,rsi,evaluateBot} from "../src/bot-ai-engine.js";

const forecast={upProbability:0.9};
const features={BTC:{momentum7d:4,volatility:2,rsi:60}};
const risk={score:20,cashPct:80};
const bullish={name:"bullish"};
const riskOff={name:"risk-off"};

test("Shield holds under risk-off despite strong bullish signal",()=>{
 assert.equal(baseDecision("shield","BTC",features,forecast,risk,riskOff,[]).action,"hold");
});
test("Gold holds in risk-off and requires momentum",()=>{
 assert.equal(baseDecision("gold","BTC",features,forecast,risk,riskOff,[]).action,"hold");
 assert.equal(baseDecision("gold","BTC",{BTC:{...features.BTC,momentum7d:1}},forecast,risk,bullish,[]).action,"hold");
 assert.equal(baseDecision("gold","BTC",features,forecast,risk,bullish,[]).action,"buy");
});
test("RSI uses equal gain and loss periods",()=>{
 const points=[100,110,105,115,110,120].map((price,timestamp)=>({price,timestamp}));
 assert.ok(Math.abs(rsi(points)-75)<0.00001);
});
test("Empty eligible market fails closed regardless of strategy",async()=>{
 const decision=await evaluateBot({type:"gold",market:[],portfolio:{total:1000,cash:1000,positions:[]}});
 assert.equal(decision.action,"hold");
 assert.equal(decision.fraction,0);
});
