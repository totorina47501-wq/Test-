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
const secret = process.env.JWT_SECRET || "dev-only-change-me";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined
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
CREATE TABLE IF NOT EXISTS wallets(user_id INTEGER PRIMARY KEY REFERENCES users(id),cash DOUBLE PRECISION NOT NULL DEFAULT 10000);
CREATE TABLE IF NOT EXISTS holdings(user_id INTEGER NOT NULL REFERENCES users(id),asset TEXT NOT NULL,quantity DOUBLE PRECISION NOT NULL DEFAULT 0,PRIMARY KEY(user_id,asset));
CREATE TABLE IF NOT EXISTS trades(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),side TEXT NOT NULL,asset TEXT NOT NULL,amount_eur DOUBLE PRECISION NOT NULL,price_eur DOUBLE PRECISION NOT NULL,quantity DOUBLE PRECISION NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bot_subscriptions(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,bot_type TEXT NOT NULL,portfolio_name TEXT NOT NULL DEFAULT 'Portefeuille principal',active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,last_run TIMESTAMPTZ,UNIQUE(user_id,bot_type));
CREATE TABLE IF NOT EXISTS bot_activity(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,bot_type TEXT NOT NULL,action TEXT NOT NULL DEFAULT 'hold',asset TEXT,message TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS max_trade_eur DOUBLE PRECISION NOT NULL DEFAULT 250;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS max_position_eur DOUBLE PRECISION NOT NULL DEFAULT 1000;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS stop_loss_pct DOUBLE PRECISION NOT NULL DEFAULT 8;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS min_cash_pct DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_since TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE TABLE IF NOT EXISTS kyc_cases(id SERIAL PRIMARY KEY,user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'required',document_type TEXT,aml_status TEXT NOT NULL DEFAULT 'not_checked',submitted_at TIMESTAMPTZ,verified_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS transfer_ledger(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,type TEXT NOT NULL,amount_eur DOUBLE PRECISION NOT NULL,fee_eur DOUBLE PRECISION NOT NULL,net_eur DOUBLE PRECISION NOT NULL,status TEXT NOT NULL DEFAULT 'simulated',created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);

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
app.use(rateLimit({ windowMs: 60000, max: 120, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "../public"), { setHeaders: (res, filePath) => { if(filePath.endsWith(".html") || filePath.endsWith(".js") || filePath.endsWith(".css")) res.setHeader("Cache-Control", "no-store, max-age=0"); } }));
app.get(/^\/bot\/(shield|silver|gold|adaptive-ai|quant-pulse|macro-rotation)\/?$/, (req,res)=>res.sendFile(path.join(__dirname,"../public/index.html")));

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
  if(!force && Date.now()-marketUpdatedAt < 30000) return marketSnapshot;
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
  } catch(e) {
    console.error("[MARKET] refresh error", e.message);
    if(!marketSnapshot.length) {
      marketSnapshot = Object.entries(prices).map(([symbol,price]) => ({symbol,price,change24h:0,marketCap:null,volume24h:null,marketCapRank:null}));
    }
  }
  return marketSnapshot;
}
refreshMarket(true).catch(()=>{});
function token(user){ return jwt.sign({sub:user.id,email:user.email},secret,{expiresIn:"7d"}); }
function auth(req,res,next){ try { req.user=jwt.verify((req.headers.authorization||"").replace("Bearer ",""),secret); next(); } catch { res.status(401).json({error:"Non authentifié"}); } }

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

app.post("/api/auth/signup", async (req,res) => {
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

app.post("/api/auth/login", async (req,res) => {
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
    res.json({token:token(u),email:u.email,profile:profileFromRow(u)});
  } catch(e) {
    console.error("[AUTH] login error", e.message);
    res.status(500).json({error:"Erreur serveur."});
  }
});

app.get("/api/auth/google/config",(req,res)=>res.json({enabled:googleConfigured,clientId:googleConfigured?googleClientId:null}));

app.post("/api/auth/google", async (req,res) => {
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
app.get("/api/market",async(req,res)=>{ const market=await refreshMarket(); res.json({updatedAt:marketUpdatedAt,source:"CoinGecko",markets:market}); });
const HISTORY_RANGES={
  "5m":{label:"5 min",days:1,maxAgeMs:5*60*1000},
  "1h":{label:"1 h",days:1,maxAgeMs:60*60*1000},
  "24h":{label:"24 h",days:1,maxAgeMs:24*60*60*1000},
  "7d":{label:"7 jours",days:7},
  "30d":{label:"30 jours",days:30},
  "1y":{label:"1 an",days:365},
  "5y":{label:"5 ans",days:1825},
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


function fallbackNoise(seed,index) {
  let x=(Math.imul((seed+index*374761393)|0,668265263)>>>0);
  x^=x>>>13;
  x=Math.imul(x,1274126177)>>>0;
  return (x/4294967296)-0.5;
}
function buildFallbackHistory(symbol, days, maxAgeMs=null) {
  const base=Number(prices[symbol])||1;
  const numericDays=days==="max"?3650:Math.max(Number(days)||7,1);
  const fallbackWindowMs=Number.isFinite(maxAgeMs)&&maxAgeMs>0?maxAgeMs:numericDays*86400000;
  const points=maxAgeMs===5*60*1000?12:maxAgeMs===60*60*1000?24:Math.min(1000,Math.max(numericDays===1?288:numericDays===7?168:numericDays===30?720:numericDays>=365?365:120,12));
  const now=Date.now();
  const span=fallbackWindowMs;
  const seed=symbol.split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
  let level=1+((seed%9)-4)*0.001;
  return Array.from({length:points},(_,index)=>{
    const progress=index/Math.max(points-1,1);
    level=Math.max(.93,Math.min(1.07,level+fallbackNoise(seed,index)*.012+fallbackNoise(seed+97,index)*.004));
    return {timestamp:now-span+(span*progress),price:base*level};
  });
}

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
    console.warn("[MARKET] history fallback",symbol,days,lastError?.message||"CoinGecko indisponible");
    return buildFallbackHistory(symbol,days);
  }
  const data=await response.json();
  const pricesHistory=(data.prices||[]).map(([timestamp,price])=>({timestamp,price:Number(price)})).filter(p=>Number.isFinite(p.price)&&p.price>0);
  if(!pricesHistory.length) {
    console.warn("[MARKET] history fallback",symbol,days,"Aucune donnée historique");
    return buildFallbackHistory(symbol,days);
  }
  historyCache.set(cacheKey,{updatedAt:Date.now(),prices:pricesHistory});
  return pricesHistory;
}
async function fetchHistoryRange(symbol,range){
  const normalizedRange=String(range||"24h").trim().toLowerCase();
  const config=HISTORY_RANGES[normalizedRange]||HISTORY_RANGES["24h"];
  const cacheKey=`${symbol}:range:${normalizedRange}`;
  const cached=historyCache.get(cacheKey);
  if(cached && Date.now()-cached.updatedAt<60000)return cached.prices;
  const source=await fetchHistory(symbol,config.days);
  let pricesHistory=source;
  if(config.maxAgeMs){
    const cutoff=Date.now()-config.maxAgeMs;
    pricesHistory=source.filter(point=>Number(point.timestamp)>=cutoff);
    if(pricesHistory.length<2)pricesHistory=buildFallbackHistory(symbol,1,config.maxAgeMs).filter(point=>Number(point.timestamp)>=cutoff);
  }
  if(!pricesHistory.length)pricesHistory=buildFallbackHistory(symbol,config.days,config.maxAgeMs);
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
    const fallback=buildFallbackHistory(symbol,days);
    res.json({symbol,days,source:"BitGold fallback",prices:fallback});
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
async function botSignal(type){
 await refreshMarket();
 const symbols=Object.keys(marketIds),histories=Object.fromEntries(await Promise.all(symbols.map(async symbol=>[symbol,await fetchHistory(symbol,7)])));
 const momentum=Object.fromEntries(symbols.map(symbol=>[symbol,botMomentum(histories[symbol])]));
 const positive=symbols.filter(symbol=>momentum[symbol]>0).length,bull=momentum.BTC>=8&&positive>=4&&momentum.ETH>2;
 if(type==="quant-pulse"){
  const candidates=symbols.map(symbol=>{
   const values=(histories[symbol]||[]).map(p=>Number(p.price)).filter(Number.isFinite),rsi=botRsi(histories[symbol]);
   const mean=values.reduce((a,b)=>a+b,0)/(values.length||1),last=values[values.length-1]||mean;
   const deviation=mean?((last-mean)/mean)*100:0;
   return{symbol,rsi,deviation,mean};
  }).sort((a,b)=>Math.abs(b.deviation)-Math.abs(a.deviation));
  const buy=candidates.find(x=>x.rsi<32&&x.deviation<=-4),sell=candidates.find(x=>x.rsi>68&&x.deviation>=4);
  if(buy)return{action:"buy",asset:buy.symbol,fraction:.04,message:"Quant Pulse : excès baissier détecté, retour vers la moyenne recherché sur "+buy.symbol+"."};
  if(sell)return{action:"sell",asset:sell.symbol,fraction:.035,message:"Quant Pulse : excès haussier détecté, prise de risque réduite sur "+sell.symbol+"."};
  return{action:"hold",asset:candidates[0]?.symbol||"BTC",message:"Quant Pulse : aucun écart statistique suffisamment extrême."};
 }
 if(type==="macro-rotation"){
  const ranked=symbols.map(symbol=>({symbol,momentum:momentum[symbol]})).sort((a,b)=>b.momentum-a.momentum),breadth=positive/symbols.length,riskOn=breadth>=.60&&momentum.BTC>=3&&momentum.ETH>=0;
  if(riskOn){const leader=ranked[0]?.symbol||"BTC";return{action:"buy",asset:leader,fraction:.055,message:"Macro Rotation Elite : régime risk-on confirmé, rotation vers le leader "+leader+"."};}
  if(breadth<.40||momentum.BTC<=-4){const weakest=ranked[ranked.length-1]?.symbol||"SOL";return{action:"sell",asset:weakest,fraction:.045,message:"Macro Rotation Elite : régime risk-off, réduction de l'actif le plus faible."};}
  return{action:"hold",asset:ranked[0]?.symbol||"BTC",message:"Macro Rotation Elite : régime neutre, aucune rotation agressive."};
 }
 if(type==="adaptive-ai"){
  const scored=symbols.map(symbol=>{
   const values=(histories[symbol]||[]).map(p=>Number(p.price)).filter(Number.isFinite),rsi=botRsi(histories[symbol]),returns=[];
   for(let i=1;i<values.length;i++)if(values[i-1])returns.push((values[i]-values[i-1])/values[i-1]*100);
   const mean=returns.reduce((a,b)=>a+b,0)/(returns.length||1),variance=returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length||1),volatility=Math.sqrt(variance),min=Math.min(...values),max=Math.max(...values),last=values[values.length-1];
   const rangePosition=max===min?50:((last-min)/(max-min))*100,momentumScore=Math.max(0,Math.min(100,50+momentum[symbol]*3)),rsiScore=Math.max(0,Math.min(100,100-Math.abs(rsi-55)*2)),rangeScore=Math.max(0,Math.min(100,rangePosition)),volatilityScore=Math.max(0,Math.min(100,100-volatility*12)),score=.45*momentumScore+.25*rsiScore+.20*rangeScore+.10*volatilityScore;
   return{symbol,score,momentum:momentum[symbol],rsi};
  }).sort((a,b)=>b.score-a.score);
  const best=scored[0],confidence=Math.round(best?.score||50);
  if(best&&best.score>=68)return{action:"buy",asset:best.symbol,fraction:.05,confidence,message:"IA Adaptive : score "+confidence+"/100, momentum "+best.momentum.toFixed(1)+" %, RSI "+best.rsi.toFixed(0)+". Convergence favorable."};
  if(best&&best.score<=32)return{action:"sell",asset:best.symbol,fraction:.04,confidence,message:"IA Adaptive : score faible ("+confidence+"/100). Exposition réduite."};
  return{action:"hold",asset:best?.symbol||"BTC",confidence,message:"IA Adaptive : score "+confidence+"/100. Signaux insuffisamment convergents, conservation du cash."};
 }
 if(type==="gold"){if(bull)return{action:"buy",asset:momentum.ETH>=momentum.BTC?"ETH":"BTC",fraction:.065,message:"Signal bull run confirmé : momentum BTC, breadth et ETH convergent."};if(momentum.BTC<=-6)return{action:"sell",asset:"BTC",fraction:.04,message:"Signal de sortie : momentum BTC 7j fortement négatif."};return{action:"hold",asset:"BTC",message:"Pas de bull run confirmé : le bot conserve sa réserve."}}
 if(type==="silver"){const leader=["BTC","ETH","SOL"].sort((a,b)=>momentum[b]-momentum[a])[0],rsi=botRsi(histories[leader]);if(momentum[leader]>=3&&rsi<72)return{action:"buy",asset:leader,fraction:.035,message:"Tendance positive détectée : renforcement progressif du leader."};if(momentum[leader]<=-5)return{action:"sell",asset:leader,fraction:.025,message:"Tendance dégradée : réduction de l’exposition."};return{action:"hold",asset:leader,message:"Tendance intermédiaire : aucune opération."}}
 const weak=["SOL","LINK","AVAX"].sort((a,b)=>momentum[a]-momentum[b])[0],leader=["BTC","ETH"].sort((a,b)=>momentum[b]-momentum[a])[0];
 if(momentum[weak]<=-7)return{action:"sell",asset:weak,fraction:.035,message:"Protection active : réduction d’un actif en tendance baissière."};
 if(momentum[leader]>=5&&botRsi(histories[leader])<68)return{action:"buy",asset:leader,fraction:.02,message:"Signal défensif favorable : petite entrée sur un leader confirmé."};
 return{action:"hold",asset:leader,message:"Marché incertain : priorité au capital disponible."};
}
async function executeBotDecision(subscription,signal){
 const def=botDefinition(subscription.bot_type),client=await pool.connect();
 try{
  await client.query("BEGIN");
  const w=await client.query("SELECT cash FROM wallets WHERE user_id=$1 FOR UPDATE",[subscription.user_id]);
  const h=await client.query("SELECT quantity FROM holdings WHERE user_id=$1 AND asset=$2 FOR UPDATE",[subscription.user_id,signal.asset]);
  const cash=Number(w.rows[0]?.cash||0),qty=Number(h.rows[0]?.quantity||0),price=Number(prices[signal.asset]||0);
  let amount=0,quantity=0;
  if(signal.action==="buy"){const maxTrade=Number(subscription.max_trade_eur||250);const maxPosition=Number(subscription.max_position_eur||1000);const currentPosition=qty*price;const remaining=Math.max(0,maxPosition-currentPosition);const reserve=Math.max(0,Math.min(90,Number(subscription.min_cash_pct||20)))/100;const spendable=Math.max(0,cash*(1-reserve));amount=Math.min(cash*signal.fraction,cash*def.allocation/100,maxTrade,remaining,spendable);quantity=price?amount/price:0}
  if(signal.action==="sell"){amount=Math.min(qty*price,(qty*price)*signal.fraction);quantity=price?amount/price:0}
  if(signal.action==="hold"||amount<=0||quantity<=0){await client.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[subscription.user_id,subscription.bot_type,"hold",signal.asset,signal.message]);await client.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[subscription.id]);await client.query("COMMIT");return}
  await client.query("UPDATE wallets SET cash=cash+$1 WHERE user_id=$2",[signal.action==="buy"?-amount:amount,subscription.user_id]);
  await client.query("UPDATE holdings SET quantity=quantity+$1 WHERE user_id=$2 AND asset=$3",[signal.action==="buy"?quantity:-quantity,subscription.user_id,signal.asset]);
  await client.query("INSERT INTO trades(user_id,side,asset,amount_eur,price_eur,quantity) VALUES($1,$2,$3,$4,$5,$6)",[subscription.user_id,signal.action,signal.asset,amount,price,quantity]);
  await client.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[subscription.user_id,subscription.bot_type,signal.action,signal.asset,signal.message+" Montant simulé : "+amount.toFixed(2)+" €."]);
  await client.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[subscription.id]);await client.query("COMMIT");
 }catch(e){await client.query("ROLLBACK");console.error("[BOT] execution error",e.message)}finally{client.release()}
}
async function runBots(){
 try{const r=await pool.query("SELECT * FROM bot_subscriptions WHERE active=TRUE AND (last_run IS NULL OR last_run<CURRENT_TIMESTAMP-INTERVAL '15 minutes') ORDER BY id");for(const sub of r.rows){try{await executeBotDecision(sub,await botSignal(sub.bot_type))}catch(e){console.error("[BOT] signal error",sub.bot_type,e.message);await pool.query("UPDATE bot_subscriptions SET last_run=CURRENT_TIMESTAMP WHERE id=$1",[sub.id])}}}catch(e){console.error("[BOT] scheduler error",e.message)}
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
app.get("/api/kyc",auth,async(req,res)=>{try{await pool.query("INSERT INTO kyc_cases(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING",[req.user.sub]);const r=await pool.query("SELECT status,document_type,aml_status,submitted_at,verified_at FROM kyc_cases WHERE user_id=$1",[req.user.sub]);res.json(r.rows[0]||{status:"required",aml_status:"not_checked"})}catch(e){res.status(500).json({error:"Impossible de charger le statut KYC."})}});
app.post("/api/kyc/demo-approve",auth,async(req,res)=>{try{await pool.query("INSERT INTO kyc_cases(user_id,status,document_type,aml_status,submitted_at,verified_at) VALUES($1,'verified','demo','clear',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET status='verified',aml_status='clear',verified_at=CURRENT_TIMESTAMP");res.json({ok:true,status:"verified",message:"KYC + contrôle AML validés en simulation. Aucun document réel n'a été traité."})}catch(e){res.status(500).json({error:"Impossible de simuler la validation KYC."})}});
app.post("/api/transfers/deposit",auth,async(req,res)=>{try{const amount=Number(req.body.amount);const k=(await pool.query("SELECT status FROM kyc_cases WHERE user_id=$1",[req.user.sub])).rows[0];if(k?.status!=="verified")return res.status(403).json({error:"KYC vérifié requis avant un dépôt."});const plan=(await getUserPlan(req.user.sub)).plan,quote=calculateTransferQuote(plan,"cashin",amount);if(!quote||amount>quote.dailyLimit)return res.status(400).json({error:"Montant invalide ou supérieur à la limite quotidienne."});await pool.query("UPDATE wallets SET cash=cash+$1 WHERE user_id=$2",[quote.net,req.user.sub]);await pool.query("INSERT INTO transfer_ledger(user_id,type,amount_eur,fee_eur,net_eur) VALUES($1,'cashin',$2,$3,$4)",[req.user.sub,quote.amount,quote.fee,quote.net]);res.json({ok:true,quote,message:"Dépôt simulé enregistré. Aucun paiement réel n'a été effectué."})}catch(e){res.status(500).json({error:e.message||"Impossible d'enregistrer le dépôt."})}});
app.post("/api/transfers/withdraw",auth,async(req,res)=>{try{const amount=Number(req.body.amount);const k=(await pool.query("SELECT status FROM kyc_cases WHERE user_id=$1",[req.user.sub])).rows[0];if(k?.status!=="verified")return res.status(403).json({error:"KYC vérifié requis avant un retrait."});const plan=(await getUserPlan(req.user.sub)).plan,quote=calculateTransferQuote(plan,"cashout",amount);if(!quote||amount>quote.dailyLimit)return res.status(400).json({error:"Montant invalide ou supérieur à la limite quotidienne."});const client=await pool.connect();try{await client.query("BEGIN");const w=await client.query("SELECT cash FROM wallets WHERE user_id=$1 FOR UPDATE",[req.user.sub]);if(Number(w.rows[0]?.cash||0)<amount)throw Error("Solde disponible insuffisant.");await client.query("UPDATE wallets SET cash=cash-$1 WHERE user_id=$2",[amount,req.user.sub]);await client.query("INSERT INTO transfer_ledger(user_id,type,amount_eur,fee_eur,net_eur) VALUES($1,'cashout',$2,$3,$4)",[req.user.sub,quote.amount,quote.fee,quote.net]);await client.query("COMMIT")}catch(e){await client.query("ROLLBACK");throw e}finally{client.release()}res.json({ok:true,quote,message:"Retrait simulé enregistré. Aucun virement réel n'a été effectué."})}catch(e){res.status(500).json({error:e.message||"Impossible d'enregistrer le retrait."})}});
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
app.get("/api/bots/catalog",(req,res)=>res.json({catalog:BOT_CATALOG}));
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
app.post("/api/bots/subscriptions",auth,async(req,res)=>{const botType=String(req.body.botType||"").toLowerCase(),def=botDefinition(botType);if(!def)return res.status(400).json({error:"Bot inconnu."});const plan=(await getUserPlan(req.user.sub)).plan;if(!botEntitlement(plan,botType))return res.status(402).json({error:"Ce bot est réservé au plan Pro.",code:"PRO_REQUIRED"});const activeCount=Number((await pool.query("SELECT COUNT(*) FROM bot_subscriptions WHERE user_id=$1 AND active=TRUE",[req.user.sub])).rows[0]?.count||0),existing=await pool.query("SELECT id FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType]);if(plan==="free"&&activeCount>=1&&!existing.rows.length)return res.status(403).json({error:"Le plan Free autorise un seul bot actif.",code:"FREE_BOT_LIMIT"});if(plan==="pro"&&activeCount>=3&&!existing.rows.length)return res.status(403).json({error:"Le plan Pro est limité à 3 bots actifs.",code:"PRO_BOT_LIMIT"});if(plan==="elite"&&activeCount>=5&&!existing.rows.length)return res.status(403).json({error:"Le mode Elite est limité à 5 bots actifs.",code:"ELITE_BOT_LIMIT"});const defaults=plan==="elite"?{maxTrade:2500,maxPosition:15000,stopLoss:3,minCash:10}:plan==="pro"?{maxTrade:1000,maxPosition:5000,stopLoss:5,minCash:15}:{maxTrade:250,maxPosition:1000,stopLoss:8,minCash:30};const maxTrade=Number(req.body.maxTradeEur??defaults.maxTrade),maxPosition=Number(req.body.maxPositionEur??defaults.maxPosition),stopLoss=Number(req.body.stopLossPct??defaults.stopLoss),minCash=Number(req.body.minCashPct??defaults.minCash);if(![maxTrade,maxPosition,stopLoss,minCash].every(Number.isFinite)||maxTrade<10||maxPosition<100||stopLoss<1||stopLoss>50||minCash<0||minCash>90)return res.status(400).json({error:"Paramètres de risque invalides."});try{if(plan==="free")await pool.query("UPDATE bot_subscriptions SET active=FALSE WHERE user_id=$1 AND bot_type<>$2",[req.user.sub,botType]);await pool.query("INSERT INTO bot_subscriptions(user_id,bot_type,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id,bot_type) DO UPDATE SET active=TRUE,max_trade_eur=EXCLUDED.max_trade_eur,max_position_eur=EXCLUDED.max_position_eur,stop_loss_pct=EXCLUDED.stop_loss_pct,min_cash_pct=EXCLUDED.min_cash_pct",[req.user.sub,botType,maxTrade,maxPosition,stopLoss,minCash]);const sub=(await pool.query("SELECT * FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType])).rows[0];await pool.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[req.user.sub,botType,"subscribe",null,"Souscription activée ou renouvelée pour "+def.name+"."]);await executeBotDecision(sub,await botSignal(botType));res.status(201).json({ok:true,bot:def,subscription:sub})}catch(e){console.error("[BOT] subscribe error",e.message);res.status(500).json({error:"Impossible d’activer ce bot."})}});
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
    const integrity=Math.abs(total-(cash+invested))<0.01&&holdings.every(row=>row.quantity>=-1e-12);
    res.json({updatedAt:Date.now(),source:"wallets + holdings + CoinGecko",cash,invested,total,initialCapital:10000,holdings,positions,trades:t.rows,integrity:{ok:integrity,cashPlusInvested:cash+invested,difference:total-(cash+invested)}});
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
    const [wallet,holdings,tradeRows,botRows,botActivity,userPlan]=await Promise.all([
      pool.query("SELECT cash FROM wallets WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT asset,quantity FROM holdings WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id ASC",[req.user.sub]),
      pool.query("SELECT bot_type,active,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct,last_run FROM bot_subscriptions WHERE user_id=$1 ORDER BY id",[req.user.sub]),
      pool.query("SELECT bot_type,action,asset,message,created_at FROM bot_activity WHERE user_id=$1 ORDER BY id DESC LIMIT 8",[req.user.sub]),
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
      integrity:{ok:Math.abs(total-(cash+invested))<0.01&&positions.every(row=>row.quantity>=-1e-12),cashPlusInvested:cash+invested,difference:total-(cash+invested),source:"wallets + holdings + live market prices"}
    });
  }catch(e){
    console.error("[DASHBOARD] error",e.message);
    res.status(500).json({error:"Impossible de charger le dashboard."});
  }
});

app.post("/api/trades",auth,async(req,res)=>{
  await refreshMarket();
  const side=req.body.side, asset=req.body.asset, amount=Number(req.body.amount);
  if(!["buy","sell"].includes(side)||!prices[asset]||!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:"Ordre invalide."});
  const price=prices[asset], qty=amount/price, client=await pool.connect();
  try {
    await client.query("BEGIN");
    const w=await client.query("SELECT cash FROM wallets WHERE user_id=$1 FOR UPDATE",[req.user.sub]);
    const h=await client.query("SELECT quantity FROM holdings WHERE user_id=$1 AND asset=$2 FOR UPDATE",[req.user.sub,asset]);
    const cash=Number(w.rows[0]?.cash??0), currentQty=Number(h.rows[0]?.quantity??0);
    if(side==="buy"&&amount>cash) throw Error("Solde insuffisant.");
    if(side==="sell"&&qty>currentQty) throw Error("Quantité insuffisante.");
    await client.query("UPDATE wallets SET cash=cash+$1 WHERE user_id=$2",[side==="buy"?-amount:amount,req.user.sub]);
    await client.query("UPDATE holdings SET quantity=quantity+$1 WHERE user_id=$2 AND asset=$3",[side==="buy"?qty:-qty,req.user.sub,asset]);
    await client.query("INSERT INTO trades(user_id,side,asset,amount_eur,price_eur,quantity) VALUES($1,$2,$3,$4,$5,$6)",[req.user.sub,side,asset,amount,price,qty]);
    await client.query("COMMIT");
    res.status(201).json({ok:true});
  } catch(e) {
    await client.query("ROLLBACK");
    res.status(400).json({error:e.message||"Erreur serveur."});
  } finally { client.release(); }
});

const port=Number(process.env.PORT||3000);
app.listen(port,()=>console.log(`BitGold API ready on port ${port}`));
