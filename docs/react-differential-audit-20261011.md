# BitGold React — differential audit (2026-10-11)

Baseline: compare existing **main** and **staging** before implementation. BitGold remains a crypto **simulation**; no real financial orders.

## Verified existing coverage (do not duplicate)

| Area | Existing test | Verified behavior |
| --- | --- | --- |
| Authentication | `server/e2e/react-auth.spec.mjs` | Signup, login, JWT persistence/logout, expired session, existing 2FA challenge |
| Production connected mode | `server/e2e/production-auth-readonly.spec.mjs` | Real E2E credentials, cockpit, portfolio, activities, bots, logout and private-route protection; read-only |
| Cockpit | `server/e2e/react-cockpit.spec.mjs` | Authenticated OHLC chart, ranges, recent simulated transactions |
| Portfolio / activities / bots | `server/e2e/react-account.spec.mjs` | Portfolio and activity, bot comparison and simulated strategy subscription; mobile overflow |
| Investir | `server/e2e/react-investir.spec.mjs` | EUR market prices, details, chart range, simulated buy/sell API; mobile overflow |
| Visitor | `server/e2e/react-guest-private.spec.mjs`, `react-public-navigation.spec.mjs` | Public bots, guest private-route protection and navigation |
| CI | `.github/workflows/production-smoke.yml`, `user-scenarios.yml` | Authenticated read-only production smoke; isolated desktop/mobile scenarios |

## Next targeted lots

1. **Connected experience**: review keyboard focus, error/retry/loading states, accessible announcements, and session expiry on each private route. Add regression tests **only for uncovered cases**.
2. **Mobile UX**: check tap targets, layout at narrow widths, visible keyboard focus, modal/dialog navigation and accessibility; avoid duplicating existing horizontal-overflow tests.
3. **Investir**: audit missing-data and provider-error states, chart interval semantics, currency labels, and safe simulation feedback. Preserve existing API and trade tests.
4. **Bots IA**: audit free/pro explanatory copy, strategy settings, public-vs-authenticated flows, and simulation status. Do not add real execution or payment integrations.

## Delivery rules

- Changes: isolated feature branches → staging PRs → green checks → staging merge → green staging → one staging-to-main PR → green checks → merge → green main workflows.
- Keep authenticated production smoke read-only. No new credentials, admin bypass, or provider-dependent features.
- A checklist item is **not** evidence of a bug. Confirm a discrepancy in code or a reproducible test before changing runtime behavior.
