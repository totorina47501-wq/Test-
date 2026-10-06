# Agent Payments — AP2 / x402 readiness

Cette couche prépare BitGold à l'autorisation de transactions exécutées par des bots. Elle **ne prétend pas implémenter l'intégralité du protocole AP2 v0.2** : elle fournit un mandat interne compatible avec les concepts AP2 (autorisation autonome, contraintes, expiration, preuve cryptographique et audit) et une abstraction de rail prête pour x402.

AP2 v0.2 distingue notamment les Checkout Mandates et Payment Mandates et exige une vérification déterministe des mandats. BitGold conserve donc la conformité KYC/AML et ses limites côté serveur avant toute exécution.

## Modèle BitGold

- **Free** : simulation uniquement.
- **Pro** : autonomie bornée, 1 000 € maximum par opération et 5 000 € de budget quotidien par mandat.
- **Elite** : autonomie renforcée, 5 000 € maximum par opération et 25 000 € de budget quotidien.
- Seuil de validation humaine avant exécution autonome au-delà d'un montant configuré.
- Expiration et révocation des mandats.
- Actifs autorisés explicitement listés.
- Journal d'autorisation avec empreinte SHA-256.
- KYC/AML/risk gate conservé en amont.

## Flux

```
Utilisateur
   ↓ définit les contraintes
Mandat agent BitGold
   ↓ signature + expiration
Bot IA / Adaptive AI
   ↓ décision
KYC / AML / Risk
   ↓ autorisation
AP2-compatible authorization
   ↓
Rail = simulation aujourd'hui
   ↓
x402 adapter / settlement réglementé à venir
```

## x402

x402 est un standard de paiement HTTP qui utilise le signal `402 Payment Required` et des messages de paiement vérifiables. BitGold ne l'active pas encore pour le règlement réel : `x402-prepared` est un mode de préparation uniquement.

Avant tout règlement réel, il faudra :
1. un wallet/custodian ou prestataire autorisé ;
2. une politique de garde et de clés ;
3. KYC/AML/sanctions/PEP opérationnels ;
4. vérification et settlement x402 conformes au réseau choisi ;
5. audit sécurité/réglementaire ;
6. tests de non-régression et kill-switch.

## Variables

- `AGENT_PAYMENT_ENFORCEMENT=true` en production.
- `AGENT_PAYMENT_MANDATE_SECRET` dans le secret manager uniquement.
- `PAYMENT_RAIL_MODE=simulation` par défaut.

Ne jamais mettre une clé privée de wallet, un secret x402 ou une clé de règlement dans Git.
