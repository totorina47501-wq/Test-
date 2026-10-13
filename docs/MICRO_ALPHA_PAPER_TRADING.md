# Micro Alpha — paper execution contract

This module is a **pure simulation-only** paper execution primitive, not a live exchange adapter or scheduler.

- File: `server/src/micro-alpha-paper.js`
- Tests: `server/test/micro-alpha-paper.test.js`
- Explicit signal IDs prevent duplicate executions; rejected IDs are also consumed.
- Buy and sell use configurable spread, slippage and fees; no leverage or negative cash.
- Buy limits and peak-equity drawdown circuit breaker are enforced; liquidation remains possible.
- All trades are marked `simulation: true`; there are no API keys, HTTP calls or real-order methods.
- Prices must come from validated fresh market data before invoking this module. The caller owns quote freshness, persistence, user isolation, transaction locking and scheduling.
- Account state is in-memory/serializable; **not production-grade durable paper trading** until a transactional persistent store, replay/recovery, monitoring, and forward-validation are implemented.
- Existing Silver, Shield and Gold decision logic remains unchanged.

## Release gates
Run `node --test server/test/micro-alpha-paper.test.js`, the complete server suite, frontend checks, authenticated Playwright journeys, and production smoke. Verify CI green on main before treating the change as released. Do not enable live trading.
