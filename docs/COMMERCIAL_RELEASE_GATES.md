# BitGold — commercial launch release gates

Status: **NOT APPROVED** until each gate has evidence and an accountable owner. This document does not assert regulatory approval or real-money readiness.

## Product scope
- **Simulation-only launch:** no customer deposits, no custody, no real crypto orders, no promised returns. Any commercial subscriptions must describe simulated functionality transparently.
- **Real-money launch:** separate legal/regulatory, custody, execution, payments, security, reconciliation and incident-response project. Never turn on real trading by configuration alone.

## Required evidence before a paid simulation launch
| Gate | Acceptance evidence | Current status |
|---|---|---|
| Real authenticated desktop/mobile journey | Green production Playwright run: sign-in, cockpit, portfolio, activity, bot configuration, sign-out and access denial | BLOCKED: production-smoke #26 authenticated step failed |
| Auth security | 2FA tested, expired JWT rejected, brute-force/rate-limit, account recovery, access isolation | VERIFY |
| Bot simulation | Deterministic scenarios, exposure limits, simulated order idempotency, no real execution | VERIFY |
| Commercial checkout | Sandbox payment webhooks, replay/duplicate protection, failed payment, cancellation, refund and entitlement synchronization | VERIFY |
| Data privacy | Privacy notice, consent where required, data export/deletion, retention, processor inventory, GDPR review | VERIFY |
| Consumer protections | Terms, clear simulation disclosures, subscription pricing, cancellation, support and complaint handling | VERIFY |
| Operational resilience | Backups and restore drill, monitoring/alerts, incident runbook, uptime and error-budget targets | VERIFY |
| Security | Dependency scans, secrets rotation, TLS, authorization tests, penetration-test findings triaged | VERIFY |
| Legal/regulatory | Qualified counsel review of French/EU crypto-services, financial promotion, payments, AML/KYC applicability and customer classification | NOT APPROVED |
| Release operations | staging green, main green, Northflank SHA verification, live smoke green, rollback documented | VERIFY |

## Production E2E known failure (2026-10-11)
Workflow: `production-smoke.yml`, run 38149880204, job 114500924958.
- Guest Playwright: passed.
- Authenticated Playwright: failed on desktop when `Shield` heading was absent; mobile retried and failed on logout control.
- GitHub secrets were present and execution passed initial credential check. Do not infer all account/backend flows work from this alone.
- Diagnose bot catalog response, authenticated route rendering, session stability and responsive navigation using redacted artifacts; do not relax assertions to hide a product defect.

## Go/no-go
A paid launch requires explicit sign-off for product, security, legal/privacy, payments, operations, and customer support. CI green is necessary but not sufficient. All test orders must remain simulated and isolated from customer balances.
