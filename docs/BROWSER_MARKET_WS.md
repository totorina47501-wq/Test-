# Browser WebSocket market stream (16 October 2026)
- Public same-origin endpoint: `/api/market/ws`, read-only JSON messages `{type:"market",markets:[...]}`.
- Node HTTP upgrade reuses the Express listener; no additional dependencies. Only same-origin browser clients accepted, 200 connection cap, 2-second snapshot sampling, 1 MiB buffered-output limit.
- Frontend Investir subscribes to live price updates, reconnects with exponential backoff, pauses when hidden, and initially loads market data from existing REST `/api/market`. No trading or bot strategy code changed.
- REST remains source of full asset metadata, historical charts and fallback; server Kraken freshness remains 30 seconds.
- Deployment: verify reverse proxy supports WebSocket Upgrade, Kraken market-data redistribution permissions, and smoke both WebSocket and REST. If the proxy blocks upgrades, initial REST fetch still works but live updates do not.
- This iteration does not yet stream portfolio/bot private events or update the cockpit; those need a separate authenticated event channel.
