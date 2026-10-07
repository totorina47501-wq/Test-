# Agent Payments v1 — Safe Testnet

## Portée livrable sans prestataire externe

BitGold dispose d'un parcours de préparation testnet reproductible : quote serveur borné par allowlist, mandat agent signé et révocable, contrôle de conformité BitGold, vérification/settlement OpenFacilitator injectables en test, verrouillage transactionnel du quote, idempotence/anti-rejeu, preuve de règlement persistée, audit corrélé, cockpit opérateur et arrêt d'urgence.

Les tests CI utilisent un facilitateur déterministe injecté. Ils ne constituent pas une preuve d'interopérabilité avec un réseau ou prestataire externe.

## Garde-fous obligatoires

- `X402_SETTLEMENT_ENABLED=false` par défaut.
- `X402_EMERGENCY_STOP=true` par défaut.
- Aucun secret de wallet ou clé de règlement dans Git.
- Un quote expiré, consommé ou échoué n'est pas réutilisable.
- La cible réseau/asset/destinataire est liée à la configuration serveur.
- Les retries utilisent une clé d'idempotence ; une clé ne peut pas être recyclée sur un autre quote.
- Le reçu x402 est lié au propriétaire du quote.
- La conformité reste une responsabilité BitGold distincte du rail x402.

## Validation locale / CI

Le scénario automatisé couvre `/verify` puis `/settle`, une preuve de transaction simulée, les altérations montant/réseau/asset, les invariants de concurrence, la récupération du reçu et les frontières AP2. La CI doit être verte avant toute promotion de `staging` vers `main`.

## Dépendances externes conservées au backlog

Ne pas considérer les points suivants comme livrés sans prestataire et environnement réels :

1. KYC/AML/sanctions/PEP opérationnels avec prestataire autorisé (#71).
2. Exécution d'un vrai parcours OpenFacilitator/testnet externe, avec credentials, réseau choisi et preuve externe (#72).
3. Validation AP2 conforme au protocole/prestataire finalement retenu, au-delà du mapping et de la signature préparatoires (#75).
4. Custody/wallet, politique de clés, responsabilités réglementaires et audit sécurité avant tout fonds réel (#67).

## Critère de sortie de la release

Agent Payments v1 Safe Testnet peut être publié comme couche de simulation/test déterministe. Il ne doit jamais être présenté comme un système de paiement réel, un KYC/AML réel, ni une implémentation AP2 complète tant que les dépendances externes ci-dessus restent ouvertes.
