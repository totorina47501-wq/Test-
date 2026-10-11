import test from "node:test";
import assert from "node:assert/strict";
import {strategyDNA} from "../src/bot-strategy-dna.js";

test("Strategy DNA differentiates Shield, Silver and Gold",()=>{
  const entries=["shield","silver","gold"].map(type=>strategyDNA({type,decision:{action:"hold"}}));
  assert.deepEqual(entries.map(x=>x.riskBudget),[25,45,65]);
  assert.ok(entries.every(x=>x.simulationOnly&&x.reasons.length>0));
});
test("Strategy DNA explains risk-off and high portfolio risk",()=>{
  const dna=strategyDNA({type:"gold",decision:{action:"buy",asset:"BTC",confidence:2},risk:{score:82,cashPct:12},regime:{name:"risk-off"},features:{BTC:{rsi:85,momentum7d:-8}}});
  assert.equal(dna.confidence,1);
  assert.equal(dna.reasons.length,5);
  assert.equal(dna.metrics.riskScore,82);
});
test("Strategy DNA rejects unknown bot and sanitizes invalid values",()=>{
  assert.throws(()=>strategyDNA({type:"unknown"}),RangeError);
  const dna=strategyDNA({type:"shield",decision:{action:"delete",asset:"../../",confidence:NaN},risk:{cashPct:-5}});
  assert.equal(dna.action,"hold");
  assert.equal(dna.asset,null);
  assert.equal(dna.metrics.cashPct,0);
});
