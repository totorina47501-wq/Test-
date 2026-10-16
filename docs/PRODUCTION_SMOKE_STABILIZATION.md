# Production smoke stabilization — 2026-10-16

- CoinGecko fetch attempts now have an 8-second timeout. Existing retry, cache and error handling remain intact. This prevents indefinite upstream waits during authenticated bot backtests, without changing bot strategy logic.
- Production Playwright login selectors accept both French and English for the sign-in button and authentication dialog.
- Validation required: run tests and the authenticated Northflank production smoke after deployment; upstream 429/5xx may still cause a visible backtest failure rather than a timeout.
- Frontend market WebSocket delivery is not yet implemented by these changes.
