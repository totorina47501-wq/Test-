# Consolidated delivery audit — 2026-10-16
## Scope and anti-duplication
Reused `useLiveMarket`, `useInvestirMarket`, `useBitGoldDashboard`, Kraken's existing public read-only socket, JWT dashboard, and existing MD. No bot engine, payments, real trades, auth rules or partner adapters changed.

## Delivered
- Indicative live valuation of the authenticated cockpit's portfolio positions from fresh Kraken quotes; the persisted portfolio ledger is untouched.
- Investir ignores stale/unknown live quotes and reloads REST every 60 seconds while visible, including when proxy WebSocket upgrade fails.
- Existing production smoke and E2E remain the release gates. Do not claim socket connectivity in production solely from build success.

## Still blocked or awaiting separate verification
- Portfolio module's independent authenticated screen may require explicit integration; only the LiveCockpit dashboard hook is updated here.
- True authenticated portfolio/bot event streaming is not implemented; no private JWT on a public WebSocket.
- A live Northflank WebSocket handshake and reconnection E2E, mobile visual review, SHA deployment provenance, and live UI screenshot inspection are not yet evidenced.
- FR/EN UI is the current enabled language set. PR #562 (FR/EN/ES) must be reconciled, not duplicated; a full untranslated-string audit is outstanding.
- Stripe sandbox replay/refund, real 2FA recovery, backups, GDPR/legal review, provider contracts and launch approvals remain external dependencies. All paid and real crypto gates stay OFF.
- Bot observed-return consistency needs a historical ledger review before certification.

## Acceptance
`npm --prefix frontend run build`; `npm --prefix server test`; desktop/mobile user journeys; production smoke; confirm exact deployed SHA and websocket upgrade with browser evidence. Update functionality tracker after release.
