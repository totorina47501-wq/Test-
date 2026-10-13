# BitGold — comparaison prestataires crypto (Bitpanda Enterprise / Venga)

**Statut : pré-contractuel, simulation uniquement.** Aucun partenariat, tarif, service crypto réel ou autorisation de trading automatisé n'est confirmé. Remplir uniquement à partir de réponses écrites du fournisseur, avec date, interlocuteur et référence documentaire. Ne pas envoyer d'identifiants, secrets ou données clients.

## Tableau de décision

| Critère bloquant | Bitpanda Enterprise | Venga | Preuve attendue |
|---|---|---|---|
| Entité française admissible / KYB | À confirmer | À confirmer | Conditions d'éligibilité écrites |
| Contrat, responsabilité réglementaire / MiCA | À confirmer | À confirmer | Contrat + avis juridique indépendant |
| Compte individuel pour chaque utilisateur BitGold | À confirmer | À confirmer | Parcours client et schéma API documentés |
| KYC/AML et consentement utilisateur | À confirmer | À confirmer | RACI et parcours sandbox |
| Custody et propriété des actifs | À confirmer | À confirmer | Conditions de conservation et ségrégation |
| Dépôts/retraits EUR, SEPA, carte, PayPal | À confirmer | À confirmer | Liste des moyens, frais et restrictions |
| Achat/vente crypto et univers d'actifs | À confirmer | À confirmer | API quotes/orders, pays, frais et limites |
| Trading algorithmique / bots autorisé | À confirmer | À confirmer | Autorisation contractuelle explicite |
| Sandbox, webhooks signés, idempotence | À confirmer | À confirmer | Accès test et documentation |
| RGPD, DPA, sous-traitants, résidence | À confirmer | À confirmer | DPA et annexes sécurité |
| Frais fixes <= 200 EUR/mois | À confirmer | À confirmer | Devis écrit, minimums et coûts variables |
| SLA, incidents, support, sortie fournisseur | À confirmer | À confirmer | SLA et procédure de réversibilité |

## Règles de sélection

1. **No-go** si l'un des points réglementaires, KYC, conservation, autorisation des bots ou contractualisation n'est pas validé pour le périmètre envisagé.
2. **No-go budget** si le coût fixe mensuel dépasse 200 EUR, sauf nouvelle décision explicite du porteur du projet. Les frais variables doivent être chiffrés séparément.
3. Comparer les fournisseurs seulement après obtention des réponses documentées : aucune capacité ne doit être notée « oui » par inférence depuis un site marketing.
4. Ne jamais basculer le connecteur `server/integrations/crypto-provider.mjs` en mode réel avant les gates de `docs/CRYPTO_PROVIDER_INTEGRATION.md` et `docs/COMMERCIAL_RELEASE_GATES.md`.

## Modèle de compte-rendu d'échange

- Fournisseur / date / interlocuteur : **à compléter**
- Réponse écrite / lien documentaire : **à compléter**
- Éligibilité BitGold et conditions : **à compléter**
- Sandbox et limites API : **à compléter**
- Devis fixe, variable et minimums : **à compléter**
- Obligations juridiques et opérationnelles : **à compléter**
- Décision : **EN ATTENTE** tant que les critères bloquants restent non vérifiés.

## Questionnaire d'envoi standard (2026-10-13)
Envoyer à chaque fournisseur les mêmes questions et demander une réponse écrite avec référence de documentation : (1) éligibilité entreprise française, (2) statut réglementaire et responsabilités MiCA, (3) accès sandbox et schéma d'API, (4) onboarding/KYB/KYC et consentement, (5) custody et ségrégation, (6) quote/order/webhook/idempotence, (7) rails EUR et frais, (8) permission de trading automatisé, (9) DPA et sécurité, (10) devis fixe <= 200 EUR/mois et coûts variables, (11) SLA/support et réversibilité, (12) usage autorisé du nom et du logo du fournisseur. Ne jamais marquer « validé » sans preuve écrite.
