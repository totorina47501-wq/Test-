import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBot} from '../src/bot-ai-engine.js';
const history=Array.from({length:36},(_,i)=>({timestamp:1000+i*60000,price:100+i}));
test('stale market data cannot trigger simulated AI orders',async()=>{
 const market=[{symbol:'BTC',price:135,change24h:5,priceFresh:false}];
 const result=await evaluateBot({type:'gold',market,histories:{BTC:history},portfolio:{cash:10000,total:10000,positions:[]}});
 assert.equal(result.action,'hold');
 assert.equal(result.decisionReason,'no_eligible_market_data');
 assert.equal(result.asset,null);
});
test('fresh market quotes remain eligible',async()=>{
 const result=await evaluateBot({type:'silver',market:[{symbol:'BTC',price:135,change24h:5,priceFresh:true}],histories:{BTC:history},portfolio:{cash:10000,total:10000,positions:[]}});
 assert.equal(result.features.BTC.historyPoints,36);
});
