# BitGold Quantum Fund — laboratoire comparatif (simulation)
Compare trois architectures à partir de courbes d'equity de bots existants : meilleur agent sur période d'entraînement, pondération égale, et allocation plafonnée selon le Sharpe empirique d'entraînement.
Module : `server/src/quantum-fund-lab.js`.
Aucune transaction réelle ni accès à un exchange.
## Contrôles
- Courbes alignées et strictement chronologiques, au moins 12 observations.
- Découpage chronologique entraînement/test, sans utiliser les rendements test pour choisir les poids.
- Coûts de rééquilibrage paramétrables et conservation en cash de la part non allouée.
- Rendement, drawdown, Sharpe et Sortino sur la période test.
## Limites
Les courbes d'entrée doivent être produites par un backtest causal, avec les mêmes frais et périodes. La sélection reste exposée au surapprentissage. La comparaison n'est pas une preuve de surperformance. La comparaison est accessible dans l'espace connecté **Bots IA**, sous le laboratoire de backtests. Ce composant affiche les rendements de test et le risque, sans passer d'ordre.
## Tests
Depuis `server/` : `node --test test/quantum-fund-lab.test.js`.

## Intégration cockpit — lot 2
- Route authentifiée : `GET /api/bots/quantum-fund?days=90&bots=shield,silver,gold`. Reprend la récupération d'historique CoinGecko et le simulateur de bots existants. Deux bots valides minimum, six maximum.
- Composant : `frontend/src/components/QuantumFundPanel.tsx`, dans l'onglet **Bots IA** de `AccountPage.tsx`.
- Affichage : histogramme rendement net / drawdown, tableau Sharpe et Sortino, poids de chaque agent, découpage chronologique entraînement / test.
- Choix de l'utilisateur : historiques de 30, 90 ou 180 jours. Aucune allocation effective sur son portefeuille ; toutes les données sont pédagogiques.
- Limitation importante : `simulateBacktest` ne fournit que les **200 dernières observations** de la courbe. Le laboratoire travaille sur ces points, et non sur l'intégralité de la période demandée. Les rendements ne sont pas annualisés sauf ratios indiqués dans le moteur ; interpréter prudemment les échantillons irréguliers.
- Frais : simulateur de bot `feeRate=0.0015` et `slippageRate=0.0005` par défaut ; laboratoire `feeRate=0.0015` lors des rééquilibrages fictifs.
- Incident historique indisponible : route HTTP 502 avec un message neutre, l'interface l'affiche dans son bloc d'erreur.

## Vérification recommandée avant livraison
1. `cd server && npm test` (comprend les tests du moteur Quantum Fund).
2. `cd frontend && npm run lint && npm run build`.
3. Playwright, utilisateur connecté : ouvrir **Bots IA**, lancer **Comparer les modèles**, contrôler tableau, graphique et gestion d'erreur.
4. GitHub Actions sur PR et sur `main` : confirmer tous les jobs verts ; ne pas confondre validation du code et déploiement de production.
