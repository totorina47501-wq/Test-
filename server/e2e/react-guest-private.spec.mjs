import { test, expect } from "@playwright/test";

test("guest private routes require authentication on desktop and mobile", async ({ page }) => {
  for (const path of ["/portefeuille", "/activite"]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Connexion requise" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Se déconnecter" })).toHaveCount(0);
  }
});

test("guest bots comparison stays public without exposing account actions", async ({ page }) => {
  const response = await page.goto("/bots", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Comparer les bots BitGold" })).toBeVisible();
  for (const name of ["Shield", "Silver", "Gold"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: /Configurer|Activer|Désactiver/ })).toHaveCount(0);
});
