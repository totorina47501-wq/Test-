import test from "node:test";
import assert from "node:assert/strict";
import {buildAssetFeatures,detectRegime,evaluateBot,getBotAIConfig,momentum,rsi,volatility} from "../src/bot-ai-engine.js";

const history=(values)=>values.map((price,index)=>({timestamp:Date.now()-((values.length-index)*86400000),price}));
const market=[{symbol:"BTC",price:100,change24h:3},{symbol:"ETH",price:50,change24h:2},{symbol:"SOL",price:20,change24h:1},{symbol:"USDC",price:1,change24h:0}];
const histories=Object.fromEntries(market.map(row=>[row.symbol,history(row.symbol==="BTC"?[90,92,94,96,98,100]:row.symbol==="ETH"?[46,47,48,49,50,51]:[20,20,20.5,20.8,21,21.2])]));

test("les indicateurs produisent des valeurs finies",()=>{const f=buildAssetFeatures(market[0],histories.BTC);assert.ok(Number.isFinite(f.momentum7d));assert.ok(Number.isFinite(f.trend));assert.ok(Number.isFinite(f.volatility));assert.ok(rsi(histories.BTC)>=0&&rsi(histories.BTC)<=100);assert.equal(momentum(histories.BTC)>0,true);});

test("le régime est déterministe à données identiques",()=>{const features=Object.fromEntries(market.map(row=>[row.symbol,buildAssetFeatures(row,histories[row.symbol])]));const a=detectRegime(market,features);const b=detectRegime(market,features);assert.deepEqual(a,b);});

test("le moteur ensemble retourne une décision bornée sans fournisseur IA",async()=>{const old=process.env.BOT_AI_PROVIDER;delete process.env.BOT_AI_PROVIDER;delete process.env.OPENAI_API_KEY;delete process.env.GEMINI_API_KEY;delete process.env.ANTHROPIC_API_KEY;const out=await evaluateBot({type:"adaptive-ai",market,histories,portfolio:{cash:6000,total:10000,positions:[]},subscription:{min_cash_pct:20}});if(old===undefined)delete process.env.BOT_AI_PROVIDER;else process.env.BOT_AI_PROVIDER=old;assert.ok(["buy","sell","hold"].includes(out.action));assert.ok(out.confidence>=0&&out.confidence<=1);assert.equal(out.engine,"ensemble-v1");assert.equal(out.provider,"none");});

test("la configuration IA reste explicite et sans secret dans le retour",()=>{const cfg=getBotAIConfig();assert.equal(typeof cfg.enabled,"boolean");assert.ok(!Object.keys(cfg).some(k=>/key|secret|token/i.test(k)));});
