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
    { filename: "investir.png", path: "/investir", selector: "main" },
    { filename: "cockpit.png", path: "/#dashboard", selector: "main" },
    { filename: "bots.png", path: "/#bots", selector: "#bots" },
    { filename: "activite.png", path: "/activite", selector: "main" },
    { filename: "transparence.png", path: "/#transparence", selector: "#transparence" }
  ];
  for (const screen of screens) {
    const response = await page.goto(baseURL + screen.path, { waitUntil: "domcontentloaded" });
    if (!response?.ok()) throw new Error("Screenshot page unavailable: " + screen.path);
    await page.locator(screen.selector).first().waitFor({ state: "visible" });
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll("iframe").forEach(node => node.remove()); });
    await page.screenshot({ path: new URL(screen.filename, dest).pathname, animations: "disabled", timeout: 15000 });
  }
} finally {
  await browser.close();
}
