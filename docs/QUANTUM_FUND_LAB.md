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
Les courbes d'entrée doivent être produites par un backtest causal, avec les mêmes frais et périodes. La sélection reste exposée au surapprentissage. La comparaison n'est pas une preuve de surperformance. La version initiale est un module de recherche, pas encore un écran cockpit.
## Tests
Depuis `server/` : `node --test test/quantum-fund-lab.test.js`.
