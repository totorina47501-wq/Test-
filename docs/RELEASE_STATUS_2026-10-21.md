# État consolidé BitGold — 21 octobre 2026

## Anti-doublons
- PR #543 fermée sans fusion : ancienne implémentation Stripe redondante et moins stricte.
- PR #574 fusionnée : tests Stripe et FR/EN/ES.
- PR #575 fusionnée : garde SQL contre événements d'abonnement hors ordre.
- CI du commit ba823ae8 verte (3/3). Le HEAD a756260e est une mise à jour de captures avec skip ci.

## Stripe — implémenté, non certifié
Webhook signé, gates commerciaux fermés par défaut, transaction SQL, dédoublonnage, liaison client/abonnement et garde chronologique déjà présents. Ne pas dupliquer.
Restent à tester en sandbox : événements de même seconde, replay concurrent, remboursement, litige, paiement différé, suppression, isolation des comptes, migration et réconciliation Stripe.

## i18n — partiellement livré
Sélecteur et dictionnaires FR/EN/ES existants. Audit JSX, messages serveur visibles, états des bots, formats dates et devises, et parcours Playwright dans les trois langues encore nécessaires.

## Prochain lot sans doublon
1. Inventaire automatisé des chaînes non traduites, puis corrections ciblées sans toucher aux algorithmes Silver/Shield/Gold.
2. Tests Stripe sandbox et robustesse des événements.
3. CI PR/main et vérifications authentifiées en production.

## Go/no-go
NON APPROUVÉ pour abonnements payants et trading crypto réel. Ne pas activer les prestataires ni les paiements.
