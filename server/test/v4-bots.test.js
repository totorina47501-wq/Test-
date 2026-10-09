import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'bitgold-v4-bots.css'),'utf8');test('V4 bots retains all live activation and risk configuration bindings',()=>{for(const id of ['botGrid','botDetailName','botAIAction','botMetricReturn','botMaxTrade','botMaxPosition','botStopLoss','botReserve','botActivate','botUnsubscribe'])assert.match(html,new RegExp('id="'+id+'"'));assert.match(html,/bitgold-v4-bots\.css/)});test('V4 bot discovery has semantic risk and responsive glass bento',()=>{assert.match(html,/v4-bots-bento/);assert.match(html,/Exécution simulée/);assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/#f87171/);assert.match(css,/max-width:760px/);assert.match(css,/prefers-reduced-motion/)});

test('V4.7 bot discovery discloses simulation and essential risk controls before choosing',()=>{
 const section=html.slice(html.indexOf('id="bots"'),html.indexOf('id="bot-decision-flow"'));
 assert.ok(section.indexOf('v47-bot-guardrail-note')>=0);
 assert.ok(section.indexOf('v47-bot-guardrail-note')<section.indexOf('id="botGrid"'));
 for(const term of ['stop-loss','exposition','réserve','Aucun ordre réel','Aucun rendement garanti'])assert.ok(section.includes(term),term);
 assert.match(css,/v47-bot-guardrail-note/);
});
