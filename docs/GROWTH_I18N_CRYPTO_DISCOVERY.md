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

## Lot suivant — langues + extension des transactions simulées

- Quatre cryptos supplémentaires : **ADA, XRP, LTC, DOT**, avec identifiants CoinGecko, cotations et historique via les mêmes API que les actifs existants.
- Les ordres manuels restent **strictement refusés si la cotation n'est pas fraîche** (moins de 120 secondes), indisponible ou non positive. Aucune cotation inventée pour les nouveaux actifs.
- Les 20 autres actifs demeurent en découverte seule, non négociables et non éligibles aux bots.
- Le flux historique global utilisé par les bots est explicitement limité aux six symboles précédents via `botLegacyMarketSymbols`. Les fichiers de stratégies, Quantum Fund et les règles de décision n'ont pas été modifiés.
- Traductions étendues à la navigation, à l'accueil et aux actions principales de la page Investir. Les vues privées historiques et certains libellés restent en français : **l'internationalisation intégrale reste à terminer**.
- Tests : mise à jour du catalogue, Playwright découverte, assertion des quatre actifs et de l'isolement des bots.

### Vérifications additionnelles à réaliser
1. Sur `/investir`, vérifier les 10 actifs négociables et le refus d'achat/vente sans cours frais.
2. Vérifier les historiques ADA/XRP/LTC/DOT, les conversions et la valorisation après transaction en environnement authentifié.
3. Vérifier les 5 langues et l'absence de chaînes françaises résiduelles sur les parcours privés.
4. Vérifier que le comparateur Quantum Fund et les bots produisent les mêmes résultats pour les mêmes entrées qu'avant le lot.
5. Vérifier les workflows PR et post-fusion sur `main`.
