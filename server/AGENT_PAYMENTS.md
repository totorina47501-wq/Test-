# Agent Payments — AP2 / x402 readiness

Cette couche prépare BitGold à l'autorisation de transactions exécutées par des bots. Elle ne prétend pas implémenter l'intégralité d'AP2 v0.2 : elle fournit un mandat interne compatible avec ses concepts d'autorisation autonome, contraintes, expiration, preuve cryptographique et audit, avec un rail préparé pour x402.

## Modèle
- Free : simulation uniquement.
- Pro : autonomie bornée, 1 000 € maximum par opération et 5 000 € par jour par mandat.
- Elite : autonomie renforcée, 5 000 € maximum par opération et 25 000 € par jour.
- Validation humaine au-delà du seuil configuré.
- Expiration, révocation, actifs autorisés et journal d'audit.
- KYC/AML/risk gate conservé côté serveur.

## Flux
Utilisateur → mandat agent → Bot IA → KYC/AML/Risk → autorisation AP2-compatible → rail de paiement.

## x402
x402 est un standard de paiement HTTP basé sur le signal 402 Payment Required. BitGold ne l'active pas pour le règlement réel : x402-prepared est un mode de préparation seulement.

Avant tout règlement réel, il faudra un prestataire/wallet/custodian autorisé, une politique de garde et de clés, KYC/AML/sanctions/PEP opérationnels, vérification/settlement x402 conformes au réseau choisi et un audit sécurité/réglementaire.

## Variables
- AGENT_PAYMENT_ENFORCEMENT=true en production.
- AGENT_PAYMENT_MANDATE_SECRET dans le secret manager uniquement.
- PAYMENT_RAIL_MODE=simulation par défaut.

Ne jamais mettre une clé privée de wallet, un secret x402 ou une clé de règlement dans Git.
