import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const prod = process.env.BITGOLD_PROD_URL || "https://p01--service-bitgold--dvn9t2gvmtgx.code.run";
test.use({
  baseURL: prod,
  storageState: { cookies: [], origins: [] },
  trace: "off",
  screenshot: "off",
  video: "off"
});

test.setTimeout(90000);

test("production authenticated account is readable without mutations", async ({ page }) => {
  const email = process.env.BITGOLD_E2E_EMAIL;
  const password = process.env.BITGOLD_E2E_PASSWORD;
  if (!email || !password) throw new Error("Missing BITGOLD_E2E_EMAIL or BITGOLD_E2E_PASSWORD GitHub Actions secrets");

  await page.addInitScript(() => localStorage.setItem("bitgold-language", "fr"));
  const home = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(home?.status()).toBe(200);
  await page.getByRole("button", { name: /Se connecter|Log in|Sign in/i }).first().click();
  const dialog = page.getByRole("dialog", { name: /Authentification BitGold|BitGold authentication/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("E-mail").fill(email);
  await dialog.getByLabel("Mot de passe").fill(password);
  await dialog.getByRole("button", { name: "Connexion", exact: true }).last().click();

  // Do not bypass the 2FA challenge; a 2FA-enabled test account needs a separate safe flow.
  if (await dialog.getByText("Vérification en deux étapes").isVisible().catch(() => false)) {
    throw new Error("Test account requires 2FA; configure a dedicated secure 2FA test flow");
  }
  await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("region", { name: "Cockpit connecté" })).toBeVisible();
  await expect(page.getByText("Solde total").first()).toBeVisible();
  const capture = process.env.BITGOLD_CAPTURE_AUTH === "true";
  const dest = "test-results/auth-showcase";
  if (capture) {
    await mkdir(dest, { recursive: true });
    await page.screenshot({ path: dest + "/cockpit-" + test.info().project.name + ".png", animations: "disabled" });
  }

  for (const [url, heading] of [
    ["/portefeuille", "Portefeuille"],
    ["/activite", "Activités"],
    ["/investir", "Investir"],
    ["/bots", "Bots IA"]
  ]) {
    const response = await page.goto(url, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(url+"(?:[?#]|$)"));
    if (capture) {
      await page.screenshot({ path: dest + "/" + url.slice(1) + "-" + test.info().project.name + ".png", animations: "disabled", fullPage: true });
    }
  }
  // Browser history must restore the screen matching the URL, not stale content.
  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Investir", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bots IA", exact: true })).toHaveCount(0);
  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Activités", exact: true })).toBeVisible();
  await page.goForward({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Investir", exact: true })).toBeVisible();
  const botsReturn = await page.goto("/bots", { waitUntil: "domcontentloaded" });
  expect(botsReturn?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Bots IA", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comparateur de stratégies" })).toBeVisible();
  // Validate the real authenticated bot configuration preview without activating a bot.
  for (const botName of ["Shield", "Silver", "Gold"]) {
    const card = page.getByRole("button", { name: `Configurer ${botName}` });
    await expect(card).toBeVisible({ timeout: 15000 });
  }
  // Scenario lab is only shown after selecting a strategy; do not mutate subscriptions.
  await page.getByRole("button", { name: "Configurer Shield" }).click();
  await expect(page.getByText("Strategy DNA · Laboratoire")).toBeVisible();
  const cashSlider = page.getByRole("slider", { name: "Liquidités du laboratoire" });
  await expect(cashSlider).toBeVisible();
  await cashSlider.fill("80");
  await expect(page.getByText("Réserve de liquidités : 80 %")).toBeVisible();
  await expect(page.getByText("Hausse rapide (+15 %)")).toBeVisible();
  await expect(page.getByText("Chute brutale (-25 %)")).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  // Bots become public after logout; private portfolio access must still be denied.
  await expect(page.getByRole("heading", { name: "Comparer les bots BitGold" })).toBeVisible();
  const privateResponse = await page.goto("/portefeuille", { waitUntil: "domcontentloaded" });
  expect(privateResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Connexion requise" })).toBeVisible();
});
