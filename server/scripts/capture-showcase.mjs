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
  // Capture the actual React account components with isolated, deterministic synthetic API data.
  // Never capture a real user session or copy production balances into public assets.
  await page.unrouteAll({ behavior: "wait" });
  await page.addInitScript(() => localStorage.setItem("bitgold-token", "showcase-isolated-test-token"));
  const mock = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  await page.route("**/api/portfolio", route => route.fulfill(mock({
    cash: 6200, invested: 3800, total: 10000, integrity: { ok: true }, trades: [],
    positions: [
      { asset: "BTC", quantity: 0.04, price: 70000, value: 2800, allocation: 28 },
      { asset: "ETH", quantity: 0.3, price: 3333.33, value: 1000, allocation: 10 }
    ]
  })));
  await page.route("**/api/activity", route => route.fulfill(mock({
    trades: [{ side: "buy", asset: "BTC", amount_eur: 500, price_eur: 70000, quantity: 0.0071, created_at: "2026-10-10T14:00:00Z" }],
    botLogs: [{ bot_type: "shield", action: "hold", asset: "BTC", message: "Position maintenue.", created_at: "2026-10-10T14:05:00Z" }]
  })));
  await page.route("**/api/bots", route => route.fulfill(mock({
    plan: { plan: "pro" }, items: [{ bot_type: "shield", active: true, max_trade_eur: 500, max_position_eur: 2500, stop_loss_pct: 5, min_cash_pct: 20 }], activity: [],
    catalog: [
      { id: "shield", name: "Shield Bot", tier: "SHIELD", plan: "free", risk: "Prudent", allocation: 25, summary: "Protection du capital", strategy: "Défensive", compatible_assets: ["BTC","ETH"] },
      { id: "silver", name: "Silver Bot", tier: "SILVER", plan: "pro", risk: "Modéré", allocation: 45, summary: "Équilibre tendance", strategy: "Momentum", compatible_assets: ["BTC","ETH","SOL"] },
      { id: "gold", name: "Gold Bot", tier: "GOLD", plan: "pro", risk: "Élevé", allocation: 65, summary: "Détection bull run", strategy: "Momentum offensif", compatible_assets: ["BTC","ETH"] }
    ]
  })));
  await page.goto(baseURL + "/react-preview/?view=portfolio", { waitUntil: "domcontentloaded" });
  const heading = name => page.getByRole("heading", { name, exact: true });
  await heading("Portefeuille").waitFor({ state: "visible", timeout: 15000 });
  await page.getByText("BTC", { exact: true }).first().waitFor({ state: "visible" });
  await page.screenshot({ path: new URL("portfolio-auth-demo.png", dest).pathname, animations: "disabled" });
  for (const screen of [
    { tab: "Bots IA", heading: "Bots IA", filename: "bots-auth-demo.png" },
    { tab: "Activités", heading: "Activités", filename: "activity-auth-demo.png" }
  ]) {
    await page.getByRole("button", { name: screen.tab, exact: true }).click();
    await heading(screen.heading).waitFor({ state: "visible" });
    if (screen.tab === "Bots IA") await heading("Shield Bot").waitFor({ state: "visible" });
    else await page.getByText("Achat BTC").waitFor({ state: "visible" });
    await page.screenshot({ path: new URL(screen.filename, dest).pathname, animations: "disabled" });
  }
  await page.unrouteAll({ behavior: "wait" });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  // Mobile screenshot of the actual public landing, never an authenticated account.
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.goto(baseURL + "/react-preview/?showcase=1", { waitUntil: "domcontentloaded" });
  if (!mobile?.ok()) throw new Error("Mobile landing unavailable");
  await page.locator(".bg-landing .hero").waitFor({ state: "visible" });
  await page.screenshot({ path: new URL("landing-mobile.png", dest).pathname, animations: "disabled", timeout: 15000 });
} finally {
  await browser.close();
}
