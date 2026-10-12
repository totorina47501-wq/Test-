# BitGold — Venga / Bitpanda Enterprise integration readiness

**Status: PRE-CONTRACT / SIMULATION ONLY. No live crypto services authorized.**

## Decision and non-duplication
Existing React investment, portfolio, onboarding, bot observability, virtual deposits and simulated trades are retained. Do not replace existing `submitSimulatedTrade` or `/api/wallet/simulated-deposits`. Bots, Quantum Fund and bot strategies are out of scope and MUST remain simulation-only.

A single vendor-neutral interface lives in `server/integrations/crypto-provider.mjs`. Both adapters fail closed. The module is not wired to any live API or production route; it cannot execute real trades even if environment variables are set.

## Public documentation consulted (2026-10-13)
- Bitpanda Enterprise overview (staging and production; coordinate go-live): https://documentation.bitpandaenterprise.com/
- Bitpanda Enterprise partner OAuth2 authentication (environment-specific credentials, short-lived access tokens): https://documentation.bitpandaenterprise.com/authentication-365493m0
- Bitpanda client categorization questionnaire: https://documentation.bitpandaenterprise.com/get-client-categorization-questionnaire-4289591e0
- Bitpanda offer acceptance V3: https://documentation.bitpandaenterprise.com/acccept-trade-offer-v3
- Bitpanda settlement deposit: https://documentation.bitpandaenterprise.com/create-settlement-deposit-v1 (availability depends on partner agreement; do not assume it is an end-user card deposit)
- Bitpanda TrustVault custody is a **separate API/product** from investment/trading. Do not confuse custody keys with trading credentials: https://documentation.bitpandaenterprise.com/introduction-365596m0
- Venga B2B product claims (custody, buy/sell, swap, transfer, KYC/AML): https://venga.com/en/mica-api-for-business/
- Venga custody terms: https://venga.com/en/legal/custody-terms-conditions/

Public documentation does **not** establish BitGold's eligibility, user account provisioning API, permitted flow, pricing, EUR deposit/withdrawal methods, contractual regulatory responsibilities or bot trading authorization. No guessed API endpoints, payloads, authentication headers or webhook signatures are implemented for Venga.

## Desired customer journey
1. User registers and authenticates **with BitGold** using existing flows.
2. User can explore simulation without KYC; simulated cash and orders are visibly separate.
3. User explicitly chooses **Activate real crypto account** (future UI, disabled until approved).
4. Backend checks eligibility and user consent, records partner selection and terms version.
5. Provider's approved KYC flow starts (hosted redirect or embedded UI only as documented/contracted).
6. A provider customer/account identifier is linked to the BitGold user in server storage, never exposed as a credential.
7. Only an approved/active account can see live balances and request a real quote; quote includes price, fees, expiration and partner identity.
8. Explicit order confirmation; idempotency; asynchronous order state reconciliation; no credit based on a pending deposit.
9. User can view audit trail, failures, pending orders, and partner support details.

## Integration contracts to confirm with each partner
- Partner KYB, company incorporation requirements, supported countries, commercial minimums (target <= EUR 200/month fixed), sandbox availability.
- Whether BitGold can create **separate end-customer custodial accounts** and the exact consent/terms acceptance process.
- KYC/AML, tax and Travel Rule responsibilities; onboarding state machine and partner-hosted vs embedded UX.
- Available fiat rails (SEPA/card/PayPal), pay-in/out ownership, settlement, chargebacks and reconciliations.
- Tradable assets, crypto-to-crypto pairs, spreads, minimums, quote expiry, order types, limits and execution lifecycle.
- API authentication, permissions, rate limits, sandbox test accounts, signed webhook format and retries.
- GDPR data processing agreement, data minimization, residency, deletion, incident response and customer support.
- Whether live algorithmic trading is contractually allowed (not part of this PR).

## Technical rollout / release gates
**Gate 0 (this PR):** vendor-neutral fail-closed interface, tests and documentation.
**Gate 1:** partner contract, legal review of BitGold's role, sandbox credentials and actual API schema.
**Gate 2:** server-only adapter, persistence of provider customer mappings, audit/idempotency and verified webhook handling; sandbox only.
**Gate 3:** frontend real/simulated mode separation, KYC consent, order preview and confirmation, funding and withdrawal UX; all protected by server authorization.
**Gate 4:** automated unit/integration/E2E desktop/mobile tests with sandbox fixtures, abuse tests, reconciliation and recovery drills.
**Gate 5:** explicit legal, security, operations and partner go-live signoff. Only then consider a separate PR for production enablement.

## Acceptance / tests
Run `node --test server/integrations/crypto-provider.test.mjs`. Verify unsupported provider is rejected, every real operation is blocked for both providers, and `CRYPTO_LIVE_ENABLED=true` cannot enable it. Existing simulated trade, virtual deposit and bot Playwright suites must stay green. Before real integration add tests for KYC rejection, double click/idempotency, expired quote, 202 pending order, webhook replay, cross-user isolation, wrong currency, partial fills, rate limiting, downtime, and mobile cancellation.

## Cost and launch
Budget ceiling: EUR 200/month **fixed infrastructure target**, not an agreed price. Marketing allocation EUR 10,000, reserved for acquisition after regulatory and partner approvals. Neither provider has confirmed eligibility or pricing. **No real deposits, real orders, custody or advertised guaranteed returns.**
