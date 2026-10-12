# BitGold — Grand lot produit : Quantum Fund, langues et découverte crypto

## Objectif
Améliorer l'accès à Quantum Fund et la découverte des actifs, **sans modifier la dernière évolution des bots IA**. Le moteur Quantum Fund, les stratégies, leurs allocations, les décisions et leurs endpoints n'ont pas été changés.

## Livré
- Quantum Fund mis en avant sur la landing et le cockpit ; lien vers la page Bots IA existante, qui conserve le comparateur authentifié.
- Socle de localisation : français, anglais, espagnol, allemand, portugais brésilien ; sélection persistée en localStorage, attribut HTML lang synchronisé.
- Traductions du nouveau contenu produit et de la découverte. **Le reste de l'application historique demeure en français** : ne pas présenter cela comme une traduction intégrale.
- Catalogue public de 24 nouveaux actifs en **découverte seulement** ; recherche par nom/symbole/catégorie, filtres, mobile.
- Endpoint `GET /api/market/discovery` renvoyant des métadonnées figées sans cours, sans transactions, sans éligibilité bots.
- Les 6 actifs initiaux et leurs prix, achats/ventes simulés, historiques et moteurs bots sont inchangés.

## Risques et règles de vérité
- **24 nouveaux actifs ≠ 24 actifs négociables**. L'extension des transactions simulées nécessitera un lot dédié avec vérification de la fraîcheur, de la liquidité, des risques, des historiques et des impacts sur les bots.
- Le catalogue de découverte n'est pas une cotation en temps réel.
- Les performances Quantum Fund restent simulées, sans garantie ni recommandation personnalisée.
- Ne pas modifier `server/src/bot-ai-engine.js`, `server/src/quantum-fund-lab.js`, `server/src/bot-ai-backtest.js` ou `frontend/src/components/QuantumFundPanel.tsx` dans ce lot.

## Contrôles
1. `cd server && npm test` : contrat du catalogue, intégration et tests existants.
2. `cd frontend && npm run lint && npm run build`.
3. Playwright : `server/e2e/crypto-discovery.spec.mjs` et parcours authentifiés existants.
4. Contrôler FR/EN/ES/DE/PT-BR, recherche et filtres ; vérifier que les actifs découverte ne proposent pas de bouton Acheter/Vendre.
5. Vérifier la CI sur PR, fusion puis sur `main`. Aucun statut vert ne doit être annoncé avant confirmation des workflows.

## Suites proposées
- Traduction complète des textes existants avec couverture CI, hreflang et emails localisés.
- Élargissement des cryptos négociables **par étapes** avec protection explicite des entrées de bots.
- Activation produit mesurée, UX mobile, analytics consenties, tests de rétention.
