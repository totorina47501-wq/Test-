# BitGold — finalisation interne : inventaire de preuves

Date : 2026-10-13. **Statut : NON APPROUVÉ POUR LA COMMERCIALISATION.**

## Comparaison anti-doublon
Les références existantes ont été relues : `docs/INTERNAL_RELEASE_GATE.md`, `docs/PRECOMMERCIAL_INTERNAL_HARDENING.md`, `docs/COMMERCIAL_RELEASE_GATES.md`, `docs/PRODUCTION_PLAYWRIGHT_REFERENCE.md` et les suites de tests déjà présentes.

Déjà développés, **ne pas redévelopper** : auth JWT et 2FA, tests de sécurité, simulation d'ordres, idempotence des transactions, bots Silver/Shield/Gold, observabilité bots, Micro Alpha V5, parcours Playwright desktop/mobile, test profil/backtest, protection Stripe contre rejeu, gate commercial, SEO, i18n, cache de cours, contrôles 429, preuve HTTP de provenance.

## Nouveau contrôle reproductible
`node server/scripts/internal-readiness.mjs` vérifie la présence des preuves automatisées existantes. `BITGOLD_REQUIRE_COMMERCIAL_APPROVAL=true node server/scripts/internal-readiness.mjs` échoue tant que la validation commerciale explicite n'existe pas. Ce script n'exécute pas les exercices externes, ne certifie pas la sécurité et n'active rien.

## Preuves qui restent à produire réellement
- Stripe : scénarios sandbox signés, remboursements, chargebacks, événements hors ordre, synchronisation d'abonnement.
- Auth : test réel 2FA et récupération, revues sécurité, protection des secrets.
- Exploitation : restauration de sauvegarde sur environnement isolé, alerte testée, exercice rollback, revue des journaux.
- Production : comparaison du SHA Northflank à GitHub, tests connectés après déploiement.
- Produit : mesures réelles de latence et 429, cohérence performance bots, indexation SEO, conformité RGPD/consentement et métriques agrégées.
- Approbations : responsable produit, sécurité, paiements, opérations, juridique et support.

**Aucune de ces preuves ne peut être déclarée PASS à partir de la seule présence de code ou d'une CI verte.** Les intégrations prestataires et tout mouvement d'argent réel restent désactivés.
