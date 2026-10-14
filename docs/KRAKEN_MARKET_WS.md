# Kraken public WebSocket — marché BitGold

- Flux public Kraken v2 `wss://ws.kraken.com/v2`, canal `ticker`, paires EUR disponibles, sans clé API.
- Le serveur consomme le flux et superpose les cotations récentes (30 s maximum) à l'API REST existante `/api/market` et aux détails. CoinGecko reste la source des historiques et du repli, y compris pour les actifs non disponibles chez Kraken.
- Désactivation immédiate : `KRAKEN_MARKET_ENABLED=false`. Le flux n'est pas démarré dans `NODE_ENV=test` ; tests unitaires avec socket simulé. Pas de clé ni de flux Kraken dans le navigateur. Aucune modification des moteurs de bots ni des transactions simulées.
- Contrôles : `node --test server/test/kraken-market.test.js`, tests serveur, Playwright et CI. Contrôler la fraîcheur et le repli si Kraken est inaccessible. Une extension future pourra pousser les prix vers les clients par WebSocket authentifié ; ici le frontend continue à lire l'API REST existante.
- Vérifier les conditions Kraken de redistribution des données avant commercialisation.

## Renforcement de robustesse (14 octobre 2026)
- Ignore les messages d'une ancienne connexion WebSocket et les événements reçus après arrêt.
- Protège l'envoi de souscription et refuse les timestamps de cotation futurs.
- Les prix Kraken expirés continuent de céder la place au repli REST CoinGecko. Aucune modification des stratégies de trading.

- Tests unitaires complémentaires : cotation horodatée dans le futur et messages reçus après `stop()` ; aucun réseau externe ni clé requis.
- Le client frontend continue d'interroger `/api/market` ; aucune promesse de streaming navigateur natif.
