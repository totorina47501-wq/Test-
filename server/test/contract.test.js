import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(process.cwd());
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"public/app.js"),"utf8");
const server=fs.readFileSync(path.join(root,"src/index.js"),"utf8");

test("visitor bot comparison is public and ordered",()=>{
  assert.match(html,/id="bots" class="section bots-section"/);
  assert.doesNotMatch(html,/id="bots"[^>]*auth-only/);
  assert.ok(app.includes("/api/bots/catalog"));
  assert.match(server,/app\.get\("\/api\/bots\/catalog"/);
  assert.match(server,/id:"gold"/); assert.match(server,/id:"silver"/); assert.match(server,/id:"shield"/); assert.match(server,/id:"quant-pulse"/); assert.match(server,/id:"macro-rotation"/);
  assert.ok(app.includes("Niveau '+(index+1)"));
});

test("authenticated bot choice is exclusive",()=>{
  assert.match(server,/UPDATE bot_subscriptions SET active=FALSE WHERE user_id=\$1 AND bot_type<>\$2/);
  assert.match(app,/Choisissez votre niveau d’automatisation/);
});

test("logout listener is not blocked by stale history exports",()=>{
  assert.doesNotMatch(app,/window\.openHistory=openHistory/);
  assert.match(app,/querySelector\("#topLogin"\)\?\.addEventListener/);
  assert.match(app,/function logout\(\)/);
});

test("history action remains removed from market cards",()=>{
  assert.doesNotMatch(html,/id="historyModal"/);
  assert.doesNotMatch(app,/data-action="history"/);
});


test("bot detail pages expose explanations, limits and pricing",()=>{
  assert.match(html,/id="bot-detail" class="bot-detail-section"/);
  assert.match(html,/id="botMaxTrade"/); assert.match(html,/id="botMaxPosition"/);
  assert.match(html,/id="botStopLoss"/); assert.match(html,/id="botReserve"/);
  assert.match(html,/id="botActivate"/); assert.match(html,/id="botBack"/);
  assert.ok(app.includes('history.pushState({}, "", "/bot/"+type)'));
  assert.match(server,/max_trade_eur/); assert.match(server,/max_position_eur/); assert.match(server,/min_cash_pct/);
  assert.match(server,/price_monthly_eur:9\.90/); assert.match(server,/price_monthly_eur:19\.90/); assert.match(server,/price_monthly_eur:34\.90/);
  assert.match(server,/maxTradeEur/);
});

test("bot execution applies configured trade and position limits",()=>{
  assert.match(server,/const maxTrade=Number\(subscription\.max_trade_eur\|\|250\)/);
  assert.match(server,/const maxPosition=Number\(subscription\.max_position_eur\|\|1000\)/);
  assert.match(server,/min_cash_pct/);
});


test("bot subscription controls are authenticated-only while detail remains public",()=>{
  assert.match(html,/class="bot-config-card auth-only"[^>]*hidden/);
  assert.match(app,/const connected=!!apiToken/);
  assert.match(app,/if\(!apiToken\)\{openModal\("connexion"\);return\}/);
  assert.match(html,/id="botDetailDescription"/);
  assert.match(html,/id="botDetailStrategy"/);
});


test("Elite mode unlocks macro rotation and five active bots",()=>{
  assert.match(server,/plan==="elite"/);
  assert.match(server,/activeCount>=5/);
  assert.match(server,/maxTrade:2500/);
  assert.match(app,/BitGold Elite/);
  assert.match(app,/macro-rotation/);
  assert.match(html,/data-plan-demo="elite"/);
});

test("Pro dashboard exposes performance risk and Autopilot",()=>{
  assert.match(server,/app\.get\("\/api\/dashboard",auth/);
  assert.match(server,/returnPct/);
  assert.match(server,/riskScore/);
  assert.match(server,/autopilot/);
  assert.match(app,/DASHBOARD PRO/);
  assert.match(app,/RISK CENTER/);
  assert.match(app,/BITGOLD AUTOPILOT/);
  assert.match(html,/href="#dashboard"/);
});

test("Dashboard analytics exposes reconstructed performance and bot statistics",()=>{
  assert.match(server,/app\.get\("\/api\/dashboard\/analytics",auth/);
  assert.match(server,/reconstructed:true/);
  assert.match(server,/byBot/);
  assert.match(app,/dashPerformanceChart/);
  assert.match(app,/dashBotStats/);
  assert.match(app,/\/api\/dashboard\/analytics/);
  assert.match(html,/HISTORIQUE/);
  assert.match(html,/BOT ANALYTICS/);
});

test("portfolio and cockpit use the connected user's holdings with live valuations",()=>{
  assert.match(server,/app\.get\("\/api\/portfolio",auth/);
  assert.match(server,/const market=await refreshMarket\(\)/);
  assert.match(server,/cashPlusInvested/);
  assert.match(server,/integrity:\{ok:integrity/);
  assert.match(app,/marketPrices\[row\.asset\]=Number\(row\.price\)/);
  assert.match(app,/state\.portfolio=\{/);
  assert.match(app,/data\.integrity\?\.ok/);
});
