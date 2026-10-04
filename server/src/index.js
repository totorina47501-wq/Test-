import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const { Pool } = pg;
const app = express();
const secret = process.env.JWT_SECRET || "dev-only-change-me";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is missing. The Northflank deployment requires PostgreSQL.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined
});

await pool.query(`
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wallets(
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  cash DOUBLE PRECISION NOT NULL DEFAULT 10000
);
CREATE TABLE IF NOT EXISTS holdings(
  user_id INTEGER NOT NULL REFERENCES users(id),
  asset TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, asset)
);
CREATE TABLE IF NOT EXISTS trades(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  side TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount_eur DOUBLE PRECISION NOT NULL,
  price_eur DOUBLE PRECISION NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 120, standardHeaders: true, legacyHeaders: false }));

const prices = { BTC: 67420.10, ETH: 3248.70, SOL: 154.20 };

function token(user) {
  return jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: "7d" });
}

function auth(req, res, next) {
  try {
    const p = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), secret);
    req.user = p;
    next();
  } catch {
    return res.status(401).json({ error: "Non authentifié" });
  }
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, service: "BitGold API" });
  } catch {
    res.status(503).json({ ok: false, service: "BitGold API" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!/^\\S+@\\S+\\.\\S+$/.test(email) || password.length < 8) {
    return res.status(400).json({ error: "Email valide et mot de passe de 8 caractères minimum requis." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hash = await bcrypt.hash(password, 12);
    const result = await client.query(
      "INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email",
      [email, hash]
    );
    const user = result.rows[0];
    await client.query("INSERT INTO wallets(user_id) VALUES($1)", [user.id]);
    for (const asset of Object.keys(prices)) {
      await client.query(
        "INSERT INTO holdings(user_id,asset,quantity) VALUES($1,$2,0)",
        [user.id, asset]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ token: token(user), email: user.email });
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") return res.status(409).json({ error: "Ce compte existe déjà." });
    res.status(500).json({ error: "Erreur serveur." });
  } finally {
    client.release();
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const u = result.rows[0];
    if (!u || !(await bcrypt.compare(password, u.password_hash))) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }
    res.json({ token: token(u), email: u.email });
  } catch {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.get("/api/me", auth, (req, res) => res.json({ id: req.user.sub, email: req.user.email }));

app.get("/api/market", (req, res) =>
  res.json(Object.entries(prices).map(([symbol, price]) => ({ symbol, price })))
);

app.get("/api/portfolio", auth, async (req, res) => {
  try {
    const [wallet, holdings, trades] = await Promise.all([
      pool.query("SELECT cash FROM wallets WHERE user_id=$1", [req.user.sub]),
      pool.query("SELECT asset,quantity FROM holdings WHERE user_id=$1", [req.user.sub]),
      pool.query(
        "SELECT side,asset,amount_eur,price_eur,quantity,created_at FROM trades WHERE user_id=$1 ORDER BY id DESC LIMIT 50",
        [req.user.sub]
      )
    ]);
    res.json({
      cash: wallet.rows[0]?.cash ?? 0,
      holdings: holdings.rows,
      trades: trades.rows
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.post("/api/trades", auth, async (req, res) => {
  const side = req.body.side;
  const asset = req.body.asset;
  const amount = Number(req.body.amount);
  if (!["buy", "sell"].includes(side) || !prices[asset] || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Ordre invalide." });
  }

  const price = prices[asset];
  const qty = amount / price;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const wallet = await client.query(
      "SELECT cash FROM wallets WHERE user_id=$1 FOR UPDATE",
      [req.user.sub]
    );
    const holding = await client.query(
      "SELECT quantity FROM holdings WHERE user_id=$1 AND asset=$2 FOR UPDATE",
      [req.user.sub, asset]
    );

    const cash = Number(wallet.rows[0]?.cash ?? 0);
    const currentQty = Number(holding.rows[0]?.quantity ?? 0);

    if (side === "buy" && amount > cash) throw new Error("Solde insuffisant.");
    if (side === "sell" && qty > currentQty) throw new Error("Quantité insuffisante.");

    await client.query(
      "UPDATE wallets SET cash=cash+$1 WHERE user_id=$2",
      [side === "buy" ? -amount : amount, req.user.sub]
    );
    await client.query(
      "UPDATE holdings SET quantity=quantity+$1 WHERE user_id=$2 AND asset=$3",
      [side === "buy" ? qty : -qty, req.user.sub, asset]
    );
    await client.query(
      "INSERT INTO trades(user_id,side,asset,amount_eur,price_eur,quantity) VALUES($1,$2,$3,$4,$5,$6)",
      [req.user.sub, side, asset, amount, price, qty]
    );

    await client.query("COMMIT");
    res.status(201).json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message || "Erreur serveur." });
  } finally {
    client.release();
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`BitGold API ready on port ${port}`));
