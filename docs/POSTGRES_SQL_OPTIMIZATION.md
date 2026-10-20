# BitGold — Optimisation SQL des historiques

## Contrôle de l'existant
Relecture de `server/src/index.js` et `docs/FINAL_INTERNAL_OPERATIONS.md`. Index déjà présents : `bot_execution_audit(user_id,id DESC)`, `bot_ai_decisions(user_id,id DESC)`, `x402_audit(quote_id,created_at DESC)`. Ils ne sont pas dupliqués.

## Lot
Cinq index complémentaires sur les requêtes existantes, filtrées par utilisateur et triées par historique récent : `trades`, `bot_activity`, `simulated_deposits`, `x402_audit`, `bot_ai_decisions`. Aucune logique de bot, de transaction ou d'activation prestataire modifiée.

## Validation
Les index sont créés après les tables au démarrage de l'API. `CREATE INDEX` sans `CONCURRENTLY` peut bloquer temporairement les écritures lors de la première exécution sur une grande table. Planifier une fenêtre calme ; pour de grandes tables, utiliser une migration administrateur `CREATE INDEX CONCURRENTLY` à la place.

Sur une base de test, mesurer `EXPLAIN (ANALYZE, BUFFERS)` pour les requêtes de `/api/activity`, `/api/portfolio`, `/api/bots` et l'historique des décisions, puis comparer latence p95, charge CPU, taille des index et débit d'insertion. Une petite table peut légitimement être parcourue séquentiellement.

Les tests CI ne remplacent ni les mesures SQL réelles ni un test de charge. Aucun gain chiffré ni déploiement Northflank n'est revendiqué ici.


## Northflank — compte rendu opérateur (2026-10-14)
- Sur le Shell du pod applicatif `service-bitgold` (révision visible `88a112d`), `DATABASE_URL` était présente et une connexion à PostgreSQL 17.10 a réussi.
- Les cinq tables ciblées étaient de petite taille lors du diagnostic : `bot_activity` ~1 082 lignes, `bot_ai_decisions` ~885, `trades` ~117, `simulated_deposits` ~1, `x402_audit` ~0 (estimations PostgreSQL).
- L'image applicative déployée ne contient **pas** `server/scripts/apply-history-indexes.mjs` ni `scripts/apply-history-indexes.mjs`. Ne pas conseiller d'exécuter ce script directement dans ce conteneur sans adapter l'image.
- L'opérateur a exécuté depuis le Shell une commande Node/pg `CREATE INDEX CONCURRENTLY IF NOT EXISTS` pour les cinq index définis dans `server/src/sql-history-indexes.js`. Capture du Shell : cinq messages `OK`, puis `INDEXATION TERMINEE`, sans erreur SQL.
- L'opérateur a déclaré une sauvegarde disponible. **Aucune preuve de restauration ni de validité `pg_index.indisvalid` n'a été collectée.** Les mesures de performance sont explicitement hors périmètre à sa demande.
- Une alerte de compatibilité TLS `pg-connection-string` a été observée ; revoir ultérieurement la validation de certificat et les options SSL, sans imprimer `DATABASE_URL` ni secrets.
- Ce compte rendu est une **preuve déclarative et visuelle**, pas un audit automatique de la base. Ne pas réappliquer les index sans vérifier `pg_indexes` et `pg_index.indisvalid`.

## Suite prestataires externes — aucune activation
Les travaux d'intégration Venga/Bitpanda sont **précontractuels** et déjà documentés dans `docs/CRYPTO_PROVIDER_INTEGRATION.md` et `docs/EXTERNAL_PROVIDER_LAUNCH_RUNBOOK.md`. Ne pas recréer d'adaptateur, de route d'ordre réel ni de paiement. Restent dépendants de tiers : accords signés, périmètre réglementaire validé, schémas API/sandbox officiels, responsabilités KYC/AML et custody, tarification et autorisations, secrets et signatures webhook, revue sécurité et validation go-live. Aucun prestataire n'est connecté ou activé par ce compte rendu.
