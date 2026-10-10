import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMarketQuote} from '../src/market-freshness.js';
test('valid quote is marked fresh and timestamped',()=>{assert.deepEqual(resolveMarketQuote({eur:120},99,1000,2000),{price:120,priceFresh:true,priceUpdatedAt:2000})});
test('missing quote retains cached price and its old timestamp',()=>{assert.deepEqual(resolveMarketQuote({},99,1000,2000),{price:99,priceFresh:false,priceUpdatedAt:1000})});
test('invalid zero or negative quotes never overwrite cache',()=>{for(const eur of [0,-1,NaN]){const q=resolveMarketQuote({eur},99,1000,2000);assert.equal(q.price,99);assert.equal(q.priceFresh,false)}});
test('unknown quote has no fake timestamp',()=>{const q=resolveMarketQuote({},0,null,2000);assert.equal(q.priceFresh,false);assert.equal(q.priceUpdatedAt,null)});
