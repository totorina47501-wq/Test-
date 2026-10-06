import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { generate, generateSecret, verify } from "otplib";
import pg from "pg";

const { Pool } = pg;
const port = 3217;
const baseUrl = `http://127.0.0.1:${port}`;
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bitgold_test";
const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret-32-characters-minimum-0001";
const twoFactorEncryptionKey = process.env.TWO_FACTOR_ENCRYPTION_KEY || "test-two-factor-encryption-key-32chars";

let serverProcess;
let pool;

async function waitForHealth(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw lastError || new Error("API health check timed out");
}

async function request(path, options = {}) {
  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test.before(async () => {
  pool = new Pool({ connectionString: databaseUrl });
  await pool.query("SELECT 1");

  serverProcess = spawn(process.execPath, ["src/index.js"], {
    cwd: new URL("..", import.meta.url).pathname.replace(/\\/g, "/"),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NODE_ENV: "test",
      JWT_SECRET: jwtSecret,
      TWO_FACTOR_ENCRYPTION_KEY: twoFactorEncryptionKey,
      PORT: String(port)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stderr = "";
  serverProcess.stderr.on("data", chunk => { stderr += chunk.toString(); });
  serverProcess.on("exit", code => {
    if (code !== null && code !== 0) console.error("2FA E2E server exited:", code, stderr);
  });

  await waitForHealth();
});

test.after(async () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill("SIGTERM");
  await pool?.end();
});

test("signup -> login -> enable 2FA -> login challenge -> TOTP/recovery -> disable", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e-${suffix}@example.com`;
  const password = "Correct-Horse-Battery-42!";
  const profile = {
    email,
    password,
    first_name: "E2E",
    last_name: "Test",
    country: "France",
    city: "Paris",
    postal_code: "75001"
  };

  const signup = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(profile)
  });
  assert.equal(signup.response.status, 201);
  assert.ok(signup.body.token);

  const normalLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  assert.equal(normalLogin.response.status, 200);
  assert.ok(normalLogin.body.token);

  const authHeaders = { authorization: `Bearer ${signup.body.token}` };
  const setup = await request("/api/security/2fa/setup", {
    method: "POST",
    headers: authHeaders,
    body: "{}"
  });
  assert.equal(setup.response.status, 200);
  assert.match(setup.body.secret, /^[A-Z2-7]+=*$/);
  assert.match(setup.body.qr, /^data:image\/png;base64,/);

  const secret = setup.body.secret;
  const setupCode = await generate({ secret });
  const enable = await request("/api/security/2fa/enable", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ code: setupCode })
  });
  assert.equal(enable.response.status, 200);
  assert.equal(enable.body.ok, true);
  assert.equal(enable.body.recoveryCodes.length, 8);
  assert.ok(enable.body.recoveryCodes.every(code => /^[A-Z0-9]{20}$/.test(code)));

  const security = await request("/api/security", { headers: authHeaders });
  assert.equal(security.response.status, 200);
  assert.equal(security.body.twoFA.enabled, true);

  const challengeLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  assert.equal(challengeLogin.response.status, 200);
  assert.equal(challengeLogin.body.requires2FA, true);
  assert.ok(challengeLogin.body.challengeToken);

  const badTotp = await request("/api/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeToken: challengeLogin.body.challengeToken,
      code: "000000"
    })
  });
  assert.equal(badTotp.response.status, 401);

  const validTotp = await generate({ secret });
  const verified = await request("/api/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeToken: challengeLogin.body.challengeToken,
      code: validTotp
    })
  });
  assert.equal(verified.response.status, 200);
  assert.ok(verified.body.token);

  const replay = await request("/api/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeToken: challengeLogin.body.challengeToken,
      code: validTotp
    })
  });
  assert.equal(replay.response.status, 401);

  const recoveryChallenge = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  assert.equal(recoveryChallenge.body.requires2FA, true);

  const recoveryCode = enable.body.recoveryCodes[0];
  const recoveryLogin = await request("/api/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeToken: recoveryChallenge.body.challengeToken,
      code: recoveryCode
    })
  });
  assert.equal(recoveryLogin.response.status, 200);
  assert.ok(recoveryLogin.body.token);

  const reusedRecoveryChallenge = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const reusedRecovery = await request("/api/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeToken: reusedRecoveryChallenge.body.challengeToken,
      code: recoveryCode
    })
  });
  assert.equal(reusedRecovery.response.status, 401);

  const disableCode = await generate({ secret });
  const disable = await request("/api/security/2fa/disable", {
    method: "POST",
    headers: { authorization: `Bearer ${verified.body.token}` },
    body: JSON.stringify({ password, code: disableCode })
  });
  assert.equal(disable.response.status, 200);
  assert.equal(disable.body.ok, true);

  const finalLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  assert.equal(finalLogin.response.status, 200);
  assert.ok(finalLogin.body.token);

  const row = await pool.query(
    "SELECT enabled, recovery_code_hashes, challenge_jti, challenge_used_at FROM user_2fa WHERE user_id=(SELECT id FROM users WHERE email=$1)",
    [email]
  );
  assert.equal(row.rows[0].enabled, false);
  assert.deepEqual(row.rows[0].recovery_code_hashes, []);
});

test("TOTP library remains compatible with otplib v13", async () => {
  const secret = generateSecret();
  const token = await generate({ secret });
  assert.match(token, /^\d{6}$/);
  assert.equal((await verify({ secret, token })).valid, true);
  assert.equal((await verify({ secret, token: "000000" })).valid, false);
});
