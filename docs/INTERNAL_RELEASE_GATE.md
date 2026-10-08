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
