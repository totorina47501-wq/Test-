# Internal release readiness (no external providers)

## Release gate
- [ ] GitHub Actions checks pass on the staging PR (HTML, CSS, JS, application tests).
- [ ] Verify PostgreSQL migrations on a disposable staging database; test recovery from migration failure.
- [ ] Verify login, registration, JWT expiry, 2FA and logout on staging.
- [ ] Exercise demo-only investing, portfolio, risk center and mobile workflows.
- [ ] Confirm no real payment or settlement can be triggered without explicit provider configuration and compliance sign-off.
- [ ] Check health endpoint, error logs, secret separation and rollback procedure.
- [ ] Require passing checks and review before merging staging into main (configure in GitHub branch protection).
- [ ] Verify actual hosting deployment, staging/production isolation and rollback manually in hosting console.

## Out of scope for this release
- Real KYC/AML provider (#71)
- OpenFacilitator live testnet integration (#72)
- Full AP2 interoperability (#75)
- Real agent settlement / payments (#67)
- Google OAuth production credentials and Stripe provider activation

Do not claim production readiness or enable real funds until the outstanding external and regulatory gates are met.

## CI evidence
- GitHub Actions run #718: success on a900c458 (2026-10-08).
- GitHub Actions run #719: success on 612be052 (2026-10-08).
- These results validate CI only, not staging runtime, hosting rollback, or production readiness.

## Deployment operator checks
1. Verify staging has its own PostgreSQL database and secrets, separate from production.
2. Deploy the reviewed staging commit; verify /api/health, registration/login and 2FA with test accounts.
3. Exercise demo trading and confirm real settlement stays disabled.
4. Confirm application logs, backup/restore and rollback to the previous known-good image.
5. Require branch protection and successful checks before staging-to-main promotion.
6. Record the staging URL, tested commit SHA, date and approver in the release record.
