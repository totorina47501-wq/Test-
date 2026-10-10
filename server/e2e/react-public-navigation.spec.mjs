import { test, expect } from "@playwright/test";

test("public React navigation reaches Investir, bots and cockpit", async ({ page }) => {
  const home = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(home?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /Explorez, comprenez et simulez avec BitGold/ })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  const cockpit = nav.getByRole("link", { name: /Cockpit/ });
  await expect(cockpit).toHaveAttribute("href", "/#cockpit");
  await cockpit.click();
  await expect(page).toHaveURL(/\/#cockpit$/);
  await expect(page.locator("#cockpit")).toBeVisible();

  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Investir" }).click();
  await expect(page.getByRole("heading", { name: "Investir", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Bots IA" }).click();
  await expect(page.getByRole("heading", { name: "Comparer les bots BitGold" })).toBeVisible();
});
