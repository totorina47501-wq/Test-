# Kraken public WebSocket — marché BitGold

- Flux public Kraken v2 `wss://ws.kraken.com/v2`, canal `ticker`, paires EUR disponibles, sans clé API.
- Le serveur consomme le flux et superpose les cotations récentes (30 s maximum) à l'API REST existante `/api/market` et aux détails. CoinGecko reste la source des historiques et du repli, y compris pour les actifs non disponibles chez Kraken.
- Désactivation immédiate : `KRAKEN_MARKET_ENABLED=false`. Le flux n'est pas démarré dans `NODE_ENV=test` ; tests unitaires avec socket simulé. Pas de clé ni de flux Kraken dans le navigateur. Aucune modification des moteurs de bots ni des transactions simulées.
- Contrôles : `node --test server/test/kraken-market.test.js`, tests serveur, Playwright et CI. Contrôler la fraîcheur et le repli si Kraken est inaccessible. Une extension future pourra pousser les prix vers les clients par WebSocket authentifié ; ici le frontend continue à lire l'API REST existante.
- Vérifier les conditions Kraken de redistribution des données avant commercialisation.
