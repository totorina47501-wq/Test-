import test from "node:test";
import assert from "node:assert/strict";
import {presentDecision,decisionFilters} from "../src/bot-decision-history.js";
test("preserves actual decision evidence without inventing confidence",()=>{
 const row=presentDecision({action:"hold",reason:"Risk guard",confidence:null,features:{selected:{features:{rsi:54,volatility:2}},portfolioRisk:{score:42}}});
 assert.equal(row.actionLabel,"CONSERVATION");assert.equal(row.explanation,"Risk guard");
 assert.equal(row.confidence,null);assert.equal(row.indicators.rsi.value,54);assert.equal(row.risk.score,42);
 assert.equal(row.simulation,true);
});
test("does not fabricate missing explanations or indicators",()=>{
 const row=presentDecision({action:"buy",features:"invalid",confidence:99});
 assert.equal(row.explanation,null);assert.equal(row.confidence,null);assert.deepEqual(row.indicators,{});
});
test("validates filter inputs",()=>{
 assert.deepEqual(decisionFilters({botType:"GOLD",asset:"btc",days:"30",limit:"200"}),{botType:"gold",asset:"BTC",days:30,limit:100});
 assert.throws(()=>decisionFilters({days:"-1"}));
 assert.throws(()=>decisionFilters({asset:"BTC' OR 1=1"}));
});
