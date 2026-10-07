# Runbook incident x402

Le settlement réel reste désactivé par défaut. En cas d'incident ou de suspicion, conserver `X402_EMERGENCY_STOP=true`.

## Triage

1. Vérifier `/api/agent-payments/x402/status` et confirmer que l'arrêt d'urgence est actif.
2. Corréler les événements avec `X-Correlation-ID` et l'audit x402.
3. Examiner les séries de résultats `failed`, `denied`, les rejeux et les codes de refus sans collecter de payload signé, token, secret ou clé.
4. Révoquer individuellement les mandats concernés si nécessaire.
5. Conserver les preuves techniques utiles (correlation ID, quote ID, événement, outcome, code, horodatage).

## Réactivation

Ne désactiver l'arrêt d'urgence qu'après résolution, revue des événements d'audit et validation explicite de l'exploitation. La réactivation du kill switch ne doit jamais activer à elle seule le settlement : `X402_SETTLEMENT_ENABLED` reste un contrôle séparé.

## Alertes

Une exploitation doit alerter sur une hausse anormale des événements `failed` ou `denied`, les tentatives de rejeu et les contournements d'allowlist. Les logs structurés x402 n'incluent pas les secrets ni les payloads de paiement.
