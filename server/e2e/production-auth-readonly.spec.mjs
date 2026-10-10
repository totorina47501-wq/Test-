import { test, expect } from "@playwright/test";

const prod = process.env.BITGOLD_PROD_URL || "https://p01--service-bitgold--dvn9t2gvmtgx.code.run";
test.use({
  baseURL: prod,
  storageState: { cookies: [], origins: [] },
  trace: "off",
  screenshot: "off",
  video: "off"
});

test("production authenticated account is readable without mutations", async ({ page }) => {
  const email = process.env.BITGOLD_E2E_EMAIL;
  const password = process.env.BITGOLD_E2E_PASSWORD;
  if (!email || !password) throw new Error("Missing BITGOLD_E2E_EMAIL or BITGOLD_E2E_PASSWORD GitHub Actions secrets");

  const home = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(home?.status()).toBe(200);
  await page.getByRole("button", { name: "Se connecter" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Authentification BitGold" });
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

  for (const [url, heading] of [
    ["/portefeuille", "Portefeuille"],
    ["/activite", "Activités"],
    ["/bots", "Bots IA"]
  ]) {
    const response = await page.goto(url, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Comparateur de stratégies" })).toBeVisible();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  // Bots become public after logout; private portfolio access must still be denied.
  await expect(page.getByRole("heading", { name: "Comparer les bots BitGold" })).toBeVisible();
  const privateResponse = await page.goto("/portefeuille", { waitUntil: "domcontentloaded" });
  expect(privateResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Connexion requise" })).toBeVisible();
});
