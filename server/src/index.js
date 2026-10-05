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

const { Pool } = pg;
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secret = process.env.JWT_SECRET || "dev-only-change-me";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined
});

await pool.query(`
CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS wallets(user_id INTEGER PRIMARY KEY REFERENCES users(id),cash DOUBLE PRECISION NOT NULL DEFAULT 10000);
CREATE TABLE IF NOT EXISTS holdings(user_id INTEGER NOT NULL REFERENCES users(id),asset TEXT NOT NULL,quantity DOUBLE PRECISION NOT NULL DEFAULT 0,PRIMARY KEY(user_id,asset));
CREATE TABLE IF NOT EXISTS trades(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),side TEXT NOT NULL,asset TEXT NOT NULL,amount_eur DOUBLE PRECISION NOT NULL,price_eur DOUBLE PRECISION NOT NULL,quantity DOUBLE PRECISION NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bot_subscriptions(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,bot_type TEXT NOT NULL,portfolio_name TEXT NOT NULL DEFAULT 'Portefeuille principal',active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,last_run TIMESTAMPTZ,UNIQUE(user_id,bot_type));
CREATE TABLE IF NOT EXISTS bot_activity(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,bot_type TEXT NOT NULL,action TEXT NOT NULL DEFAULT 'hold',asset TEXT,message TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS max_trade_eur DOUBLE PRECISION NOT NULL DEFAULT 250;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS max_position_eur DOUBLE PRECISION NOT NULL DEFAULT 1000;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS stop_loss_pct DOUBLE PRECISION NOT NULL DEFAULT 8;
ALTER TABLE bot_subscriptions ADD COLUMN IF NOT EXISTS min_cash_pct DOUBLE PRECISION NOT NULL DEFAULT 20;
`);

app.use(helmet({contentSecurityPolicy:{directives:{"img-src":["'self'","data:","https:"]}}}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 120, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "../public"), { setHeaders: (res, filePath) => { if(filePath.endsWith(".html") || filePath.endsWith(".js") || filePath.endsWith(".css")) res.setHeader("Cache-Control", "no-store, max-age=0"); } }));
app.get(/^\/bot\/(shield|silver|gold)\/?$/, (req,res)=>res.sendFile(path.join(__dirname,"../public/index.html")));

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

async function refreshMarket(force=false) {
  if(!force && Date.now()-marketUpdatedAt < 30000) return marketSnapshot;
  try {
    const ids = Object.values(marketIds).join(",");
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_market_cap_rank=true`, {
      headers: { accept: "application/json", "user-agent": "BitGold/1.0" }
    });
    if(!response.ok) throw Error(`CoinGecko HTTP ${response.status}`);
    const data = await response.json();
    marketSnapshot = Object.entries(marketIds).map(([symbol,id]) => {
      const item = data[id] || {};
      const price = Number(item.eur);
      const change24h = Number(item.eur_24h_change);
      const marketCap = Number(item.eur_market_cap);
      const volume24h = Number(item.eur_24h_vol);
      const marketCapRank = Number(item.eur_market_cap_rank);
      if(Number.isFinite(price) && price > 0) prices[symbol] = price;
      return {
        symbol,
        price: Number.isFinite(price) && price > 0 ? price : prices[symbol],
        change24h: Number.isFinite(change24h) ? change24h : 0,
        marketCap: Number.isFinite(marketCap) ? marketCap : null,
        volume24h: Number.isFinite(volume24h) ? volume24h : null,
        marketCapRank: Number.isFinite(marketCapRank) ? marketCapRank : null
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

app.post("/api/auth/signup", async (req,res) => {
  const email=String(req.body.email||"").trim().toLowerCase(), password=String(req.body.password||"");
  if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8) return res.status(400).json({error:"Email valide et mot de passe de 8 caractères minimum requis."});
  console.log("[AUTH] signup attempt", email);
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const hash=await bcrypt.hash(password,12);
    const r=await client.query("INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email",[email,hash]);
    const user=r.rows[0];
    await client.query("INSERT INTO wallets(user_id) VALUES($1)",[user.id]);
    for(const asset of Object.keys(prices)) await client.query("INSERT INTO holdings(user_id,asset,quantity) VALUES($1,$2,0)",[user.id,asset]);
    await client.query("COMMIT");
    console.log("[AUTH] signup success", email);
    res.status(201).json({token:token(user),email:user.email});
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
    if(!u){
      console.log("[AUTH] user not found", email);
      return res.status(401).json({error:"Identifiants incorrects."});
    }
    const valid=await bcrypt.compare(password,u.password_hash);
    if(!valid){
      console.log("[AUTH] invalid password", email);
      return res.status(401).json({error:"Identifiants incorrects."});
    }
    console.log("[AUTH] login success", email);
    res.json({token:token(u),email:u.email});
  } catch(e) {
    console.error("[AUTH] login error", e.message);
    res.status(500).json({error:"Erreur serveur."});
  }
});

app.get("/api/me",auth,(req,res)=>res.json({id:req.user.sub,email:req.user.email}));
const newsCache={items:[],updatedAt:0};

function decodeXml(value){
  return String(value||"")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs,"$1")
    .replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&#x27;/gi,"'");
}

function parseRssItems(xml,defaultSource="Crypto"){
  const items=[...String(xml||"").matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .slice(0,12)
    .map(match=>{
      const block=match[1];
      const pick=tag=>{
        const found=block.match(new RegExp("<"+tag+"\\b[^>]*>([\\s\\S]*?)</"+tag+">","i"));
        return found?decodeXml(found[1]).trim():"";
      };
      const pickAttr=(tag,attr)=>{
        const found=block.match(new RegExp("<"+tag+"\\b[^>]*\\s"+attr+"=[\"']([^\"']+)[\"'][^>]*>","i"));
        return found?decodeXml(found[1]).trim():"";
      };
      const description=pick("description");
      const descriptionImage=(description.match(/<img[^>]+src=["']([^"']+)["']/i)||[])[1]||"";
      const imageUrl=pickAttr("media:content","url")||pickAttr("media:thumbnail","url")||pickAttr("enclosure","url")||descriptionImage;
      let url=pick("link");
      if(!url){
        const link=block.match(/<link[^>]*href=["']([^"']+)["']/i);
        url=link?decodeXml(link[1]).trim():"";
      }
      return{
        title:pick("title"),
        url,
        publishedAt:pick("pubDate")||pick("dc:date")||new Date().toISOString(),
        source:pick("source")||defaultSource,
        category:"Crypto",
        imageUrl
      };
    })
    .filter(item=>item.title&&/^https?:\/\//i.test(item.url));
  return items;
}

async function fetchNews(){
  if(newsCache.items.length&&Date.now()-newsCache.updatedAt<300000)return newsCache.items;
  const feed="https://news.google.com/rss/search?q=crypto%20OR%20bitcoin%20OR%20ethereum&hl=fr&gl=FR&ceid=FR:fr";
  const response=await fetch(feed,{headers:{accept:"application/rss+xml, application/xml, text/xml","user-agent":"BitGold/1.0"}});
  if(!response.ok)throw Error(`News HTTP ${response.status}`);
  const xml=await response.text();
  const items=parseRssItems(xml,"Google News");
  if(!items.length)throw Error("Aucun article Google News détecté");
  newsCache.items=items;
  newsCache.updatedAt=Date.now();
  return items;
}

async function fetchCoinDeskFallback(){
  const response=await fetch("https://www.coindesk.com/arc/outboundfeeds/rss/",{headers:{accept:"application/rss+xml, application/xml, text/xml","user-agent":"BitGold/1.0"}});
  if(!response.ok)throw Error(`CoinDesk RSS HTTP ${response.status}`);
  const xml=await response.text();
  const items=parseRssItems(xml,"CoinDesk");
  if(!items.length)throw Error("Aucun article CoinDesk RSS détecté");
  return items.slice(0,9);
}

app.get("/api/news",async(req,res)=>{
  try{
    const items=await fetchNews();
    res.json({source:"Google News",updatedAt:newsCache.updatedAt,items});
  }catch(e){
    console.error("[NEWS] Google News error",e.message);
    try{
      const items=await fetchCoinDeskFallback();
      res.json({source:"CoinDesk",updatedAt:Date.now(),items});
    }catch(fallbackError){
      console.error("[NEWS] CoinDesk fallback error",fallbackError.message);
      res.status(502).json({error:"Actualités temporairement indisponibles.",items:[]});
    }
  }
});
app.get("/api/market",async(req,res)=>{ const market=await refreshMarket(); res.json({updatedAt:marketUpdatedAt,source:"CoinGecko",markets:market}); });
app.get("/api/market/details/:symbol",async(req,res)=>{
  const symbol=String(req.params.symbol||"").toUpperCase();
  if(!marketIds[symbol]) return res.status(404).json({error:"Crypto inconnue."});
  const market=await refreshMarket();
  const item=market.find(row=>row.symbol===symbol);
  try {
    const pricesHistory=await fetchHistory(symbol,7);
    const values=pricesHistory.map(point=>Number(point.price));
    res.json({
      ...item,
      name:{BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",USDC:"USD Coin",LINK:"Chainlink",AVAX:"Avalanche"}[symbol],
      days7:{min:Math.min(...values),max:Math.max(...values),points:pricesHistory},
      source:"CoinGecko"
    });
  } catch(e) {
    console.error("[MARKET] detail error",symbol,e.message);
    res.json({...item,name:symbol,days7:{min:item.price,max:item.price,points:[]},source:"CoinGecko"});
  }
});

function fallbackNoise(seed,index) {
  let x=(Math.imul((seed+index*374761393)|0,668265263)>>>0);
  x^=x>>>13;
  x=Math.imul(x,1274126177)>>>0;
  return (x/4294967296)-0.5;
}
function buildFallbackHistory(symbol, days) {
  const base=Number(prices[symbol])||1;
  const points=Math.max(days===1?24:days===7?56:days===30?90:120,12);
  const now=Date.now();
  const span=Math.max(days,1)*86400000;
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
      response=await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=eur&days=${days}`,{headers:{accept:"application/json","user-agent":"BitGold/1.0"}});
      if(response.ok) break;
      lastError=Error(`CoinGecko HTTP ${response.status}`);
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
{id:"shield",name:"Shield Bot",tier:"SHIELD",risk:"Prudent",allocation:25,frequency:"30 min",price_monthly_eur:9.90,summary:"Protection d'abord : conserve du cash et réduit les actifs fragiles.",description:"Le niveau défensif pour privilégier la stabilité. Shield surveille les tendances sur 7 jours, réduit les actifs fragiles et ne renforce que les leaders avec un momentum suffisamment net.",strategy:"Le moteur classe les actifs par momentum, surveille un RSI simplifié et applique des seuils conservateurs. Une baisse forte de SOL, LINK ou AVAX déclenche une réduction de 3,5 %. Une hausse confirmée de BTC ou ETH peut déclencher une entrée limitée à 2 %.",algorithm:"1. Calcule le momentum 7 jours et un RSI indicatif. 2. Cherche l'actif le plus faible parmi SOL/LINK/AVAX. 3. Réduit l'exposition si le momentum passe sous -7 %. 4. Sinon, cherche BTC/ETH au-dessus de +5 % avec RSI inférieur à 68. 5. Respecte la taille maximale d'ordre, la position maximale et la réserve de cash.",compatible_assets:["BTC","ETH","SOL","LINK","AVAX"]},
{id:"silver",name:"Silver Bot",tier:"SILVER",risk:"Modéré",allocation:45,frequency:"30 min",price_monthly_eur:19.90,summary:"Équilibre tendance, diversification et renforcement progressif.",description:"Une approche intermédiaire qui suit BTC, ETH et SOL sans concentrer tout le portefeuille sur un seul signal.",strategy:"Le moteur compare BTC, ETH et SOL, sélectionne le leader de momentum puis combine tendance et RSI pour décider d'un renforcement progressif ou d'une réduction.",algorithm:"1. Mesure le momentum 7 jours sur BTC/ETH/SOL. 2. Sélectionne le leader. 3. Achète 3,5 % si son momentum atteint +3 % et que le RSI reste sous 72. 4. Réduit 2,5 % si la tendance passe sous -5 %. 5. Bloque les opérations qui dépassent les limites de risque configurées.",compatible_assets:["BTC","ETH","SOL"]},
{id:"gold",name:"Gold Bot",tier:"GOLD",risk:"Élevé",allocation:65,frequency:"15 min",price_monthly_eur:34.90,summary:"Performance offensive : détecte les phases de bull run et renforce les leaders.",description:"Le bot le plus dynamique. Il combine momentum BTC, breadth du marché et tendance ETH pour détecter un régime haussier avant d'agir.",strategy:"Détecte un régime de bull run via momentum BTC, breadth du marché et tendance 7 jours, puis concentre les renforcements sur BTC ou ETH.",algorithm:"1. Mesure le momentum 7 jours de l'univers suivi. 2. Confirme un régime haussier si BTC dépasse +8 %, au moins quatre actifs sont positifs et ETH dépasse +2 %. 3. Renforce le leader BTC/ETH à hauteur de 6,5 % du cash disponible, dans les limites configurées. 4. Si BTC passe sous -6 %, réduit une partie de l'exposition BTC. 5. En l'absence de convergence, conserve le cash.",compatible_assets:["BTC","ETH"]}
];
function botDefinition(type){return BOT_CATALOG.find(bot=>bot.id===type)}
function botMomentum(points){const v=(points||[]).map(p=>Number(p.price)).filter(Number.isFinite);return v.length>2&&v[0]?((v[v.length-1]-v[0])/v[0])*100:0}
function botRsi(points){const v=(points||[]).map(p=>Number(p.price)).filter(Number.isFinite);if(v.length<3)return 50;const start=Math.max(1,v.length-14),g=[],l=[];for(let i=start;i<v.length;i++){const d=v[i]-v[i-1];if(d>0)g.push(d);else if(d<0)l.push(Math.abs(d))}const ag=g.reduce((a,b)=>a+b,0)/(g.length||1),al=l.reduce((a,b)=>a+b,0)/(l.length||1);return al===0?100:100-(100/(1+ag/al))}
async function botSignal(type){
 await refreshMarket();
 const symbols=Object.keys(marketIds),histories=Object.fromEntries(await Promise.all(symbols.map(async symbol=>[symbol,await fetchHistory(symbol,7)])));
 const momentum=Object.fromEntries(symbols.map(symbol=>[symbol,botMomentum(histories[symbol])]));
 const positive=symbols.filter(symbol=>momentum[symbol]>0).length;
 const bull=momentum.BTC>=8&&positive>=4&&momentum.ETH>2;
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
app.get("/api/bots/catalog",(req,res)=>res.json({catalog:BOT_CATALOG}));
app.get("/api/bots/:botType",auth,async(req,res)=>{const botType=String(req.params.botType||"").toLowerCase(),def=botDefinition(botType);if(!def)return res.status(404).json({error:"Bot inconnu."});const row=(await pool.query("SELECT bot_type,portfolio_name,active,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct,created_at,last_run FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType])).rows[0]||null;res.json({bot:def,subscription:row})});
app.get("/api/bots",auth,async(req,res)=>{try{const [subs,activity]=await Promise.all([pool.query("SELECT bot_type,portfolio_name,active,created_at,last_run,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct FROM bot_subscriptions WHERE user_id=$1 ORDER BY id",[req.user.sub]),pool.query("SELECT bot_type,action,asset,message,created_at FROM bot_activity WHERE user_id=$1 ORDER BY id DESC LIMIT 20",[req.user.sub])]);res.json({catalog:BOT_CATALOG,items:subs.rows,activity:activity.rows})}catch(e){res.status(500).json({error:"Impossible de charger les bots."})}});
app.get("/api/activity",auth,async(req,res)=>{
  try{
    const [botLogs,trades]=await Promise.all([
      pool.query("SELECT bot_type,action,asset,message,created_at FROM bot_activity WHERE user_id=$1 ORDER BY id DESC LIMIT 200",[req.user.sub]),
      pool.query("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id DESC LIMIT 200",[req.user.sub])
    ]);
    res.json({botLogs:botLogs.rows,trades:trades.rows});
  }catch(e){console.error("[ACTIVITY] error",e.message);res.status(500).json({error:"Impossible de charger le journal d'activité."})}
});
app.post("/api/bots/subscriptions",auth,async(req,res)=>{const botType=String(req.body.botType||"").toLowerCase(),def=botDefinition(botType);if(!def)return res.status(400).json({error:"Bot inconnu."});const maxTrade=Number(req.body.maxTradeEur??250),maxPosition=Number(req.body.maxPositionEur??1000),stopLoss=Number(req.body.stopLossPct??8),minCash=Number(req.body.minCashPct??20);if(![maxTrade,maxPosition,stopLoss,minCash].every(Number.isFinite)||maxTrade<10||maxPosition<100||stopLoss<1||stopLoss>50||minCash<0||minCash>90)return res.status(400).json({error:"Paramètres de risque invalides."});try{await pool.query("UPDATE bot_subscriptions SET active=FALSE WHERE user_id=$1 AND bot_type<>$2",[req.user.sub,botType]);await pool.query("INSERT INTO bot_subscriptions(user_id,bot_type,max_trade_eur,max_position_eur,stop_loss_pct,min_cash_pct) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id,bot_type) DO UPDATE SET active=TRUE,max_trade_eur=EXCLUDED.max_trade_eur,max_position_eur=EXCLUDED.max_position_eur,stop_loss_pct=EXCLUDED.stop_loss_pct,min_cash_pct=EXCLUDED.min_cash_pct",[req.user.sub,botType,maxTrade,maxPosition,stopLoss,minCash]);const sub=(await pool.query("SELECT * FROM bot_subscriptions WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType])).rows[0];await pool.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[req.user.sub,botType,"subscribe",null,"Souscription activée ou renouvelée pour "+def.name+"."]);await executeBotDecision(sub,await botSignal(botType));res.status(201).json({ok:true,bot:def,subscription:sub})}catch(e){console.error("[BOT] subscribe error",e.message);res.status(500).json({error:"Impossible d’activer ce bot."})}});
app.delete("/api/bots/subscriptions/:botType",auth,async(req,res)=>{const botType=String(req.params.botType||"").toLowerCase();if(!botDefinition(botType))return res.status(404).json({error:"Bot inconnu."});await pool.query("UPDATE bot_subscriptions SET active=FALSE WHERE user_id=$1 AND bot_type=$2",[req.user.sub,botType]);await pool.query("INSERT INTO bot_activity(user_id,bot_type,action,asset,message) VALUES($1,$2,$3,$4,$5)",[req.user.sub,botType,"unsubscribe",null,"Désabonnement du "+botDefinition(botType).name+"."]);res.json({ok:true})});
setInterval(runBots,60000);runBots().catch(()=>{});
app.get("/api/portfolio",auth,async(req,res)=>{
  try {
    const [w,h,t]=await Promise.all([
      pool.query("SELECT cash FROM wallets WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT asset,quantity FROM holdings WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id DESC LIMIT 50",[req.user.sub])
    ]);
    res.json({cash:w.rows[0]?.cash??0,holdings:h.rows,trades:t.rows});
  } catch(e) { console.error("[PORTFOLIO] error", e.message); res.status(500).json({error:"Erreur serveur."}); }
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
