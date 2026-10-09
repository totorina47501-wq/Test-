import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {simulateBacktest} from "../src/bot-ai-backtest.js";
const histories={BTC:Array.from({length:50},(_,i)=>({timestamp:1000+i*3600000,price:100+i})),ETH:Array.from({length:50},(_,i)=>({timestamp:1000+i*3600000,price:50+i*.5}))};
test("BTC benchmark curve matches strategy timestamps and starts at aligned initial capital",()=>{
 const result=simulateBacktest({botType:"silver",histories,initialCash:1000});
 assert.equal(result.curve.length,result.benchmarkCurve.length);
 assert.ok(result.curve.length>1);
 assert.equal(result.benchmarkCurve[0].timestamp,result.curve[0].timestamp);
 assert.equal(result.benchmarkCurve[0].equity,1000);
 assert.equal(result.benchmarkCurve.at(-1).timestamp,result.curve.at(-1).timestamp);
 assert.ok(result.benchmarkCurve.at(-1).equity>1000);
});
test("strategy comparator renders and clears accessible simulated chart",()=>{
 const html=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
 assert.match(html,/id="botComparatorChart"/);
 assert.match(html,/comparator-chart-scroll/);
 assert.match(js,/function renderComparatorChart\(rows\)/);
 assert.match(js,/renderComparatorChart\(\[\]\)/);
 assert.match(js,/Évolution simulée de 1 000 €/);
 assert.match(js,/aria-label="Courbes de performance simulée/);
});
