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
`);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 120, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "../public")));

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

async function refreshMarket(force=false) {
  if(!force && Date.now()-marketUpdatedAt < 30000) return marketSnapshot;
  try {
    const ids = Object.values(marketIds).join(",");
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`, {
      headers: { accept: "application/json", "user-agent": "BitGold/1.0" }
    });
    if(!response.ok) throw Error(`CoinGecko HTTP ${response.status}`);
    const data = await response.json();
    marketSnapshot = Object.entries(marketIds).map(([symbol,id]) => {
      const item = data[id];
      const price = Number(item?.eur);
      const change24h = Number(item?.eur_24h_change);
      if(Number.isFinite(price) && price > 0) prices[symbol] = price;
      return {
        symbol,
        price: Number.isFinite(price) && price > 0 ? price : prices[symbol],
        change24h: Number.isFinite(change24h) ? change24h : 0
      };
    });
    marketUpdatedAt = Date.now();
  } catch(e) {
    console.error("[MARKET] refresh error", e.message);
    if(!marketSnapshot.length) {
      marketSnapshot = Object.entries(prices).map(([symbol,price]) => ({symbol,price,change24h:0}));
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
app.get("/api/market",async(req,res)=>{ const market=await refreshMarket(); res.json({updatedAt:marketUpdatedAt,source:"CoinGecko",markets:market}); });

app.get("/api/market/history/:symbol",async(req,res)=>{
  const symbol=String(req.params.symbol||"").toUpperCase();
  const days=Math.min(Math.max(Number(req.query.days||7),1),365);
  const id=marketIds[symbol];
  if(!id) return res.status(404).json({error:"Crypto inconnue."});
  try {
    const response=await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=eur&days=${days}&interval=${days<=1?"hourly":"daily"}`,{
      headers:{accept:"application/json","user-agent":"BitGold/1.0"}
    });
    if(!response.ok) throw Error(`CoinGecko HTTP ${response.status}`);
    const data=await response.json();
    const pricesHistory=(data.prices||[]).map(([timestamp,price])=>({timestamp,price:Number(price)})).filter(p=>Number.isFinite(p.price));
    res.json({symbol,days,source:"CoinGecko",prices:pricesHistory});
  } catch(e) {
    console.error("[MARKET] history error",symbol,e.message);
    res.status(502).json({error:"Historique temporairement indisponible."});
  }
});

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
