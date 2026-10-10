import test from 'node:test';
import assert from 'node:assert/strict';
import {isFreshBacktestQuote,simulateBacktest} from '../src/bot-ai-backtest.js';
test('only a candle at the simulated time is executable',()=>{
 assert.equal(isFreshBacktestQuote({timestamp:1000,price:20},1000),true);
 assert.equal(isFreshBacktestQuote({timestamp:1000,price:20},2000),false);
 assert.equal(isFreshBacktestQuote({timestamp:2000,price:0},2000),false);
 assert.equal(isFreshBacktestQuote(null,2000),false);
});
test('sparse altcoin history cannot generate stale-quote executions',()=>{
 const BTC=Array.from({length:55},(_,i)=>({timestamp:1000000+i*3600000,price:100+i*2}));
 const ETH=Array.from({length:20},(_,i)=>({timestamp:1000000+i*3600000,price:50+i*3}));
 const result=simulateBacktest({botType:'gold',histories:{BTC,ETH}});
 for(const decision of result.decisionHistory){
   const candles={BTC,ETH}[decision.asset];
   assert.ok(candles.some(c=>c.timestamp===decision.timestamp),'trade must use a contemporaneous candle');
 }
});
