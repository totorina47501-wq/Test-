# BitGold — registre de suivi des fonctionnalités

> Référence de travail pour les prochains lots. Mettre à jour à chaque PR : ce qui existe déjà, ce qui a été testé, ce qui manque, et les preuves. Ne jamais déduire « production validée » d'un simple merge.

## Règles de suivi

- **IMPLÉMENTÉ** : code présent dans `main`.
- **CI VALIDÉE** : tests du lot passés ; préciser s'ils tournent sur un serveur isolé.
- **PROD VALIDÉE** : navigateur Playwright a vérifié la fonctionnalité sur Northflank ; associer run + date + version déployée si disponible.
- **À VÉRIFIER** : manque de preuve ; ne pas masquer les limites.
- **BLOQUÉ** : défaut identifié, indiquer la PR ou le ticket.
- Avant toute modification : rechercher les composants, API, scripts, fixtures, tests et docs existants pour éviter les doublons.
- Toute fonctionnalité annoncée doit avoir au minimum une assertion de comportement, un test négatif pertinent et une vérification mobile quand l'UI est concernée.

## Inventaire initial au 2026-10-12

| Domaine | Existant repéré | État et preuves | Prochain contrôle |
|---|---|---|---|
| Landing publique | `frontend/src/LandingPage.tsx`, `frontend/src/landing.css` | IMPLÉMENTÉ ; rendu Northflank des nouveaux visuels À VÉRIFIER | Playwright desktop/mobile, sections et CTA |
| Captures UI réelles | `server/scripts/capture-showcase.mjs`, trois PNG `*-auth-demo.png` | Génération et commit sur main confirmés (`d998817`) ; affichage PROD À VÉRIFIER | HTTP, décodage et visibilité sur landing |
| Cockpit | `server/e2e/react-cockpit.spec.mjs`, tests prod authentifiés | Tests existants ; version déployée À VÉRIFIER | Vérifier composants réels et graphes |
| Portefeuille / actifs détenus | `server/e2e/react-account.spec.mjs`, API `/api/portfolio` | Parcours isolés et image synthétique ; rendu PROD À VÉRIFIER | Valeurs cohérentes, BTC/ETH, lien actifs |
| Investir / marché crypto | `server/e2e/react-investir.spec.mjs` | Tests isolés ; production invitée déjà couverte | Parcours marché, logos, graphiques, erreurs |
| Bots IA Shield/Silver/Gold | `server/e2e/react-account.spec.mjs`, `/api/bots` | Catalogue/configuration testés en isolé ; parcours prod connecté existant | Vérifier catalogue, comparaison, limites de risque |
| Activité / transactions simulées | `server/e2e/react-account.spec.mjs`, `/api/activity` | Test isolé + capture synthétique ; PROD À VÉRIFIER | Historique, dates, opérations et logs bots |
| Inscription / connexion / JWT | `server/e2e/react-auth.spec.mjs`, `server/e2e/auth.spec.mjs` | Tests isolés ; smoke invité + auth prod existants | Expiration, déconnexion, isolation |
| 2FA | `server/e2e/react-auth.spec.mjs` | Test 2FA isolé existant ; profondeur prod À VÉRIFIER | Gestion 2FA sans modifier comptes réels |
| Responsive / mobile | Projets Playwright `desktop`, `mobile` | Couverture existante ; visuels landing live À VÉRIFIER | Débordement, lisibilité, navigation |
| Paiements / abonnement | `docs/COMMERCIAL_RELEASE_GATES.md` | Commercialisation NON APPROUVÉE | Preuves sandbox, juridique, sécurité |
| Exécution crypto réelle | Hors périmètre du produit de simulation | NON ACTIVÉE ; aucune promesse de gain | Ne pas activer sans projet réglementaire séparé |
| Déploiement / observabilité | Workflows GitHub, Northflank, `docs/react-production-runbook.md` | CI verte ; preuve SHA déployé À VÉRIFIER | Rapprocher SHA, release et navigateur |

## Priorités du prochain lot

1. **P0** — Contrôle Playwright en production des trois PNG et de leur présence réelle sur la landing desktop/mobile ; ne pas se contenter du statut 200.
2. **P0** — Comparer SHA `main` et révision Northflank avant d'affirmer que la landing est livrée.
3. **P1** — Inspecter visuellement les captures bots, portefeuille, activité : qualité, lisibilité mobile, absence de contenu répété.
4. **P1** — Tester les liens landing → modules et l'authentification sans perdre le contexte.
5. **P2** — Étendre les assertions fonctionnelles des bots, graphiques et portefeuille ; conserver la séparation simulation/argent réel.

## Journal des lots

| Date | PR / commit | Livraison | CI | Production | Suites |
|---|---|---|---|---|---|
| 2026-10-12 | #509 / `bfd3b03` | Landing mobile, libellés de captures | Verte | Visuel non confirmé | Captures privées |
| 2026-10-12 | #510 / `5d391f4` | Capture composants authentifiés avec fixtures | Verte | Visuel non confirmé | Publication |
| 2026-10-12 | #511 / `4302f43` | Correction du chemin de publication | Verte | Visuel non confirmé | Contrôle live |
| 2026-10-12 | `d998817` | Trois PNG de démonstration versionnés | Commit `[skip ci]` | Non vérifié | Smoke ciblé |

## Modèle à remplir pour chaque lot

- **Objectif / périmètre** :
- **Existant contrôlé (anti-doublon)** :
- **Fichiers/API modifiés** :
- **PR / commit** :
- **Tests CI (liens et résultats)** :
- **Playwright production desktop/mobile (liens et résultats)** :
- **SHA déployé confirmé ?** :
- **Captures et preuve UX** :
- **Régression / risque / rollback** :
- **Statut final** : IMPLÉMENTÉ / CI VALIDÉE / PROD VALIDÉE / À VÉRIFIER / BLOQUÉ.

## Lot activité mobile — 2026-10-12

- Demande : transactions trop longues sur mobile ; filtres achat/vente et crypto.
- Implémentation proposée : `frontend/src/components/AccountPage.tsx` ; filtres combinables sur les transactions existantes, sélecteurs accessibles, 8 transactions initiales et bouton développer/réduire ; les logs bots restent indépendants.
- Preuves requises : build React, parcours CI, production desktop/mobile après merge ; filtres achat, vente, BTC/ETH/USDC selon données présentes ; état vide ; ouverture/fermeture de la liste.
- État : IMPLÉMENTÉ SUR BRANCHE, CI ET PRODUCTION À VÉRIFIER.

## Crédit fictif carte / PayPal — 2026-10-12
- API authentifiée `POST /api/wallet/simulated-deposits` et historique `GET /api/wallet/simulated-deposits`.
- Choix carte bancaire ou PayPal **entièrement simulé** : aucun numéro de carte, aucun SDK ou paiement réel.
- Transaction SQL, verrou de portefeuille, clé d'idempotence, limite 1–100 000 € et historique par utilisateur.
- CTA cockpit, accueil, navigation Investir et portefeuille, renvoyant vers `/portefeuille?action=crediter`.
- Tests CI/Playwright et validation production à effectuer avant annonce de livraison.
