# BitGold — commercial launch release gates

Status: **NOT APPROVED** until each gate has evidence and an accountable owner. This document does not assert regulatory approval or real-money readiness.

## Product scope
- **Simulation-only launch:** no customer deposits, no custody, no real crypto orders, no promised returns. Any commercial subscriptions must describe simulated functionality transparently.
- **Real-money launch:** separate legal/regulatory, custody, execution, payments, security, reconciliation and incident-response project. Never turn on real trading by configuration alone.

## Required evidence before a paid simulation launch
| Gate | Acceptance evidence | Current status |
|---|---|---|
| Real authenticated desktop/mobile journey | Green production Playwright run: sign-in, cockpit, portfolio, activity, bot configuration, sign-out and access denial | PASS (2026-10-11): production authenticated desktop + mobile read-only journey, run 38162635129; further profile/2FA/backtest checks remain |
| Auth security | 2FA tested, expired JWT rejected, brute-force/rate-limit, account recovery, access isolation | VERIFY |
| Bot simulation | Deterministic scenarios, exposure limits, simulated order idempotency, no real execution | VERIFY |
| Commercial checkout | Sandbox payment webhooks, replay/duplicate protection, failed payment, cancellation, refund and entitlement synchronization | VERIFY |
| Data privacy | Privacy notice, consent where required, data export/deletion, retention, processor inventory, GDPR review | VERIFY |
| Consumer protections | Terms, clear simulation disclosures, subscription pricing, cancellation, support and complaint handling | VERIFY |
| Operational resilience | Backups and restore drill, monitoring/alerts, incident runbook, uptime and error-budget targets | VERIFY |
| Security | Dependency scans, secrets rotation, TLS, authorization tests, penetration-test findings triaged | VERIFY |
| Legal/regulatory | Qualified counsel review of French/EU crypto-services, financial promotion, payments, AML/KYC applicability and customer classification | NOT APPROVED |
| Release operations | staging green, main green, Northflank SHA verification, live smoke green, rollback documented | VERIFY |

## Historical production E2E failure (2026-10-11; subsequently resolved in latest run)
Workflow: `production-smoke.yml`, run 38149880204, job 114500924958.
- Guest Playwright: passed.
- Authenticated Playwright: failed on desktop when `Shield` heading was absent; mobile retried and failed on logout control.
- GitHub secrets were present and execution passed initial credential check. Do not infer all account/backend flows work from this alone.
- Diagnose bot catalog response, authenticated route rendering, session stability and responsive navigation using redacted artifacts; do not relax assertions to hide a product defect.

## Go/no-go
A paid launch requires explicit sign-off for product, security, legal/privacy, payments, operations, and customer support. CI green is necessary but not sufficient. All test orders must remain simulated and isolated from customer balances.

## Latest production browser evidence (2026-10-11)
- GitHub Actions run [38162635129](https://github.com/totorina47501-wq/Test-/actions/runs/38162635129), associated with main commit `77076734363f40d85d15bd18a495593e83cc0b51`: production guest smoke **6/6 passed** (desktop + mobile); authenticated read-only journey **2/2 passed** (desktop + mobile).
- Authenticated checks include login, cockpit, portfolio, activity, bots catalog, strategy scenario laboratory, logout and private-route access denial.
- The browser suite tests the live production URL, but does **not** independently attest the deployed Northflank image SHA matches the GitHub commit; deployment provenance remains VERIFY.
- Profile settings, live 2FA management, authenticated historical backtest, deeper mobile accessibility and incident rollback remain VERIFY. Never substitute a passing read-only smoke for regulatory or payment sign-off.

## Partner technical review evidence (2026-10-13)
- Repository evidence inventory and outstanding questions: `docs/PARTNER_TECHNICAL_DUE_DILIGENCE.md`.
- Public `/#architecture` provides a simplified architectural boundary and explicitly disabled real provider layer; this is not a certification or production readiness assessment.
- Partner-specific capabilities, legal entity onboarding and regulatory responsibilities remain **UNVERIFIED** until each provider answers in writing.

## Lot ABCDE (2026-10-13) — preuves et limitations
- Adaptateur toujours désactivé pour toute opération réelle ; fixture contractuel local ajouté, sans valeur de preuve d'intégration fournisseur.
- Landing : parcours de découverte avec CTA et mesure UTM **locale et consentie**, sans collecte serveur ni dashboard de cohortes.
- Onboarding : quatrième étape « première simulation » informative, **non validée par exécution d'ordre**. Une vraie preuve d'activation nécessitera instrumentation d'événement serveur idempotent et consentement adéquat.
- Offre premium et checkout : **non commercialisés**, gates paiement, support, RGPD et conseil juridique inchangés (VERIFY / NOT APPROVED).
- Avant toute mise en vente, obtenir approbation juridique, CGV/TVA, droits consommateurs et résultats des tests de paiements sandbox.

## Fail-closed launch switches (2026-10-13)
- `GET /api/commercial/status` exposes only non-sensitive booleans. It is **not** an approval record.
- Paid subscription checkout and portal routes are disabled by default even if Stripe credentials are populated.
- To prepare a sandbox validation, a developer must explicitly set `BITGOLD_PAID_SIMULATION_ENABLED` plus all four independent sign-off switches; **do not do so in production** before contractual/legal/operational validation.
- Real crypto remains disabled in `server/integrations/crypto-provider.mjs` regardless of commercial flags.
- Stripe webhook route remains present to preserve existing compatibility. **Before paid launch**, audit event replay, subscription state transitions, failed payments, refund/chargeback, event ownership and database transactions. Current work does not certify them.
- Do not enable payments by editing environment variables alone: signed approvals and an independent go/no-go are mandatory.
