import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import Stripe from "stripe";
import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { createCompliance } from "./compliance.js";
import { createAgentPayments } from "./agent-payment-policy.js";
import { buildPaymentRequirements, hashPaymentRequirements, acceptedMatchesRequirements, requirementsMatch } from "./x402-quote.js";
import { createOpenFacilitator } from "./openfacilitator.js";
import { evaluateBot, getBotAIConfig } from "./bot-ai-engine.js";
import { simulateBacktest, compareBacktests, analyzeBacktestRobustness } from "./bot-ai-backtest.js";

const { Pool } = pg;
const app = express();
const stripeSecretKey=String(process.env.STRIPE_SECRET_KEY||"").trim();
const stripeWebhookSecret=String(process.env.STRIPE_WEBHOOK_SECRET||"").trim();
const stripe=new Stripe(stripeSecretKey||"sk_test_not_configured");
const stripeConfigured=Boolean(stripeSecretKey);
const googleClientId=String(process.env.GOOGLE_CLIENT_ID||"").trim();
const googleClient=new OAuth2Client(googleClientId||undefined);
const googleConfigured=Boolean(googleClientId);
const FX_CURRENCIES=["EUR","USD","GBP","CHF","CAD","AUD","NZD","JPY","CNY","HKD","SGD","BRL","MXN","INR","SEK","NOK","DKK","PLN","CZK","HUF","RON","TRY"];
const fxCache={rates:{EUR:1},updatedAt:0,source:"ECB"};
const FX_URL="https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
async function refreshFxRates(){
  if(fxCache.updatedAt && Date.now()-fxCache.updatedAt<6*60*60*1000)return fxCache;
  try{
    const response=await fetch(FX_URL,{headers:{accept:"application/xml,text/xml"}});
    if(!response.ok)throw Error("ECB HTTP "+response.status);
    const xml=await response.text();
    const rates={EUR:1};
    for(const match of xml.matchAll(/currency=['"]([A-Z]{3})['"][^>]*rate=['"]([0-9.]+)['"]/g)){
      const code=match[1],rate=Number(match[2]);
      if(FX_CURRENCIES.includes(code)&&Number.isFinite(rate)&&rate>0)rates[code]=rate;
    }
    if(Object.keys(rates).length<8)throw Error("ECB feed incomplet");
    fxCache.rates=rates;fxCache.updatedAt=Date.now();fxCache.source="European Central Bank";
  }catch(e){
    console.warn("[FX] ECB unavailable:",e.message);
  }
  return fxCache;
}
app.get("/api/fx",async(req,res)=>{
  const data=await refreshFxRates();
  res.json({base:"EUR",rates:data.rates,updatedAt:data.updatedAt,source:data.source,stale:data.updatedAt===0,disclaimer:"Taux de référence ECB indicatifs, actualisés les jours ouvrés. Les montants BitGold sont stockés en EUR et convertis à l'affichage."});
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secret = String(process.env.JWT_SECRET || "").trim();
const isProduction = process.env.NODE_ENV === "production";
const twoFactorEncryptionKey = String(process.env.TWO_FACTOR_ENCRYPTION_KEY || "").trim();
if (isProduction && secret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}
if (!isProduction && secret.length < 32) {
  console.warn("[SECURITY] JWT_SECRET is not production-grade; configure a 32+ character secret before deployment.");
}
if (isProduction && twoFactorEncryptionKey.length < 32) {
  throw new Error("TWO_FACTOR_ENCRYPTION_KEY must be configured with at least 32 characters in production.");
}
if (!isProduction && twoFactorEncryptionKey.length < 32) {
  console.warn("[SECURITY] TWO_FACTOR_ENCRYPTION_KEY is not production-grade; configure a 32+ character secret before deployment.");
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "test" || process.env.DATABASE_SSL === "false" ? false : (process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined)
});

await pool.query(`
CREATE TABLE IF NOT EXISTS newsletter_subscribers(id SERIAL PRIMARY KEY,email TEXT UNIQUE NOT NULL,subscribed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_profile TEXT NOT NULL DEFAULT 'moderate';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password';
CREATE TABLE IF NOT EXISTS user_2fa(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,secret_enc TEXT,pending_secret_enc TEXT,enabled BOOLEAN NOT NULL DEFAULT FALSE,recovery_code_hashes TEXT[] NOT NULL DEFAULT '{}',challenge_jti TEXT,challenge_used_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,enabled_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS wallets(user_id INTEGER PRIMARY KEY REFERENCES users(id),cash DOUBLE PRECISION NOT NULL DEFAULT 10000);
CREATE TABLE IF NOT EXISTS holdings(user_id INTEGER NOT NULL REFERENCES users(id),asset TEXT NOT NULL,quantity DOUBLE PRECISION NOT NULL DEFAULT 0,PRIMARY KEY(user_id,asset));
CREATE TABLE IF NOT EXISTS trades(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),side TEXT NOT NULL,asset TEXT NOT NULL,amount_eur DOUBLE PRECISION NOT NULL,price_eur DOUBLE PRECISION NOT NULL,quantity DOUBLE PRECISION NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS trade_idempotency(user_id INTEGER NOT NULL REFERENCES users(id),request_key TEXT NOT NULL,request_hash TEXT NOT NULL,trade_id INTEGER REFERENCES trades(id),created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,request_key));
CREATE TABLE IF NOT EXISTS bot_subscriptions(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,bot_type TEXT NOT NULL,portfolio_name TEXT NOT NULL DEFAULT 'Portefeuille principal',active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,last_run TIMESTAMPTZ,UNIQUE(user_id,bot_type));
CREATE TABLE IF NOT EXISTS bot_activity(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,bot_type TEXT NOT NULL,action TEXT NOT NULL DEFAULT 'hold',asset TEXT,message TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bot_ai_decisions(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,bot_type TEXT NOT NULL,engine TEXT NOT NULL,provider TEXT NOT NULL,model TEXT,action TEXT NOT NULL,asset TEXT,confidence DOUBLE PRECISION NOT NULL DEFAULT 0,regime TEXT,reason TEXT,features JSONB,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS max_trade_eur DOUBLE PRECISION NOT NULL DEFAULT 250;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS max_position_eur DOUBLE PRECISION NOT NULL DEFAULT 1000;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS stop_loss_pct DOUBLE PRECISION NOT NULL DEFAULT 8;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS min_cash_pct DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_since TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
`);

const compliance = createCompliance(pool, {
  isProduction,
  enforcement: String(process.env.COMPLIANCE_ENFORCEMENT || (isProduction ? "true" : "false")).toLowerCase() === "true",
  webhookSecret: String(process.env.COMPLIANCE_WEBHOOK_SECRET || "").trim()
});
await compliance.init();
await pool.query(`
CREATE TABLE IF NOT EXISTS x402_quotes(
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_type TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  pay_to TEXT NOT NULL,
  amount_eur NUMERIC(18,2) NOT NULL,
  amount_atomic TEXT NOT NULL,
  requirements JSONB NOT NULL,
  requirements_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  idempotency_key TEXT,
  verified_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  settlement_receipt JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE x402_quotes ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE x402_quotes ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE x402_quotes ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
ALTER TABLE x402_quotes ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;
ALTER TABLE x402_quotes ADD COLUMN IF NOT EXISTS settlement_receipt JSONB;
CREATE INDEX IF NOT EXISTS idx_x402_quotes_user_status ON x402_quotes(user_id,status,expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_x402_quotes_user_idempotency ON x402_quotes(user_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS x402_audit(
  id BIGSERIAL PRIMARY KEY,
  correlation_id UUID NOT NULL,
  quote_id UUID,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  outcome TEXT NOT NULL,
  code TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_x402_audit_quote_created ON x402_audit(quote_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_x402_audit_event_created ON x402_audit(event,created_at DESC);
`);
const agentPayments = createAgentPayments(pool, {
  compliance,
  isProduction,
  enforcement: String(process.env.AGENT_PAYMENT_ENFORCEMENT || (isProduction ? "true" : "false")).toLowerCase() === "true",
  secret: String(process.env.AGENT_PAYMENT_MANDATE_SECRET || "").trim(),
  railMode: String(process.env.PAYMENT_RAIL_MODE || "simulation").trim().toLowerCase()
});
await agentPayments.init();
const x402AllowedNetwork=String(process.env.X402_ALLOWED_NETWORK||"eip155:84532").trim();
const x402AllowedAsset=String(process.env.X402_ALLOWED_ASSET||"").trim();
const x402AllowedAssetSymbol=String(process.env.X402_ALLOWED_ASSET_SYMBOL||"USDC").trim().toUpperCase();
const x402PayTo=String(process.env.X402_PAY_TO||"").trim();
const x402EmergencyStop=String(process.env.X402_EMERGENCY_STOP||"true").trim().toLowerCase()!=="false";
async function auditX402({correlationId,quoteId=null,userId=null,event,outcome,code=null,details={}}){
  const safeDetails={};
  for(const [key,value] of Object.entries(details||{})){
    if(!/secret|token|key|payload|signature|authorization/i.test(key))safeDetails[key]=value;
  }
  await pool.query("INSERT INTO x402_audit(correlation_id,quote_id,user_id,event,outcome,code,details) VALUES($1,$2,$3,$4,$5,$6,$7)",[correlationId,quoteId,userId,event,outcome,code,JSON.stringify(safeDetails)]);
  console.info(JSON.stringify({scope:"x402",correlationId,quoteId,event,outcome,code}));
}
const openFacilitator = createOpenFacilitator({
  base: String(process.env.X402_FACILITATOR_URL || "https://pay.openfacilitator.io").trim(),
  enabled: String(process.env.X402_FACILITATOR_ENABLED || "false").toLowerCase() === "true",
  settlementEnabled: String(process.env.X402_SETTLEMENT_ENABLED || "false").toLowerCase() === "true"
});

app.use(helmet({crossOriginOpenerPolicy:{policy:"same-origin-allow-popups"},contentSecurityPolicy:{directives:{"img-src":["'self'","data:","https:"],"script-src":["'self'","https://accounts.google.com"],"frame-src":["'self'","https://accounts.google.com"],"connect-src":["'self'","https://accounts.google.com"]}}}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.post("/api/stripe/webhook",express.raw({type:"application/json"}),async(req,res)=>{
  if(!stripeConfigured||!stripeWebhookSecret)return res.status(503).json({error:"Stripe webhook non configuré."});
  let event;
  try{event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"],stripeWebhookSecret)}catch(e){console.error("[STRIPE] webhook signature error",e.message);return res.status(400).json({error:"Signature Stripe invalide."})}
  try{
    if(event.type==="checkout.session.completed"){
      const session=event.data.object;
      const userId=Number(session.metadata?.userId);
      const plan=session.metadata?.plan==="elite"?"elite":session.metadata?.plan==="pro"?"pro":null;
      if(userId&&plan)await pool.query("UPDATE users SET plan=$1,pro_since=COALESCE(pro_since,CURRENT_TIMESTAMP),stripe_customer_id=COALESCE($2,stripe_customer_id),stripe_subscription_id=COALESCE($3,stripe_subscription_id) WHERE id=$4",[plan,session.customer||null,session.subscription||null,userId]);
    }
    if(event.type==="customer.subscription.updated"||event.type==="customer.subscription.deleted"){
      const subscription=event.data.object;
      const userId=Number(subscription.metadata?.userId);
      const plan=subscription.metadata?.plan==="elite"?"elite":subscription.metadata?.plan==="pro"?"pro":null;
      const active=event.type==="customer.subscription.updated"&&["active","trialing","past_due"].includes(subscription.status);
      if(userId)await pool.query("UPDATE users SET plan=$1,stripe_customer_id=COALESCE($2,stripe_customer_id),stripe_subscription_id=$3 WHERE id=$4",[active&&plan?plan:"free",subscription.customer||null,event.type==="customer.subscription.deleted"?null:subscription.id,userId]);
      else if(subscription.customer)await pool.query("UPDATE users SET plan=$1,stripe_subscription_id=$2 WHERE stripe_customer_id=$3",[active&&plan?plan:"free",event.type==="customer.subscription.deleted"?null:subscription.id,subscription.customer]);
    }
    res.json({received:true});
  }catch(e){console.error("[STRIPE] webhook handler error",e.message);res.status(500).json({error:"Erreur webhook Stripe."})}
});

app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: process.env.NODE_ENV === "test" ? 2000 : 120, standardHeaders: true, legacyHeaders: false }));
const authRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives d’authentification. Réessayez plus tard." }
});
const twoFactorRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives 2FA. Réessayez plus tard." }
});
app.use(express.static(path.join(__dirname, "../public"), { setHeaders: (res, filePath) => { if(filePath.endsWith(".html") || filePath.endsWith(".js") || filePath.endsWith(".css")) res.setHeader("Cache-Control", "no-store, max-age=0"); } }));
app.get(/^\/bot\/(shield|silver|gold|adaptive-ai|quant-pulse|macro-rotation)\/?$/, (req,res)=>res.sendFile(path.join(__dirname,"../public/index.html")));
app.get(/^\/activite\/?$/, (req,res)=>res.sendFile(path.join(__dirname,"../public/index.html")));
app.get(/^\/investir\/?$/, (req,res)=>res.sendFile(path.join(__dirname,"../public/index.html")));

const prices = { BTC: 67420.10, ETH: 3248.70, SOL: 154.20, USDC: 0.92, LINK: 17.84, AVAX: 28.16 };
const marketIds = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDC: "usd-coin",
  LINK: "chainlink",
  AVAX: "avalanche-2"
};
let marketSnapshot = Object.entries(prices).map(([symbol,price]) => ({symbol,price,change24h:0}));
let marketUpdatedAt = 0;
const historyCache = new Map();
const marketTickHistory = new Map();
const coingeckoBaseUrl=String(process.env.COINGECKO_API_BASE_URL||"https://api.coingecko.com/api/v3").replace(/\/$/,"");
const coingeckoApiKey=String(process.env.COINGECKO_API_KEY||"").trim();

function coingeckoHeaders(){
  const headers={accept:"application/json","user-agent":"BitGold/1.0"};
  if(coingeckoApiKey){
    const isPro=coingeckoBaseUrl.includes("pro-api.coingecko.com");
    headers[isPro?"x-cg-pro-api-key":"x-cg-demo-api-key"]=coingeckoApiKey;
  }
  return headers;
}

async function coingeckoFetch(path, options={}){
  const request=()=>fetch(coingeckoBaseUrl+path,{...options,headers:{...coingeckoHeaders(),...(options.headers||{})}});
  let response=await request();
  if(response.status===429){
    const retryAfter=Number(response.headers.get("retry-after"));
    const waitMs=Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,10000):2000;
    await new Promise(resolve=>setTimeout(resolve,waitMs));
    response=await request();
  }
  return response;
}

async function coingeckoError(response,prefix="CoinGecko"){
  let detail="";
  try{
    const text=await response.text();
    if(text) detail=": "+text.slice(0,300).replace(/\s+/g," ").trim();
  }catch{}
  return Error(`${prefix} HTTP ${response.status}${detail}`);
}

async function refreshMarket(force=false) {
  if(!force && Date.now()-marketUpdatedAt < 12000) return marketSnapshot;
  try {
    const ids = Object.values(marketIds).join(",");
    const response = await coingeckoFetch(`/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`);
    if(!response.ok) throw await coingeckoError(response);
    const data = await response.json();
    marketSnapshot = Object.entries(marketIds).map(([symbol,id]) => {
      const item = data[id] || {};
      const price = Number(item.eur);
      const change24h = Number(item.eur_24h_change);
      const marketCap = Number(item.eur_market_cap);
      const volume24h = Number(item.eur_24h_vol);
      if(Number.isFinite(price) && price > 0) prices[symbol] = price;
      return {
        symbol,
        price: Number.isFinite(price) && price > 0 ? price : prices[symbol],
        change24h: Number.isFinite(change24h) ? change24h : 0,
        marketCap: Number.isFinite(marketCap) ? marketCap : null,
        volume24h: Number.isFinite(volume24h) ? volume24h : null,
        marketCapRank: null
      };
    });
    marketUpdatedAt = Date.now();
    const tickTimestamp=marketUpdatedAt;
    for(const row of marketSnapshot){
      const ticks=marketTickHistory.get(row.symbol)||[];
      ticks.push({timestamp:tickTimestamp,price:Number(row.price)});
      const cutoff=tickTimestamp-10*60*1000;
      marketTickHistory.set(row.symbol,ticks.filter(point=>point.timestamp>=cutoff).slice(-120));
    }
  } catch(e) {
    console.error("[MARKET] refresh error", e.message);
    if(!marketSnapshot.length) {
      marketSnapshot = Object.entries(prices).map(([symbol,price]) => ({symbol,price,change24h:0,marketCap:null,volume24h:null,marketCapRank:null}));
    }
  }
  return marketSnapshot;
}
refreshMarket(true).catch(()=>{});
function encrypt2fa(value){
  const key=crypto.createHash("sha256").update(twoFactorEncryptionKey||secret).digest();
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",key,iv);
  const data=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),data.toString("base64url")].join(".");
}
function decrypt2fa(value){
  const key=crypto.createHash("sha256").update(twoFactorEncryptionKey||secret).digest();
  const [iv,tag,data]=String(value).split(".");
  if(!iv||!tag||!data) throw new Error("Secret 2FA chiffré invalide.");
  const dec=crypto.createDecipheriv("aes-256-gcm",key,Buffer.from(iv,"base64url"));
  dec.setAuthTag(Buffer.from(tag,"base64url"));
  return Buffer.concat([dec.update(Buffer.from(data,"base64url")),dec.final()]).toString("utf8");
}
async function challengeToken(user){
  const jti=crypto.randomUUID();
  await pool.query("INSERT INTO user_2fa(user_id,challenge_jti,challenge_used_at) VALUES($1,$2,NULL) ON CONFLICT(user_id) DO UPDATE SET challenge_jti=$2,challenge_used_at=NULL",[user.id,jti]);
  return jwt.sign({sub:user.id,email:user.email,purpose:"2fa_challenge",jti},secret,{expiresIn:"5m"});
}
function token(user){ return jwt.sign({sub:user.id,email:user.email},secret,{expiresIn:"7d"}); }
function auth(req,res,next){
  const authorization=String(req.headers.authorization||"");
  const match=/^Bearer ([^\s]+)$/.exec(authorization);
  if(!match)return res.status(401).json({error:"Non authentifié"});
  try{
    const payload=jwt.verify(match[1],secret,{algorithms:["HS256"]});
    if(payload.purpose||!Number.isSafeInteger(Number(payload.sub))||Number(payload.sub)<=0)return res.status(401).json({error:"Non authentifié"});
    req.user=payload;
    next();
  }catch{return res.status(401).json({error:"Non authentifié"});}
}

app.get("/api/compliance/status",auth,async(req,res)=>{
  try{res.json(await compliance.getUserStatus(req.user.sub));}catch(e){console.error("[COMPLIANCE] status error",e.message);res.status(500).json({error:"Impossible de charger le statut de conformité."})}
});
app.post("/api/agent-payments/mandate",auth,async(req,res)=>{
  try{const result=await agentPayments.createMandate(req.user.sub,req.body||{});res.status(201).json(result)}catch(e){res.status(e.statusCode||400).json({error:e.message||"Mandat agent invalide.",code:e.code})}
});
app.get("/api/agent-payments/mandate",auth,async(req,res)=>{
  try{res.json(await agentPayments.status(req.user.sub))}catch(e){res.status(500).json({error:"Impossible de charger les mandats agent."})}
});
app.delete("/api/agent-payments/mandate/:botType",auth,async(req,res)=>{
  try{res.json(await agentPayments.revokeMandate(req.user.sub,req.params.botType))}catch(e){res.status(500).json({error:"Impossible de révoquer le mandat agent."})}
});
app.delete("/api/agent-payments/mandates/id/:mandateId",auth,async(req,res)=>{
  try{res.json(await agentPayments.revokeMandateById(req.user.sub,req.params.mandateId))}catch(e){res.status(500).json({error:"Impossible de révoquer ce mandat agent."})}
});
app.get("/api/agent-payments/operations",auth,async(req,res)=>{
  try{
    const [operations,audit]=await Promise.all([
      agentPayments.operations(req.user.sub),
      pool.query("SELECT correlation_id,quote_id,event,outcome,code,details,created_at FROM x402_audit WHERE user_id=$1 ORDER BY id DESC LIMIT 100",[req.user.sub])
    ]);
    res.json({...operations,x402:{emergencyStop:x402EmergencyStop,facilitatorEnabled:Boolean(openFacilitator.config.enabled),settlementEnabled:Boolean(openFacilitator.config.settlementEnabled),settlementAvailable:Boolean(openFacilitator.config.settlementEnabled&&!x402EmergencyStop),audit:audit.rows}});
  }catch(e){res.status(500).json({error:"Impossible de charger le cockpit des paiements agents."})}
});

app.get("/api/agent-payments/x402/reconciliation",auth,async(req,res)=>{
  try{
    const rows=(await pool.query("SELECT id,status,network,asset,amount_atomic,settled_at,failed_at,settlement_receipt,created_at FROM x402_quotes WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200",[req.user.sub])).rows;
    const counts=rows.reduce((acc,row)=>(acc[row.status]=(acc[row.status]||0)+1,acc),{});
    const staleBefore=Date.now()-15*60*1000;
    const anomalies=rows.flatMap(row=>{
      if(row.status==="settled"&&!row.settlement_receipt)return [{quoteId:row.id,status:row.status,code:"X402_MISSING_RECEIPT",severity:"critical"}];
      if(row.status==="failed"&&!row.failed_at)return [{quoteId:row.id,status:row.status,code:"X402_MISSING_FAILURE_TIMESTAMP",severity:"warning"}];
      if(["pending","verified"].includes(row.status)&&new Date(row.created_at).getTime()<staleBefore)return [{quoteId:row.id,status:row.status,code:"X402_STALE_IN_FLIGHT",severity:"warning"}];
      return [];
    });
    res.json({counts,healthy:anomalies.length===0,anomalies,recent:rows});
  }catch(e){res.status(500).json({error:"Impossible de réconcilier les paiements x402."})}
});

app.get("/api/agent-payments/x402/status",auth,async(req,res)=>{
  try{
    const health=await openFacilitator.health();
    res.json({provider:"OpenFacilitator",...openFacilitator.config,health});
  }catch(e){
    res.status(502).json({provider:"OpenFacilitator",...openFacilitator.config,health:{ok:false,error:e.message}});
  }
});
app.post("/api/agent-payments/x402/verify",auth,async(req,res)=>{
  try{
    const body=req.body||{};
    if(!body.paymentPayload||!body.paymentRequirements)return res.status(400).json({error:"paymentPayload et paymentRequirements sont requis."});
    const complianceStatus=await compliance.getUserStatus(req.user.sub);
    if(isProduction&&!complianceStatus.transaction_clear)return res.status(403).json({error:"KYC/AML requis avant vérification d'un paiement agent.",code:"COMPLIANCE_REQUIRED"});
    const result=await openFacilitator.verify(body.paymentPayload,body.paymentRequirements);
    res.json({provider:"OpenFacilitator",...result});
  }catch(e){
    res.status(e.statusCode||502).json({error:e.message||"Vérification x402 impossible.",code:e.code});
  }
});
app.post("/api/agent-payments/x402/quote",auth,async(req,res)=>{
  const correlationId=crypto.randomUUID();
  res.setHeader("X-Correlation-ID",correlationId);
  try{
    const body=req.body||{};
    const amountEur=Number(body.amountEur);
    const amountAtomic=String(body.amountAtomic||"").trim();
    const asset=String(body.asset||"").trim();
    const assetSymbol=String(body.assetSymbol||"").trim().toUpperCase();
    const network=String(body.network||"").trim();
    const payTo=String(body.payTo||"").trim();
    const botType=String(body.botType||"agent-payment").trim().toLowerCase();
    if(!Number.isFinite(amountEur)||amountEur<=0)return res.status(400).json({error:"amountEur doit être strictement positif."});
    if(!/^\d+$/.test(amountAtomic)||BigInt(amountAtomic)<=0n)return res.status(400).json({error:"amountAtomic doit être un entier positif en unités atomiques."});
    if(!asset||!assetSymbol||!network||!payTo)return res.status(400).json({error:"asset, assetSymbol, network et payTo sont requis."});
    if(!/^[a-z0-9][a-z0-9._:-]{1,99}$/i.test(network))return res.status(400).json({error:"network x402 invalide."});
    if(!x402AllowedAsset||!x402PayTo)return res.status(503).json({error:"Allowlist x402 non configurée.",code:"X402_ALLOWLIST_NOT_CONFIGURED"});
    if(network!==x402AllowedNetwork||asset!==x402AllowedAsset||assetSymbol!==x402AllowedAssetSymbol||payTo.toLowerCase()!==x402PayTo.toLowerCase())return res.status(403).json({error:"Cible x402 non autorisée.",code:"X402_TARGET_DENIED"});
    const complianceStatus=await compliance.getUserStatus(req.user.sub);
    if(isProduction&&!complianceStatus.transaction_clear)return res.status(403).json({error:"KYC/AML requis avant création du quote agent.",code:"COMPLIANCE_REQUIRED"});
    const validation=await agentPayments.validate({userId:req.user.sub,botType,asset:assetSymbol,amountEur});
    if(!validation.allowed)return res.status(403).json({error:"Paiement agent non autorisé.",code:"AGENT_PAYMENT_DENIED"});
    const requirements=buildPaymentRequirements({
      protocolVersion:Number(body.protocolVersion||2),
      scheme:String(body.scheme||"exact"),
      network,
      amountAtomic,
      asset,
      payTo,
      maxTimeoutSeconds:body.maxTimeoutSeconds??60,
      extra:body.extra
    });
    const id=crypto.randomUUID();
    const expiresAt=new Date(Date.now()+5*60*1000);
    await pool.query(
      `INSERT INTO x402_quotes(id,user_id,bot_type,asset_symbol,asset,network,pay_to,amount_eur,amount_atomic,requirements,requirements_hash,expires_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id,req.user.sub,botType,assetSymbol,asset,network,payTo,amountEur,amountAtomic,requirements,hashPaymentRequirements(requirements),expiresAt]
    );
    await auditX402({correlationId,quoteId:id,userId:req.user.sub,event:"quote",outcome:"success",details:{botType,assetSymbol,network,amountEur}});
    res.status(201).json({ok:true,correlationId,quoteId:id,expiresAt:expiresAt.toISOString(),amountEur,amountAtomic,requirements,authorization:validation});
  }catch(e){
    await auditX402({correlationId,userId:req.user.sub,event:"quote",outcome:"failed",code:e.code||"X402_QUOTE_ERROR"}).catch(()=>{});
    res.status(e.statusCode||400).json({error:e.message||"Impossible de créer le quote x402.",code:e.code});
  }
});

app.get("/api/agent-payments/x402/audit",auth,async(req,res)=>{
  const rows=(await pool.query("SELECT correlation_id,quote_id,event,outcome,code,details,created_at FROM x402_audit WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",[req.user.sub])).rows;
  res.json({events:rows});
});

app.get("/api/agent-payments/x402/receipt/:quoteId",auth,async(req,res)=>{
  const quote=(await pool.query("SELECT id,status,network,asset,amount_atomic,settled_at,settlement_receipt FROM x402_quotes WHERE id=$1 AND user_id=$2",[req.params.quoteId,req.user.sub])).rows[0];
  if(!quote)return res.status(404).json({error:"Quote x402 introuvable."});
  if(quote.status!=="settled")return res.status(409).json({error:"Aucune preuve de règlement disponible.",code:"X402_RECEIPT_NOT_AVAILABLE"});
  res.json({quoteId:quote.id,status:quote.status,network:quote.network,asset:quote.asset,amountAtomic:quote.amount_atomic,settledAt:quote.settled_at,receipt:quote.settlement_receipt});
});

app.get("/api/agent-payments/x402/status",auth,(req,res)=>res.json({
  settlementEnabled:Boolean(openFacilitator.config.settlementEnabled),
  emergencyStop:x402EmergencyStop,
  settlementAvailable:Boolean(openFacilitator.config.settlementEnabled&&!x402EmergencyStop),
  mode:x402EmergencyStop?"emergency-stop":openFacilitator.config.settlementEnabled?"enabled":"disabled"
}));

app.post("/api/agent-payments/x402/settle",auth,async(req,res)=>{
  const correlationId=crypto.randomUUID();
  res.setHeader("X-Correlation-ID",correlationId);
  const client=await pool.connect();
  try{
    const body=req.body||{};
    if(!body.quoteId||!body.paymentPayload||!body.paymentRequirements)return res.status(400).json({error:"quoteId, paymentPayload et paymentRequirements sont requis."});
    const idempotencyKey=String(req.headers["idempotency-key"]||body.idempotencyKey||"").trim();
    if(!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey))return res.status(400).json({error:"Idempotency-Key requis (8-128 caractères).",code:"X402_IDEMPOTENCY_REQUIRED"});
    if(x402EmergencyStop)return res.status(503).json({error:"Arrêt d'urgence x402 actif.",code:"X402_EMERGENCY_STOP"});
    if(!openFacilitator.config.settlementEnabled)return res.status(503).json({error:"Le settlement x402 réel est désactivé.",code:"X402_SETTLEMENT_DISABLED"});
    await client.query("BEGIN");
    const quote=(await client.query("SELECT * FROM x402_quotes WHERE id=$1 AND user_id=$2 FOR UPDATE",[String(body.quoteId),req.user.sub])).rows[0];
    if(!quote){await client.query("ROLLBACK");return res.status(404).json({error:"Quote x402 introuvable."});}
    if(quote.status==="settled"&&quote.idempotency_key===idempotencyKey){await client.query("ROLLBACK");return res.status(200).json({provider:"OpenFacilitator",quoteId:quote.id,idempotent:true,status:"settled",receipt:quote.settlement_receipt});}
    const replay=(await client.query("SELECT id,status FROM x402_quotes WHERE user_id=$1 AND idempotency_key=$2 AND id<>$3 LIMIT 1",[req.user.sub,idempotencyKey,quote.id])).rows[0];
    if(replay){await client.query("ROLLBACK");return res.status(409).json({error:"Cette clé d'idempotence est déjà liée à un autre quote.",code:"X402_IDEMPOTENCY_REPLAY"});}
    if(!["pending","issued"].includes(quote.status)){await client.query("ROLLBACK");return res.status(409).json({error:"Ce quote x402 n'est plus utilisable.",code:"X402_QUOTE_USED"});}
    if(new Date(quote.expires_at).getTime()<=Date.now()){await client.query("UPDATE x402_quotes SET status='expired' WHERE id=$1",[quote.id]);await client.query("COMMIT");return res.status(410).json({error:"Quote x402 expiré.",code:"X402_QUOTE_EXPIRED"});}
    const requirements=body.paymentRequirements;
    if(!requirementsMatch(requirements,quote.requirements)||hashPaymentRequirements(requirements)!==quote.requirements_hash){
      await client.query("ROLLBACK");
      return res.status(409).json({error:"Les paymentRequirements ne correspondent pas au quote serveur.",code:"X402_QUOTE_MISMATCH"});
    }
    if(!acceptedMatchesRequirements(body.paymentPayload,requirements)){
      await client.query("ROLLBACK");
      return res.status(409).json({error:"Le paiement signé ne correspond pas aux paymentRequirements du quote.",code:"X402_PAYMENT_MISMATCH"});
    }
    await client.query("UPDATE x402_quotes SET status='verified',idempotency_key=$2,verified_at=CURRENT_TIMESTAMP WHERE id=$1",[quote.id,idempotencyKey]);
    await auditX402({correlationId,quoteId:quote.id,userId:req.user.sub,event:"verify",outcome:"success",details:{assetSymbol:quote.asset_symbol,network:quote.network,amountEur:Number(quote.amount_eur)}});
    const authorization=await agentPayments.authorize({userId:req.user.sub,botType:quote.bot_type,asset:quote.asset_symbol,amountEur:Number(quote.amount_eur)});
    if(!authorization.allowed){await client.query("UPDATE x402_quotes SET status='failed',failed_at=CURRENT_TIMESTAMP WHERE id=$1",[quote.id]);await client.query("COMMIT");await auditX402({correlationId,quoteId:quote.id,userId:req.user.sub,event:"authorize",outcome:"denied",code:"AGENT_PAYMENT_DENIED"});return res.status(403).json({error:"Paiement agent non autorisé.",code:"AGENT_PAYMENT_DENIED"});}
    await auditX402({correlationId,quoteId:quote.id,userId:req.user.sub,event:"authorize",outcome:"success"});
    const result=await openFacilitator.settle(body.paymentPayload,requirements);
    if(result?.success===false){await client.query("UPDATE x402_quotes SET status='failed',failed_at=CURRENT_TIMESTAMP WHERE id=$1",[quote.id]);await client.query("COMMIT");return res.status(402).json({provider:"OpenFacilitator",authorization,...result});}
    const receipt={provider:"OpenFacilitator",transaction:result?.transaction||result?.txHash||result?.transactionHash||null,network:quote.network,asset:quote.asset,amountAtomic:quote.amount_atomic};
    await client.query("UPDATE x402_quotes SET status='settled',settled_at=CURRENT_TIMESTAMP,settlement_receipt=$2 WHERE id=$1",[quote.id,receipt]);
    await client.query("COMMIT");
    await auditX402({correlationId,quoteId:quote.id,userId:req.user.sub,event:"settle",outcome:"success",details:{provider:"OpenFacilitator",transaction:receipt.transaction}});
    res.json({provider:"OpenFacilitator",correlationId,quoteId:quote.id,authorization,...result});
  }catch(e){
    try{await client.query("ROLLBACK")}catch{}
    const quoteId=String(req.body?.quoteId||"");
    if(quoteId){
      // The transaction rollback also rolls back the transient 'verified' state.
      // Persist failure from any still-consumable state so provider exceptions
      // cannot leave the quote reusable.
      await pool.query("UPDATE x402_quotes SET status='failed',failed_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2 AND status IN ('pending','issued','verified')",[quoteId,req.user.sub]).catch(()=>{});
    }
    await auditX402({correlationId,quoteId:quoteId||null,userId:req.user.sub,event:"settle",outcome:"failed",code:e.code||"X402_SETTLEMENT_ERROR"}).catch(()=>{});
    res.status(e.statusCode||502).json({error:e.message||"Settlement x402 impossible.",code:e.code});
  }finally{client.release()}
});

app.post("/api/compliance/provider/webhook",async(req,res)=>{
  try{const result=await compliance.handleProviderWebhook(req);res.json(result)}catch(e){console.error("[COMPLIANCE] webhook error",e.message);res.status(e.statusCode||400).json({error:e.message||"Webhook conformité invalide."})}
});

app.get("/api/health", async (req,res) => {
  try { await pool.query("SELECT 1"); res.json({ok:true,service:"BitGold API"}); }
  catch(e) { console.error("[HEALTH] database error", e.message); res.status(503).json({ok:false,service:"BitGold API"}); }
});

function normalizeProfile(body={}){
  const value=(key,max=160)=>String(body[key]??"").trim().slice(0,max);
  const risk=["conservative","moderate","dynamic"].includes(value("risk_profile"))?value("risk_profile"):"moderate";
  const supportedCurrencies=["EUR","USD","GBP","CHF","CAD","AUD","NZD","JPY","CNY","HKD","SGD","BRL","MXN","INR","SEK","NOK","DKK","PLN","CZK","HUF","RON","TRY"];
  const currency=supportedCurrencies.includes(value("preferred_currency"))?value("preferred_currency"):"EUR";
  const birth=value("birth_date");
  const validBirth=!birth||(!Number.isNaN(Date.parse(birth+"T00:00:00Z"))&&birth<=new Date().toISOString().slice(0,10));
  return {
    first_name:value("first_name",80),
    last_name:value("last_name",80),
    phone:value("phone",40),
    birth_date:/^\d{4}-\d{2}-\d{2}$/.test(birth)&&validBirth?birth:"",
    country:value("country",80),
    city:value("city",100),
    postal_code:value("postal_code",20),
    address:value("address",200),
    preferred_currency:currency,
    risk_profile:risk
  };
}
function profileFromRow(u){
  return {
    id:u.id,email:u.email,
    first_name:u.first_name||"",last_name:u.last_name||"",phone:u.phone||"",
    birth_date:u.birth_date?new Date(u.birth_date).toISOString().slice(0,10):"",
    country:u.country||"",city:u.city||"",postal_code:u.postal_code||"",address:u.address||"",
    preferred_currency:u.preferred_currency||"EUR",risk_profile:u.risk_profile||"moderate",
    auth_provider:u.auth_provider||"password",created_at:u.created_at
  };
}
async function provisionUserAssets(client,userId){
  await client.query("INSERT INTO wallets(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING",[userId]);
  for(const asset of Object.keys(prices)){
    await client.query("INSERT INTO holdings(user_id,asset,quantity) VALUES($1,$2,0) ON CONFLICT(user_id,asset) DO NOTHING",[userId,asset]);
  }
}

app.post("/api/auth/signup", authRateLimit, async (req,res) => {
  const email=String(req.body.email||"").trim().toLowerCase(), password=String(req.body.password||"");
  const profile=normalizeProfile(req.body);
  if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8) return res.status(400).json({error:"Email valide et mot de passe de 8 caractères minimum requis."});
  if(!profile.first_name||!profile.last_name||!profile.country||!profile.city||!profile.postal_code) return res.status(400).json({error:"Prénom, nom, pays, ville et code postal sont requis pour créer votre profil."});
  console.log("[AUTH] signup attempt", email);
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const hash=await bcrypt.hash(password,12);
    const r=await client.query(
      "INSERT INTO users(email,password_hash,first_name,last_name,phone,birth_date,country,city,postal_code,address,preferred_currency,risk_profile) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
      [email,hash,profile.first_name,profile.last_name,profile.phone,profile.birth_date||null,profile.country,profile.city,profile.postal_code,profile.address,profile.preferred_currency,profile.risk_profile]
    );
    const user=r.rows[0];
    await provisionUserAssets(client,user.id);
    await client.query("COMMIT");
    console.log("[AUTH] signup success", email);
    res.status(201).json({token:token(user),email:user.email,profile:profileFromRow(user)});
  } catch(e) {
    await client.query("ROLLBACK");
    console.error("[AUTH] signup error", e.message);
    res.status(e.code==="23505"?409:500).json({error:e.code==="23505"?"Ce compte existe déjà.":"Erreur serveur."});
  } finally { client.release(); }
});

app.post("/api/auth/login", authRateLimit, async (req,res) => {
  const email=String(req.body.email||"").trim().toLowerCase(), password=String(req.body.password||"");
  console.log("[AUTH] login attempt", email);
  try {
    const r=await pool.query("SELECT * FROM users WHERE email=$1",[email]), u=r.rows[0];
    if(!u||!u.password_hash){
      console.log("[AUTH] password login unavailable", email);
      return res.status(401).json({error:"Identifiants incorrects."});
    }
    const valid=await bcrypt.compare(password,u.password_hash);
    if(!valid){
      console.log("[AUTH] invalid password", email);
      return res.status(401).json({error:"Identifiants incorrects."});
    }
    console.log("[AUTH] login success", email);
    const twofa=(await pool.query("SELECT enabled FROM user_2fa WHERE user_id=$1",[u.id])).rows[0]?.enabled===true;
    if(twofa)return res.json({requires2FA:true,challengeToken:await challengeToken(u),email:u.email});
    res.json({token:token(u),email:u.email,profile:profileFromRow(u)});
  } catch(e) {
    console.error("[AUTH] login error", e.message);
    res.status(500).json({error:"Erreur serveur."});
  }
});

app.get("/api/security",auth,async(req,res)=>{try{const r=await pool.query("SELECT enabled,enabled_at FROM user_2fa WHERE user_id=$1",[req.user.sub]);res.json({twoFA:{enabled:r.rows[0]?.enabled===true,enabledAt:r.rows[0]?.enabled_at||null}})}catch(e){res.status(500).json({error:"Impossible de charger la sécurité."})}});
app.post("/api/security/2fa/setup",auth,twoFactorRateLimit,async(req,res)=>{try{const old=(await pool.query("SELECT enabled FROM user_2fa WHERE user_id=$1",[req.user.sub])).rows[0];if(old?.enabled)return res.status(409).json({error:"Le 2FA est déjà actif."});const u=(await pool.query("SELECT email FROM users WHERE id=$1",[req.user.sub])).rows[0];if(!u)return res.status(404).json({error:"Compte introuvable."});const sec=generateSecret();await pool.query("INSERT INTO user_2fa(user_id,pending_secret_enc,challenge_jti,challenge_used_at) VALUES($1,$2,NULL,NULL) ON CONFLICT(user_id) DO UPDATE SET pending_secret_enc=$2,challenge_jti=NULL,challenge_used_at=NULL",[req.user.sub,encrypt2fa(sec)]);const uri=generateURI({issuer:"BitGold",label:u.email,secret:sec}),qr=await QRCode.toDataURL(uri,{width:260,margin:1,errorCorrectionLevel:"M"});res.json({ok:true,qr,secret:sec,email:u.email})}catch(e){console.error("[2FA] setup error",e.message);res.status(500).json({error:"Impossible de préparer le 2FA."})}});
app.post("/api/security/2fa/enable",auth,twoFactorRateLimit,async(req,res)=>{try{const row=(await pool.query("SELECT pending_secret_enc FROM user_2fa WHERE user_id=$1",[req.user.sub])).rows[0],code=String(req.body.code||"").replace(/\s/g,"");if(!row?.pending_secret_enc)return res.status(400).json({error:"Configuration 2FA absente."});const sec=decrypt2fa(row.pending_secret_enc);if(!(await verify({secret:sec,token:code})).valid)return res.status(400).json({error:"Code Google Authenticator invalide."});const recovery=Array.from({length:8},()=>crypto.randomBytes(10).toString("hex").toUpperCase()),hashes=await Promise.all(recovery.map(x=>bcrypt.hash(x,12)));await pool.query("UPDATE user_2fa SET secret_enc=$1,pending_secret_enc=NULL,enabled=TRUE,enabled_at=CURRENT_TIMESTAMP,recovery_code_hashes=$2,challenge_jti=NULL,challenge_used_at=NULL WHERE user_id=$3",[encrypt2fa(sec),hashes,req.user.sub]);res.json({ok:true,recoveryCodes:recovery})}catch(e){console.error("[2FA] enable error",e.message);res.status(500).json({error:"Impossible d'activer le 2FA."})}});
app.post("/api/security/2fa/disable",auth,twoFactorRateLimit,async(req,res)=>{try{const password=String(req.body.password||""),code=String(req.body.code||"").replace(/\s/g,"");const u=(await pool.query("SELECT password_hash FROM users WHERE id=$1",[req.user.sub])).rows[0];if(!u?.password_hash||!(await bcrypt.compare(password,u.password_hash)))return res.status(401).json({error:"Mot de passe invalide."});const row=(await pool.query("SELECT secret_enc FROM user_2fa WHERE user_id=$1 AND enabled=TRUE",[req.user.sub])).rows[0];if(!row)return res.status(400).json({error:"2FA non actif."});if(!(await verify({secret:decrypt2fa(row.secret_enc),token:code})).valid)return res.status(400).json({error:"Code Google Authenticator invalide."});await pool.query("UPDATE user_2fa SET secret_enc=NULL,pending_secret_enc=NULL,enabled=FALSE,enabled_at=NULL,recovery_code_hashes='{}',challenge_jti=NULL,challenge_used_at=NULL WHERE user_id=$1",[req.user.sub]);res.json({ok:true})}catch(e){console.error("[2FA] disable error",e.message);res.status(500).json({error:"Impossible de désactiver le 2FA."})}});
app.post("/api/auth/2fa/verify",twoFactorRateLimit,async(req,res)=>{try{const d=jwt.verify(String(req.body.challengeToken||""),secret);if(d.purpose!=="2fa_challenge"||!d.jti)throw Error();const client=await pool.connect();try{await client.query("BEGIN");const row=(await client.query("SELECT secret_enc,recovery_code_hashes,challenge_jti,challenge_used_at FROM user_2fa WHERE user_id=$1 AND enabled=TRUE FOR UPDATE",[d.sub])).rows[0],code=String(req.body.code||"").replace(/\s/g,"");if(!row||row.challenge_jti!==d.jti||row.challenge_used_at)return res.status(401).json({error:"Vérification 2FA invalide ou déjà utilisée."});let ok=/^\d{6}$/.test(code)&&(await verify({secret:decrypt2fa(row.secret_enc),token:code})).valid;if(!ok){for(const h of row.recovery_code_hashes||[]){if(await bcrypt.compare(code,h)){ok=true;await client.query("UPDATE user_2fa SET recovery_code_hashes=array_remove(recovery_code_hashes,$1) WHERE user_id=$2",[h,d.sub]);break}}}if(!ok){await client.query("ROLLBACK");return res.status(401).json({error:"Code 2FA invalide."})}await client.query("UPDATE user_2fa SET challenge_used_at=CURRENT_TIMESTAMP WHERE user_id=$1",[d.sub]);const u=(await client.query("SELECT * FROM users WHERE id=$1",[d.sub])).rows[0];await client.query("COMMIT");if(!u)return res.status(401).json({error:"Compte introuvable."});res.json({token:token(u),email:u.email,profile:profileFromRow(u)})}catch(e){await client.query("ROLLBACK");throw e}finally{client.release()}}catch(e){console.error("[2FA] verify error",e.message);res.status(401).json({error:"Vérification 2FA invalide ou expirée."})}});
app.get("/api/auth/google/config",(req,res)=>res.json({enabled:googleConfigured,clientId:googleConfigured?googleClientId:null}));

app.post("/api/auth/google", authRateLimit, async (req,res) => {
  if(!googleConfigured) return res.status(503).json({error:"La connexion Google n'est pas encore configurée."});
  const credential=String(req.body.credential||"").trim();
  if(!credential) return res.status(400).json({error:"Jeton Google manquant."});
  try {
    const ticket=await googleClient.verifyIdToken({idToken:credential,audience:googleClientId});
    const payload=ticket.getPayload();
    const googleSub=String(payload?.sub||"").trim();
    const email=String(payload?.email||"").trim().toLowerCase();
    if(!googleSub||!email||payload?.email_verified!==true) return res.status(401).json({error:"Compte Google non vérifié."});
    const given=String(payload.given_name||"").trim().slice(0,80);
    const family=String(payload.family_name||"").trim().slice(0,80);
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      let r=await client.query("SELECT * FROM users WHERE google_sub=$1",[googleSub]);
      let user=r.rows[0];
      if(!user){
        r=await client.query("SELECT * FROM users WHERE email=$1",[email]);
        user=r.rows[0];
      }
      if(user){
        r=await client.query(
          "UPDATE users SET google_sub=$1,auth_provider=CASE WHEN password_hash IS NULL THEN 'google' ELSE auth_provider END,first_name=COALESCE(NULLIF(first_name,''),$2),last_name=COALESCE(NULLIF(last_name,''),$3) WHERE id=$4 RETURNING *",
          [googleSub,given,family,user.id]
        );
        user=r.rows[0];
      }else{
        r=await client.query(
          "INSERT INTO users(email,password_hash,first_name,last_name,google_sub,auth_provider) VALUES($1,NULL,$2,$3,$4,'google') RETURNING *",
          [email,given,family,googleSub]
        );
        user=r.rows[0];
        await provisionUserAssets(client,user.id);
      }
      await client.query("COMMIT");
      const twofa=(await pool.query("SELECT enabled FROM user_2fa WHERE user_id=$1",[user.id])).rows[0]?.enabled===true;
      if(twofa)return res.json({requires2FA:true,challengeToken:await challengeToken(user),email:user.email});
      res.json({token:token(user),email:user.email,profile:profileFromRow(user)});
    }catch(e){await client.query("ROLLBACK");throw e}
    finally{client.release()}
  }catch(e){
    console.error("[AUTH] Google error",e.message);
    res.status(401).json({error:"Connexion Google impossible ou jeton invalide."});
  }
});

app.get("/api/me",auth,async(req,res)=>{
  try{
    const r=await pool.query("SELECT * FROM users WHERE id=$1",[req.user.sub]);
    if(!r.rows[0]) return res.status(404).json({error:"Profil introuvable."});
    res.json(profileFromRow(r.rows[0]));
  }catch(e){res.status(500).json({error:"Impossible de charger le profil."})}
});

app.put("/api/me",auth,async(req,res)=>{
  const profile=normalizeProfile(req.body);
  if(!profile.first_name||!profile.last_name) return res.status(400).json({error:"Prénom et nom sont requis."});
  try{
    const r=await pool.query(
      "UPDATE users SET first_name=$1,last_name=$2,phone=$3,birth_date=$4,country=$5,city=$6,postal_code=$7,address=$8,preferred_currency=$9,risk_profile=$10 WHERE id=$11 RETURNING *",
      [profile.first_name,profile.last_name,profile.phone,profile.birth_date||null,profile.country,profile.city,profile.postal_code,profile.address,profile.preferred_currency,profile.risk_profile,req.user.sub]
    );
    if(!r.rows[0]) return res.status(404).json({error:"Profil introuvable."});
    res.json({ok:true,profile:profileFromRow(r.rows[0])});
  }catch(e){
    console.error("[PROFILE] update error",e.message);
    res.status(500).json({error:"Impossible d'enregistrer le profil."});
  }
});

app.post("/api/newsletter/subscribe", async (req,res) => {
  const email=String(req.body.email||"").trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:"Adresse email invalide."});
  try {
    await pool.query(
      "INSERT INTO newsletter_subscribers(email,active) VALUES($1,TRUE) ON CONFLICT(email) DO UPDATE SET active=TRUE,subscribed_at=CURRENT_TIMESTAMP",
      [email]
    );
    res.status(201).json({ok:true,message:"Inscription confirmée. Vous recevrez les prochaines sélections BitGold."});
  } catch(e) {
    console.error("[NEWSLETTER] subscribe error",e.message);
    res.status(500).json({error:"Inscription temporairement indisponible."});
  }
});
app.post("/api/newsletter/unsubscribe", async (req,res) => {
  const email=String(req.body.email||"").trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:"Adresse email invalide."});
  try {
    await pool.query("UPDATE newsletter_subscribers SET active=FALSE WHERE email=$1",[email]);
    res.json({ok:true,message:"Désinscription enregistrée."});
  } catch(e) {
    console.error("[NEWSLETTER] unsubscribe error",e.message);
    res.status(500).json({error:"Désinscription temporairement indisponible."});
  }
});

const newsCache={items:[],updatedAt:0,source:"BitGold News"};

const NEWS_FEEDS=[
  {name:"Cointelegraph",url:"https://cointelegraph.com/rss",weight:3},
  {name:"CoinDesk",url:"https://www.coindesk.com/arc/outboundfeeds/rss/",weight:3},
  {name:"Decrypt",url:"https://decrypt.co/feed",weight:2},
  {name:"Bitcoin Magazine",url:"https://bitcoinmagazine.com/feed",weight:2},
  {name:"CryptoSlate",url:"https://cryptoslate.com/feed/",weight:1},
  {name:"The Block",url:"https://www.theblock.co/rss.xml",weight:2}
];
const NEWS_KEYWORDS={
  Bitcoin:["bitcoin","btc"],Ethereum:["ethereum","eth"],Solana:["solana","sol"],DeFi:["defi","decentralized finance","dex","lending","staking"],Régulation:["regulation","regulatory","sec","esma","mica","law","ban"],ETF:["etf","exchange-traded fund"],Marché:["market","price","trading","rally","volatility","liquidation"]
};

function normalizeNewsItem(item){
  const title=String(item?.title||"").trim();
  const description=String(item?.description||item?.summary||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  const published=Date.parse(item?.posted_at||item?.published_at||item?.pubDate||item?.published||item?.updated||"");
  const text=(title+" "+description).toLowerCase();
  const categories=Object.entries(NEWS_KEYWORDS).filter(([,words])=>words.some(word=>text.includes(word))).map(([name])=>name);
  return {title,url:String(item?.url||item?.link||"").trim(),publishedAt:Number.isFinite(published)?new Date(published).toISOString():new Date().toISOString(),source:String(item?.source_name||item?.source||"Crypto").trim(),category:categories[0]||"Crypto",categories:categories.length?categories:["Crypto"],imageUrl:String(item?.image||item?.image_url||"").trim(),author:String(item?.author||"").trim(),summary:description.slice(0,220)};
}

function decodeXml(value){
  return String(value||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi,"$1").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/gi,"'");
}

function parseRssItems(xml,defaultSource="Crypto"){
  const source=String(xml||"");
  const blocks=[...source.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map(match=>match[1]).slice(0,20);
  const pickRaw=(block,tags)=>{
    for(const tag of tags){
      const found=block.match(new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)</"+tag+">","i"));
      if(found)return found[1];
    }
    return "";
  };
  const pick=(block,tags)=>decodeXml(pickRaw(block,tags)).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  const pickAttr=(block,tags,attr)=>{
    for(const tag of tags){
      const found=block.match(new RegExp("<"+tag+"(?:\\s[^>]*)?[^>]*\\s"+attr+"=[\"']([^\"']+)[\"'][^>]*>","i"));
      if(found)return decodeXml(found[1]).trim();
    }
    return "";
  };
  return blocks.map(block=>{
    const rawDescription=pickRaw(block,["description","content:encoded","summary"]);
    const description=decodeXml(rawDescription).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    const descriptionImage=(decodeXml(rawDescription).match(/<img[^>]+(?:src|data-src|data-original)=[\"']([^\"']+)[\"']/i)||[])[1]||"";
    const url=pick(block,["link","guid"])||pickAttr(block,["link"],"href");
    const imageUrl=pickAttr(block,["media:content","media:thumbnail","enclosure","image"],"url")||descriptionImage;
    return normalizeNewsItem({title:pick(block,["title"]),url,published_at:pick(block,["pubDate","published","updated","dc:date"]),source_name:pick(block,["source"])||defaultSource,image:imageUrl,description});
  }).filter(item=>item.title&&/^https?:\/\//i.test(item.url));
}

async function fetchNewsFeed(feed){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  try{
    const response=await fetch(feed.url,{signal:controller.signal,headers:{accept:"application/rss+xml, application/atom+xml, application/xml, text/xml","user-agent":"BitGold-News/1.0"}});
    if(!response.ok)throw Error(feed.name+" RSS HTTP "+response.status);
    const body=await response.text();
    const items=parseRssItems(body,feed.name).map(item=>({...item,source:feed.name,_weight:feed.weight}));
    if(!items.length)throw Error(feed.name+" RSS sans article");
    return items;
  }finally{clearTimeout(timer)}
}

function dedupeNews(items){
  const map=new Map();
  for(const item of items){
    const normalizedTitle=item.title.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
    const urlKey=item.url.replace(/[?#].*$/,"").trim().toLowerCase();
    const titleKey=normalizedTitle.split(" ").slice(0,18).join(" ");
    const key=titleKey||urlKey;
    const previous=map.get(key);
    if(!previous||Date.parse(item.publishedAt)>Date.parse(previous.publishedAt)) map.set(key,item);
  }
  return [...map.values()]
    .sort((a,b)=>{
      const freshness=Date.parse(b.publishedAt)-Date.parse(a.publishedAt);
      const sourceBoost=(Number(b._weight||0)-Number(a._weight||0))*3600000;
      return freshness+sourceBoost;
    })
    .slice(0,12)
    .map(({_weight,...item})=>item);
}

async function fetchProfessionalNews(){
  const results=await Promise.allSettled(NEWS_FEEDS.map(fetchNewsFeed));
  const successful=results.filter(result=>result.status==="fulfilled").flatMap(result=>result.value);
  if(!successful.length) throw Error("Aucune source d’actualité disponible");
  const items=dedupeNews(successful);
  if(!items.length) throw Error("Aucun article exploitable");
  return {items,feedsOk:results.filter(result=>result.status==="fulfilled").length,feedsTotal:NEWS_FEEDS.length};
}

app.get("/api/news",async(req,res)=>{
  if(newsCache.items.length&&Date.now()-newsCache.updatedAt<300000){
    return res.json({source:newsCache.source,updatedAt:newsCache.updatedAt,items:newsCache.items});
  }
  try{
    const {items,feedsOk,feedsTotal}=await fetchProfessionalNews();
    newsCache.items=items;
    newsCache.source=`BitGold News · ${feedsOk}/${feedsTotal} sources`;
    newsCache.updatedAt=Date.now();
    return res.json({source:newsCache.source,updatedAt:newsCache.updatedAt,items});
  }catch(e){
    console.error("[NEWS] aggregator error",e.message);
    if(newsCache.items.length) return res.json({source:newsCache.source,updatedAt:newsCache.updatedAt,items:newsCache.items,stale:true});
    return res.status(502).json({error:"Actualités temporairement indisponibles.",items:[]});
  }
});
async function getBotNewsForAI(){
  if(newsCache.items.length&&Date.now()-newsCache.updatedAt<300000)return newsCache.items;
  try{
    const {items}=await fetchProfessionalNews();
    newsCache.items=items;
    newsCache.source="BitGold News · IA";
    newsCache.updatedAt=Date.now();
    return items;
  }catch(e){
    console.warn("[BOT-AI] news sentiment unavailable:",e.message);
    return newsCache.items;
  }
}

app.get("/api/market",async(req,res)=>{ const market=await refreshMarket(); res.json({updatedAt:marketUpdatedAt,source:"CoinGecko",markets:market}); });
const HISTORY_RANGES={
  "5m":{label:"5 min",days:1,maxAgeMs:5*60*1000},
  "1h":{label:"1 h",days:1,maxAgeMs:60*60*1000},
  "24h":{label:"24 h",days:1,maxAgeMs:24*60*60*1000},
  "7d":{label:"7 jours",days:7},
  "30d":{label:"30 jours",days:30},
  "1y":{label:"1 an",days:365},
  "5y":{label:"5 ans",days:"max"},
};

app.get("/api/market/details/:symbol",async(req,res)=>{
  const symbol=String(req.params.symbol||"").toUpperCase();
  const requestedRange=String(req.query.range||"24h").trim().toLowerCase();
  const range=Object.prototype.hasOwnProperty.call(HISTORY_RANGES,requestedRange)?requestedRange:"24h";
  const rangeConfig=HISTORY_RANGES[range];
  if(!marketIds[symbol]) return res.status(404).json({error:"Crypto inconnue."});
  const market=await refreshMarket();
  const item=market.find(row=>row.symbol===symbol);
  try {
    const pricesHistory=await fetchHistoryRange(symbol,range);
    const values=pricesHistory.map(point=>Number(point.price)).filter(Number.isFinite);
    res.json({
      ...item,
      name:{BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",USDC:"USD Coin",LINK:"Chainlink",AVAX:"Avalanche"}[symbol],
      history:{range,label:rangeConfig.label,min:values.length?Math.min(...values):item.price,max:values.length?Math.max(...values):item.price,points:pricesHistory},
      source:"CoinGecko"
    });
  } catch(e) {
    console.error("[MARKET] detail error",symbol,range,e.message);
    res.json({...item,name:symbol,history:{range,label:rangeConfig.label,min:item.price,max:item.price,points:[]},source:"CoinGecko"});
  }
});


async function fetchHistory(symbol, days) {
  const cacheKey=`${symbol}:${days}`;
  const cached=historyCache.get(cacheKey);
  if(cached && Date.now()-cached.updatedAt<60000) return cached.prices;
  const id=marketIds[symbol];
  if(!id) throw Error("Crypto inconnue.");
  let response;
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
    try{
      response=await coingeckoFetch(`/coins/${id}/market_chart?vs_currency=eur&days=${days}`);
      if(response.ok) break;
      lastError=await coingeckoError(response);
    }catch(e){ lastError=e; }
    if(attempt<2) await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
  }
  if(!response?.ok) {
    console.warn("[MARKET] history unavailable",symbol,days,lastError?.message||"CoinGecko indisponible");
    return cached?.prices||[];
  }
  const data=await response.json();
  const pricesHistory=(data.prices||[]).map(([timestamp,price])=>({timestamp,price:Number(price)})).filter(p=>Number.isFinite(p.price)&&p.price>0);
  if(!pricesHistory.length) {
    console.warn("[MARKET] history unavailable",symbol,days,"Aucune donnée historique");
    return cached?.prices||[];
  }
  historyCache.set(cacheKey,{updatedAt:Date.now(),prices:pricesHistory});
  return pricesHistory;
}
async function fetchHistoryRange(symbol,range){
  const normalizedRange=String(range||"24h").trim().toLowerCase();
  const config=HISTORY_RANGES[normalizedRange]||HISTORY_RANGES["24h"];
  const cacheKey=`${symbol}:range:${normalizedRange}`;
  if(normalizedRange==="5m"){
    await refreshMarket();
    const cutoff=Date.now()-config.maxAgeMs;
    const ticks=(marketTickHistory.get(symbol)||[]).filter(point=>point.timestamp>=cutoff&&Number.isFinite(Number(point.price))&&Number(point.price)>0);
    const source=await fetchHistory(symbol,config.days);
    const sourceRecent=source.filter(point=>Number(point.timestamp)>=cutoff);
    const merged=[...sourceRecent,...ticks].sort((a,b)=>Number(a.timestamp)-Number(b.timestamp));
    const unique=[];
    for(const point of merged){
      const normalized={timestamp:Number(point.timestamp),price:Number(point.price)};
      if(!unique.length||normalized.timestamp>unique[unique.length-1].timestamp) unique.push(normalized);
      else unique[unique.length-1]=normalized;
    }
    if(unique.length>=2){
      const pricesHistory=unique.slice(-120);
      historyCache.set(cacheKey,{updatedAt:Date.now(),prices:pricesHistory});
      return pricesHistory;
    }
    return ticks.length?ticks:sourceRecent;
  }
  const cached=historyCache.get(cacheKey);
  if(cached && Date.now()-cached.updatedAt<60000)return cached.prices;
  const source=await fetchHistory(symbol,config.days);
  let pricesHistory=source;
  if(config.maxAgeMs){
    const cutoff=Date.now()-config.maxAgeMs;
    pricesHistory=source.filter(point=>Number(point.timestamp)>=cutoff);
  }
  historyCache.set(cacheKey,{updatedAt:Date.now(),prices:pricesHistory});
  return pricesHistory;
}

app.get("/api/market/history",async(req,res)=>{
  const days=Math.min(Math.max(Number(req.query.days||7),1),90);
  try {
    const results=await Promise.allSettled(Object.keys(marketIds).map(async symbol=>[symbol,await fetchHistory(symbol,days)]));
    const markets=Object.fromEntries(results.filter(result=>result.status==="fulfilled").map(result=>result.value));
    if(!Object.keys(markets).length) throw Error("Aucune donnée historique disponible.");
    res.json({days,source:Object.keys(markets).length?"CoinGecko":"BitGold fallback",markets});
  } catch(e) {
    console.error("[MARKET] history batch error",e.message);
    res.status(502).json({error:"Historique temporairement indisponible."});
  }
});
app.get("/api/market/history/:symbol",async(req,res)=>{
  const symbol=String(req.params.symbol||"").toUpperCase();
  const days=Math.min(Math.max(Number(req.query.days||7),1),90);
  if(!marketIds[symbol]) return res.status(404).json({error:"Crypto inconnue."});
  try {
    const pricesHistory=await fetchHistory(symbol,days);
    res.json({symbol,days,source:"CoinGecko",prices:pricesHistory});
  } catch(e) {
    console.error("[MARKET] history error",symbol,e.message);
    res.json({symbol,days,source:"CoinGecko",prices:[]});
  }
});

const BOT_CATALOG=[
{id:"shield",name:"Shield Bot",tier:"SHIELD",plan:"free",risk:"Prudent",allocation:25,frequency:"30 min",summary:"Protection d'abord : conserve du cash et réduit les actifs fragiles.",description:"Le bot gratuit pour apprendre l'automatisation avec une approche défensive et des garde-fous stricts.",strategy:"Momentum 7 jours + RSI simplifié. Le moteur protège la réserve de cash et n'intervient que lorsque la tendance est suffisamment claire.",algorithm:"1. Calcule momentum 7j et RSI. 2. Réduit SOL/LINK/AVAX si momentum ≤ -7 %. 3. Renforce BTC/ETH si momentum ≥ +5 % et RSI < 68. 4. Respecte les limites Free.",compatible_assets:["BTC","ETH","SOL","LINK","AVAX"]},
{id:"silver",name:"Silver Bot",tier:"SILVER",plan:"pro",risk:"Modéré",allocation:45,frequency:"30 min",summary:"Équilibre tendance, diversification et renforcement progressif.",description:"Une stratégie Pro intermédiaire qui suit BTC, ETH et SOL.",strategy:"Momentum 7 jours + RSI sur BTC, ETH et SOL, avec sélection du leader.",algorithm:"1. Momentum 7j. 2. Sélection du leader. 3. Achat si momentum ≥ +3 % et RSI < 72. 4. Réduction sous -5 %.",compatible_assets:["BTC","ETH","SOL"]},
{id:"gold",name:"Gold Bot",tier:"GOLD",plan:"pro",risk:"Élevé",allocation:65,frequency:"15 min",summary:"Performance offensive : détecte les phases haussières et renforce les leaders.",description:"Une stratégie Pro dynamique qui cherche les régimes de marché favorables.",strategy:"Momentum BTC + breadth du marché + tendance ETH.",algorithm:"1. BTC ≥ +8 %. 2. Quatre actifs positifs. 3. ETH > +2 %. 4. Renforce BTC/ETH. 5. Réduit BTC sous -6 %.",compatible_assets:["BTC","ETH"]},
{id:"adaptive-ai",name:"Adaptive AI Bot",tier:"IA",plan:"pro",risk:"Adaptatif",allocation:55,frequency:"15 min",summary:"IA explicable : momentum, RSI, volatilité et position dans le range.",description:"Le bot IA Pro attribue un score de conviction à chaque actif sans dépendre d'une API IA externe.",strategy:"Score adaptatif : 45 % momentum, 25 % RSI, 20 % range, 10 % volatilité.",algorithm:"1. Calcule les signaux. 2. Normalise. 3. Score 0–100. 4. Achète au-dessus de 68. 5. Vend sous 32. 6. Sinon HOLD.",compatible_assets:["BTC","ETH","SOL","LINK","AVAX"]},
{id:"quant-pulse",name:"Quant Pulse Bot",tier:"QUANT",plan:"pro",risk:"Quantitatif",allocation:50,frequency:"10 min",summary:"Mean-reversion : exploite les excès de prix plutôt que de poursuivre la tendance.",description:"Une stratégie quantitative qui recherche les retours vers la moyenne après des mouvements extrêmes.",strategy:"Mean-reversion sur moyenne 7 jours, RSI et écart normalisé au prix moyen.",algorithm:"1. Calcule moyenne et écart. 2. Achète si RSI < 32 et prix ≥ 4 % sous la moyenne. 3. Vend si RSI > 68 et prix ≥ 4 % au-dessus. 4. HOLD dans la zone neutre.",compatible_assets:["BTC","ETH","SOL","LINK","AVAX"]},
{id:"macro-rotation",name:"Macro Rotation Bot",tier:"ELITE",plan:"elite",risk:"Institutionnel",allocation:70,frequency:"10 min",summary:"Rotation de régime : augmente le risque en marché porteur et protège en régime défensif.",description:"Une stratégie Elite qui combine breadth, momentum BTC/ETH et force relative pour faire tourner l'allocation.",strategy:"Détection de régime risk-on/risk-off puis sélection des actifs les plus robustes.",algorithm:"1. Mesure breadth et momentum BTC/ETH. 2. Risk-on si breadth ≥ 60 % et BTC ≥ +3 %. 3. Renforce le leader. 4. Risk-off si breadth < 40 % ou BTC ≤ -4 %. 5. Réduit les altcoins.",compatible_assets:["BTC","ETH","SOL","LINK","AVAX"]}
];
function botDefinition(type){return BOT_CATALOG.find(bot=>bot.id===type)}
function botMomentum(points){const v=(points||[]).map(p=>Number(p.price)).filter(Number.isFinite);return v.length>2&&v[0]?((v[v.length-1]-v[0])/v[0])*100:0}
function botRsi(points){const v=(points||[]).map(p=>Number(p.price)).filter(Number.isFinite);if(v.length<3)return 50;const start=Math.max(1,v.length-14),g=[],l=[];for(let i=start;i<v.length;i++){const d=v[i]-v[i-1];if(d>0)g.push(d);else if(d<0)l.push(Math.abs(d))}const ag=g.reduce((a,b)=>a+b,0)/(g.length||1),al=l.reduce((a,b)=>a+b,0)/(l.length||1);return al===0?100:100-(100/(1+ag/al))}
async function botSignal(type,userId,subscription={}){
 await refreshMarket();
 if(!marketUpdatedAt||Date.now()-marketUpdatedAt>120000){
  return {action:"hold",asset:null,message:"Cours de marché indisponibles ou périmés : aucun ordre simulé exécuté.",fraction:0,engine:"risk-guard",provider:"BitGold",model:"quote-freshness",confidence:0,regime:{name:"data-unavailable"}};
 }
 const symbols=Object.keys(marketIds);
 const histories=Object.fromEntries(await Promise.all(symbols.map(async symbol=>[symbol,await fetchHistory(symbol,7)])));
 const wallet=await pool.query("SELECT cash FROM wallets WHERE user_id=$1",[userId]);
 const holdings=await pool.query("SELECT asset,quantity FROM holdings WHERE user_id=$1",[userId]);
 const cash=Number(wallet.rows[0]?.cash||0);
 const positions=holdings.rows.map(row=>{const asset=String(row.asset||"").toUpperCase();const quantity=Number(row.quantity||0);const price=Number(prices[asset]||0);return{asset,quantity,price,value:quantity*price,allocation:0}}).filter(row=>row.quantity>0&&row.price>0);
 const total=cash+positions.reduce((sum,row)=>sum+row.value,0);
 const weighted=positions.map(row=>({...row,allocation:total?row.value/total*100:0}));
 const news=await getBotNewsForAI();
 const decision=await evaluateBot({type,market:marketSnapshot,histories,portfolio:{cash,total,positions:weighted},subscription,news});
 await pool.query(
   "INSERT INTO bot_ai_decisions(user_id,bot_type,engine,provider,model,action,asset,confidence,regime,reason,features) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
   [userId,type,decision.engine,decision.provider,decision.model,decision.action,decision.asset,decision.confidence,decision.regime?.name||"unknown",decision.message,JSON.stringify({selected:decision.selected,portfolioRisk:decision.portfolioRisk,sentiment:decision.sentiment})]
 );
 return decision;
}
async function executeBotDecision(subscription,signal){
 const complianceCheck=()=>compliance.assertTransactionAllowed(subscription.user_id);
 const def=botDefinition(subscription.bot_type),client=await pool.connect();
 try{
  await client.query("BEGIN");
  const w=await client.query("SELECT cash FROM wallets WHERE user_id=$1 FOR UPDATE",[subscription.user_id]);
  // A HOLD decision requires neither a position nor a live quote. Newly listed
  // assets may also have no holdings row until the first simulated purchase.
  const asset=String(signal?.asset||"").toUpperCase();
  const action=signal?.action;
  const cash=Number(w.rows[0]?.cash);
  if(!def||!w.rows.length||!["buy","sell","hold"].includes(action)||!Number.isFinite(cash)||cash<0)throw Error("Bot: invalid signal or wallet state.");
  if(action==="hold"){
    await client.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[subscription.user_id,subscription.bot_type,"hold",asset||null,signal.message||"Aucun ordre simulé."]);
    await client.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[subscription.id]);
    await client.query("COMMIT");return;
  }
  const quote=marketSnapshot.find(row=>row.symbol===asset);
  const price=Number(quote?.price);
  const fraction=Number(signal.fraction);
  if(!marketUpdatedAt||Date.now()-marketUpdatedAt>120000||!quote||!Number.isFinite(price)||price<=0){
    await client.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[subscription.user_id,subscription.bot_type,"hold",asset||null,"Ordre simulé ignoré : cotation absente ou périmée."]);
    await client.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[subscription.id]);
    await client.query("COMMIT");return;
  }
  if(!asset||!Object.hasOwn(marketIds,asset)||!Number.isFinite(price)||price<=0||!Number.isFinite(fraction)||fraction<=0||fraction>1)throw Error("Bot: invalid trade signal or market quote.");
  await client.query("INSERT INTO holdings(user_id,asset,quantity) VALUES($1,$2,0) ON CONFLICT(user_id,asset) DO NOTHING",[subscription.user_id,asset]);
  const h=await client.query("SELECT quantity FROM holdings WHERE user_id=$1 AND asset=$2 FOR UPDATE",[subscription.user_id,asset]);
  const qty=Number(h.rows[0]?.quantity);
  if(!Number.isFinite(qty)||qty<0)throw Error("Bot: invalid position state.");
  let amount=0,quantity=0;
  if(signal.action==="buy"){const maxTrade=Number(subscription.max_trade_eur||250);const maxPosition=Number(subscription.max_position_eur||1000);const currentPosition=qty*price;const remaining=Math.max(0,maxPosition-currentPosition);const reserve=Math.max(0,Math.min(90,Number(subscription.min_cash_pct||20)))/100;const spendable=Math.max(0,cash*(1-reserve));amount=Math.min(cash*signal.fraction,cash*def.allocation/100,maxTrade,remaining,spendable);quantity=price?amount/price:0}
  if(signal.action==="sell"){amount=Math.min(qty*price,(qty*price)*signal.fraction);quantity=price?amount/price:0}
  if(signal.action!=="hold"&&amount>0&&quantity>0){await complianceCheck(amount);await agentPayments.authorize({userId:subscription.user_id,botType:subscription.bot_type,asset:signal.asset,amountEur:amount});}
  if(signal.action==="hold"||amount<=0||quantity<=0){await client.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[subscription.user_id,subscription.bot_type,"hold",signal.asset,signal.message]);await client.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[subscription.id]);await client.query("COMMIT");return}
  if(!Number.isFinite(amount)||!Number.isFinite(quantity)||amount<=0||quantity<=0||(signal.action==="buy"&&amount>Number(subscription.max_trade_eur||250)+1e-8)||(signal.action==="buy"&&amount>cash+1e-8)||(signal.action==="sell"&&quantity>qty+1e-10))throw Error("Bot: trade risk limit exceeded.");
  await client.query("UPDATE wallets SET cash=cash+$1 WHERE user_id=$2",[signal.action==="buy"?-amount:amount,subscription.user_id]);
  await client.query("UPDATE holdings SET quantity=quantity+$1 WHERE user_id=$2 AND asset=$3",[signal.action==="buy"?quantity:-quantity,subscription.user_id,signal.asset]);
  await client.query("INSERT INTO trades(user_id,side,asset,amount_eur,price_eur,quantity) VALUES($1,$2,$3,$4,$5,$6)",[subscription.user_id,signal.action,signal.asset,amount,price,quantity]);
  await client.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[subscription.user_id,subscription.bot_type,signal.action,signal.asset,signal.message+" Montant simulé : "+amount.toFixed(2)+" €."]);
  await client.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[subscription.id]);await client.query("COMMIT");
 }catch(e){await client.query("ROLLBACK");console.error("[BOT] execution error",e.message)}finally{client.release()}
}
async function runBots(){
 try{const r=await pool.query("SELECT * FROM bot_subscriptions WHERE active=TRUE AND (last_run IS NULL OR last_run<CURRENT_TIMESTAMP-INTERVAL '15 minutes') ORDER BY id");for(const sub of r.rows){try{await executeBotDecision(sub,await botSignal(sub.bot_type,sub.user_id,sub))}catch(e){console.error("[BOT] signal error",sub.bot_type,e.message);await pool.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[sub.id])}}}catch(e){console.error("[BOT] scheduler error",e.message)}
}
async function getUserPlan(userId){const r=await pool.query("SELECT plan,pro_since FROM users WHERE id=$1",[userId]);const row=r.rows[0]||{plan:"free",pro_since:null};const plan=row.plan==="elite"?"elite":row.plan==="pro"?"pro":"free";return{plan,pro_since:row.pro_since};}
const TRANSFER_FEE_POLICY={
  free:{label:"Free",cashin:{rate:0.015,fixed:0.50},cashout:{rate:0.0199,fixed:0.50},dailyLimit:2000},
  pro:{label:"Pro",cashin:{rate:0.009,fixed:0.35},cashout:{rate:0.0125,fixed:0.35},dailyLimit:10000},
  elite:{label:"Elite",cashin:{rate:0.0045,fixed:0.20},cashout:{rate:0.0075,fixed:0.20},dailyLimit:50000}
};
function getTransferFeePolicy(plan){
  const key=plan==="elite"?"elite":plan==="pro"?"pro":"free";
  const policy=TRANSFER_FEE_POLICY[key];
  return {
    plan:key,label:policy.label,dailyLimit:policy.dailyLimit,
    cashin:{rate:policy.cashin.rate,fixed:policy.cashin.fixed},
    cashout:{rate:policy.cashout.rate,fixed:policy.cashout.fixed}
  };
}
function calculateTransferQuote(plan,type,amount){
  const policy=getTransferFeePolicy(plan),safeType=type==="cashout"?"cashout":"cashin",safeAmount=Number(amount);
  if(!Number.isFinite(safeAmount)||safeAmount<=0)return null;
  const rule=policy[safeType],fee=safeAmount*rule.rate+rule.fixed;
  return {
    type:safeType,amount:safeAmount,fee:Math.round(fee*100)/100,
    net:safeType==="cashin"?Math.round((safeAmount-fee)*100)/100:Math.round((safeAmount-fee)*100)/100,
    rate:rule.rate,fixed:rule.fixed,dailyLimit:policy.dailyLimit,plan:policy.plan
  };
}
function botEntitlement(plan,botType){const def=botDefinition(botType);return !!def&&(def.plan==="free"||plan==="pro"&&(def.plan==="pro")||plan==="elite");}
app.get("/api/stripe/status",(req,res)=>res.json({configured:stripeConfigured,plans:{pro:Boolean(process.env.STRIPE_PRO_PRICE_ID),elite:Boolean(process.env.STRIPE_ELITE_PRICE_ID)}}));
app.get("/api/transfers/fees",auth,async(req,res)=>{
  try{
    const plan=(await getUserPlan(req.user.sub)).plan;
    res.json({ok:true,policy:getTransferFeePolicy(plan),disclaimer:"Frais indicatifs pour le mode démo. Les frais réels dépendront du prestataire de paiement et des conditions applicables."});
  }catch(e){res.status(500).json({error:"Impossible de charger la politique de frais."})}
});
app.post("/api/transfers/quote",auth,async(req,res)=>{
  try{
    const plan=(await getUserPlan(req.user.sub)).plan;
    const type=String(req.body.type||"cashin").toLowerCase();
    if(!["cashin","cashout"].includes(type))return res.status(400).json({error:"Type de transfert invalide."});
    const amount=Number(req.body.amount);
    const quote=calculateTransferQuote(plan,type,amount);
    if(!quote)return res.status(400).json({error:"Montant invalide."});
    if(amount>quote.dailyLimit)return res.status(400).json({error:"Le montant dépasse la limite quotidienne de votre formule."});
    res.json({ok:true,quote,disclaimer:"Simulation uniquement : aucun mouvement d'argent réel n'est exécuté."});
  }catch(e){res.status(500).json({error:"Impossible de calculer les frais."})}
});
app.post("/api/stripe/checkout",auth,async(req,res)=>{
  if(!stripeConfigured)return res.status(503).json({error:"Stripe n'est pas encore configuré."});
  const plan=String(req.body.plan||"").toLowerCase();
  if(!["pro","elite"].includes(plan))return res.status(400).json({error:"Plan Stripe invalide."});
  const priceId=plan==="pro"?String(process.env.STRIPE_PRO_PRICE_ID||"").trim():String(process.env.STRIPE_ELITE_PRICE_ID||"").trim();
  if(!priceId)return res.status(503).json({error:"Le Price ID Stripe de ce plan n'est pas configuré."});
  const user=(await pool.query("SELECT id,email,stripe_customer_id FROM users WHERE id=$1",[req.user.sub])).rows[0];
  if(!user)return res.status(404).json({error:"Compte introuvable."});
  try{
    const customer=user.stripe_customer_id||((await stripe.customers.create({email:user.email,metadata:{userId:String(user.id)}})).id);
    if(!user.stripe_customer_id)await pool.query("UPDATE users SET stripe_customer_id=$1 WHERE id=$2",[customer,user.id]);
    const session=await stripe.checkout.sessions.create({mode:"subscription",customer,client_reference_id:String(user.id),metadata:{userId:String(user.id),plan},subscription_data:{metadata:{userId:String(user.id),plan}},line_items:[{price:priceId,quantity:1}],success_url:String(process.env.STRIPE_SUCCESS_URL||"").trim()||"http://localhost:3000/?stripe=success",cancel_url:String(process.env.STRIPE_CANCEL_URL||"").trim()||"http://localhost:3000/?stripe=cancel",allow_promotion_codes:true});
    res.json({ok:true,url:session.url,sessionId:session.id});
  }catch(e){console.error("[STRIPE] checkout error",e.message);res.status(500).json({error:"Impossible de créer la session Stripe."})}
});
app.post("/api/stripe/portal",auth,async(req,res)=>{
  if(!stripeConfigured)return res.status(503).json({error:"Stripe n'est pas encore configuré."});
  const user=(await pool.query("SELECT stripe_customer_id FROM users WHERE id=$1",[req.user.sub])).rows[0];
  if(!user?.stripe_customer_id)return res.status(400).json({error:"Aucun abonnement Stripe associé à ce compte."});
  try{
    const session=await stripe.billingPortal.sessions.create({customer:user.stripe_customer_id,return_url:String(process.env.STRIPE_PORTAL_RETURN_URL||"").trim()||"http://localhost:3000/#dashboard"});
    res.json({ok:true,url:session.url});
  }catch(e){console.error("[STRIPE] portal error",e.message);res.status(500).json({error:"Impossible d'ouvrir le portail Stripe."})}
});

app.get("/api/plan",auth,async(req,res)=>{try{res.json(await getUserPlan(req.user.sub))}catch(e){res.status(500).json({error:"Impossible de charger le plan."})}});
app.post("/api/plan/demo",auth,async(req,res)=>{try{const plan=String(req.body.plan||"free").toLowerCase();if(!["free","pro","elite"].includes(plan))return res.status(400).json({error:"Plan invalide."});await pool.query("UPDATE users SET plan=$1,pro_since=CASE WHEN $1='pro' THEN COALESCE(pro_since,CURRENT_TIMESTAMP) ELSE NULL END WHERE id=$2",[plan,req.user.sub]);res.json(await getUserPlan(req.user.sub))}catch(e){res.status(500).json({error:"Impossible de modifier le plan de démonstration."})}});
app.get("/api/plans/demo",(_req,res)=>res.json({mode:"simulation",requiresPayment:false,plans:[
  {id:"free",label:"Free",maxActiveBots:1,botTypes:BOT_CATALOG.filter(bot=>bot.plan==="free").map(bot=>bot.id)},
  {id:"pro",label:"Pro",maxActiveBots:3,botTypes:BOT_CATALOG.filter(bot=>bot.plan==="free"||bot.plan==="pro").map(bot=>bot.id)},
  {id:"elite",label:"Elite",maxActiveBots:5,botTypes:BOT_CATALOG.map(bot=>bot.id)}
]}));
app.get("/api/bots/catalog",(req,res)=>res.json({catalog:BOT_CATALOG,ai:getBotAIConfig()}));
app.get("/api/bots/ai/status",auth,async(req,res)=>{try{res.json({ok:true,...getBotAIConfig(),sentiment:{enabled:true,source:"BitGold News",windowHours:36}})}catch(e){res.status(500).json({error:"Impossible de charger le moteur IA."})}});
app.get("/api/bots/ai/sentiment",auth,async(req,res)=>{
  try{
    const news=await getBotNewsForAI();
    const decision=await evaluateBot({type:"adaptive-ai",market:marketSnapshot,histories:{},portfolio:{cash:10000,total:10000,positions:[]},subscription:{min_cash_pct:20},news});
    res.json({ok:true,updatedAt:newsCache.updatedAt||Date.now(),source:newsCache.source,engine:decision.engine,sentiment:decision.sentiment});
  }catch(e){console.error("[BOT-AI] sentiment endpoint error",e.message);res.status(502).json({error:"Sentiment IA temporairement indisponible."})}
});
app.get("/api/bots/:botType/backtest",auth,async(req,res)=>{
  try{
    const botType=String(req.params.botType||"").toLowerCase();
    if(!botDefinition(botType))return res.status(404).json({error:"Bot inconnu."});
    const days=Math.min(Math.max(Number(req.query.days||30),14),180);
    const symbols=Object.keys(marketIds).filter(symbol=>symbol!=="USDC");
    const histories=Object.fromEntries(await Promise.all(symbols.map(async symbol=>[symbol,await fetchHistory(symbol,days)])));
    const backtest=simulateBacktest({botType,histories,initialCash:10000});
    res.json({ok:true,source:"CoinGecko",days,backtest});
  }catch(e){console.error("[BOT-AI] backtest error",e.message);res.status(502).json({error:"Backtest IA temporairement indisponible."})}
});
app.get("/api/bots/comparator",auth,async(req,res)=>{
  try{
    const days=Math.min(Math.max(Number(req.query.days||90),14),180);
    const requested=String(req.query.bots||"adaptive-ai,quant-pulse,shield").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);
    const botTypes=[...new Set(requested)].filter(botType=>botDefinition(botType)).slice(0,6);
    if(botTypes.length<2)return res.status(400).json({error:"Sélectionnez au moins deux bots valides."});
    const symbols=Object.keys(marketIds).filter(symbol=>symbol!=="USDC");
    const histories=Object.fromEntries(await Promise.all(symbols.map(async symbol=>[symbol,await fetchHistory(symbol,days)])));
    const results=compareBacktests({botTypes,histories,initialCash:10000});
    const robustness=results.map(result=>({botType:result.botType,robustness:analyzeBacktestRobustness({curve:result.curve,paths:250,seed:42})}));
    const byBot=new Map(robustness.map(item=>[item.botType,item.robustness]));
    res.json({ok:true,mode:"simulation",source:"CoinGecko",days,bots:results.map(({curve,...result})=>({...result,robustness:byBot.get(result.botType)||null}))});
  }catch(e){console.error("[BOT-AI] comparator error",e.message);res.status(502).json({error:"Comparateur IA temporairement indisponible."})}
});
app.get("/api/bots/:botType/decision",auth,async(req,res)=>{try{const botType=String(req.params.botType||"").toLowerCase();if(!botDefinition(botType))return res.status(404).json({error:"Bot inconnu."});const sub=(await pool.query("SELECT min_cash_pct FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType])).rows[0]||{min_cash_pct:20};res.json(await botSignal(botType,req.user.sub,sub))}catch(e){console.error("[BOT-AI] decision error",e.message);res.status(500).json({error:"Impossible de calculer la décision IA."})}});
app.get("/api/bots/:botType",auth,async(req,res)=>{const botType=String(req.params.botType||"").toLowerCase(),def=botDefinition(botType);if(!def)return res.status(404).json({error:"Bot inconnu."});const row=(await pool.query("SELECT bot_type,portfolio_name,active,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct,created_at,last_run FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType])).rows[0]||null;res.json({bot:def,subscription:row})});
app.get("/api/bots",auth,async(req,res)=>{try{const [subs,activity,plan]=await Promise.all([pool.query("SELECT bot_type,portfolio_name,active,created_at,last_run,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct FROM bot_subscriptions WHERE user_id=$1 ORDER BY id",[req.user.sub]),pool.query("SELECT bot_type,action,asset,message,created_at FROM bot_activity WHERE user_id=$1 ORDER BY id DESC LIMIT 30",[req.user.sub]),getUserPlan(req.user.sub)]);res.json({catalog:BOT_CATALOG,items:subs.rows,activity:activity.rows,plan})}catch(e){res.status(500).json({error:"Impossible de charger les bots."})}});
app.get("/api/activity",auth,async(req,res)=>{
  try{
    const [botLogs,trades]=await Promise.all([
      pool.query("SELECT bot_type,action,asset,message,created_at FROM bot_activity WHERE user_id=$1 ORDER BY id DESC LIMIT 200",[req.user.sub]),
      pool.query("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id DESC LIMIT 200",[req.user.sub])
    ]);
    res.json({botLogs:botLogs.rows,trades:trades.rows});
  }catch(e){console.error("[ACTIVITY] error",e.message);res.status(500).json({error:"Impossible de charger le journal d'activité."})}
});
app.post("/api/bots/subscriptions",auth,async(req,res)=>{const botType=String(req.body.botType||"").toLowerCase(),def=botDefinition(botType);if(!def)return res.status(400).json({error:"Bot inconnu."});const plan=(await getUserPlan(req.user.sub)).plan;if(!botEntitlement(plan,botType))return res.status(402).json({error:"Ce bot est réservé au plan Pro.",code:"PRO_REQUIRED"});const activeCount=Number((await pool.query("SELECT COUNT(*) FROM bot_subscriptions WHERE user_id=$1 AND active=TRUE",[req.user.sub])).rows[0]?.count||0),existing=await pool.query("SELECT id FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType]);if(plan==="free"&&activeCount>=1&&!existing.rows.length)return res.status(403).json({error:"Le plan Free autorise un seul bot actif.",code:"FREE_BOT_LIMIT"});if(plan==="pro"&&activeCount>=3&&!existing.rows.length)return res.status(403).json({error:"Le plan Pro est limité à 3 bots actifs.",code:"PRO_BOT_LIMIT"});if(plan==="elite"&&activeCount>=5&&!existing.rows.length)return res.status(403).json({error:"Le mode Elite est limité à 5 bots actifs.",code:"ELITE_BOT_LIMIT"});const defaults=plan==="elite"?{maxTrade:2500,maxPosition:15000,stopLoss:3,minCash:10}:plan==="pro"?{maxTrade:1000,maxPosition:5000,stopLoss:5,minCash:15}:{maxTrade:250,maxPosition:1000,stopLoss:8,minCash:30};const maxTrade=Number(req.body.maxTradeEur??defaults.maxTrade),maxPosition=Number(req.body.maxPositionEur??defaults.maxPosition),stopLoss=Number(req.body.stopLossPct??defaults.stopLoss),minCash=Number(req.body.minCashPct??defaults.minCash);if(![maxTrade,maxPosition,stopLoss,minCash].every(Number.isFinite)||maxTrade<10||maxPosition<100||stopLoss<1||stopLoss>50||minCash<0||minCash>90)return res.status(400).json({error:"Paramètres de risque invalides."});try{if(plan==="free")await pool.query("UPDATE bot_subscriptions SET active=FALSE WHERE user_id=$1 AND bot_type<>$2",[req.user.sub,botType]);await pool.query("INSERT INTO bot_subscriptions(user_id,bot_type,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id,bot_type) DO UPDATE SET active=TRUE,max_trade_eur=EXCLUDED.max_trade_eur,max_position_eur=EXCLUDED.max_position_eur,stop_loss_pct=EXCLUDED.stop_loss_pct,min_cash_pct=EXCLUDED.min_cash_pct",[req.user.sub,botType,maxTrade,maxPosition,stopLoss,minCash]);const sub=(await pool.query("SELECT * FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType])).rows[0];await pool.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[req.user.sub,botType,"subscribe",null,"Souscription activée ou renouvelée pour "+def.name+"."]);await executeBotDecision(sub,await botSignal(botType,req.user.sub,sub));res.status(201).json({ok:true,bot:def,subscription:sub})}catch(e){console.error("[BOT] subscribe error",e.message);res.status(500).json({error:"Impossible d’activer ce bot."})}});
app.delete("/api/bots/subscriptions/:botType",auth,async(req,res)=>{const botType=String(req.params.botType||"").toLowerCase();if(!botDefinition(botType))return res.status(404).json({error:"Bot inconnu."});await pool.query("UPDATE bot_subscriptions SET active=FALSE WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType]);await pool.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[req.user.sub,botType,"unsubscribe",null,"Désabonnement du "+botDefinition(botType).name+"."]);res.json({ok:true})});
setInterval(runBots,60000);runBots().catch(()=>{});
app.get("/api/portfolio",auth,async(req,res)=>{
  try {
    const market=await refreshMarket();
    const [w,h,t]=await Promise.all([
      pool.query("SELECT cash FROM wallets WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT asset,quantity FROM holdings WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id DESC LIMIT 50",[req.user.sub])
    ]);
    const cash=Number(w.rows[0]?.cash??0);
    const holdings=h.rows.map(row=>{const asset=String(row.asset||"").toUpperCase();const quantity=Number(row.quantity||0);const price=Number(market.find(item=>item.symbol===asset)?.price||prices[asset]||0);return {asset,quantity,price,value:quantity*price};});
    const invested=holdings.reduce((sum,row)=>sum+Math.max(0,row.value),0);
    const total=cash+invested;
    const positions=holdings.filter(row=>row.quantity>0&&row.price>0).map(row=>({...row,allocation:total?row.value/total*100:0}));
    // Reconcile user-visible balances against the complete simulated trade history.
    // This is an operational warning, not a mutation of balances.
    const historical=await pool.query("SELECT side,asset,amount_eur,quantity FROM trades WHERE user_id=$1 ORDER BY id ASC",[req.user.sub]);
    const expected=new Map();let tradeCashDelta=0;
    for(const row of historical.rows){
      const direction=row.side==="buy"?1:-1;
      tradeCashDelta-=direction*Number(row.amount_eur);
      expected.set(row.asset,(expected.get(row.asset)||0)+direction*Number(row.quantity));
    }
    const assetDiscrepancies=[];
    const actual=new Map(holdings.map(row=>[row.asset,row.quantity]));
    for(const asset of new Set([...expected.keys(),...actual.keys()])){
      const expectedQty=expected.get(asset)||0,actualQty=actual.get(asset)||0;
      if(Math.abs(expectedQty-actualQty)>Math.max(1e-9,Math.abs(expectedQty)*1e-8))assetDiscrepancies.push({asset,expected:expectedQty,actual:actualQty});
    }
    // Cash can include legitimate deposits/withdrawals, so do not assert that initial capital plus trade deltas is the cash balance.
    const integrity=Number.isFinite(cash)&&cash>=-1e-8&&Math.abs(total-(cash+invested))<0.01&&holdings.every(row=>Number.isFinite(row.quantity)&&row.quantity>=-1e-12);
    const reconciliation={ok:assetDiscrepancies.length===0,assetDiscrepancies,tradeCount:historical.rows.length,tradeCashDelta};
    res.json({updatedAt:Date.now(),source:"wallets + holdings + CoinGecko",cash,invested,total,initialCapital:10000,holdings,positions,trades:t.rows,integrity:{ok:integrity,cashPlusInvested:cash+invested,difference:total-(cash+invested),reconciliation}});
  } catch(e) { console.error("[PORTFOLIO] error", e.message); res.status(500).json({error:"Erreur serveur."}); }
});

app.get("/api/dashboard/analytics",auth,async(req,res)=>{
  try{
    const [trades,activity,subscriptions]=await Promise.all([
      pool.query("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id ASC",[req.user.sub]),
      pool.query("SELECT bot_type,action,asset,message,created_at FROM bot_activity WHERE user_id=$1 ORDER BY id ASC",[req.user.sub]),
      pool.query("SELECT bot_type,active,last_run FROM bot_subscriptions WHERE user_id=$1 ORDER BY id",[req.user.sub])
    ]);
    const initialCapital=10000;
    const rows=trades.rows;
    const byBot=new Map();
    for(const sub of subscriptions.rows){
      const key=sub.bot_type;
      const botLogs=activity.rows.filter(row=>row.bot_type===key);
      byBot.set(key,{bot_type:key,active:sub.active!==false,last_run:sub.last_run,signals:botLogs.length,buys:botLogs.filter(row=>row.action==="buy").length,sells:botLogs.filter(row=>row.action==="sell").length,holds:botLogs.filter(row=>row.action==="hold").length});
    }
    const timeline=[];
    const cashByDay=new Map();
    let cash=initialCapital;
    const holdings={};
    for(const trade of rows){
      const asset=String(trade.asset||"").toUpperCase();
      const amount=Number(trade.amount_eur||0);
      const qty=Number(trade.quantity||0);
      if(trade.side==="buy"){cash-=amount;holdings[asset]=(holdings[asset]||0)+qty}
      else{cash+=amount;holdings[asset]=(holdings[asset]||0)-qty}
      const day=new Date(trade.created_at).toISOString().slice(0,10);
      cashByDay.set(day,{cash,holdings:{...holdings}});
    }
    for(const [date,snapshot] of [...cashByDay.entries()].slice(-30)){
      let invested=0;
      for(const [asset,qty] of Object.entries(snapshot.holdings)) invested+=Math.max(0,Number(qty))*Number(prices[asset]||0);
      timeline.push({date,total:Number(snapshot.cash)+invested,invested,cash:Number(snapshot.cash)});
    }
    if(!timeline.length) timeline.push({date:new Date().toISOString().slice(0,10),total:initialCapital,invested:0,cash:initialCapital});
    const last=timeline[timeline.length-1].total;
    res.json({updatedAt:Date.now(),performance:{initialCapital,reconstructed:true,returnPct:initialCapital?((last-initialCapital)/initialCapital)*100:0,points:timeline},bots:[...byBot.values()]});
  }catch(e){
    console.error("[DASHBOARD ANALYTICS] error",e.message);
    res.status(500).json({error:"Impossible de charger les analytics."});
  }
});

app.get("/api/dashboard",auth,async(req,res)=>{
  try{
    const market=await refreshMarket();
    const [wallet,holdings,tradeRows,botRows,botActivity,latestDecisionRows,userPlan]=await Promise.all([
      pool.query("SELECT cash FROM wallets WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT asset,quantity FROM holdings WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id ASC",[req.user.sub]),
      pool.query("SELECT bot_type,active,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct,last_run FROM bot_subscriptions WHERE user_id=$1 ORDER BY id",[req.user.sub]),
      pool.query("SELECT bot_type,action,asset,message,created_at FROM bot_activity WHERE user_id=$1 ORDER BY id DESC LIMIT 8",[req.user.sub]),
      pool.query("SELECT id,bot_type,action,asset,confidence,regime,reason,features,created_at FROM bot_ai_decisions WHERE user_id=$1 ORDER BY id DESC LIMIT 1",[req.user.sub]),
      getUserPlan(req.user.sub)
    ]);
    const cash=Number(wallet.rows[0]?.cash||0);
    const positions=holdings.rows.map(row=>{
      const symbol=String(row.asset||"").toUpperCase();
      const quantity=Number(row.quantity||0);
      const price=Number(prices[symbol]||0);
      return {asset:symbol,quantity,price,value:quantity*price};
    }).filter(row=>row.quantity>0&&row.price>0);
    const invested=positions.reduce((sum,row)=>sum+row.value,0);
    const total=cash+invested;
    const initialCapital=10000;
    const returnEur=total-initialCapital;
    const returnPct=initialCapital?returnEur/initialCapital*100:0;
    const cashPct=total?cash/total*100:100;
    const allocations=positions.map(row=>({...row,allocation:total?row.value/total*100:0})).sort((a,b)=>b.allocation-a.allocation);
    const concentration=allocations[0]?.allocation||0;
    const activeBots=botRows.rows.filter(row=>row.active!==false).length;
    const riskScore=Math.min(100,Math.round(18+concentration*.58+(cashPct<15?18:cashPct<25?10:0)+activeBots*4));
    const riskLabel=riskScore>=70?"Élevé":riskScore>=45?"Modéré":"Maîtrisé";
    const momentum=market.map(row=>({symbol:row.symbol,change24h:Number(row.change24h||0)})).sort((a,b)=>b.change24h-a.change24h);
    const leader=momentum[0]||{symbol:"BTC",change24h:0};
    const weakest=momentum[momentum.length-1]||{symbol:"BTC",change24h:0};
    const btcChange=Number(market.find(row=>row.symbol==="BTC")?.change24h||0);
    const ethChange=Number(market.find(row=>row.symbol==="ETH")?.change24h||0);
    const regime=btcChange>=2&&ethChange>=0?"Risk-On":btcChange<=-3?"Risk-Off":"Neutre";
    const autopilot=regime==="Risk-On"
      ? {status:"Opportuniste",bot:"adaptive-ai",title:"Marché favorable à une approche dynamique",reason:"Momentum positif : "+leader.symbol+" mène le marché avec "+leader.change24h.toFixed(2)+" %.",allocation:Math.min(45,Math.max(20,100-cashPct))}
      : regime==="Risk-Off"
      ? {status:"Défensif",bot:"shield",title:"Réduire l’exposition et préserver le cash",reason:"BTC affiche "+btcChange.toFixed(2)+" % sur 24 h.",allocation:Math.max(10,Math.min(35,cashPct))}
      : {status:"Équilibré",bot:"quant-pulse",title:"Attendre des écarts de prix plus nets",reason:"Régime neutre : "+leader.symbol+" est leader et "+weakest.symbol+" ferme la marche.",allocation:Math.min(40,Math.max(15,100-cashPct))};
    res.json({
      updatedAt:Date.now(),
      portfolio:{cash,invested,total,initialCapital,returnEur,returnPct,cashPct,positions:allocations},
      performance:{label:"Depuis le début",returnEur,returnPct,trades:tradeRows.rows.length,buys:tradeRows.rows.filter(row=>row.side==="buy").length,sells:tradeRows.rows.filter(row=>row.side==="sell").length},
      risk:{score:riskScore,label:riskLabel,concentration,cashPct,activeBots},
      bots:{active:activeBots,total:botRows.rows.length,items:botRows.rows},
      subscription:{plan:userPlan.plan,label:userPlan.plan==="elite"?"BitGold Elite":userPlan.plan==="pro"?"BitGold Pro":"BitGold Free",botLimit:userPlan.plan==="elite"?5:userPlan.plan==="pro"?3:1},
      transferFees:getTransferFeePolicy(userPlan.plan),
      market:{regime,leader,weakest},
      autopilot,
      activity:botActivity.rows,
      latestDecision:latestDecisionRows[0]||null,
      integrity:{ok:Math.abs(total-(cash+invested))<0.01&&positions.every(row=>row.quantity>=-1e-12),cashPlusInvested:cash+invested,difference:total-(cash+invested),source:"wallets + holdings + live market prices"}
    });
  }catch(e){
    console.error("[DASHBOARD] error",e.message);
    res.status(500).json({error:"Impossible de charger le dashboard."});
  }
});

app.post("/api/trades",auth,compliance.requireTransactionClearance,async(req,res)=>{
  const side=req.body?.side, asset=req.body?.asset, amount=req.body?.amount;
  const key=req.get("Idempotency-Key");
  if(key!==undefined&&(!/^[A-Za-z0-9_-]{8,128}$/.test(key))) return res.status(400).json({error:"Clé d'idempotence invalide."});
  if(!["buy","sell"].includes(side)||typeof asset!=="string"||typeof amount!=="number"||!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:"Ordre invalide."});
  const requestHash=crypto.createHash("sha256").update(JSON.stringify([side,asset,amount])).digest("hex");
  const client=await pool.connect();
  let committed=false;
  try {
    await client.query("BEGIN");
    // The wallet lock serializes all manual orders for one user, including repeated keys.
    const w=await client.query("SELECT cash FROM wallets WHERE user_id=$1 FOR UPDATE",[req.user.sub]);
    if(!w.rows.length) throw Error("Portefeuille introuvable.");
    if(key){
      const prior=await client.query("SELECT request_hash,trade_id FROM trade_idempotency WHERE user_id=$1 AND request_key=$2",[req.user.sub,key]);
      if(prior.rows.length){
        await client.query("COMMIT");committed=true;
        if(prior.rows[0].request_hash!==requestHash) return res.status(409).json({error:"Clé déjà utilisée pour un autre ordre."});
        return res.status(200).json({ok:true,replayed:true,tradeId:prior.rows[0].trade_id});
      }
    }
    await refreshMarket();
    const price=Number(prices[asset]);
    if(!Number.isFinite(price)||price<=0) throw Error("Actif indisponible.");
    const qty=amount/price;
    if(!Number.isFinite(qty)||qty<=0) throw Error("Ordre invalide.");
    const h=await client.query("SELECT quantity FROM holdings WHERE user_id=$1 AND asset=$2 FOR UPDATE",[req.user.sub,asset]);
    const cash=Number(w.rows[0].cash),currentQty=Number(h.rows[0]?.quantity??0);
    if(side==="buy"&&amount>cash+1e-9) throw Error("Solde insuffisant.");
    if(side==="sell"&&qty>currentQty+1e-12) throw Error("Quantité insuffisante.");
    const updatedWallet=await client.query("UPDATE wallets SET cash=cash+$1 WHERE user_id=$2 RETURNING cash",[side==="buy"?-amount:amount,req.user.sub]);
    const updatedHolding=await client.query("UPDATE holdings SET quantity=quantity+$1 WHERE user_id=$2 AND asset=$3 RETURNING quantity",[side==="buy"?qty:-qty,req.user.sub,asset]);
    if(!updatedHolding.rows.length||Number(updatedWallet.rows[0].cash)<-1e-7||Number(updatedHolding.rows[0].quantity)<-1e-9) throw Error("Incohérence de solde.");
    const trade=await client.query("INSERT INTO trades(user_id,side,asset,amount_eur,price_eur,quantity) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",[req.user.sub,side,asset,amount,price,qty]);
    if(key) await client.query("INSERT INTO trade_idempotency(user_id,request_key,request_hash,trade_id) VALUES($1,$2,$3,$4)",[req.user.sub,key,requestHash,trade.rows[0].id]);
    await client.query("COMMIT");committed=true;
    res.status(201).json({ok:true,tradeId:trade.rows[0].id});
  } catch(e) {
    if(!committed) await client.query("ROLLBACK").catch(()=>{});
    console.error("[TRADES] rejected",e.message);
    res.status(400).json({error:e.message||"Erreur serveur."});
  } finally {client.release();}
});

const port=Number(process.env.PORT||3000);
app.listen(port,()=>console.log(`BitGold API ready on port ${port}`));
