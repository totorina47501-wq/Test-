import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://accounts.google.com/**", route => route.abort());
});

test("visitor sees the BitGold V3 clean-slate landing and can open signup", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".visitor-hero h1")).toContainText("Explorez la crypto.");
  await expect(page.locator(".visitor-hero")).toContainText("Comprenez les marchés, suivez un portefeuille virtuel");
  await expect(page.locator("#heroSignup")).toBeVisible();
  await page.locator("#heroSignup").click();
  await expect(page.locator("#authEmail")).toBeVisible();
});

test("responsive shell keeps the landing usable without horizontal overflow", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator('link[href="bitgold-2.css?v=20261009-mint2"]')).toHaveCount(1);
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

test("visitor demo opens and closes with Escape without leaving a blocking overlay", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#heroDemo").click();
  await expect(page.locator("#demoModal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#demoModal")).toBeHidden();
  await expect(page.locator("body")).not.toHaveClass(/modal-open/);
  await page.locator("#heroSignup").click();
  await expect(page.locator("#authEmail")).toBeVisible();
});

test("mobile navigation closes on Escape and keeps its ARIA state in sync", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile navigation only");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const toggle = page.locator("#menuToggle");
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#mainNav")).not.toHaveClass(/menu-open/);
});

test("visitor can reach markets and bots without authentication", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#marches")).toBeAttached();
  await expect(page.locator("#bots")).toBeAttached();
  await page.locator('.bg3-feature-row a[href="#bots"]').click();
  await expect(page).toHaveURL(/#bots$/);
});
