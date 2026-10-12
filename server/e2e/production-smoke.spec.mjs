import { test, expect } from "@playwright/test";

const prod = process.env.BITGOLD_PROD_URL || "https://p01--service-bitgold--dvn9t2gvmtgx.code.run";
test.use({ baseURL: prod, storageState: { cookies: [], origins: [] } });

test("guest homepage and login modal", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /Explorez la crypto/i })).toBeVisible();
  await expect(page.getByText("Environnement de simulation. Aucun ordre réel, aucun dépôt et aucune promesse de rendement.")).toBeVisible();
  await page.getByRole("button", { name: /Se connecter/i }).first().click();
  const dialog = page.getByRole("dialog", { name: "Authentification BitGold" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(errors).toEqual([]);
});

test("guest Investir page loads", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/investir", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Investir" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("expired JWT is rejected on live production", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bitgold-token", "invalid.jwt.token"));
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bitgold-token"))).toBeNull();
  await expect(page.getByRole("heading", { name: /Explorez la crypto/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Se connecter" }).first()).toBeVisible();
});
