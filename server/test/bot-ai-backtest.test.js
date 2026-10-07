import test from "node:test";
import assert from "node:assert/strict";
import {simulateBacktest} from "../src/bot-ai-backtest.js";

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
