# BitGold — ABCDE commercialisation & partenaires (2026-10-13)
## Statut
Lot de préparation, pas de lancement commercial ni de partenariat signé. Tout reste en simulation. Les composants Silver, Shield, Gold, Micro Alpha, portefeuilles et ordres existants restent inchangés.

## A — Contrats et simulation fournisseur
Le module existant `server/integrations/crypto-provider.mjs` reste **fail-closed**. `createContractFixture` ajoute une simulation déterministe en mémoire pour tester quote, expiration, idempotence, événement validé, anti-rejeu, réconciliation et isolation utilisateur. Ce fixture n'est ni une sandbox Bitpanda/Venga, ni un ledger durable, ni une preuve de conformité. Pas de réseau, pas de secrets, pas de live.

## B — Kit de due diligence partenaire
Utiliser `PARTNER_TECHNICAL_DUE_DILIGENCE.md`, `PARTNER_PROVIDER_SCORECARD.md`, `PARTNER_REVIEW_DEMO.md` et `CRYPTO_PROVIDER_INTEGRATION.md` comme sources. Envoyer uniquement une démonstration synthétique, demander KYB, API sandbox, KYC/AML, custody, frais, SLA, RGPD/DPA, permissions bots et contraintes marketing par écrit. Aucune capacité n'est présumée. Prévoir une validation juridique indépendante avant tout service réel.

## C — Activation utilisateur
Réutiliser `ReactOnboarding`, `LandingPage`, `Investir`, `Bots`, `Portefeuille` : la landing comporte un parcours découverte → inscription → scénarios IA et l'onboarding affiche une étape pédagogique « première simulation ». Cette étape est volontairement **manuelle**, pas une preuve qu'un ordre a été passé. Ne pas confondre page visitée et activation réelle.

## D — Acquisition, mesure et monétisation
`GrowthConsentPanel` enregistre **localement** les CTA et les paramètres UTM seulement après consentement explicite ; aucun transfert réseau ni cookie analytique tiers. Limite à 100 événements et effacement immédiat sur retrait. Cela ne fournit **pas encore** un dashboard d'acquisition agrégé ; pour une mesure de cohortes, prévoir une solution RGPD revue et testée, puis un backoffice avec permissions. Offre premium **à tester**, sans paiement actif : historique avancé, comparaison de stratégies et scénarios éducatifs. Ne pas activer de checkout tant que les gates paiements/CGV/TVA/support ne sont pas approuvés.

## E — Gates commerciaux
Voir `COMMERCIAL_RELEASE_GATES.md`. Avant commercialisation payante : preuves de 2FA, sessions, RGPD et suppression/export, CGV, support, paiements sandbox (échec, double webhook, annulation, remboursement), sauvegarde/restauration, audit sécurité, approbation juridique et preuve du SHA déployé. Le code ne doit pas présenter ces gates comme validés.

## Validation
`node --test server/integrations/crypto-provider.test.mjs`, `npm --prefix frontend run lint`, `npm --prefix frontend run build`, tests backend, Playwright desktop/mobile et CI sur PR/main. La présence du code n'atteste pas la conformité ni une activation commerciale.
