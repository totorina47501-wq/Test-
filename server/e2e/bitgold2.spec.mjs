import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://accounts.google.com/**", route => route.abort());
});

test("visitor sees the BitGold V3 clean-slate landing and can open signup", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".visitor-hero h1")).toContainText("Explorez la crypto.");
  await expect(page.locator(".visitor-hero")).toContainText("Les marchés, votre portefeuille");
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

test("dashboard quick links are present in the delivered HTML", async ({ request }) => {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  const section = html.split('<div class="bg2-shortcuts"')[1]?.split('</div>')[0];
  expect(section, "dashboard shortcuts must be delivered to authenticated clients").toBeTruthy();
  for (const target of ['href="/investir"', 'href="#bots"', 'href="#portefeuille"', 'href="/activite"']) {
    expect(section).toContain(target);
  }
});
