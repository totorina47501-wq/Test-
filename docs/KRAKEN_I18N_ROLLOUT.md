# Kraken et internationalisation — lot initial (2026-10-14)

- Décision produit : Kraken WebSocket v2 public, sans authentification pour le ticker spot. Ne pas confondre avec l'API d'exécution d'ordres ; les transactions BitGold restent simulées.
- Source actuelle vérifiée : CoinGecko fournit les cours EUR, historiques et métadonnées via `/api/market`. **Le flux Kraken n'est pas encore câblé** dans ce lot de corrections linguistiques. Prévoir un adaptateur dédié avec souscriptions EUR disponibles, normalisation, indicateur de fraîcheur, reconnexion et repli CoinGecko, puis tests de coupure et de reconnexion avant activation.
- Traductions : extension des cinq langues de `frontend/src/i18n.ts` pour l'écran Investir (opérations, avertissements de simulation, erreurs, graphique et mesures). Aucun changement des bots, prix de référence ou ordres.
- Vérification : `node --test server/test/investir-i18n.test.js` puis `npm --prefix frontend run build` et Playwright desktop/mobile. Les autres écrans peuvent encore comporter du texte français ; ne pas revendiquer une couverture totale.
