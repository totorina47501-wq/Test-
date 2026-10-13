# Revue partenaire — Venga / Bitpanda Enterprise
Date: 2026-10-13. **Simulation uniquement. Aucun partenariat annoncé.**

## État réel et anti-doublon
- Landing existante: `frontend/src/LandingPage.tsx`, captures publiques et captures de démonstration synthétiques déjà utilisées. Conserver le fallback schématique et ne jamais présenter les images de test comme des comptes réels.
- Parcours public de bots et laboratoire testmode: `frontend/src/App.tsx`; réutilisés sans toucher aux stratégies, décisions, backtests ou Quantum Fund.
- Cockpit, portefeuille, historique et connexion: modules existants, inchangés.
- Nouvelle section publique `#partenaires`: périmètre simulation, modèle B2B projeté, conformité à obtenir et risques; liens vers le laboratoire public.
- Contrat provider: `server/integrations/crypto-provider.mjs`, fail-closed, issu de la PR #525.

## Démonstration conseillée (partenaire sans identifiants)
1. Accueil `/` ou `/react-preview/`: vérifier images, transparence de la simulation et navigation mobile.
2. `/#modules`: portefeuille, Investir et activité; les pages privées nécessitent un compte BitGold.
3. `/bots`: lire Shield/Silver/Gold, leur exposition indicative et avertissements.
4. `/bots?testmode=1`: tester les trois scénarios fictifs sans connexion; ce n'est pas une performance observée.
5. `/#partenaires`: montrer le parcours projeté, la séparation simulation/réel et les gates.
6. Ne pas remettre d'identifiants de comptes réels aux partenaires ni faire de transactions d'argent réel.

## Tests à exécuter
- Playwright: `server/e2e/partner-review.spec.mjs` sur projets desktop/mobile, dans le serveur isolé habituel.
- Confirmer: CTA laboratoire, section partenaire, absence de débordement horizontal, message simulation, bots publics.
- Régressions: `server/e2e/react-auth.spec.mjs`, `react-investir.spec.mjs`, `react-account.spec.mjs`, `react-cockpit.spec.mjs`.
- Backend: `node --test server/integrations/crypto-provider.test.mjs`.
- Build/lint frontend: `npm --prefix frontend run build`.
- Vérification production distincte: SHA déployé Northflank, chargement réel des PNG, navigation mobile et session de test autorisée.

## Gate de sortie
La CI verte valide les tests du commit, pas la production Northflank. Le vrai trading, la custody, les dépôts et le KYC restent bloqués jusqu'aux contrats, sandbox et autorisations.

## Visite guidée publique (lot suivant)
- Section `/#visite-guidee` : quatre étapes sans authentification, avec liens Investir, bots publics, laboratoire fictif et aperçu du cockpit.
- Ne jamais utiliser une capture de compte client ou promettre un rendement; les captures privées restent synthétiques.
- Le test `partner-review.spec.mjs` valide la section et ses liens sur les projets Playwright desktop/mobile, en plus du laboratoire et de la transparence partenaire.
- Ce lot ne modifie pas le moteur des bots, les transactions ni l'intégration fournisseur.

## Lot de préparation institutionnelle
- `/#architecture` : schéma fonctionnel visiteur → services simulés → connecteur fournisseur désactivé ; la dernière étape ne représente pas un flux réel opérationnel.
- Quatre cartes publiques : fonctionnalités démontrables, garde-fous, prérequis pour un lancement réel et niveau de preuve de la CI.
- Aucun logo de prestataire ni affirmation de partenariat ; le texte distingue explicitement projet de conformité et mise en production autorisée.
- Playwright `partner-review.spec.mjs` : assertions sémantiques et contrôle du débordement horizontal sur projets desktop et Pixel 7. Le test ne remplace pas un audit de sécurité ni une revue juridique.
- Référence à transmettre en revue : `docs/PARTNER_TECHNICAL_DUE_DILIGENCE.md`.
