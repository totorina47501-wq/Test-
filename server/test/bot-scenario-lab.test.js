import test from "node:test";
import assert from "node:assert/strict";
import {botScenarioLab} from "../src/bot-scenario-lab.js";
test("what-if lab compares three synthetic scenarios without trades",()=>{
 const result=botScenarioLab({type:"shield",portfolio:{total:10000,cash:4000}});
 assert.deepEqual(result.scenarios.map(x=>x.estimatedTotalEur),[10900,8500,10000]);
 assert.equal(result.scenarios[1].riskFlag,"above-profile-exposure");
 assert.equal(result.forecast,false);
 assert.equal(result.simulationOnly,true);
});
test("cash-only account stays unchanged under shocks",()=>{
 const result=botScenarioLab({type:"gold",portfolio:{total:10000,cash:10000}});
 assert.ok(result.scenarios.every(x=>x.estimatedPnlEur===0));
});
test("invalid portfolio is rejected",()=>{
 assert.throws(()=>botScenarioLab({type:"silver",portfolio:{total:100,cash:120}}),RangeError);
});
