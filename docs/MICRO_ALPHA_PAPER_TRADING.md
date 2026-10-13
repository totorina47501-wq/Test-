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

## Micro Alpha V2 — laboratoire pédagogique React
- `frontend/src/components/MicroAlphaPaperLab.tsx` est intégré dans l'onglet Bots IA de `AccountPage.tsx` après l'observatoire existant : aucun second observatoire créé.
- Simulation **locale, volatile et fictive** avec cours BTC saisi à la main, montant 1–50 €, frais configurables, limite de drawdown, P&L de démonstration et journal de huit derniers micro-ordres. Réinitialisation possible. Aucune API, persistance, source de prix, activation de bot, donnée réelle ni modification des stratégies Shield/Silver/Gold.
- Le démonstrateur React ne partage **pas** le ledger serveur `micro-alpha-paper.js` : il sert uniquement à illustrer l'expérience. Une activation paper durable nécessitera un chantier distinct (API auth, isolation SQL, prix frais et idempotence).
- E2E CI isolé `server/e2e/react-account.spec.mjs` : entrée Bots IA, achat/vente fictifs, remise à zéro, garde-fou montant invalide, desktop/mobile. Ne jamais annoncer un P&L de ce laboratoire comme un rendement d'utilisateur ou d'un bot.

## Micro Alpha V3 — compte persistant distinct
- Nouvelle table `micro_alpha_accounts` (JSONB, PK `user_id`, FK `users`) créée au démarrage, distincte de `wallets`, `holdings` et `trades`.
- API JWT : `GET /api/micro-alpha/account`, `POST /api/micro-alpha/signals` et `POST /api/micro-alpha/reset`. Écritures atomiques par `BEGIN`, verrou `FOR UPDATE`, `COMMIT`/`ROLLBACK` ; rejouabilité via `seenIds` du moteur #534 ; montant 1–50 €.
- `MicroAlphaPersistentPanel.tsx` présente ce compte dans Bots IA à côté du laboratoire V2 local. Prix saisi manuellement **uniquement pour scénarios pédagogiques**, jamais étiqueté cours de marché. Aucun scheduler, aucun ordre réel, aucun paiement et aucun impact sur le portefeuille principal.
- Les valeurs des positions ne sont PAS évaluées au marché : endpoint retourne `valuation: cash-only-without-fresh-quotes`. Le résultat net officiel et le drawdown multi-actifs exigent une source de prix fraîche vérifiée. La protection de drawdown du moteur n'est pas une garantie de perte maximale dans cette version.
- Tests `server/test/micro-alpha-store.test.js` : isolation utilisateur, transactions, idempotence, reset et rejet ; `server/e2e/react-account.spec.mjs` : API simulée pour UI desktop/mobile. **Production authentifiée et version Northflank restent à vérifier.**
