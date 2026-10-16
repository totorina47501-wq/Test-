# Backtest production resilience — 2026-10-16

Production smoke on main commit 670ef94 returned HTTP 502 for Shield backtest; a retry returned proxy HTTP 503 connection refused. These are distinct failure classes: application history failure versus infrastructure availability.

The authenticated backtest now tolerates unavailable *optional* CoinGecko asset histories using Promise.allSettled, but still requires at least 16 BTC observations and retains the original simulation engine, parameters and strategy. It fails explicitly with HTTP 502 if BTC is unavailable. This does not conceal an unavailable provider and does not resolve Northflank HTTP 503.

Verify Northflank service health, startup logs, resource limits, and deployment revision for HTTP 503. Rerun production smoke only after the new revision is deployed. Do not weaken authenticated smoke assertions or disable 2FA.

## Public BTC history fallback
When CoinGecko cannot provide BTC/EUR history after bounded retries, the server requests actual BTC/EUR hourly OHLC close prices from Kraken public API (up to 720 candles). Only valid completed candles within the requested window are accepted; at least 16 are required. The backtest engine and bot algorithms remain unchanged. If both providers fail, the endpoint continues to return HTTP 502 rather than inventing data. Production deployment and authenticated smoke must still be checked.
