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

## Micro Alpha V4 — valorisation de scénario (pas de cotation de marché)
- Réutilise `paperEquity`, le compte SQL V3 et l'auth JWT. `POST /api/micro-alpha/scenario-valuation` accepte uniquement un prix BTC numérique strictement positif, dans la limite de 10 M€, et valorise les positions de **l'utilisateur authentifié**, sans modifier l'état.
- Retour : `equityEur`, `exposureEur`, `pnlEur`, `pnlPct`, `marketVerified:false`, `valuation:"manual-scenario-only"`, `priceSource:"user-input"`. Affichage explicitement **hypothétique** dans le panneau V3, sans rendement de marché.
- Les actifs autres que BTC et les prix malformés sont refusés ; jamais de fallback de prix obsolète. Tests : `server/test/micro-alpha-valuation.test.js` et suites existantes. Aucun changement Shield/Silver/Gold.
- **Non réalisé :** connexion à une source de cours frais validée, valorisation officielle, historique horodaté, drawdown réel. Ne pas communiquer le P&L fictif comme une performance utilisateur.

## Micro Alpha V4 — cours de marché BTC vérifié (même lot)
- Réutilise `refreshMarket()` et le cache CoinGecko existants ; **aucun deuxième fournisseur, scheduler ou stockage dupliqué**.
- `GET /api/micro-alpha/market-valuation` (JWT) retourne le snapshot BTC de l'utilisateur, `marketVerified:true`, `priceSource:"CoinGecko"`, `priceUpdatedAt`, equity, exposition, P&L et pourcentage de simulation. Pas d'ordre réel.
- Fail-closed : BTC manquant, `priceFresh!==true`, timestamp absent, futur ou de plus de **60 secondes** ⇒ HTTP 503, aucune performance affichée ; jamais de fallback sur un prix manuel ou ancien. Le P&L est une **valorisation ponctuelle**, pas un historique de rendement.
- Tests positifs/négatifs `server/test/micro-alpha-valuation.test.js` ; vérifier le parcours connecté desktop/mobile, CI et version Northflank avant de marquer PROD VALIDÉE.
- **Limites restantes** : pas de séries historiques durables, benchmark, calcul de drawdown temporel ou stratégie automatisée ; le circuit breaker historique n'est pas une mesure de drawdown vérifiée au marché. Ne pas assimiler un snapshot à une performance historique.
