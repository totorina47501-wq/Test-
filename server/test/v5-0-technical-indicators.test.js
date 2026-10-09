import test from "node:test";
import assert from "node:assert/strict";
import {ema,macd,buildAssetFeatures,forecast} from "../src/bot-ai-engine.js";
const points=Array.from({length:50},(_,i)=>({timestamp:i+1,price:100+i}));
test("EMA returns null with insufficient data and tracks monotonic prices",()=>{
 assert.equal(ema(points.slice(0,5),12),null);
 assert.ok(ema(points,12)>ema(points,26));
 assert.equal(ema(points,1),null);
});
test("MACD requires adequate history and returns finite signals",()=>{
 assert.equal(macd(points.slice(0,20)).value,null);
 const result=macd(points);
 assert.ok(Number.isFinite(result.value));
 assert.ok(Number.isFinite(result.signal));
 assert.ok(Number.isFinite(result.histogram));
 assert.ok(result.value>0);
});
test("asset features include indicators; forecasts remain bounded",()=>{
 const features=buildAssetFeatures({price:149,change24h:1},points);
 assert.ok(Number.isFinite(features.macdHistogram));
 assert.ok(Number.isFinite(features.ema12));
 const result=forecast(features);
 assert.ok(result.score>=0&&result.score<=1);
 assert.ok(result.upProbability>=0&&result.upProbability<=1);
});
