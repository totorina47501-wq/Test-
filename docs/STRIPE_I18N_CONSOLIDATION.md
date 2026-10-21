# Stripe + FR/EN/ES — consolidation 2026-10-21

## Existing code reused
Stripe webhook already requires commercial approval and signature, uses durable event ID idempotency, SQL transactions, Stripe customer binding, and grants subscription entitlements only on active/trialing lifecycle events. The obsolete PR #543 must not be cherry-picked wholesale. FR/EN/ES selector and typed dictionaries already exist.

## This lot
Added per-user last Stripe subscription event timestamp and conditional SQL updates to prevent older subscription events from restoring entitlements after newer events. Added source-contract regression checks for Stripe and language selector. No checkout, paid service, real crypto, or bot strategy activated.

## Residual risks — NOT APPROVED
Stripe event timestamps have one-second resolution: equal-timestamp event order and cross-subscription races need sandbox/reconciliation tests. Check customer/subscription ownership, payment failures, disputes, refunds, replay concurrency and database migrations in a disposable environment. Do not activate paid subscriptions. i18n remains incomplete until all JSX/server error strings and FR/EN/ES browser journeys are audited. CI success is not a production billing or translation certification.
