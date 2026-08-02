# Code Audit — Oversize Escort Hub

**Date:** 2026-06-23
**Branch:** `claude/code-audit-fixes-qjzfbk`
**Scope:** Full-repo audit ("audit every line, fix what's broken").

This file is a handoff note for the next person/Claude session. It records what
was wrong, what I changed, and what still needs a human decision.

---

## TL;DR

The app compiles cleanly (`npx tsc --noEmit` passes). The build was already
functional; the broken things were **logic/data bugs and repo hygiene**, not
compile errors. The stale `build_summary.txt` that claimed parse errors was
out of date — those files had already been fixed before this audit.

I fixed 7 concrete bug classes (below). One area — the **matching subsystem** —
is architecturally inconsistent and needs a human decision before touching; I
documented it rather than guess.

---

## How I audited

1. `npm install` then `npx tsc --noEmit` → **passes** (0 errors).
2. `npx next build` → only fails on fetching Google Fonts (`Inter`) because this
   sandbox has no outbound network to `fonts.googleapis.com`. **Not a code bug** —
   it will build fine on Vercel. Could not produce a full local build here.
3. `npx eslint .` → 365 problems (260 errors, 105 warnings). Almost all are
   pre-existing `@typescript-eslint/no-explicit-any` (197) and unused-vars (82).
   The serious one (`react-hooks/rules-of-hooks`) is now fixed (see below).
4. Cross-checked DB column/table names in code against `supabase/migrations*`.

---

## What I FIXED

### 1. Removed accidental junk files at repo root
Shell-redirect artifacts that had been committed (they contained `less` help
text and `git log` output). Deleted:
`, re`, `=re.DOTALL`, `e:`, `f:`, `fw:`, `grep`, `loadingAuthsed`,
`that have both metadata export AND use client`, and the stale `build_summary.txt`.

### 2. Removed conflicting/duplicate config files
- `postcss.config.mjs` referenced **Tailwind v4** (`@tailwindcss/postcss`, which
  is *not installed* — the project uses Tailwind v3 `^3.4.17`). PostCSS happened
  to resolve `postcss.config.js` first, so the build worked, but the `.mjs` was a
  latent landmine. **Kept `postcss.config.js` (v3-correct), deleted `.mjs`.**
- Deleted duplicate `tailwind.config.js`, kept `tailwind.config.ts`.

### 3. Rules-of-Hooks crash in `app/page.tsx` (`PostLoadPage`)
`useState`/`useEffect` were called **after** early `return`s (the not-signed-in
and escort guards). When auth/profile resolved between renders, React throws
"Rendered fewer hooks than expected" and the **Post Load page crashes**.
**Fix:** moved all hooks above the guard returns; removed a now-unreachable
duplicate escort guard.

### 4. Admin email typo locking the admin out
`bahamed3170@gmail.com` (extra "a") instead of the real `bahmed3170@gmail.com`
in `lib/supabase.ts` (`ADMIN_EMAILS`, used by `isAdminEmail`) and
`app/api/loads/notify-pro/route.ts`. This silently denied admin access / excluded
the admin from Pro notifications. **Fixed both.**

### 5. `posted_by` vs `carrier_id` — wrong column, reads returned nothing
The `loads` table's owner column is **`carrier_id`** (confirmed by the
`loads_carrier_id_idx` index and every INSERT). Several reads queried
`posted_by`, which is **never written**, so they silently returned empty.
This broke: the carrier "my loads" dashboard tabs, the post-load SMS hook's
`loadId` lookup, the pending-match count, match notifications, and the load
detail page's carrier-contact + owner check. Fixed all `posted_by` → `carrier_id`
in `app/page.tsx` (5 sites), `app/api/matches/route.ts`, and
`app/loads/[id]/page.tsx`.

### 6. Server routes using the browser/anon client for auth → always 401
`createBrowserClient()` (and the bare `@/lib/supabase` anon singleton) can't read
the auth cookie server-side, so `supabase.auth.getUser()` always returned null —
the routes always responded 401 / "Admin only". Switched to the cookie-aware
server client (`@/lib/supabase/server`) in:
- `app/api/jobs/log/route.ts`
- `app/api/invoices/create/route.ts`
- `app/api/escort/cert-upload/route.ts`
- `app/api/veteran/dd214-submit/route.ts`
- `app/api/notify/route.ts` (GET/POST/PATCH)

(`app/api/reviews/route.ts` already did this correctly — left as is.)

### 7. `lib/tier-access.ts` queried a non-existent table
`checkTierAccess` / `enforceTierLimit` read from `user_subscriptions`, which does
not exist in the migrations. The rest of the app uses **`profiles.tier`**. So any
non-admin/non-carrier escort was wrongly blocked from invoices and reviews.
Rewrote it to read `profiles.tier` via the server client, with a tier-rank map
(`free/trial=0`, `member/carrier_member=1`, `pro/fleet_*=2`).

---

## KNOWN ISSUES — need a human decision (NOT fixed)

### A. Matching subsystem uses three incompatible models ⚠️ (highest priority)
The "match" feature is implemented three different ways against tables that
**aren't in the repo migrations**:
- `app/dashboard/_client.tsx` reads a **`matches`** table and calls
  `POST /api/matches` with `{ matchId, action }`.
- `app/api/matches/route.ts` reads `{ load_id, action }` (so `load_id` is
  `undefined` — payload mismatch) **and** auths via the bare anon singleton
  (always 401). It updates `loads.status` directly.
- `app/page.tsx` (a separate carrier UI) reads a **`load_matches`** table.
- `app/api/loads/match/route.ts` is the most complete endpoint (service-role,
  `{ load_id, action, carrier_id }`, push notifications) and works off
  `loads.matched_escort_id`.

**Decision needed:** which table is canonical (`matches`, `load_matches`, or just
`loads.matched_escort_id`)? Once that's settled, the dashboard should call the
canonical endpoint with the matching payload, and the dead/duplicate route(s)
removed. I left this untouched to avoid guessing against an unknown live schema.

### B. `lib/email.ts` is a half-built stub
In production (when `SMTP_HOST`/`GMAIL_USER` is set) it does a **relative** fetch
to `/api/internal/send-email`, which (a) doesn't exist and (b) won't resolve
server-side without an absolute base URL — so those emails silently fail.
Meanwhile `app/api/bgc-badge/submit/route.ts` calls Resend directly and the
project already depends on `resend`. **Recommend:** make `lib/email.ts` use
Resend (`RESEND_API_KEY`) for consistency.

### C. `lib/auth-utils.ts` is dead code against a stale schema
Unused everywhere; queries non-existent `users` / `user_subscriptions` tables.
Safe to delete, or rewrite against `profiles` if you intend to use it.

### D. Pre-existing lint debt (not breaking, but worth a pass)
- 197 `@typescript-eslint/no-explicit-any`, 82 unused-vars, 28
  `react/no-unescaped-entities`, plus `react-hooks/exhaustive-deps`,
  `set-state-in-effect`, inline-component, and TDZ-style
  (`react-hooks/immutability`) warnings across `app/page.tsx`,
  `app/dashboard/_client.tsx`, the board `_client.tsx` files, and `SiteHeader`.
- None of these crash at runtime (the one that could — conditional hooks — is
  fixed). If your **Vercel build fails on ESLint**, the quick unblock is to add
  `eslint: { ignoreDuringBuilds: true }` to `next.config.ts`; the proper fix is a
  typing/cleanup pass.

### E. `/api/notify` POST has no authorization
Anyone can insert a notification for any `user_id` (the body is trusted). Auth
on GET/PATCH is now fixed, but POST should verify the caller before it's wired
into the UI (currently unused by the frontend).

---

## How to verify
```bash
npm install
npx tsc --noEmit          # passes
npx eslint .              # pre-existing debt only; no rules-of-hooks errors
npx next build            # works where Google Fonts is reachable (e.g. Vercel)
```

---

# Round 2 — Deep re-audit (every API route + page)

After the first pass I re-audited the whole repo subsystem-by-subsystem (payments,
SMS/push, loads/bids/escort, and the page/React layer). Found and fixed another
batch of **high-confidence, verified** bugs. As before, `npx tsc --noEmit` passes.

> Important context discovered: the repo's `supabase/migrations*` are **incomplete** —
> the production database has many tables created directly in Supabase Studio
> (bids' own migration says "back-port from live schema"). So "not in migrations"
> does **not** mean "doesn't exist." I only renamed columns/values I could verify
> against the committed migration (`reviews`) or the `Profile` type + consistent
> app-wide usage (`carrier_id`, `tier`). Everything uncertain is documented, not changed.

## Round 2 — FIXED

### Reviews were broken end-to-end → now aligned to the real schema
The `reviews` table (in `migrations.sql`) is `load_id (NOT NULL)`, `reviewer_id`,
`reviewee_id`, `rating`, `body`, with `UNIQUE(load_id, reviewer_id)`. The code used
`target_user_id`/`comment`/`escort_id` and never sent `load_id`, so **every review
insert failed** and **every rating display read the wrong column** (always 0 stars).
Fixed across: `app/api/reviews/route.ts` (insert `load_id`/`reviewee_id`/`body`; GET
filters `reviewee_id`), `app/review/[id]/page.tsx` (now sends `loadId`),
`app/find-escorts/page.tsx` and `app/escorts/[id]/page.tsx` (`escort_id`→`reviewee_id`,
`comment`→`body`).

### Posting a load via `/post-load` always failed
`app/post-load/_client.tsx` sent `escort_type`, but `app/api/loads/route.ts` requires
`escortType` (camelCase) → 400 "Missing required fields" every time. Fixed the field name.

### Stripe checkout from `/checkout` always failed
`app/checkout/page.tsx` sent internal keys (`"P_EVO_MEMBER"`, `"FLEET_PRO"`) as the
Stripe price id; the route passed them straight to Stripe, which rejects them. The
route now resolves keys through `STRIPE_PRICE_IDS` and passes real `price_…` ids
through unchanged (so the `/pricing` page still works too). `app/api/checkout/route.ts`.

### Stripe webhook mis-tiered one-time purchases
A one-time **P/EVO cert-review** purchase fell into the subscription block where
`PRICE_TO_TIER[priceId] ?? 'member'` **silently set the buyer's tier to `member`**
and nulled `stripe_subscription_id`. Now cert-review purchases only set `pevo_paid`,
and unknown prices no longer default anyone to `member`. `app/api/webhook/route.ts`.

### Two endpoints 404'd on every call (selected a non-existent `title` column)
`app/api/loads/request/route.ts` and `app/api/bids/accept/route.ts` selected a `title`
column on `loads` (no such column; never read in the code) → query error → "Load not
found" every time → match requests and bid acceptance were impossible. Removed `title`.

### Fleet Manager was Pro-only-but-403-for-everyone
`app/api/fleet-search/route.ts` checked `profile.subscription_tier` (real column is
`tier`) → undefined → every non-admin got 403. Now checks `tier` (`pro`/`fleet_pro`).

### Pro escorts never got "new load" alerts
`app/api/loads/notify-pro/route.ts` had a self-contradictory filter
(`.eq("tier","pro").or("role.eq.admin").eq("role","escort")` → `role=admin AND
role=escort` → matches nothing). Removed the bad `.or()`; admins are already added
separately. `app/api/sms/route.ts` filtered on a non-existent `membership` column →
changed to `tier`.

### Bid submission rejected valid open-bid loads
`app/api/bids/route.ts` only accepted `board_type` of `'bid'` or `'open'`, but some
loads use `'open-bid'`. Now accepts `bid`/`open`/`open-bid`.

### Notification emails silently never sent
`lib/email.ts` did a relative `fetch('/api/internal/send-email')` (no such route, and
relative URLs don't resolve server-side). Rewrote to use **Resend** (`RESEND_API_KEY`),
matching how `app/api/bgc-badge/submit` already sends email. Falls back to a console
stub when no key is set.

## Round 2 — STILL needs a human decision (NOT changed)

- **`board_type` naming is inconsistent app-wide.** The main posting UI writes
  `flat`/`bid`/`open`; the SMS webhook and the `Load` type use `flat-rate`/`bid`/`open-bid`.
  The board pages filter on specific strings, so some loads may not appear on the
  board you'd expect. Needs one canonical set of values + a data backfill.
- **`/api/sms/parse`** inserts loads with `board_type` values like `flat_rate`/`open_loads`
  (underscores — match nothing) and a `source` column. It has **no in-app callers**
  (external webhook or dead). Don't wire it up until its insert shape is reconciled.
- **TextRequest API calls disagree on URL/host/version** across routes
  (`api.textrequest.com/api/v3/Messages`, `app.textrequest.com/api/v2/...`,
  `www.textrequest.com/api/v3/send/` in `lib/sms.ts`). At most one is correct — verify
  against your TextRequest account and standardize. (`lib/sms.ts` is also unused/dead.)
- **Auth gaps:** `app/api/loads/[id]/route.ts` (PATCH) and `app/api/deadhead/route.ts`
  (PATCH) let anyone modify any load's deadhead destination — no caller check.
- **`app/api/deadhead/route.ts`** filters `status IN ('matched','pending_match')` but the
  migration's status CHECK is `open/pending_match/filled/expired` (`'matched'` is written
  only by the divergent `/api/matches`). Tied to the matching-model decision (section A).
- **Verify these tables/columns exist in production** (referenced in code, absent from
  repo migrations): `matches`, `load_matches`, `sponsored_zones`, `device_fingerprints`,
  `escort_certs`, `invoices`, `job_logs`, `fleet_searches`, `admin_flags`,
  `escort_availability`, `launch_waitlist`, `disputes`, `fleet_escorts`,
  `veteran_discounts`, `dd214_submissions`, and the `profiles.stripe_subscription_id`
  column. If any are missing, the related feature throws at runtime.
- **Dead/inert code:** `lib/auth-utils.ts` (queries non-existent `users`/`user_subscriptions`),
  `lib/sms.ts` (unused), and `app/components/PushInit` is imported but never rendered in
  `app/layout.tsx` so push registration never runs.

---

# Round 3 — Matching unified + schema verifier

## Matching subsystem (was Round 1 "section A") — NOW FIXED
The feature was built three incompatible ways (a `matches` table, a `load_matches`
table, and `loads.matched_escort_id`). Standardized everything on the model the
committed migration already defines and the working endpoints already use:

- **One source of truth:** `loads.status` (`open` → `pending_match` → `filled`)
  plus `loads.matched_escort_id`. Dropped all reads/writes of the orphan
  `matches`/`load_matches` tables.
- **One accept/decline path:** both the `/dashboard` page and the homepage carrier
  hub now call `POST /api/loads/match` with `{ load_id, action, carrier_id }`
  (service-role, already complete: sets `filled`/`open`, fills the deadhead
  destination, pushes the escort). Deleted the broken duplicate `/api/matches`
  (it auth'd with the anon client → always 401, and read `load_id` while the
  caller sent `matchId`).
- **One "done" status:** standardized on `filled` everywhere (the migration's
  status CHECK is `open/pending_match/filled/expired` — `matched` isn't valid and
  could fail the constraint). Fixed readers in `/dashboard`, the homepage carrier
  hub + escort jobs, fleet dashboard, load detail page, and the deadhead route.
- Fixed `page.tsx` decline writing the invalid status `'active'` (now `open`, via
  the API).

Files: `app/dashboard/_client.tsx`, `app/page.tsx`, `app/loads/[id]/page.tsx`,
`app/fleet-dashboard/_client.tsx`, `app/api/deadhead/route.ts`, and deleted
`app/api/matches/route.ts`.

Residual note: `/api/loads/match` trusts `carrier_id` from the body but verifies
it equals the load's `carrier_id`, so a caller can only act as the actual load
owner. Pre-existing; fine for now, worth tightening to session auth later.

## Database schema verifier (the other Round 2 "needs decision" item)
Added `supabase/verify_schema.sql` — a **read-only** query that reports which
expected tables and key columns exist vs. are missing in production. The repo's
migrations are incomplete (many tables were made in Supabase Studio), so this is
how to confirm nothing the code relies on is absent. Run it in the Supabase SQL
editor; anything marked MISSING is a feature that will error until created.

## Scraper
Removed from the repo in Round 2 (`cloudflare-workers/` deleted). Fully retiring
it also requires disconnecting/deleting the `oehscraper` Worker in the Cloudflare
dashboard — that integration lives outside the repo and can't be changed here.

---

# Round 4 — Deep multi-agent audit (11 finders + adversarial verify)

Ran a fan-out audit across every subsystem (each finding independently verified).
Fixed 21 confirmed, previously-unknown functional bugs. `tsc` + `next build` pass.

## Round 4 — FIXED
**Checkout / payments**
- `lib/stripe-utils.ts`: `SPONSORED_ZONE` wasn't in `ONE_TIME_PRICES` → its checkout
  was created in *subscription* mode. Added it (one-time).
- `app/api/webhook/route.ts`: `SPONSORED_ZONE` was in `PRICE_TO_TIER` → a sponsored
  purchase could overwrite `profiles.tier` to `'sponsored_zone'`. Removed it.
- `app/api/bgc-badge/submit/route.ts` + `app/bgc-badge/page.tsx`: the form sent the
  file as `pdf` with no `userId`, the route read `file`+`userId` → **every BGC badge
  submission 400'd**. Route now derives the user from the session and accepts `pdf`.
- `app/api/bgc-badge/approve/route.ts`: had **no auth** — anyone could approve any
  cert and set `bgc_verified`. Now `requireAdmin()`.
- `app/api/bgc/route.ts`: added the `GET` the `/bgc` page calls (was 405 → status
  always showed "none").

**Boards / loads display**
- Homepage post form wrote `board_type` `flat`/`open`; boards filter
  `flat-rate`/`open-bid` → flat & open loads never appeared. Canonicalized
  (`app/page.tsx`). Also `app/loads/page.tsx` filtered `open` → `open-bid`.
- Load-detail + bid-board showed `load.rate`/`escort_qty`/`date_needed` — real
  columns are `per_mile_rate`/`escort_count`/`start_date`. Fixed
  (`app/loads/[id]/page.tsx`, `app/bid-board/_client.tsx`).
- `app/api/fleet-search/route.ts`: selected `rate_per_mile` → `per_mile_rate`.

**Auth / session**
- `components/SiteHeader.tsx`: read auth via the localStorage `supabase` singleton
  → logged-in users always saw the signed-out header. Switched to the cookie-aware
  browser client.
- `app/api/push/subscribe/route.ts`: POST required a body `userId` the client never
  sent (→ 400) and there was no DELETE (unsubscribe → 405). Rewrote: derive user
  from session, add DELETE.
- `app/review/[id]/page.tsx`: signin redirect used `?next=` but signin reads
  `?redirect=` → user never returned to the review. Fixed.

**Data / queries**
- `app/find-escorts/page.tsx`: selected/filtered `membership` (nonexistent) → the
  escort query errored and **no escorts listed**. Changed to `tier`. Also sponsored
  filter `zone` → `state`.
- `app/api/deadhead/route.ts`: filtered escorts on `membership` and read `load.rate`
  → now `tier` + `per_mile_rate`.
- `app/page.tsx` referral loader queried `referrals.referred_by` (a *profiles*
  column) → `referrer_id`. Return-load search hit `GET /api/loads` (405) → queries
  loads directly.
- `app/api/invoices/create/route.ts`: read `{carrierId,…}` but the page sends
  `{load_id,amount,recipient_email}`, and the insert had no `.select()` (id always
  undefined). Aligned the payload + added `.select()`.
- `app/api/sms/blast/route.ts`: ignored `sms_opt_outs` → users who texted STOP still
  got admin blasts. Now excluded (compliance).

## Round 4 — DEFERRED (need the schema check; not changed)
Run `supabase/verify_schema.sql` (now extended) and tell me which spelling exists:
- **`loads.pay_type` vs `pay_term`** — writers use `pay_term`, readers use `pay_type`,
  so posted loads don't show their pay terms. Can't fix safely without knowing the
  real column (guessing risks breaking the load insert).
- **`profiles.availability_states` vs the `escort_availability` table** — push
  broadcast reads the former, SMS/board coverage uses the latter (two stores).
- **`loads` status `cancelled`** — `escort/breakdown` writes it on protocol-disable;
  the migration's CHECK only lists `open/pending_match/filled/expired`. If the live
  CHECK doesn't allow `cancelled`, that write silently fails. (Left as-is because
  `cancelled` is used as a valid status elsewhere — likely the live CHECK allows it.)

## Note
13 of the 42 raw findings were matching-subsystem bugs already fixed in Round 3 —
the audit ran against a branch predating that merge. Skipped those.

## Files changed in this audit
- **Round 1** — Deleted: junk root files, `build_summary.txt`, `postcss.config.mjs`,
  `tailwind.config.js`. Modified: `app/page.tsx`, `app/loads/[id]/page.tsx`,
  `app/api/{jobs/log,invoices/create,escort/cert-upload,veteran/dd214-submit,notify,matches,loads/notify-pro}/route.ts`,
  `lib/supabase.ts`, `lib/tier-access.ts`
- **Round 2** — Modified: `app/api/reviews/route.ts`, `app/review/[id]/page.tsx`,
  `app/find-escorts/page.tsx`, `app/escorts/[id]/page.tsx`, `app/post-load/_client.tsx`,
  `app/api/checkout/route.ts`, `app/api/webhook/route.ts`, `app/api/loads/request/route.ts`,
  `app/api/bids/accept/route.ts`, `app/api/bids/route.ts`, `app/api/fleet-search/route.ts`,
  `app/api/loads/notify-pro/route.ts`, `app/api/sms/route.ts`, `lib/email.ts`
