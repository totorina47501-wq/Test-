# Crypto provider implementation — test reference

Status: PRE-CONTRACT. Real money MUST remain blocked.

## Now (automated)
`node --test server/integrations/crypto-provider.test.mjs`
- Venga/Bitpanda capabilities remain unverified.
- All account, KYC, deposit, withdrawal, quote, trade and webhook operations reject with LIVE_CRYPTO_NOT_AUTHORIZED.
- Invalid provider rejected; env toggles cannot enable real trading.

## After sandbox access (not implemented yet)
| Domain | Happy path | Negative / security |
|---|---|---|
| Registration | BitGold user to unique provider account | duplicate identity, unsupported country, account ownership |
| KYC | pending > approved | rejected, expired, interrupted, user declines terms |
| Balance | partner snapshot synchronized | stale values, wrong user, partial API outage |
| Quote | EUR/crypto, fee and expiry | expired quote, unavailable asset, unsupported currency |
| Buy/sell | confirmed order then settled | double submit, 202 pending, rejected, partial fill |
| Deposit | confirmed fiat settlement | pending deposit never spendable, duplicate callback |
| Withdrawal | explicit verified request | account takeover, wrong beneficiary, insufficient balance |
| Webhooks | verified signature and replay-safe | bad signature, replay, out-of-order delivery |
| Mobile | authenticated desktop and mobile journey | cancel/back/refresh/offline |

## CI and production evidence
Preserve `docs/FUNCTIONALITY_TRACKER.md`, `docs/PRODUCTION_PLAYWRIGHT_REFERENCE.md` and `docs/COMMERCIAL_RELEASE_GATES.md`. Do not claim production readiness from a green unit test. Never run real-money end-to-end tests without written partner authorization.
