// Screenshots are produced from the real BitGold application running locally.
// No credentials, real users, portfolio values or fabricated performances are used.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.BITGOLD_CAPTURE_URL || "http://127.0.0.1:3000";
const dest = new URL("../public/showcase/", import.meta.url);
await mkdir(dest, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale: "fr-FR", colorScheme: "dark", reducedMotion: "reduce" });
  await context.route("https://accounts.google.com/**", route => route.abort());
  const page = await context.newPage();
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
  const screens = [
    { filename: "landing-desktop.png", path: "/react-preview/?showcase=1", selector: ".bg-landing .hero" },
    { filename: "investir.png", path: "/investir", selector: "body" },
    { filename: "cockpit.png", path: "/#dashboard", selector: "body" }
  ];
  for (const screen of screens) {
    const response = await page.goto(baseURL + screen.path, { waitUntil: "domcontentloaded" });
    if (!response?.ok()) throw new Error("Screenshot page unavailable: " + screen.path);
    await page.locator(screen.selector).first().waitFor({ state: "visible" });
    await page.waitForTimeout(350);
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll("iframe").forEach(node => node.remove()); });
    const visibleAuthDialog = await page.getByText("Connexion BitGold", { exact: true }).isVisible();
    if (visibleAuthDialog) throw new Error("Protected or authentication-only capture rejected: " + screen.path);
    await page.screenshot({ path: new URL(screen.filename, dest).pathname, animations: "disabled", timeout: 15000 });
  }
  // Mobile screenshot of the actual public landing, never an authenticated account.
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.goto(baseURL + "/react-preview/?showcase=1", { waitUntil: "domcontentloaded" });
  if (!mobile?.ok()) throw new Error("Mobile landing unavailable");
  await page.locator(".bg-landing .hero").waitFor({ state: "visible" });
  await page.screenshot({ path: new URL("landing-mobile.png", dest).pathname, animations: "disabled", timeout: 15000 });
} finally {
  await browser.close();
}
