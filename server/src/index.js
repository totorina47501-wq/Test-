import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";

const app=express();
const db=new Database(process.env.DB_PATH||"bitgold.db");
const secret=process.env.JWT_SECRET||"dev-only-change-me";
db.pragma("journal_mode = WAL");
db.exec(\
`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS wallets(user_id INTEGER PRIMARY KEY,cash REAL NOT NULL DEFAULT 10000,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS holdings(user_id INTEGER NOT NULL,asset TEXT NOT NULL,quantity REAL NOT NULL DEFAULT 0,PRIMARY KEY(user_id,asset),FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS trades(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,side TEXT NOT NULL,asset TEXT NOT NULL,amount_eur REAL NOT NULL,price_eur REAL NOT NULL,quantity REAL NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));`);
app.use(helmet()); app.use(cors({origin:process.env.CLIENT_ORIGIN?.split(",")||true})); app.use(express.json());
app.use(rateLimit({windowMs:60000,max:120,standardHeaders:true,legacyHeaders:false}));
const prices={BTC:67420.10,ETH:3248.70,SOL:154.20};
function token(user){return jwt.sign({sub:user.id,email:user.email},secret,{expiresIn:"7d"})}
function auth(req,res,next){try{const p=jwt.verify((req.headers.authorization||"").replace("Bearer ",""),secret);req.user=p;next()}catch{return res.status(401).json({error:"Non authentifié"})}}
app.get("/api/health",(req,res)=>res.json({ok:true,service:"BitGold API"}));
app.post("/api/auth/signup",async(req,res)=>{const email=String(req.body.email||"").trim().toLowerCase(),password=String(req.body.password||"");if(!/^\\S+@\\S+\\.\\S+$/.test(email)||password.length<8)return res.status(400).json({error:"Email valide et mot de passe de 8 caractères minimum requis."});try{const hash=await bcrypt.hash(password,12);const info=db.prepare("INSERT INTO users(email,password_hash) VALUES(?,?)").run(email,hash);const id=Number(info.lastInsertRowid);db.prepare("INSERT INTO wallets(user_id) VALUES(?)").run(id);for(const a of Object.keys(prices))db.prepare("INSERT INTO holdings(user_id,asset,quantity) VALUES(?,?,0)").run(id,a);res.status(201).json({token:token({id,email}),email})}catch(e){res.status(409).json({error:"Ce compte existe déjà."})}});
app.post("/api/auth/login",async(req,res)=>{const email=String(req.body.email||"").trim().toLowerCase(),password=String(req.body.password||"");const u=db.prepare("SELECT * FROM users WHERE email=?").get(email);if(!u||!(await bcrypt.compare(password,u.password_hash)))return res.status(401).json({error:"Identifiants incorrects."});res.json({token:token(u),email:u.email})});
app.get("/api/me",auth,(req,res)=>res.json({id:req.user.sub,email:req.user.email}));
app.get("/api/market",(req,res)=>res.json(Object.entries(prices).map(([symbol,price])=>({symbol,price}))))
app.get("/api/portfolio",auth,(req,res)=>{const wallet=db.prepare("SELECT cash FROM wallets WHERE user_id=?").get(req.user.sub);const holdings=db.prepare("SELECT asset,quantity FROM holdings WHERE user_id=?").all(req.user.sub);const trades=db.prepare("SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=? ORDER BY id DESC LIMIT 50").all(req.user.sub);res.json({cash:wallet.cash,holdings,trades})});
app.post("/api/trades",auth,(req,res)=>{const side=req.body.side,asset=req.body.asset,amount=Number(req.body.amount);if(!["buy","sell"].includes(side)||!prices[asset]||!Number.isFinite(amount)||amount<=0)return res.status(400).json({error:"Ordre invalide."});const price=prices[asset],qty=amount/price;const tx=db.transaction(()=>{const w=db.prepare("SELECT cash FROM wallets WHERE user_id=?").get(req.user.sub);const h=db.prepare("SELECT quantity FROM holdings WHERE user_id=? AND asset=?").get(req.user.sub,asset);if(side==="buy"&&amount>w.cash)throw Error("Solde insuffisant.");if(side==="sell"&&qty>(h?.quantity||0))throw Error("Quantité insuffisante.");db.prepare("UPDATE wallets SET cash=cash+? WHERE user_id=?").run(side==="buy"?-amount:amount,req.user.sub);db.prepare("UPDATE holdings SET quantity=quantity+? WHERE user_id=? AND asset=?").run(side==="buy"?qty:-qty,req.user.sub,asset);db.prepare("INSERT INTO trades(user_id,side,asset,amount_eur,price_eur,quantity) VALUES(?,?,?,?,?,?)").run(req.user.sub,side,asset,amount,price,qty)});try{tx();res.status(201).json({ok:true})}catch(e){res.status(400).json({error:e.message})}});
app.listen(process.env.PORT||3000,()=>console.log("BitGold API ready"));
