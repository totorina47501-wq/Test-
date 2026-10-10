import { test, expect } from "@playwright/test";

const prod = process.env.BITGOLD_PROD_URL || "https://p01--service-bitgold--dvn9t2gvmtgx.code.run";
test.use({ baseURL: prod, storageState: { cookies: [], origins: [] } });

test("guest homepage and login modal", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /Explorez, comprenez et simulez avec BitGold/i })).toBeVisible();
  await expect(page.getByText("Simulation uniquement · aucun ordre réel")).toBeVisible();
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
