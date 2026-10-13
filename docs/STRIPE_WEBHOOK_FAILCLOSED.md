# Précommercial — lot webhook fail-closed (2026-10-13)

## Correction réellement implémentée
- La route existante `POST /api/stripe/webhook` vérifie désormais le **même verrou d'approbation** que le checkout et le portail **avant** de traiter une signature ou de modifier `users.plan`.
- Sans toutes les approbations, elle renvoie HTTP 503 ; aucune mise à niveau de compte ne peut être provoquée par un webhook signé lorsque la commercialisation est désactivée.
- Tests de régression de l'ordre gate/signature/écritures, du contrôle de signature et de l'absence d'activation par la simple présence de clés Stripe.
- Aucun nouveau service, abonnement, prestataire, transaction réelle, moteur de bots ou modification de Silver/Shield/Gold.

## Validation
`node --test server/test/stripe-webhook-gate.test.js`
`npm --prefix server test`

## Restant non certifié — ne pas confondre avec la correction
- Stripe sandbox : stockage transactionnel et idempotent des IDs d'événements, ordre des événements, association customer/user, vérification du statut de paiement, échecs, remboursements, chargebacks et réconciliation des droits.
- Authentification JWT/2FA et tests live de sécurité ; E2E connectés et SHA Northflank ; preuves de performance bots et parcours UX ; monitoring, restauration et rollback ; mesures API/cache ; SEO réel et instrumentation analytics consentie.
- L'ensemble de ces contrôles demande des tests et preuves supplémentaires. Les switches commerciaux restent OFF, sans aucune validation réglementaire présumée.
