import { test, expect } from "@playwright/test";

const prod = process.env.BITGOLD_PROD_URL || "https://p01--service-bitgold--dvn9t2gvmtgx.code.run";
test.use({ baseURL: prod, storageState: { cookies: [], origins: [] }, trace: "off", screenshot: "off", video: "off" });

test.setTimeout(90000);
test.skip(!process.env.BITGOLD_E2E_EMAIL || !process.env.BITGOLD_E2E_PASSWORD, "Production credentials only available in dedicated smoke workflow");

test("production authenticated profile, 2FA status and bot backtest are read-only", async ({ page }) => {
  const email = process.env.BITGOLD_E2E_EMAIL;
  const password = process.env.BITGOLD_E2E_PASSWORD;
  if (!email || !password) throw new Error("Missing dedicated production E2E credentials");

  await page.addInitScript(() => localStorage.setItem("bitgold-language", "fr"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Se connecter|Log in|Sign in/i }).first().click();
  const dialog = page.getByRole("dialog", { name: /Authentification BitGold|BitGold authentication/i });
  await dialog.getByLabel("E-mail").fill(email);
  await dialog.getByLabel("Mot de passe").fill(password);
  await dialog.getByRole("button", { name: "Connexion", exact: true }).last().click();
  if (await dialog.getByText("Vérification en deux étapes").isVisible().catch(() => false)) {
    throw new Error("Dedicated test account requires 2FA; do not bypass the challenge");
  }
  await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible({ timeout: 15000 });

  // Read-only checks: never mutate profile, 2FA settings or bot subscriptions.
  const profileResponse = await page.request.get("/api/me", {
    headers: { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem("bitgold-token"))}` }
  });
  expect(profileResponse.status()).toBe(200);
  const profile = await profileResponse.json();
  expect(profile.email).toBe(email);

  const token = await page.evaluate(() => localStorage.getItem("bitgold-token"));
  expect(token).toBeTruthy();
  const securityResponse = await page.request.get("/api/security", {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(securityResponse.status()).toBe(200);
  const security = await securityResponse.json();
  expect(typeof security.twoFA?.enabled).toBe("boolean");
  // Never log the token, password or any recovery secret.

  const botsResponse = await page.request.get("/api/bots", {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(botsResponse.status()).toBe(200);
  const bots = await botsResponse.json();
  expect(Array.isArray(bots.catalog)).toBe(true);
  const botId = bots.catalog.find(bot => ["shield", "silver", "gold"].includes(bot.id))?.id;
  expect(botId, "Expected at least one existing simulation bot").toBeTruthy();

  const backtestResponse = await page.request.get(`/api/bots/${encodeURIComponent(botId)}/backtest?days=30`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 60000
  });
  if (backtestResponse.status() !== 200) {
    const responseBody = await backtestResponse.text();
    throw new Error(`Production backtest returned HTTP ${backtestResponse.status()}: ${responseBody.slice(0, 500)}. Check Northflank rollout and [BOT-AI] logs.`);
  }
  const backtest = await backtestResponse.json();
  expect(backtest.ok).toBe(true);
  expect(backtest.backtest).toBeTruthy();
  expect(typeof backtest.backtest).toBe("object");

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  const denied = await page.request.get("/api/me", { headers: { Authorization: "Bearer invalid.jwt.token" } });
  expect(denied.status()).toBe(401);
});
