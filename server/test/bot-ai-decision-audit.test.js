import test from "node:test";
import assert from "node:assert/strict";
import {evaluateBot} from "../src/bot-ai-engine.js";

test("no eligible market data is a safe HOLD with a reason code",async()=>{
 const result=await evaluateBot({type:"gold",market:[{symbol:"BTC",price:0}],histories:{},portfolio:{cash:1000,total:1000,positions:[]}});
 assert.equal(result.action,"hold");
 assert.equal(result.fraction,0);
 assert.equal(result.decisionReason,"no_eligible_market_data");
 assert.equal(result.aiConfidence,null);
 assert.equal(result.confidence,0.5);
});
test("too-short histories fail closed with a documented reason",async()=>{
 const result=await evaluateBot({type:"shield",market:[{symbol:"BTC",price:100}],histories:{BTC:[{price:100},{price:101}]},portfolio:{cash:1000,total:1000,positions:[]}});
 assert.equal(result.action,"hold");
 assert.equal(result.decisionReason,"no_eligible_market_data");
});
test("decision reason is stable and separate from AI confidence",async()=>{
 const result=await evaluateBot({type:"gold",market:[],portfolio:{}});
 assert.ok(["no_eligible_market_data","strategy_hold","ai_veto","invalid_market_data","risk_limit","strategy_signal"].includes(result.decisionReason));
 assert.equal(result.aiConfidence,null);
});
