# BitGold — référence des tests Playwright en production

> Document de référence maintenu à chaque lot. La CI verte ne prouve pas à elle seule que le dernier commit GitHub est déployé sur Northflank.

## Environnement et sources de vérité

- Dépôt : https://github.com/totorina47501-wq/Test-
- Production : https://p01--service-bitgold--dvn9t2gvmtgx.code.run/
- Workflow live : `.github/workflows/production-smoke.yml` (push main, quotidien, manuel).
- Tests invités : `server/e2e/production-smoke.spec.mjs`.
- Tests connectés : `server/e2e/production-auth-readonly.spec.mjs` et `server/e2e/production-auth-profile-backtest.spec.mjs`.
- Configuration desktop/mobile : `server/playwright.config.mjs` (Chromium desktop + Pixel 7).
- Tests sur environnement isolé (non production) : `.github/workflows/user-scenarios.yml`, `server/e2e/react-account.spec.mjs`, `server/scripts/capture-showcase.mjs`.
- Captures de démonstration générées avec données synthétiques : `server/public/showcase/{bots-auth-demo,portfolio-auth-demo,activity-auth-demo}.png`.

## Niveaux de preuve (ne jamais les confondre)

1. **GitHub main** : fichiers présents dans le dépôt, tests CI réussis.
2. **Déploiement** : identifier la révision effectivement servie par Northflank (SHA / identifiant de déploiement vérifié). Un HTTP 200 ne prouve pas l'identité de la révision.
3. **Production invitée** : navigateur réel charge les routes et ressources depuis l'URL publique ; vérification des images décodées et des erreurs console.
4. **Production connectée** : compte de test dédié, assertions sur vrais composants et navigation ; aucune transaction réelle, aucun compte client.
5. **Validation UX** : captures desktop/mobile examinées pour taille, lisibilité, absence de recouvrement et correspondance entre légendes et images.

## Checklist obligatoire après chaque merge

- [ ] Tous les workflows déclenchés par le commit sont terminés et verts ; noter les liens des runs.
- [ ] Le commit courant de main est identifié, y compris éventuel commit automatique `[skip ci]` de captures.
- [ ] La révision déployée Northflank est identifiée et comparée au code attendu (si inaccessible : `NON VÉRIFIÉ`).
- [ ] `/api/health`, `/`, `/investir`, `/portefeuille`, `/bots`, `/activite` répondent et affichent le bon écran, pas simplement une page 200.
- [ ] Landing desktop et mobile : titre, CTA, navigation, sections, absence de débordement horizontal et de superposition.
- [ ] `/showcase/bots-auth-demo.png`, `portfolio-auth-demo.png`, `activity-auth-demo.png` : HTTP 200, type `image/png`, décodage correct, dimensions non nulles.
- [ ] Images réellement affichées dans les sections Bots IA, Portefeuille et Activité ; vérifier `img.complete && img.naturalWidth > 0`.
- [ ] Le contenu de ces images montre bien les modules annoncés (inspection visuelle des artefacts), et pas la landing répétée.
- [ ] Aucune donnée personnelle ou performance présentée comme réelle ; exemples clairement identifiés comme simulation.
- [ ] Session authentifiée de test : cockpit, portefeuille, activité, bots IA, paramètres et déconnexion.
- [ ] Contrôle des erreurs JavaScript et requêtes échouées pertinentes, desktop + mobile.
- [ ] Captures/rapport GitHub Actions archivés et anomalies consignées dans `docs/FUNCTIONALITY_TRACKER.md`.

## Commandes locales (tests live en lecture seule)

Depuis `server/`, après `npm ci`, installation de `@playwright/test` et `npx playwright install chromium` :

```bash
BITGOLD_PROD_URL=https://p01--service-bitgold--dvn9t2gvmtgx.code.run \
npx playwright test e2e/production-smoke.spec.mjs \
  --config=playwright.config.mjs --project=desktop --project=mobile
```

Le workflow GitHub exécute également les parcours connectés avec les secrets `BITGOLD_E2E_EMAIL` et `BITGOLD_E2E_PASSWORD`. Ne jamais les inscrire dans des fichiers Markdown, logs ou captures. Les tests connectés doivent rester non destructifs.

## Politique de diagnostic

- Échec `404` / image cassée : vérifier chemin statique, build et révision déployée avant de modifier le composant.
- HTTP 200 mais mauvaise page : vérifier le rendu/route React et les assertions de contenu.
- CI verte, production ancienne : classer `DÉPLOIEMENT NON VÉRIFIÉ`, ne pas annoncer une livraison visuelle terminée.
- Capture réelle d'un composant avec fixtures : dire « capture d'interface réelle, données de démonstration », jamais « portefeuille réel ».
- Registre des fonctionnalités : `docs/FUNCTIONALITY_TRACKER.md`; runbook existant : `docs/react-production-runbook.md`; critères commerciaux : `docs/COMMERCIAL_RELEASE_GATES.md`.

## Historique de référence

- 2026-10-12 : PR #510 — génération de captures authentifiées synthétiques ; PR #511 — correction de publication ; commit de captures `d998817`.
- Le workflow `BitGold user journeys` de la PR #511 et sur main est passé. Cela **ne valide pas** à lui seul le rendu Northflank.
- Première vérification de production des images : **À FAIRE**, avec résultat consigné ci-dessous.

| Date | SHA main | SHA déployé | Run Playwright production | Images live | Décision |
|---|---|---|---|---|---|
| 2026-10-12 | `d998817` | Non vérifié | À exécuter avec assertion visuelle ciblée | Non vérifié | En attente |

## Régression Achat / Vente (PR #518)

- Tests Playwright `server/e2e/react-investir.spec.mjs` : achat LINK rejeté (liquidités insuffisantes), vente LINK rejetée (quantité insuffisante), liens de récupération et messages d'erreur.
- Desktop et Pixel 7 via `server/playwright.config.mjs` ; scénarios avec API simulée pour reproductibilité.
- Exécution : `cd server && npx playwright test e2e/react-investir.spec.mjs --project=desktop --project=mobile` dans l'environnement CI disposant du navigateur et du serveur de prévisualisation.
- **Limite** : API interceptée ; ceci ne valide pas une transaction sur Northflank ni le compte de l'utilisateur. Ne pas confondre succès CI et production authentifiée.

## Contrôle automatisé de provenance (lot partenaire)
Le workflow de production écrit désormais `server/production-evidence.json` dans l'artefact de CI. Le script `server/scripts/production-evidence.mjs` collecte les statuts HTTP des routes publiques, l'empreinte éventuelle d'un en-tête de révision, le SHA GitHub attendu et la conclusion `VERIFIED` ou `UNVERIFIED`. En l'absence d'un en-tête explicitement exposé et concordant, le déploiement reste **UNVERIFIED**, même si les parcours navigateur passent. Ce script ne tente ni transaction ni authentification et n'expose aucun secret.

La suite Playwright live vérifie en plus les cinq étapes de la démo, les mentions de simulation, la progression et la remise à zéro, sur desktop et mobile. La vérification est conditionnée au déploiement effectif du code et peut échouer pendant le délai de propagation Northflank ; il faut diagnostiquer l'écart avant d'affirmer que la production est à jour.

Grille de qualification des partenaires : `docs/PARTNER_PROVIDER_SCORECARD.md`. Toutes les capacités non confirmées restent inconnues ; le budget cible d'infrastructure est de 200 €/mois au maximum, sans supposer de tarif négocié.

## Navigation, historique et cohérence des écrans
- Suite isolée : `server/e2e/react-navigation-history.spec.mjs`, projets desktop et mobile. Tester `goBack()` et `goForward()` entre accueil, Investir et Bots, ainsi que le bouton de retour intégré d'Investir.
- Sur Portefeuille et Activités non authentifiés, confirmer le verrouillage de l'espace privé et le retour à l'accueil sans fuite de données ; sur session connectée, conserver les parcours `react-account.spec.mjs` et les tests de production authentifiés existants.
- Après chaque action : vérifier le titre propre à l'écran, l'absence du titre de l'écran précédent, les erreurs JS et le débordement horizontal.
- Le test isolé n'est **pas** une preuve de navigation sur la révision Northflank. Pour une validation production, consigner l'identité de révision, les runs et les captures desktop/mobile.
- Observatoire bots PR #531, merge `5748fd6` : fenêtres communes 7/30/90 jours ; 4/4 workflows main verts, SHA Northflank non vérifié.


## Preuve production renforcée — 2026-10-13
- Le smoke invité vérifie désormais l'identité des écrans au fil de l'historique navigateur : accueil, Investir, Bots, puis verrouillage Portefeuille et Activités sans session.
- Le parcours connecté reste strictement en lecture seule et contrôle Portefeuille → Activités → Investir → Bots, puis `back/forward`. Il ne crédite pas le compte E2E et n'envoie aucun ordre.
- `BITGOLD_CAPTURE_UI=true` et `BITGOLD_CAPTURE_AUTH=true` dans le workflow live produisent des captures desktop/mobile dans `server/test-results/`, incluses dans l'artefact `production-guest-smoke-report`.
- La provenance accepte deux preuves exactes : un en-tête de révision égal au SHA GitHub attendu, ou le SHA complet trouvé dans un bundle JavaScript effectivement référencé par la page servie. Un HTTP 200, une capture ou un SHA partiel ne suffisent jamais.
- Si aucune de ces preuves n'existe, `production-evidence.json` conserve `identity: "UNVERIFIED"` même si les parcours navigateur sont verts.
- Le crédit fictif est muté uniquement dans l'environnement CI isolé : tests API d'idempotence/rejet/historique et test UI PayPal. La production authentifiée reste non destructive.

## Audit #343 — état vérifié le 28 octobre 2026

Ce relevé distingue les résultats historiques des vérifications à refaire. Il ne ferme pas l'audit et n'autorise ni paiement ni ordre réel.

| Domaine | Preuve disponible | Complément de clôture |
|---|---|---|
| CI isolée | [Run du 25 octobre](https://github.com/totorina47501-wq/Test-/actions/runs/40162566185) : 85 passed, 3 skipped ; desktop/Pixel 7, onglets clavier/ARIA compris. | Obtenir de nouveaux runs verts après correction du runner ; conserver le détail des tests ignorés. Ne pas recréer les suites locales. |
| Northflank invité/connecté | [Run du 25 octobre](https://github.com/totorina47501-wq/Test-/actions/runs/40167764065) : 12 invités + 4 connectés réussis, desktop/mobile émulé ; connexion, cockpit, portefeuille, activité, bots, backtest, déconnexion. | Rejouer les suites existantes sur la version identifiée ; archiver les rapports et examiner les captures. Ne pas confondre lecture d'un écran et validation de toutes ses données. |
| Derniers échecs CI | [Live du 28 octobre](https://github.com/totorina47501-wq/Test-/actions/runs/40642662159) et [isolé](https://github.com/totorina47501-wq/Test-/actions/runs/40634667927) échouent à l'installation Chromium : Playwright 1.58.2 ne supporte pas ubuntu26.04-x64. Les tests applicatifs sont ignorés, aucun artefact produit. | Fixer ces deux jobs sur ubuntu-24.04, environnement du dernier succès, puis vérifier les runs. Ce constat ne démontre pas une panne de l'application. |
| Provenance | Main audité : cd399b53c86e633943dc991b77e0a23138439499. Seules six captures diffèrent du parent ea851f0786042a704a5c176460b213c5bea66038 testé le 21 octobre. Le run live du 25 octobre indique identity: UNVERIFIED malgré son succès. | Relevé Northflank horodaté : service, déploiement, SHA complet, digest immuable de l'image ; rattacher le rapport navigateur à ce déploiement. Un SHA dans un bundle n'atteste pas à lui seul l'image backend. |
| Isolation | PostgreSQL CI isolé démontré par le workflow ; aucune attestation d'isolation des services Northflank examinée. | Relevé expurgé des identifiants services/bases et références de secrets distincts staging/prod ; test de non-partage des données avec comptes dédiés. Aucun secret dans les preuves. |
| 2FA et simulations déployées | La suite live consulte le statut 2FA mais échoue si un challenge est demandé. Aucun ordre/crédit live ; les tests complets de simulation et challenge sont locaux. | Challenge 2FA et récupération contrôlés sur compte dédié ; achat/vente simulés et rapprochement portefeuille/activité sur staging Northflank isolé. Faire consigner dans #343 l'acceptation de ce périmètre, le runbook imposant la production en lecture seule. Ne pas pointer aveuglément les suites locales vers la production. |
| Restauration | Script restore-drill.mjs présent ; son contrôle vérifie seulement des tables publiques. | Exercice réel source autorisée vers base jetable distincte ; preuve JSON expurgée, volumes/intégrité des données, migrations et smoke applicatif après restauration. |
| Rollback | Procédure FRONTEND_MODE=legacy documentée, sans preuve d'exercice Northflank. | Exercice horodaté image actuelle → image précédente connue → retour ; identités des images, health et parcours essentiels. Documenter séparément le basculement React/legacy, qui n'est pas un rollback de release complet. |
| UX #274–#278 / #362 | Onglets clavier/ARIA corrigés et testés ; mobile émulé existant. Aucune certification WCAG par ces tests. | Une matrice unique critère → preuve → verdict : captures live examinées, mobile réel (appareil/OS/navigateur), focus modal et retour du focus, clavier, contrastes AA mesurés, reduced-motion, lisibilité et débordements. Lier aux tickets concernés. |

### Références à maintenir et statut
- Réutiliser ce document et docs/FUNCTIONALITY_TRACKER.md ; ne pas ouvrir une nouvelle suite Playwright ou un second pipeline de scénarios.
- Rapports CI : conservation prévue à 90 jours dans les deux workflows concernés. Cela ne prolonge pas les archives déjà créées ; l'artefact live du 25 octobre expire le 1er novembre 2026. Exporter les preuves retenues vers l'archive approuvée avant expiration.
- Aucun résultat opérateur, challenge 2FA, restauration, rollback ou contrôle mobile réel n'est déclaré réussi dans ce relevé.
- Les accès opérateur Northflank, les bases source/jetable et le compte 2FA dédié restent à rendre accessibles par un canal sécurisé ; ne pas transmettre de secrets dans l'issue ou le dépôt.
- #343 reste ouverte. Les dépendances commerciales externes ne sont pas des travaux à recréer pour cet audit ; aucun changement des algorithmes Silver/Shield/Gold.

### Vérification d'exécution et contrôle public — 28 octobre 2026
- [PR #577, premier run](https://github.com/totorina47501-wq/Test-/actions/runs/40681367482) : Chromium installé, scénarios API réussis, 81 tests navigateur réussis, 3 ignorés, 2 échecs desktop/mobile sur le sélecteur de capture à chemin ancien. Le job backend [40681367466](https://github.com/totorina47501-wq/Test-/actions/runs/40681367466) est réussi.
- Cause identifiée : staging conservait le sélecteur exact /showcase/<fichier>, tandis que la production sert des chemins localisés. Le correctif existe déjà dans main via [e610441](https://github.com/totorina47501-wq/Test-/commit/e6104414167da95b1356e487f89bc15c75178450) ; reprise du même fichier de test, sans nouveau scénario ni assertion supprimée.
- Attention : user-scenarios.yml exécute aussi certains tests live invités de production-smoke.spec.mjs ; son nom et son serveur local ne suffisent pas à classifier tous les résultats comme locaux.
- Les nouveaux artefacts du premier run sont conservés jusqu'au 26 janvier 2027, ce qui confirme la rétention 90 jours sur ce run.
- [Contrôle navigateur public du 28 octobre](https://agent.tinyfish.ai/runs/f3c7402a-066b-412e-98a1-0917f175639a) : accueil/Investir/Bots accessibles ; Activités verrouillé ; Escape ferme le modal. Le rapport signale un possible 404 invité sur /portefeuille, NON CONFIRMÉ indépendamment. Ne pas corriger le routeur sur cette seule observation.
- Ce contrôle n'a pas effectué de vraie émulation mobile : il a seulement inspecté une image showcase mobile. Aucun PASS mobile réel, contraste AA, reduced-motion ou retour de focus ne doit en être déduit. Les onglets demandés n'ont pas été trouvés ; cette divergence de version reste à rapprocher du SHA déployé.
