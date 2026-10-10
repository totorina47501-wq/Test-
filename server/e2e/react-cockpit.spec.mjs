import { test, expect } from "@playwright/test";

const preview = "/react-preview/";

test("authenticated React cockpit exposes OHLC ranges and recent simulated transactions", async ({ page }) => {
  const token = "e2e-authenticated-cockpit-token";

  await page.route("**/api/dashboard", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      updatedAt: Date.now(),
      portfolio: {
        cash: 7000, invested: 3000, total: 10000, initialCapital: 10000,
        returnEur: 0, returnPct: 0, cashPct: 70,
        positions: [{ asset: "BTC", quantity: 0.04, price: 75000, value: 3000, allocation: 30 }]
      },
      performance: { label: "Depuis le début", returnEur: 0, returnPct: 0, trades: 2, buys: 1, sells: 1 },
      risk: { score: 24, label: "Maîtrisé", concentration: 30, cashPct: 70, activeBots: 0 },
      subscription: { plan: "free", label: "BitGold Free", botLimit: 1 },
      market: { regime: "Neutre", leader: { symbol: "BTC", change24h: 1.2 }, weakest: { symbol: "ETH", change24h: -0.4 } },
      activity: [],
      integrity: { ok: true }
    })
  }));

  await page.route("**/api/dashboard/analytics", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      performance: { points: [{ date: "2026-10-09", total: 9900 }, { date: "2026-10-10", total: 10000 }] }
    })
  }));

  await page.route("**/api/activity", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      botLogs: [],
      trades: [
        { side: "buy", asset: "BTC", amount_eur: 1000, price_eur: 70000, quantity: 0.01428571, created_at: "2026-10-10T10:00:00Z" },
        { side: "sell", asset: "ETH", amount_eur: 250, price_eur: 3500, quantity: 0.07142857, created_at: "2026-10-10T11:00:00Z" }
      ]
    })
  }));

  await page.route("**/api/market/details/BTC?range=*", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      symbol: "BTC",
      name: "Bitcoin",
      history: {
        range: new URL(route.request().url()).searchParams.get("range"),
        label: "24 h",
        points: [
          { timestamp: 1791622800000, price: 70000 },
          { timestamp: 1791626400000, price: 70500 },
          { timestamp: 1791630000000, price: 69900 },
          { timestamp: 1791633600000, price: 71000 },
          { timestamp: 1791637200000, price: 71500 },
          { timestamp: 1791640800000, price: 71200 }
        ]
      }
    })
  }));

  await page.addInitScript(value => localStorage.setItem("bitgold-token", value), token);
  await page.goto(preview);

  await expect(page.getByRole("heading", { name: "Marché BTC" })).toBeVisible();
  await expect(page.getByRole("button", { name: "24 h" })).toBeVisible();
  await expect(page.getByRole("button", { name: "7 jours" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Chandeliers OHLC BTC" })).toBeVisible();

  await page.getByRole("button", { name: "7 jours" }).click();
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType("resource").some(entry => entry.name.includes("/api/market/details/BTC?range=7d")))).toBeTruthy();

  await expect(page.getByRole("heading", { name: "Transactions récentes" })).toBeVisible();
  await expect(page.getByText("Achat BTC")).toBeVisible();
  await expect(page.getByText("Vente ETH")).toBeVisible();
});
