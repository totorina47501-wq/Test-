import { test, expect } from "@playwright/test";

const preview = "/react-preview/?view=investir";

test("React Investir shows EUR markets, crypto details, ranges and submits simulated buy through existing API", async ({ page }) => {
  const market = {
    updatedAt: Date.now(),
    source: "CoinGecko",
    markets: [
      { symbol: "BTC", price: 68000, change24h: 2.4, marketCap: 1200000000000, volume24h: 18000000000 },
      { symbol: "ETH", price: 3400, change24h: -1.1, marketCap: 410000000000, volume24h: 9000000000 },
      { symbol: "SOL", price: 160, change24h: 0.7, marketCap: 75000000000, volume24h: 2800000000 }
    ]
  };

  await page.route("**/api/market", route => route.fulfill({ contentType: "application/json", body: JSON.stringify(market) }));
  await page.route("**/api/market/details/*", route => {
    const url = new URL(route.request().url());
    const symbol = url.pathname.split("/").pop();
    const range = url.searchParams.get("range") || "24h";
    const base = symbol === "ETH" ? 3400 : symbol === "SOL" ? 160 : 68000;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        symbol,
        name: symbol === "ETH" ? "Ethereum" : symbol === "SOL" ? "Solana" : "Bitcoin",
        price: base,
        change24h: symbol === "ETH" ? -1.1 : 2.4,
        marketCap: 410000000000,
        volume24h: 9000000000,
        history: {
          range,
          label: range,
          min: base * 0.98,
          max: base * 1.02,
          points: [
            { timestamp: 1791622800000, price: base * 0.99 },
            { timestamp: 1791626400000, price: base * 1.01 },
            { timestamp: 1791630000000, price: base }
          ]
        },
        source: "CoinGecko"
      })
    });
  });

  let tradePayload = null;
  let tradeAuth = "";
  await page.route("**/api/trades", async route => {
    tradePayload = route.request().postDataJSON();
    tradeAuth = route.request().headers().authorization || "";
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, tradeId: 77 }) });
  });

  await page.addInitScript(() => localStorage.setItem("bitgold-token", "investir-e2e-token"));
  await page.goto(preview);

  await expect(page.getByRole("heading", { name: "Investir" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bitcoin/ }).getByText("68\u202f000,00\u00a0€")).toBeVisible();
  await page.getByRole("button", { name: /Ethereum/ }).click();

  await expect(page.getByRole("heading", { name: "Ethereum" })).toBeVisible();
  await expect(page.getByRole("button", { name: "7 jours" })).toBeVisible();
  await page.getByRole("button", { name: "7 jours" }).click();
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType("resource").some(entry => entry.name.includes("/api/market/details/ETH?range=7d")))).toBeTruthy();

  await page.getByLabel("Montant en euros").fill("500");
  await expect(page.getByText(/≈ 0,147/)).toBeVisible();
  await page.getByRole("button", { name: "Acheter en simulation" }).click();

  await expect(page.getByText("Ordre simulé enregistré")).toBeVisible();
  expect(tradePayload).toEqual({ side: "buy", asset: "ETH", amount: 500 });
  expect(tradeAuth).toBe("Bearer investir-e2e-token");
});

test("React Investir stays responsive on mobile without horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.route("**/api/market", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ updatedAt: Date.now(), source: "CoinGecko", markets: [{ symbol: "BTC", price: 68000, change24h: 1.2 }] })
  }));
  await page.route("**/api/market/details/BTC?range=*", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      symbol: "BTC", name: "Bitcoin", price: 68000, change24h: 1.2,
      history: { range: "24h", label: "24 h", min: 67000, max: 69000, points: [
        { timestamp: 1791622800000, price: 67500 },
        { timestamp: 1791626400000, price: 68000 }
      ] }
    })
  }));
  await page.goto(preview);
  await expect(page.getByRole("heading", { name: "Investir" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
});
