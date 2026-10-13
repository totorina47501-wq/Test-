# BitGold — Optimisation SQL des historiques

## Contrôle de l'existant
Relecture de `server/src/index.js` et `docs/FINAL_INTERNAL_OPERATIONS.md`. Index déjà présents : `bot_execution_audit(user_id,id DESC)`, `bot_ai_decisions(user_id,id DESC)`, `x402_audit(quote_id,created_at DESC)`. Ils ne sont pas dupliqués.

## Lot
Cinq index complémentaires sur les requêtes existantes, filtrées par utilisateur et triées par historique récent : `trades`, `bot_activity`, `simulated_deposits`, `x402_audit`, `bot_ai_decisions`. Aucune logique de bot, de transaction ou d'activation prestataire modifiée.

## Validation
Les index sont créés après les tables au démarrage de l'API. `CREATE INDEX` sans `CONCURRENTLY` peut bloquer temporairement les écritures lors de la première exécution sur une grande table. Planifier une fenêtre calme ; pour de grandes tables, utiliser une migration administrateur `CREATE INDEX CONCURRENTLY` à la place.

Sur une base de test, mesurer `EXPLAIN (ANALYZE, BUFFERS)` pour les requêtes de `/api/activity`, `/api/portfolio`, `/api/bots` et l'historique des décisions, puis comparer latence p95, charge CPU, taille des index et débit d'insertion. Une petite table peut légitimement être parcourue séquentiellement.

Les tests CI ne remplacent ni les mesures SQL réelles ni un test de charge. Aucun gain chiffré ni déploiement Northflank n'est revendiqué ici.
