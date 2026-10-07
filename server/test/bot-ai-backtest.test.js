import test from "node:test";
import assert from "node:assert/strict";
import {simulateBacktest,analyzeBacktestRobustness,compareBacktests} from "../src/bot-ai-backtest.js";

function series(start,step,count,scale=1){
  return Array.from({length:count},(_,i)=>({timestamp:Date.parse("2026-01-01T00:00:00Z")+i*86400000,price:(start+i*step)*scale}));
}

const histories={
  BTC:series(100,1,40),
  ETH:series(50,.4,40),
  SOL:series(20,.15,40),
  LINK:series(10,.08,40),
  AVAX:series(12,.05,40)
};

test("le backtest produit des métriques finies et un benchmark",()=>{
  const out=simulateBacktest({botType:"adaptive-ai",histories,initialCash:10000});
  assert.equal(out.botType,"adaptive-ai");
  assert.ok(Number.isFinite(out.finalEquity));
  assert.ok(Number.isFinite(out.totalReturn));
  assert.ok(Number.isFinite(out.maxDrawdown));
  assert.ok(Number.isFinite(out.sharpe));
  assert.ok(Number.isFinite(out.sortino));
  assert.ok(Number.isFinite(out.benchmarkBTC));
  assert.ok(out.periodPoints>=16);
});

test("le backtest reste déterministe à données identiques",()=>{
  const a=simulateBacktest({botType:"quant-pulse",histories,initialCash:10000});
  const b=simulateBacktest({botType:"quant-pulse",histories,initialCash:10000});
  assert.deepEqual({...a,curve:undefined},{...b,curve:undefined});
  assert.deepEqual(a.curve,b.curve);
});

test("un historique trop court est refusé",()=>{
  assert.throws(()=>simulateBacktest({botType:"shield",histories:{BTC:series(100,1,8)}}),/Historique insuffisant/);
});


test("l’analyse de robustesse est déterministe et bornée",()=>{
  const curve=Array.from({length:20},(_,i)=>({timestamp:i,equity:10000*(1+i*.002)}));
  const a=analyzeBacktestRobustness({curve,paths:100,seed:42});
  const b=analyzeBacktestRobustness({curve,paths:100,seed:42});
  assert.deepEqual(a,b);
  assert.equal(a.paths,100);
  assert.equal(a.sampleSize,19);
  assert.ok(Number.isFinite(a.confidence.p05));
  assert.ok(Number.isFinite(a.confidence.p50));
  assert.ok(Number.isFinite(a.confidence.p95));
  assert.ok(Number.isFinite(a.drawdown.p95));
});

test("le comparateur trie les bots par rendement",()=>{
  const out=compareBacktests({histories,botTypes:["adaptive-ai","quant-pulse","shield"],initialCash:10000});
  assert.equal(out.length,3);
  assert.ok(out.every(row=>row.botType));
  assert.ok(out.every(row=>Number.isFinite(row.totalReturn)));
  for(let i=1;i<out.length;i++) assert.ok(out[i-1].totalReturn>=out[i].totalReturn);
});
