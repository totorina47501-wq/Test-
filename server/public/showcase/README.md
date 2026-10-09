# BitGold V4.1 screenshots

The available public-page PNG screenshots are generated with `node scripts/capture-showcase.mjs` from the running BitGold server using a clean, unauthenticated Playwright browser context.

Only visitor-visible pages can be captured. Routes without public pages are intentionally excluded; do not relabel screenshots as other product features. Never use real account credentials, personal data, seeded profit claims or fabricated trading performance. The capture workflow must run before publication and the resulting `.png` assets must be reviewed and committed before release. Screenshots must be treated as an authentic snapshot, not live market data.

## Visitor-safe captures

The automated artifact contains **investir.png** and **cockpit.png** only. The activity route is behind authentication and must not be represented by a login popup screenshot. Bots and transparency must not be represented by screenshots taken from unrelated pages. The product carousel continues to use its existing live-page previews until truthful, reviewed images are published.
