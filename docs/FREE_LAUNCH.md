# Free launch

Everything is free until the marketplace has users. One setting controls it.

- **On (default):** every escort gets Pro features, every carrier gets the carrier plan, fleet managers get the top fleet plan.
  Nothing to configure. Upgrade prompts and paywalls (P/EVO review fee, background-check fee) are off, the plan checkout and
  `/api/checkout` / `/api/bgc-checkout` refuse plan and review purchases, and the pricing page shows "Free while we launch".
  Sponsored zones (ads) can still be bought.
- **Turn charging back on:** set `NEXT_PUBLIC_FREE_LAUNCH=false` in Vercel and redeploy. Plans, paywalls and checkout behave
  as they did before. Accounts that never paid then fall back to what their profile's plan says (free / trial).
- **Where it lives:** `lib/free-launch.ts` (`FREE_LAUNCH`, `effectiveTier`, `withFreeLaunch`). The server decides claims, bids,
  alerts, job-log limits and uploads with it; pages that read `profile.tier` get the effective plan when the profile loads.
- **Before you switch charging on:** tell users first, and decide what happens to existing accounts (grace period or not).

SMS texts are separate: they stay "coming soon" until `SMS_ENABLED=true` (see `lib/features.ts`).
