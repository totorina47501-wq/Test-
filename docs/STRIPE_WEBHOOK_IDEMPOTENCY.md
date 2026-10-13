# Lot interne : durcissement des webhooks Stripe (2026-10-13)

## Anti-doublon
La route Stripe, les gates commerciaux, les colonnes utilisateurs et les tests préexistants sont **réutilisés**. Aucun deuxième gestionnaire d'abonnements, fournisseur, moteur de bot ou écran n'est créé.

## Changements
- Une table d'événements Stripe à identifiant unique empêche le rejeu d'un même événement signé.
- Insertion de l'ID, modification des droits et validation dans **une transaction SQL** ; un échec annule l'ensemble pour permettre le rejeu Stripe.
- La simple fin d'un checkout ne donne plus accès à Pro/Elite.
- Un abonnement `past_due` ne donne plus accès au premium ; un événement ne peut modifier un compte que si le client Stripe correspond au compte.
- Les gates restent désactivés par défaut. Aucun paiement ni ordre réel activé.
- Les stratégies Silver, Shield, Gold et Micro Alpha restent inchangées.

## Tests et limites
`npm --prefix server test` ; `node --test server/test/stripe-webhook-idempotency.test.js`.

À valider encore : scénarios sandbox signés bout-en-bout, événements Stripe reçus dans le désordre, annulation/réactivation, remboursements, chargebacks et réconciliation périodique avec Stripe. Le modèle courant ne doit pas être activé commercialement sans ces preuves.

Autres travaux internes non clos : sécurité JWT/2FA réelle, SHA Northflank, E2E authentifiés, sauvegarde/restauration, alerting, performances, qualité des métriques bots, SEO et analytics consentis. Les documents historiques ne valent pas preuve de production.
