# Claude Code task: fix the double-audit findings

Paste this whole file into Claude Code. Repo: PettyMiggzy/Oversize-Escort-Hub. Start from current `origin/main`. Branch `cursor/audit-fixes`. One commit per group below. Do not push `main`. Do not open a pull request unless asked. Do not run `next build`.

Read `CLAUDE.md` first and keep those rules: free launch, never write “verified” / “background checked” / “vetted”, no keys in chat or commits, additive SQL in `docs/sql-*.sql` (do not run SQL against production), Next.js routes export only HTTP handlers, new tables/columns must be listed in `tests/hostile-audit/schema-columns.ts`, before you finish run `npx tsc --noEmit` and `npm run test:hostile` (all must pass). Do not change things the owner did not ask for.

Hostile audit of origin/main `644bd5a` (24 isolated agents, two rounds). Live Supabase was not queried. Fix the items both rounds agreed on. Do not invent extra features.

## Do not touch

- Android keystore / Play signing (group 8 is docs + gitignore only; do not mint a new key).
- Turning SMS on (`SMS_ENABLED` stays off).
- Capacitor `server.url` host (keep production HTTPS origin).
- Billing price amounts, Stripe price IDs, `FREE_LAUNCH` product copy that says plans are free while we launch.
- Anything under `.github` except adding CI in group 8 if you can do it with the existing hostile/tsc scripts only.
- Do not rewrite git history.

## Group 1 — privilege (commit 1)

1. Stop treating `profiles.role` as caller-writable. Freeze `role`, `tier`, `bgc_verified`, `pevo_verified`, `bgc_paid`, `pevo_paid`, `fmcsa_verified`, `stripe_customer_id`, `stripe_subscription_id`, `suspended` so the authenticated Data API cannot UPDATE them. Put the SQL in a new `docs/sql-*.sql`. Fix `protect_*` triggers so `auth.uid() IS NULL` is NOT privileged (anon must not skip the freeze).
2. Ignore `user_metadata.role` for authorization. Signup/callback must not allow `fleet_manager` from the client. Default new accounts to escort/carrier/broker only, server-side.
3. `fmcsa_verified` must only be set by a server route with the service role after a real FMCSA lookup, never from the browser.
4. Enforce `suspended` in `requireAuth` / middleware. Admin suspend must revoke sessions.
5. `requireAdmin` must not rely on a compiled email list in the client bundle as the only check. Keep server-side admin from `profiles.role = admin` (service-role maintained) or `app_metadata`. Do not add new admin emails.

Tests: hostile tests that fail on the old code (role update blocked, fleet_manager not accepted from metadata, suspended rejected, fmcsa_verified not in a browser update object).

## Group 2 — contact and bids (commit 2)

1. Release another user’s phone/email only when the load is `filled` (carrier accepted), not `pending_match`. Same rule for invoice generate. Jobs contact already waits for accept — match that.
2. Stop `select('*')` on `bids` and `loads` in browser files. Explicit columns. Never select `permit_url`, other people’s bids, or `escort_availability.phone` in the client.
3. Add real bids RLS in a `docs/sql-*.sql` (own bids insert, poster reads bids on their load, no world-readable rates). Do not leave it as comments.
4. Jobs board must honor `user_blocks` the same way loads/bids do.
5. `/admin` reads of other users must go through `requireAdmin` + service role, not the visitor JWT. Do not start those fetches until authorized.

Tests: contact-party refuses pending_match; static scan that browser files do not select bids `*` or `permit_url` / availability `phone`.

## Group 3 — schema holes (commit 3)

Do not guess columns. These are confirmed missing vs writes:

- `fleet_escorts.escort_id uuid references public.profiles(id)` (the embed assumes `fleet_escorts_escort_id_fkey`).
- `invoices.description text`, `invoices.due_date date`, `invoices.items jsonb` — only if the invoice create route still writes them; otherwise stop writing them and keep the existing columns.
- `helper_usage` CHECK must allow `wraith` OR stop inserting `kind = 'wraith'`.
- `profiles.email_alerts boolean not null default true` if alerts still select it.
- certifications: only add `reviewed_at` / `reviewed_by` / `reject_reason` if admin review still writes them; do not touch the type/status/document_url patch.

SQL additive in `docs/sql-*.sql`. List every new column in `tests/hostile-audit/schema-columns.ts`.

## Group 4 — unauth and mail (commit 4)

1. Rate-limit `POST /api/contact`. Require a session or a simple origin check. Escape every interpolated HTML value (match `escapeHtml` used on DD-214/contact). Deadhead mail must escape cities/type.
2. Cap new-load alert emails (do not mail escorts with empty `availability_states`; keep a hard cap well under 80). Cap unauthenticated `/api/loads` if that path still exists.
3. `/api/weather`, `/api/nws`, `/api/fmcsa`: require a session and a rate limit. NWS second hop: only `api.weather.gov` URLs. Do not put `FMCSA_API_KEY` in the query string if you can send it as a header.
4. `/api/check-trial` and waitlist: no unauthenticated service-role write. Fail closed on errors. Remove anon-key fallback.
5. `requireCron`: use `safeEqual`. Return non-2xx when the expire update fails.

Tests: contact/unauth routes 401/429 without a session; deadhead HTML escapes; cron compare uses safeEqual (source scan is fine).

## Group 5 — native prices and jobs SEO (commit 5)

1. Native “no prices / no pay buttons / no ads” must fail closed (same pattern as HelperChat: assume in-app until proven web). First HTML must not include $29.99, Join/Checkout pay, BoardAdSidebar, or Features $99.99. Do not add new pay UI in the phone app.
2. Jobs: do not emit schema.org `JobPosting` or sitemap URLs for unchecked user posts, OR only emit after a server-side allowlist (no user HTML in JSON-LD; keep `<` escaped). Plain words, no new claims.
3. Sign-in must honor `next` as well as `redirect` (same `safeRedirectPath`). `/post-job` should return the user to `/post-job` after sign-in.

Appearance: keep the premium kit. Appearance-only files you do not need to restyle.

## Group 6 — Stripe (commit 6)

1. Never build Stripe `success_url` / `cancel_url` from `Origin`. Require `NEXT_PUBLIC_APP_URL` (or a fixed production host). Fail the checkout route if it is missing.
2. Sponsored zone: unique hold so two buyers cannot both pay for one state. Do not ACK a paid zone that was not applied.
3. Account delete must cancel Wraith Stripe subscriptions too, not only `profiles.stripe_subscription_id`.
4. Do not mint uncapped forever coupons from `veteran_discounts.discount_percentage`. Cap or ignore until veteran flow is live.
5. Grant paid tier only for `payment_status === 'paid'` and subscription `active`/`trialing`. `past_due` / `unpaid` / `incomplete` must not keep a paid tier. Do not ACK if the grant write failed.

Do not change prices or plan names.

## Group 7 — copy and public profile (commit 7)

1. Never write “verified”, “background checked”, or “vetted”. Find Escorts / profiles: cert chips and “available” must not imply OEH checked anyone. Use the existing “uploaded by the escort, not checked” idea.
2. `/escorts/[id]`: do not `select('*')` with the service role. Public view columns only (see `PUBLIC_PROFILE_COLUMNS`). Filter suspended / non-escort.
3. Terms/Privacy: do not call escorts licensed; do not describe referral/SMS as live if they are not; no skipped section numbers. Keep LLC name Precision Pilot Services, LLC DBA Oversize Escort Hub.

## Group 8 — config (commit 8)

1. Add a GitHub workflow that runs `npx tsc --noEmit` and `npm run test:hostile` on pull requests to `main`. Nothing else.
2. Confirm `.gitignore` ignores `*.keystore` and does not comment those rules out. Do not commit a new keystore. Do not rewrite history. Note in the report that the owner still needs to treat the old key as compromised.
3. Add a Content-Security-Policy that allows this origin, Supabase, and Stripe. Do not break the live site’s scripts.
4. FileProvider: narrow `path="."` to the cache dirs the app actually needs. Do not change `applicationId`.
5. Optional if quick: bump `@capacitor/android` off CVE-2026-103922 to match patched iOS line; do not change the bundle id `pevo.oversizeescorthub.app`.

## Checks before each commit

- `npx tsc --noEmit` exit 0
- `npm run test:hostile` all passing. Do not weaken an old test to go green. New tests must fail on the old code.
- `npx eslint` on files you changed: no new errors (old `any` on untouched lines may stay).

## Report back

Short and plain: commits (sha + group), SQL files the owner must run and in what order relative to deploy (code first if a revoke would break old queries), exact command counts, what you did not run, anything you would not do without asking.

If a fix needs a live DB check (`has_column_privilege`, RLS), write the query in the SQL file and do not run it.
