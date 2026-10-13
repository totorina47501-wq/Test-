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
- Couverture CI ajoutée au parcours isolé : crédit fictif, historique, rejet, idempotence et absence de double crédit. La production reste en lecture seule : aucune mutation du compte E2E live.

## Achat / Vente Investir — PR #518
- Gestion des rejets d'ordres : messages d'erreur explicites, accès direct au crédit fictif et au portefeuille.
- Régression Playwright achat/vente LINK en desktop et mobile avec réponses API contrôlées ; fichier `server/e2e/react-investir.spec.mjs`.
- Statut : en attente de validation CI et de vérification production authentifiée ; référence `docs/PRODUCTION_PLAYWRIGHT_REFERENCE.md`.

## PR #531 — observatoire bots, période commune (2026-10-13)
- IMPLÉMENTÉ et CI VALIDÉE sur main `5748fd6` (4/4 workflows) : comparaison des décisions et exécutions simulées sur 7/30/90 jours ou historique disponible ; volume et journal alignés sur la période.
- Les 100 derniers événements par source peuvent rendre les agrégats incomplets ; rendement et drawdown non disponibles faute de valorisation historique.
- Déploiement exact Northflank : NON VÉRIFIÉ (SHA exposé non confirmé).

## PR #532 — Régression navigation / retours arrière (fusionnée)
- Test `server/e2e/react-navigation-history.spec.mjs` : retour/avance navigateur entre accueil, Investir et Bots ; identité de chaque écran et absence de contenu de l'écran précédent ; retour intégré Investir ; routes privées Portefeuille et Activités pour visiteur ; retour accueil ; absence de débordement et erreurs JS.
- Les projets Playwright desktop et mobile exécutent la même suite en CI isolée. Production authentifiée et identité du SHA déployé restent à vérifier séparément.


## Lot preuve production + parcours commercial — 2026-10-13
- Anti-doublon : réutilise les suites production, user-scenarios et les composants existants ; aucun nouveau moteur de bot ni chemin de paiement réel.
- Parcours isolé : crédit virtuel carte, rejeu idempotent, conflit de clé, rejet d'un montant invalide, historique, puis achat/vente simulés et réconciliation portefeuille/activité.
- UI isolée desktop/mobile : formulaire de crédit fictif PayPal, payload limité à `method`, `amount`, `requestKey`, rechargement du portefeuille et contrôle du débordement horizontal.
- Production invitée : accueil → Investir → Bots → retour/avance navigateur → Portefeuille/Activités verrouillés ; identité de l'écran et absence de contenu obsolète.
- Production authentifiée **lecture seule** : Portefeuille → Activités → Investir → Bots, retours arrière/avant, comparateur bots et captures desktop/mobile. Aucune activation de bot, aucun crédit, aucun trade live.
- Provenance : `production-evidence.mjs` peut désormais valider le SHA attendu s'il est exposé par un en-tête de révision **ou présent exactement dans le bundle frontend servi**. Sinon état `UNVERIFIED`.
- Preuves visuelles : captures live invitées et connectées conservées dans l'artefact du workflow production.
- Algorithmes Shield/Silver/Gold et Quantum Fund : inchangés.

## Micro Alpha V2 — laboratoire virtuel React (2026-10-13)
- Audit anti-doublon : moteur serveur `micro-alpha-paper.js` (#534) déjà présent, observatoire `BotObservabilityPanel` déjà disponible sur Bots/Portefeuille/Activités, et laboratoire Quantum Fund préexistant. Aucun de ces moteurs n'est recopié ou modifié.
- Nouveauté : `MicroAlphaPaperLab.tsx`, expérience éducative locale BTC, dans Bots IA. Cours manuel, cash fictif, micro-ordres 1–50 €, frais simulés, stop drawdown, résultat fictif, journal réinitialisable ; aucune API/ordre réel ou persistance.
- Tests Playwright isolés : `server/e2e/react-account.spec.mjs` (desktop/mobile), achat, vente, réinitialisation et validation des bornes. SHA Northflank et production authentifiée restent À VÉRIFIER ; la CI ne vaut pas preuve prod.
- Suite produit après le présent lot : ledger serveur durable multi-utilisateur, identité, quotes fraîches et comptabilité d'événements avant tout journal officiel de performance Micro Alpha.

## Micro Alpha V3 — compte persistant par utilisateur (2026-10-13)
- Implémentation : `micro_alpha_accounts` JSONB isolé, API JWT `/api/micro-alpha/*`, transactions avec verrou, moteur existant `executePaperSignal`, composant `MicroAlphaPersistentPanel` intégré à Bots IA. Aucun doublon des portefeuilles ou de l'observatoire ; stratégies Silver/Shield/Gold intactes.
- Scénarios BTC manuels exclusivement : pas de prix de marché, valorisation fiable, bot automatisé ou ordre réel. Le journal est conservé côté serveur, distinct du labo V2 volatil.
- Tests : `micro-alpha-store.test.js` (isolation, idempotence, rollback, reset, rejets) et parcours React Playwright desktop/mobile mocké. Les workflows PR/main déterminent le statut CI ; SHA de production Northflank non confirmé.
- Restant P0 : prix frais validés et marquage-to-market ; limite de croissance des événements ; politique de rétention ; E2E DB réelle et vérification production authentifiée avant annonce de performance utilisateur.

## Micro Alpha V4 — calcul hypothétique sans doublon (2026-10-13)
- Ajout `server/src/micro-alpha-valuation.js` et endpoint JWT `POST /api/micro-alpha/scenario-valuation` ; réutilisation du ledger V3 et du moteur `paperEquity` existants.
- Interface Bots IA : bouton d'évaluation, exposition BTC et P&L **hypothétiques** au cours saisi ; étiquetage explicite de l'absence de données de marché. Ne modifie ni portefeuille principal ni stratégies bots.
- Tests unitaires positifs et négatifs `micro-alpha-valuation.test.js`. CI PR et main à contrôler ; validation Northflank authentifiée non prouvée.
- Suite : source de prix fiable avec timestamp, rejet des cours obsolètes, valorisation horodatée, politique d'historique et preuves E2E authentifiées.

## Micro Alpha V4 — valorisation BTC fraîche, même PR
- Réutilisation du flux CoinGecko et du cache existants : `GET /api/micro-alpha/market-valuation`, JWT, quote BTC fraîche ≤60 s, timestamp, exposition, equity, P&L fictif, échec HTTP 503 si obsolète/manquante.
- Panneau Bots IA existant enrichi de « Actualiser la valeur au marché » ; aucun doublon de composant ou fournisseur, aucun changement Shield/Silver/Gold.
- Tests de validation et refus des prix périmés ajoutés. **CI et déploiement authentifié à vérifier**. Les métriques historiques et drawdown temporel restent hors périmètre de cette version et ne doivent pas être présentés comme acquis.

## Micro Alpha V5 — suivi de performance observée (PR en cours)
- Anti-doublon contrôlé : garde `micro_alpha_accounts`, `paperEquity`, `refreshMarket`, `BotObservabilityPanel` et les pages existantes. Ne crée pas de portefeuille, de provider, de scheduler ni de moteur de stratégie parallèle.
- Table isolée `micro_alpha_valuations`, endpoint JWT de lecture de l'historique et enregistrement lors d'une valorisation vérifiée, reset atomique, échantillons BTC horodatés et dédupliqués.
- Courbe Bots IA responsive et synthèse réutilisée dans Portefeuille et Cockpit, sans addition aux liquidités du portefeuille ni fausse attribution à Shield/Silver/Gold.
- Tests unitaires isolation/idempotence/drawdown observé/reset et Playwright isolé desktop/mobile ; CI puis SHA `main` à contrôler. **Production Northflank non confirmée**.
- Document historique : les formulations V3/V4 désignant le manque de source fraîche sont des limites *à la date de ces versions*, levées en V4 ; absence d'historique durable levée en V5 si la CI réussit. Le calcul du drawdown n'est valable qu'entre relevés enregistrés.

## CI reliability follow-up (2026-10-13)
- GitHub main V5 38f2cb5d: frontend/tests green, production guest smoke and authenticated journeys red. Production read-only bot backtest GET timed out at 60 seconds; mobile home returned HTTP 503. These are real failures, not ignored/flaky-success. Do not claim production SHA verified.
- Separate CoinGecko 429 errors occurred in local journey runner. Existing `refreshMarket` is now singleflight (concurrent calls share a single provider request) and honors a bounded cooldown after HTTP 429. Quotes still fail closed on staleness: never mark fallback prices verified. No change to Silver/Shield/Gold.
- Verify the PR tests and rerun all four main workflows. Northflank 503/backtest latency requires independent production investigation and cannot be corrected by increasing Playwright timeouts or skipping tests.


## Branding & SEO — PR #540 (2026-10-13)
- Audit anti-doublon : `frontend/src/LandingPage.tsx` et guides UX existants réutilisés ; pas de création d'une nouvelle application ou modification de bots.
- SEO : métadonnées HTML, canonical Northflank provisoire, Open Graph, Twitter et JSON-LD SoftwareApplication ; quatre guides publics statiques crawlables, sitemap et robots excluant les chemins privés.
- Test dédié `server/test/seo-pages.test.js` : cohérence sitemap/guides, métadonnées, garde de routage, HTML strictement public.
- À VALIDER : CI de la PR et de main, puis présence des pages et balises sur le déploiement exact. Ne pas confondre indexabilité technique, indexation Google et résultats SEO ; domaine de marque non choisi.


## Lot ABCDE préparation prestataires & growth — 2026-10-13
- Préparation Venga/Bitpanda : réutilisation de l'adaptateur désactivé, fixture déterministe local ajouté (aucune API réelle).
- Démo et diligence : docs de référence réutilisés, questionnaire fournisseur complété.
- Acquisition : parcours landing et CTA, consentement explicite pour mesure locale UTM sans réseau.
- Onboarding : étape de première simulation pédagogique (ne prouve pas un ordre).
- Monétisation : plan premium et gates paiement documentés, aucun abonnement réel activé.
- À vérifier : CI PR/main, production, parcours mobile, conformité commerciale ; ne pas présenter ces points comme déjà approuvés.
