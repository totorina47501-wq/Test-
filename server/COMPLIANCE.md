# KYC / AML — architecture de production

Cette couche ajoute les contrôles techniques nécessaires avant de connecter un prestataire réglementé. **Elle ne constitue pas, à elle seule, une certification de conformité réglementaire.**

## Contrôle de transaction

En production, COMPLIANCE_ENFORCEMENT=true bloque les opérations sensibles tant que :
- KYC = verified
- AML = clear
- risque = différent de high

Toute erreur du moteur de conformité bloque également l'opération (fail-closed).

## Statuts

Chaque utilisateur possède un enregistrement user_compliance :
- kyc_status : pending | verified | rejected
- aml_status : pending | clear | review | blocked
- risk_level : unknown | low | medium | high
- fournisseur et référence externe
- motif et date du dernier contrôle

Les changements sont journalisés dans compliance_events avec une empreinte SHA-256 du payload.

## Fournisseur

Le endpoint POST /api/compliance/provider/webhook attend un payload JSON signé par HMAC-SHA256 dans X-Compliance-Signature (format sha256=<hex>), avec notamment :
- userId
- provider
- externalReference
- kycStatus
- amlStatus
- riskLevel
- reason

Les valeurs reçues sont normalisées et refusées si la signature n'est pas valide.

## Mise en production

Configurer dans le gestionnaire de secrets (jamais dans Git) :
- COMPLIANCE_ENFORCEMENT=true
- COMPLIANCE_WEBHOOK_SECRET
- KYC_PROVIDER_URL
- AML_PROVIDER_URL

Il faut ensuite connecter un prestataire KYC/AML adapté aux pays ciblés, définir les règles de sanctions/PEP, la revue manuelle, la conservation des données, les obligations RGPD et le dispositif de conformité interne. Tant que ce branchement n'est pas effectué, le système reste en attente et bloque les opérations en production.


## Adaptation par abonnement

La conformité ne supprime jamais le KYC/AML pour les comptes Free, Pro ou Elite.

- **Free** : KYC standard + AML, opération maximale 2 000 €, plafond quotidien 2 000 €.
- **Pro** : KYC standard + AML, opération maximale 10 000 €, plafond quotidien 10 000 €.
- **Elite** : KYC renforcé + AML, opération maximale 50 000 €, plafond quotidien 50 000 €.
- Des seuils de montant déclenchent une revue AML manuelle avant exécution.
- Les limites sont appliquées aux trades manuels **et** aux exécutions automatiques des bots.

Les niveaux et plafonds doivent rester cohérents avec les règles du prestataire réglementé, la juridiction et la politique de risque réelle de BitGold.
