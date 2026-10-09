import test from 'node:test';
import assert from 'node:assert/strict';
import {portfolioHealth} from '../src/portfolio-health.js';
test('empty simulation has no false risk alerts',()=>{const h=portfolioHealth();assert.equal(h.positionCount,0);assert.equal(h.exposure,0);assert.equal(h.alerts.length,0);assert.ok(Number.isFinite(h.score))});
test('single concentrated position flags concentration and lack of cash',()=>{const h=portfolioHealth({cash:0,positions:[{asset:'BTC',value:1000}]});assert.equal(h.concentration,100);assert.equal(h.exposure,100);assert.ok(h.alerts.some(a=>a.code==='concentration'));assert.ok(h.alerts.some(a=>a.code==='exposure'));assert.equal(h.diversification,'Faible')});
test('balanced allocation lowers concentration',()=>{const h=portfolioHealth({cash:500,positions:[{asset:'BTC',value:250},{asset:'ETH',value:250}]});assert.equal(h.concentration,25);assert.equal(h.exposure,50);assert.equal(h.alerts.length,0);assert.equal(h.diversification,'Répartie')});
test('invalid holdings cannot create NaN or negative exposures',()=>{const h=portfolioHealth({cash:-100,positions:[{asset:'BTC',value:-5},{asset:'ETH',value:NaN}]});assert.equal(h.exposure,0);assert.ok(Number.isFinite(h.score))});
