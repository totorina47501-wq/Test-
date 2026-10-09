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

test("V5.1.3 journal is bounded and contains only simulated executions",()=>{
 const histories={BTC:Array.from({length:90},(_,i)=>({timestamp:1000+i*3600000,price:100+Math.sin(i/7)*20+i*.15})),ETH:Array.from({length:90},(_,i)=>({timestamp:1000+i*3600000,price:50+Math.cos(i/9)*8+i*.12}))};
 const result=simulateBacktest({botType:"gold",histories,initialCash:1000});
 assert.ok(Array.isArray(result.decisionHistory));
 assert.ok(result.decisionHistory.length<=30);
 assert.ok(result.decisionHistory.length<=result.trades);
 for(const entry of result.decisionHistory){
  assert.ok(["buy","sell"].includes(entry.action));
  assert.ok(entry.timestamp>0&&entry.price>0&&entry.quantity>0);
  assert.ok(entry.fee>=0);
  assert.ok(typeof entry.reason==="string");
 }
 const html=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
 assert.match(html,/id="botComparatorDecisions"/);
 assert.match(js,/function renderComparatorDecisions\(rows\)/);
 assert.match(js,/renderComparatorDecisions\(\[\]\)/);
});
