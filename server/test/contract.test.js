import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(process.cwd());
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"public/app.js"),"utf8");
const css=fs.readFileSync(path.join(root,"public/styles.css"),"utf8");
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
  assert.match(html,/Choisissez votre niveau d'automatisation/);
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
  assert.match(server,/id:"shield"[^]*plan:"free"/); assert.match(server,/id:"silver"[^]*plan:"pro"/); assert.match(server,/id:"macro-rotation"[^]*plan:"elite"/);
  assert.match(server,/maxTradeEur/);
});

test("bot execution applies configured trade and position limits",()=>{
  assert.match(server,/const maxTrade=Number\(subscription\.max_trade_eur\|\|250\)/);
  assert.match(server,/const maxPosition=Number\(subscription\.max_position_eur\|\|1000\)/);
  assert.match(server,/min_cash_pct/);
});


test("bot subscription controls are authenticated-only while detail remains public",()=>{
  assert.match(html,/class="bot-config-card auth-only"[^>]*hidden/);
  assert.match(app,/connected=!!apiToken/);
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
  assert.match(html,/DASHBOARD PRO/);
  assert.match(html,/RISK CENTER/);
  assert.match(html,/BITGOLD AUTOPILOT/);
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

test("site completion exposes About FAQ newsletter and footer",()=>{
  assert.match(html,/id="a-propos"/);
  assert.match(html,/id="faq"/);
  assert.match(html,/id="newsletter"/);
  assert.match(html,/id="newsletterForm"/);
  assert.match(html,/class="site-footer"/);
  assert.match(app,/\/api\/newsletter\/subscribe/);
  assert.match(server,/newsletter_subscribers/);
  assert.match(server,/app\.post\("\/api\/newsletter\/subscribe"/);
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


test("cockpit shows only held assets, subscription reminder and hides pricing when authenticated",()=>{
  assert.match(server,/subscription:\{plan:userPlan\.plan/);
  assert.match(server,/getUserPlan\(req\.user\.sub\)/);
  assert.match(html,/id="dashHeldAssets"/);
  assert.match(html,/id="dashPlanName"/);
  assert.match(html,/id="dashPlanBadge"/);
  assert.match(app,/\(p\.positions\|\|\[\]\)\.filter\(row=>Number\(row\.quantity\|\|0\)>0\)/);
  assert.match(app,/querySelectorAll\("\.visitor-only"\)/);
  assert.match(html,/href="#pricings" class="visitor-only"/);
  assert.match(html,/id="pricings" class="section pricing-page-section visitor-only"/);
});


test("authenticated portfolio is consolidated into the cockpit",()=>{
  assert.match(html,/href="#dashboard" class="auth-only nav-cockpit" hidden>[\s\S]*Cockpit[\s\S]*<\/a>/);
  assert.match(html,/legacy-wallet-section/);
  assert.match(html,/class="visitor-only">Pricings<\/a>/);
  assert.match(app,/document\.getElementById\("dashboard"\)\?\.scrollIntoView/);
  assert.match(css,/\.legacy-wallet-section[\s\S]*display:none!important/);
});

test("premium header navigation is responsive and keeps auth actions",()=>{
  assert.match(html,/class="topbar-inner"/);
  assert.match(html,/class="brand-mark"/);
  assert.match(html,/id="mainNav"/);
  assert.match(html,/id="menuToggle"/);
  assert.match(html,/Tarifs/);
  assert.match(html,/Transparence/);
  assert.match(app,/menuToggle/);
  assert.match(app,/menu-open/);
  assert.match(html,/Se déconnecter/);
  assert.match(css,/Header premium BitGold/);
  assert.match(css,/\.topbar-inner/);
  assert.match(css,/\.menu-toggle/);
  assert.match(css,/max-width:850px/);
});

test("visitor transparency and fee simulator are public",()=>{
  assert.match(html,/id="transparence"/);
  assert.match(html,/TRANSPARENCE BITGOLD/);
  assert.match(html,/id="visitorFeePlan"/);
  assert.match(html,/id="visitorFeeType"/);
  assert.match(html,/id="visitorFeeAmount"/);
  assert.match(html,/id="visitorFeeSimulate"/);
  assert.match(app,/VISITOR_FEE_POLICY/);
  assert.match(app,/simulateVisitorFees/);
  assert.match(css,/visitor-transparency/);
  assert.match(css,/visitor-fee-simulator/);
});

test("transfer fee policy is tiered by plan and available server-side",()=>{
  assert.match(server,/const TRANSFER_FEE_POLICY=/);
  assert.match(server,/free:\{label:"Free",cashin:/);
  assert.match(server,/pro:\{label:"Pro",cashin:/);
  assert.match(server,/elite:\{label:"Elite",cashin:/);
  assert.match(server,/app\.get\("\/api\/transfers\/fees",auth/);
  assert.match(server,/app\.post\("\/api\/transfers\/quote",auth/);
  assert.match(server,/dailyLimit/);
  assert.match(server,/Simulation uniquement/);
  assert.match(html,/id="dashCashinFee"/);
  assert.match(html,/id="dashCashoutFee"/);
  assert.match(html,/id="dashTransferLimit"/);
  assert.match(html,/Quels sont les frais de cash-in et cash-out/);
  assert.match(app,/dashCashinFee/);
  assert.match(app,/dashCashoutFee/);
  assert.match(css,/transfer-fee-panel/);
});

test("Stripe subscription configuration is server-side and webhook-ready",()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
  const env=fs.readFileSync(path.join(root,".env.example"),"utf8");
  assert.equal(pkg.dependencies.stripe,"^23.0.0");
  assert.match(env,/STRIPE_SECRET_KEY=/);
  assert.match(env,/STRIPE_WEBHOOK_SECRET=/);
  assert.match(env,/STRIPE_PRO_PRICE_ID=/);
  assert.match(env,/STRIPE_ELITE_PRICE_ID=/);
  assert.match(server,/stripe\.checkout\.sessions\.create/);
  assert.match(server,/stripe\.billingPortal\.sessions\.create/);
  assert.match(server,/stripe\.webhooks\.constructEvent/);
  assert.match(server,/stripe_customer_id/);
  assert.match(server,/stripe_subscription_id/);
  assert.match(server,/app\.post\("\/api\/stripe\/checkout",auth/);
  assert.match(server,/app\.post\("\/api\/stripe\/portal",auth/);
  assert.match(server,/app\.post\("\/api\/stripe\/webhook"/);
});


test("user profile and Google authentication are implemented end-to-end",()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
  const env=fs.readFileSync(path.join(root,".env.example"),"utf8");
  assert.equal(pkg.dependencies["google-auth-library"],"^10.3.0");
  assert.match(env,/GOOGLE_CLIENT_ID=/);
  assert.match(server,/ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name/);
  assert.match(server,/ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub/);
  assert.match(server,/app\.get\("\/api\/auth\/google\/config"/);
  assert.match(server,/verifyIdToken/);
  assert.match(server,/app\.post\("\/api\/auth\/google"/);
  assert.match(server,/app\.put\("\/api\/me",auth/);
  assert.match(server,/preferred_currency/);
  assert.match(html,/id="signupFields"/);
  assert.match(html,/id="profileModal"/);
  assert.match(html,/id="googleSignInButton"/);
  assert.match(app,/initGoogleAuth/);
  assert.match(app,/handleGoogleCredential/);
  assert.match(app,/function openProfile/);
  assert.match(app,/apiFetch\("\/api\/me",{method:"PUT"/);
  assert.match(css,/Profil utilisateur \+ authentification Google/);
});


test("authentication security baseline is enforced",()=>{
  assert.match(server,/const secret = String\(process\.env\.JWT_SECRET \|\| ""\)\.trim\(\)/);
  assert.match(server,/JWT_SECRET must be configured with at least 32 characters in production/);
  assert.match(server,/const authRateLimit = rateLimit\(\{/);
  assert.match(server,/windowMs: 10 \* 60 \* 1000/);
  assert.match(server,/max: 10/);
  assert.match(server,/app\.post\("\/api\/auth\/login", authRateLimit/);
  assert.match(server,/app\.post\("\/api\/auth\/google", authRateLimit/);
});
