# Contrôles qualité BitGold — couverture du dépôt

## Inventaire
- Frontend React TypeScript : `npm run lint` dans `frontend/` (compilateur TypeScript strict, sans émission), et `npm run build`.
- JavaScript serveur, tests, scripts, E2E et frontend legacy : `npm run lint:all` dans `server/` parcourt tous les `.js`, `.mjs`, `.cjs` hors artefacts générés, via `node --check`.
- HTML legacy : `npm run check:html` ; CSS legacy : `npm run check:css` (stylelint recommandé).
- CI : tests.yml lance `lint:all` avant le conteneur, react-frontend.yml lance `lint` avant build.

## Limites et suites
Ces contrôles garantissent la **syntaxe JS** et les **types TS** ; ils ne remplacent pas une analyse ESLint de règles stylistiques/sémantiques sur tout le dépôt. Pour une couverture ESLint complète, ajouter une configuration flat ESLint et ses dépendances verrouillées après un audit des avertissements historiques. Ne pas annoncer de lint sémantique ESLint tant qu'il n'est pas intégré.
