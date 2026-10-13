# Précommercial — contrôles internes de non-régression (2026-10-13)

## Périmètre livré
- Ajout d'une matrice de tests Node native pour les cinq approbations commerciales : absence, valeur vide, faux, variantes non canoniques et espaces.
- Vérification que la présence de clés Stripe, même sous une forme simulant une clé live, ne contourne pas les approbations.
- Vérification que les drapeaux de prestataire ou de trading réel ne peuvent activer la crypto réelle.
- Vérification de l'absence de secrets et de drapeaux internes dans le statut public, de l'immuabilité des snapshots et de la non-mutation de l'environnement.
- Aucune modification du comportement des bots Silver / Shield / Gold, du code Stripe, de la production ou des adaptateurs fournisseur.

## Exécution
`node --test server/test/commercial-release-hardening.test.js`
`node --test server/test/commercial-release.test.js`

## Reste à valider — ne pas déclarer PASS sans preuve
1. Stripe : tests d'intégration sandbox signés (rejeu d'événement, idempotence transactionnelle, paiement échoué, annulation, remboursement, chargeback, ownership et entitlements).
2. JWT / 2FA : expiration, isolation inter-comptes, limitation de débit, récupération de compte et authentification réelle.
3. Playwright : parcours desktop/mobile connectés, erreurs, retours arrière et actions portefeuille/investir/activité.
4. UX : navigation, états vides, chargement, erreurs et accessibilité mobile.
5. Bots : affichage des performances/historiques et cohérence des calculs, sans toucher aux stratégies.
6. API : latence, cache, erreurs de fournisseur de prix, limitation 429 et tests de charge.
7. SEO : audits d'indexation, métadonnées et contenus par langue.
8. Analytics : consentement, instrumentation et validation des événements agrégés.
9. Ops : logs, alertes, sauvegardes et exercice de restauration.
10. Documentation : tenir à jour les preuves CI/production et les fiches de fonctionnalité.

## Gates
Cette livraison ne constitue **ni** une certification de sécurité **ni** une autorisation commerciale. Les paiements restent désactivés par défaut. Le raccordement à un prestataire réel demeure hors périmètre. Ne pas fusionner vers `main` avant validation des contrôles CI de la PR.
