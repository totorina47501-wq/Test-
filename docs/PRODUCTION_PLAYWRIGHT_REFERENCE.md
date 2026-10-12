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
