# BitGold — lot opérations internes (prestataires désactivés)

## Réutilisation et anti-doublon
Relu avant modification : `docs/COMMERCIAL_RELEASE_GATES.md`, `docs/INTERNAL_RELEASE_GATE.md`, `docs/PRECOMMERCIAL_INTERNAL_HARDENING.md`, `docs/PRODUCTION_PLAYWRIGHT_REFERENCE.md`, `docs/INTERNAL_FINALIZATION_EVIDENCE.md`. Les tests JWT/2FA, Stripe, bots, Playwright, SEO et le script de provenance existent déjà. Ce lot ne les duplique pas.

## Exercice de restauration PostgreSQL (nouveau)
`node server/scripts/restore-drill.mjs` est **refusé par défaut**. Exécution manuelle par un opérateur disposant de `pg_dump`, `pg_restore`, `psql` et de deux bases distinctes :
- `BITGOLD_BACKUP_SOURCE_URL` : source autorisée (lecture de sauvegarde).
- `BITGOLD_RESTORE_DISPOSABLE_URL` : base **jetable**, jamais la production.
- `BITGOLD_RESTORE_DRILL_ACK=DISPOSABLE_DATABASE_ONLY` : confirmation explicite.
- `BITGOLD_RESTORE_EVIDENCE_PATH` : chemin facultatif d'une preuve JSON, sans URL ni mot de passe.

Le script restaure dans la base jetable, contrôle l'existence de tables publiques, supprime l'archive temporaire et ne publie aucun secret. Une réussite technique ne garantit pas l'intégrité fonctionnelle de toutes les données : comparer aussi les volumes et réaliser des tests applicatifs après restauration. La base de destination peut être **effacée** : ne jamais y mettre de données utiles.

## Bloquants non réalisables uniquement par commit
- Exercice réel de restauration : nécessite bases et droits de l'opérateur.
- Stripe : environnement sandbox signé, clés, événements réels de remboursement/chargeback, approbations.
- 2FA : compte dédié et parcours réels de récupération, revue sécurité.
- Northflank : attestation indépendante du SHA déployé, rollback réel.
- RGPD, conditions commerciales, juridique, support et validation des prestataires : décisions externes.
- Performance, SEO indexation et analytics : mesures sur services déployés et consentement conforme.

**Statut : preuves externes non validées, lancement commercial non approuvé.** Aucun changement de stratégie des bots, aucune activation de paiements ou d'ordres réels.
