import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {simulateBacktest} from "../src/bot-ai-backtest.js";
const histories={BTC:Array.from({length:50},(_,i)=>({timestamp:1000+i*3600000,price:100+(i%3===0?-2:i)})),ETH:Array.from({length:50},(_,i)=>({timestamp:1000+i*3600000,price:50+(i%4===0?-1:i*.2)}))};
test("backtest reports aligned first and last observation timestamps",()=>{
 const result=simulateBacktest({histories,botType:"silver"});
 assert.equal(result.periodStart,histories.BTC[14].timestamp);
 assert.equal(result.periodEnd,histories.BTC.at(-1).timestamp);
 assert.ok(Number.isFinite(result.sortino));
 assert.ok(Number.isFinite(result.sharpe));
});
test("comparator excludes absent robustness instead of showing zero",()=>{
 const source=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
 assert.match(source,/row\.robustness\?\.confidence\?\.p50\)\.filter\(value=>value!==null/);
 assert.match(source,/comparatorCachedRows=\[\];/);
 assert.match(source,/if\(summary\)summary.hidden=true;/);
});
