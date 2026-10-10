# BitGold React production release gate

This runbook is the required gate before a React migration lot is considered production-ready.

## Automated checks

The following GitHub Actions workflows must all be green on `staging` before promotion and again on `main` after promotion:

- **BitGold React frontend** — TypeScript/Vite build and React preview container.
- **BitGold tests** — production Docker build, `/api/health`, React root shell, legacy rollback shell, backend quality and unit tests.
- **BitGold user journeys** — signup/login, authenticated cockpit, markets, simulated buy/sell, portfolio/activity/bots, desktop and mobile Playwright journeys.

No red or pending workflow may be promoted.

## Production health

After `main` deploys, verify:

- `GET /api/health` returns HTTP 200 and `{"ok":true,"service":"BitGold API"}`.
- `GET /` serves the React shell.
- `GET /investir`, `/portefeuille`, `/activite` and `/bots` resolve through the React application.
- The interface continues to state that all trading is simulated.

## Rollback

The production image contains both the React application and the legacy public frontend.

To rollback the UI without changing APIs or the database:

1. Set `FRONTEND_MODE=legacy` on the existing Northflank service.
2. Redeploy the same image/commit.
3. Verify `/api/health` is still HTTP 200.
4. Verify `/` serves the legacy BitGold landing.
5. Keep the failing React commit available for diagnosis; do not rewrite transaction history or user data.

To return to React, set `FRONTEND_MODE=react` (or remove the override in production, where React is the default) and redeploy.

The rollback changes presentation only. It does not enable real orders, external settlement, KYC/AML providers or payment rails.
