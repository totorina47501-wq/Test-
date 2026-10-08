import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://accounts.google.com/**", route => route.abort());
});

test("visitor sees the simplified BitGold 2.0 landing and can open signup", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".visitor-hero h1")).toContainText("Votre crypto. Vos stratégies.");
  await expect(page.locator(".visitor-hero")).toContainText("portefeuille virtuel");
  await expect(page.locator("#heroSignup")).toBeVisible();
  await page.locator("#heroSignup").click();
  await expect(page.locator("#authEmail")).toBeVisible();
});

test("responsive shell keeps the landing usable without horizontal overflow", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator('link[href="bitgold-2.css?v=1"]')).toHaveCount(1);
  await expect(page.locator(".visitor-hero h1")).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow, `horizontal overflow on ${isMobile ? "mobile" : "desktop"}`).toBe(false);
});

test("authenticated dashboard navigation is not shown to visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".bg2-mobile-tabs")).toBeHidden();
  await expect(page.locator("#dashboard")).toBeHidden();
});

test("dashboard quick links preserve functional destinations", async ({ page }) => {
  await page.goto("/");
  const shortcuts = page.locator(".bg2-shortcuts a");
  await expect(shortcuts).toHaveCount(4);
  await expect(shortcuts.nth(0)).toHaveAttribute("href", "/investir");
  await expect(shortcuts.nth(1)).toHaveAttribute("href", "#bots");
  await expect(shortcuts.nth(2)).toHaveAttribute("href", "#portefeuille");
  await expect(shortcuts.nth(3)).toHaveAttribute("href", "/activite");
});
