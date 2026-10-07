# Agent Payments v1.1 — Production Readiness

## Scope livré sans prestataire externe

- cockpit opérateur : mandats, événements, budget consommé, capacité et alertes ;
- révocation individuelle des mandats ;
- x402 : idempotence, anti-rejeu, cycle pending/verified/settled/failed et reçus persistants ;
- réconciliation : états, preuves manquantes, échecs incohérents et paiements bloqués > 15 min ;
- concurrence : test PostgreSQL avec verrouillage empêchant un double settlement ;
- audit/correlation et emergency stop ;
- OpenFacilitator injectable pour CI déterministe ;
- frontière AP2 explicite, signée pour l'anti-altération interne, sans revendication de conformité AP2 complète.

## Garde-fous obligatoires

X402_SETTLEMENT_ENABLED=false reste la valeur sûre par défaut. X402_EMERGENCY_STOP=true reste actif par défaut. La promotion de cette release ne doit pas activer de fonds réels.

## Runbook opérateur

1. Consulter /api/agent-payments/operations pour l'état du rail, les budgets et alertes.
2. Consulter /api/agent-payments/x402/reconciliation ; healthy=false impose une investigation.
3. X402_MISSING_RECEIPT est critique : ne pas retenter aveuglément un settlement.
4. X402_STALE_IN_FLIGHT signale un quote pending/verified depuis plus de 15 minutes ; vérifier l'audit et le prestataire avant toute reprise.
5. En cas de doute sur l'intégrité du rail, conserver l'emergency stop actif.
6. Révoquer individuellement le mandat compromis plutôt que de réactiver globalement le rail.

## Dépendances externes maintenues au backlog

La production avec fonds réels reste bloquée jusqu'à validation des dépendances externes : KYC/AML réel (#71), validation OpenFacilitator/testnet externe (#72), AP2 conforme au protocole/prestataire retenu (#75), ainsi que custody/wallet et validation réglementaire suivies par #67.

Cette v1.1 est donc une readiness logicielle et opérationnelle, pas une autorisation de mise en production financière.
