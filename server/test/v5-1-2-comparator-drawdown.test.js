import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {drawdownSeries,simulateBacktest} from "../src/bot-ai-backtest.js";
test("drawdown series measures losses from rolling peak and resets on new highs",()=>{
 const curve=[100,120,90,110,130].map((equity,i)=>({timestamp:i+1,equity}));
 assert.deepEqual(drawdownSeries(curve).map(p=>p.drawdownPct),[0,0,25,8.33,0]);
 assert.deepEqual(drawdownSeries([]),[]);
});
test("backtest drawdown observations align with equity and maximum drawdown",()=>{
 const histories={BTC:Array.from({length:45},(_,i)=>({timestamp:1000+i*3600000,price:100+(i%10)*3})),ETH:Array.from({length:45},(_,i)=>({timestamp:1000+i*3600000,price:50+(i%9)*2}))};
 const result=simulateBacktest({botType:"silver",histories,initialCash:1000});
 assert.equal(result.drawdownCurve.length,result.curve.length);
 assert.equal(result.drawdownCurve[0].timestamp,result.curve[0].timestamp);
 assert.ok(result.drawdownCurve.every(p=>p.drawdownPct>=0&&Number.isFinite(p.drawdownPct)));
 assert.equal(Math.max(...result.drawdownCurve.map(p=>p.drawdownPct)),result.maxDrawdown);
});
test("UI includes accessible risk chart and clears obsolete data",()=>{
 const html=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
 assert.match(html,/id="botComparatorRisk"/);
 assert.match(js,/function renderComparatorRisk\(rows\)/);
 assert.match(js,/renderComparatorRisk\(\[\]\)/);
 assert.match(js,/Historique des baisses simulées/);
});
