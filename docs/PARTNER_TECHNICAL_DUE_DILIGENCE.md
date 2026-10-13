# BitGold — Technical due diligence for prospective crypto infrastructure partners

**Status: discovery / pre-contract · 2026-10-13 · simulation only.** This is not a statement of regulatory authorization, a security audit, or an announced partnership with Venga or Bitpanda Enterprise.

## Executive summary
BitGold currently demonstrates a React crypto experience with a virtual portfolio and simulated bots (Shield, Silver, Gold). User-facing simulation does not mean deposits, trades or custody are provided. A vendor-neutral adapter in `server/integrations/crypto-provider.mjs` enumerates future capabilities and rejects all live provider operations with `LIVE_CRYPTO_NOT_AUTHORIZED`. Its capability labels are `unverified`; the adapter does not connect to any provider API.

## Data and money flow boundaries

| Flow | Today | Potential later (subject to contract and approvals) |
|---|---|---|
| Public product discovery | Public landing, Investir, bots comparison, isolated scenario lab | Same with approved provider disclosures |
| Authentication and private portfolio | BitGold session, virtual balances, test/synthetic demonstration data | Separate customer identity mapping after security and legal review |
| Buy / sell and bot decisions | Simulated positions and orders; no transfer of funds | Regulated provider order endpoints with explicit authorization and safeguards |
| Funding and withdrawal | Virtual account credit in simulation; no payment captured | Provider-approved fiat rails, KYC/AML and reconciliation after signed agreement |
| Custody | None supplied by BitGold | Provider-specific regulated custody arrangement only if contractually authorized |
| Webhooks and ledger | No live provider webhooks | Verified signatures, idempotency, immutable events, reconciliation, exception handling |

**Important:** Visual simulations, synthetic screenshots and green tests do not constitute proof of client-asset segregation, regulatory permission, or live transaction readiness.

## Current implementation evidence (repository)
- `frontend/src/LandingPage.tsx`: public simulation disclaimers, `#visite-guidee`, `#architecture`, `#partenaires`.
- `frontend/src/App.tsx`: separate public demo bots route and local `?testmode=1` scenario laboratory; authenticated private views are separate.
- `server/integrations/crypto-provider.mjs`: fail-closed pre-contract adapter, explicit disabled capabilities.
- `server/integrations/crypto-provider.test.mjs`: checks that real operations cannot be called successfully.
- `server/e2e/partner-review.spec.mjs`: desktop/mobile public partner journey.
- `docs/COMMERCIAL_RELEASE_GATES.md`: product, security, payments, operations and legal gates.
- `docs/PRODUCTION_PLAYWRIGHT_REFERENCE.md`: CI vs deployment proof and production-only testing.

## Questions to validate with each prospective provider
1. Corporate onboarding eligibility, legal entity, geography, licensing allocation and required contracts.
2. KYC/AML ownership, sanctions screening, age restrictions, ongoing monitoring, beneficial ownership and audit logs.
3. Custody ownership, safeguarding, client-asset segregation, insolvency treatment and statements.
4. Fiat deposit/withdrawal support, safeguarding, payment methods, chargebacks, settlement windows and reconciliation.
5. Order-routing permissions (spot only vs other products), quotes, slippage, fees, supported assets and jurisdiction restrictions.
6. Sandbox access, webhook authentication, delivery retry, event idempotency, rate limits, API versioning and outages.
7. Security review, incident SLAs, data processor and subprocessor agreements, GDPR rights and retention schedules.
8. Marketing approval process, permitted product and performance statements, partner naming and complaint channels.

## Mandatory launch gates, not yet satisfied
No live execution can be enabled by selecting a vendor name. Required: signed agreements, legal/regulatory sign-off, full API sandbox integration, scoped credentials and secrets management, ledger/reconciliation design, penetration/security review, AML/KYC operations, fraud and risk limits, customer disclosures, incident response, monitored deployment, rollback and signed release decision. The existing adapter must remain fail-closed until a separately reviewed project explicitly replaces it.

## Demonstration script (8–10 minutes, public only)
1. Open `/#visite-guidee` and show four public steps and synthetic private screenshots.
2. Open `/investir` and `/bots`, demonstrate the bot risk descriptions.
3. Open `/bots?testmode=1` to exercise hypothetical scenarios without signing in.
4. Open `/#architecture` and show the **disabled** provider boundary.
5. Open `/#partenaires` and explain compliance and infrastructure dependencies.
6. Provide CI run links and release-gate documents; distinguish repository tests from the actual Northflank revision.

## No-go signals
Never demo personal customer balances, use a production account for screenshots, assert approved custody/KYC, quote simulated returns as achieved performance, provide secrets, or imply Venga/Bitpanda has approved the project. Escalate uncertainty to qualified legal and technical reviewers.
