import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboardCopilot} from '../src/dashboard-copilot.js';
test('empty cockpit does not invent bot decisions',()=>{const r=dashboardCopilot();assert.equal(r.mode,'pedagogical');assert.ok(r.notes.some(n=>n.message.includes('Aucune décision')));assert.ok(r.disclaimer.includes('Ni conseil financier'))});
test('performance and risk notes reflect provided facts',()=>{const r=dashboardCopilot({portfolio:{returnEur:-250},health:{alerts:[{message:'Concentration élevée'}]}});assert.ok(r.notes.some(n=>n.message.includes('-250,00')));assert.ok(r.notes.some(n=>n.message==='Concentration élevée'))});
test('recorded bot decision explanation is retained',()=>{const r=dashboardCopilot({latestDecision:{bot_type:'shield',action:'hold',asset:'BTC',reason:'Marché incertain'}});assert.ok(r.notes.some(n=>n.kind==='bot'&&n.message.includes('Marché incertain')&&n.message.includes('conservation')))});
