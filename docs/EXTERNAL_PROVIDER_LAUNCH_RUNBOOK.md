# BitGold — Final provider connection and commercial readiness runbook
Status: **PREPARED / DISABLED**. This file is an operator checklist, not a certification or legal opinion.

## Already implemented (reuse, no duplicates)
- Stripe checkout, portal and signed webhook: `server/src/index.js`. Their existing logic must undergo a separate billing replay/entitlement security review before launch.
- 2FA/JWT: existing routes and tests, plus production read-only authenticated E2E in `docs/COMMERCIAL_RELEASE_GATES.md`.
- Provider precontract boundary and synthetic fixture: `server/integrations/crypto-provider.mjs`.
- Public SEO, sitemap and landing: previous branding lot.
- Opt-in local CTA/UTM capture: `frontend/src/components/GrowthConsentPanel.tsx`; **not** aggregate analytics.
- Partner due diligence, scorecard and demonstration: `docs/PARTNER_TECHNICAL_DUE_DILIGENCE.md`, `docs/PARTNER_PROVIDER_SCORECARD.md`, `docs/PARTNER_REVIEW_DEMO.md`.

## What an operator must supply (no keys in Git)
1. **Domain**: buy and verify a brand domain, configure DNS/TLS, update canonical URLs, OAuth callbacks and Stripe redirect URLs.
2. **Stripe**: verify business entity, product/prices, test-mode keys, webhook signing secret, cancellation/refund flows, taxes and legal notices. Complete replay/idempotency audit before enabling subscriptions.
3. **Email/support**: choose service, verify sender SPF/DKIM/DMARC, privacy/DPA and complaint/support procedures. Confirm escalation and SLA.
4. **Privacy/legal**: approved CGU/CGV, privacy/retention/export/deletion policy, French consumer law, MiCA marketing perimeter, processor register and documented sign-off.
5. **Security/operations**: external pentest, dependency and secrets review, 2FA/recovery exercise, backup/restore rehearsal, on-call and rollback runbook, authenticated prod E2E proof.
6. **Growth**: consented server-side events only after privacy review, aggregate cohort dashboard and verified attribution. Current local event log is not an acquisition reporting platform.
7. **Crypto provider**: contract with Venga/Bitpanda/other approved firm, written API scopes and responsibilities, sandbox credentials, KYC/AML ownership, settlement/custody and webhook signatures, ledger reconciliation, dispute and incident flows. Then implement and test a provider-specific sandbox adapter; **not** a live switch.
8. **User beta**: recruit users, record consent, measure first simulation, retention, support issues and pricing feedback; release only after gates.

## Verification
- `node --test server/test/commercial-release.test.js`
- `node --test server/integrations/crypto-provider.test.mjs`
- `npm --prefix server test` and `npm --prefix frontend run build`
- GitHub PR and main workflows, Playwright desktop/mobile, production guest/auth E2E, Northflank deployed SHA.
- Negative checks: no approvals -> checkout/portal HTTP 503; partial approvals -> HTTP 503; `/api/commercial/status` realCrypto=false.
- Security note: enabling every approval switch is **not** equivalent to a completed billing audit or external legal approval. Keep OFF until evidence signed.

## Go/no-go
Product owner + legal + security + payments + support owners sign a dated release record. Real crypto launch requires its own separate legal and technical project.

## Revue sécurité Stripe supplémentaire
- Table `stripe_webhook_events` : vérifier index unique, rollback, migrations et stratégie de rétention.
- En sandbox fournisseur : rejouer le même événement 10 fois en parallèle, envoyer événements hors ordre, annulation, remboursement, paiement différé et statut past_due. Vérifier l'absence d'élévation de privilèges et la correspondance du client Stripe au compte.
- Les traitements asynchrones, la réconciliation avec l'API Stripe et les litiges nécessitent une revue finale avant activation. Aucun paramètre de production ne doit être activé par ce lot.
- Les événements sont persistés uniquement après vérification de signature et activation commerciale explicite.
