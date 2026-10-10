import { test, expect } from "@playwright/test";

const preview = "/react-preview/?view=portfolio";

test("React account space covers portfolio, activity and bot strategy management", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bitgold-token", "account-e2e-token"));

  await page.route("**/api/portfolio", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      cash: 6200,
      invested: 3800,
      total: 10000,
      positions: [
        { asset: "BTC", quantity: 0.04, price: 70000, value: 2800, allocation: 28 },
        { asset: "ETH", quantity: 0.3, price: 3333.33, value: 1000, allocation: 10 }
      ],
      trades: [],
      integrity: { ok: true }
    })
  }));

  await page.route("**/api/activity", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      trades: [{ side: "buy", asset: "BTC", amount_eur: 500, price_eur: 70000, quantity: 0.0071, created_at: "2026-10-10T14:00:00Z" }],
      botLogs: [{ bot_type: "shield", action: "hold", asset: "BTC", message: "Position maintenue.", created_at: "2026-10-10T14:05:00Z" }]
    })
  }));

  const bots = {
    plan: { plan: "pro" },
    items: [{ bot_type: "shield", active: true, max_trade_eur: 500, max_position_eur: 2500, stop_loss_pct: 5, min_cash_pct: 20 }],
    activity: [],
    catalog: [
      { id: "shield", name: "Shield Bot", tier: "SHIELD", plan: "free", risk: "Prudent", allocation: 25, summary: "Protection du capital", strategy: "Défensive", compatible_assets: ["BTC","ETH"] },
      { id: "silver", name: "Silver Bot", tier: "SILVER", plan: "pro", risk: "Modéré", allocation: 45, summary: "Équilibre tendance", strategy: "Momentum", compatible_assets: ["BTC","ETH","SOL"] },
      { id: "gold", name: "Gold Bot", tier: "GOLD", plan: "pro", risk: "Élevé", allocation: 65, summary: "Détection bull run", strategy: "Momentum offensif", compatible_assets: ["BTC","ETH"] }
    ]
  };
  await page.route("**/api/bots", route => route.fulfill({ contentType: "application/json", body: JSON.stringify(bots) }));

  let subscriptionPayload = null;
  await page.route("**/api/bots/subscriptions", async route => {
    subscriptionPayload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await page.goto(preview);

  await expect(page.getByRole("heading", { name: "Portefeuille" })).toBeVisible();
  await expect(page.getByText("10\u202f000,00\u00a0€")).toBeVisible();
  await expect(page.getByText("BTC")).toBeVisible();

  await page.getByRole("button", { name: "Activités" }).click();
  await expect(page.getByRole("heading", { name: "Activités" })).toBeVisible();
  await expect(page.getByText("Achat BTC")).toBeVisible();
  await expect(page.getByText("Position maintenue.")).toBeVisible();

  await page.getByRole("button", { name: "Bots IA" }).click();
  await expect(page.getByRole("heading", { name: "Bots IA" })).toBeVisible();
  await expect(page.getByText("Shield Bot")).toBeVisible();
  await expect(page.getByText("Silver Bot")).toBeVisible();
  await expect(page.getByText("Gold Bot")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comparateur de stratégies" })).toBeVisible();

  await page.getByRole("button", { name: /Configurer Silver Bot/ }).click();
  await page.getByLabel("Limite par ordre").fill("750");
  await page.getByRole("button", { name: "Activer Silver Bot" }).click();
  await expect(page.getByText("Silver Bot activé en simulation")).toBeVisible();
  expect(subscriptionPayload).toMatchObject({ botType: "silver", maxTradeEur: 750 });
});

test("React account space has no mobile horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.addInitScript(() => localStorage.setItem("bitgold-token", "account-mobile-token"));
  await page.route("**/api/portfolio", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ cash: 10000, invested: 0, total: 10000, positions: [], trades: [], integrity: { ok: true } }) }));
  await page.route("**/api/activity", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ trades: [], botLogs: [] }) }));
  await page.route("**/api/bots", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ plan: { plan: "free" }, items: [], activity: [], catalog: [] }) }));
  await page.goto(preview);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
});
