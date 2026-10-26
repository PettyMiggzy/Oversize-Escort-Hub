# Oversize Escort Hub: notes for whoever works on this repo

Read this first. Update it when the owner decides something new (short entry, same commit as the change).

## The business
- Operated by **Precision Pilot Services, LLC**, doing business as (DBA) **Oversize Escort Hub** (owner, 2026-10-26). Terms, Privacy, About and the footer say so.
  Owner: Brian Ahmed. (He also called it "Precision Pilot Escorts" once: the LLC name above is the one he confirmed.)
- `brian@precisionpilotservices.com` is the owner's own address, not a customer (test emails that land there are harmless).
- Mailboxes at the domain: `support@oversize-escort-hub.com` is the public contact (used across the site). `verification@oversize-escort-hub.com`
  also exists (owner, 2026-10-26) but verification is no longer offered. The veteran discount is parked "way later" (owner, 2026-10-26): the DD-214 routes
  answer 410 behind `VERIFICATION_LIVE`; never collect DD-214s (SSN, birth date, and we cannot verify them). `lib/email-utils.ts` still points at the mailbox.
- Live site: https://www.oversize-escort-hub.com. Hosting: Vercel project `oversize-escort-hub`, deploys from `main`. Database: Supabase. Email: Resend.
- Emails go out as `OEH <noreply@oversize-escort-hub.com>` (`EMAIL_FROM` in Vercel). Gmail shows a letter "O" because there is no logo set (owner will make the Google account and send its address): the free route is a
  Google account on a domain mailbox with the logo as its profile picture; a logo for everyone (BIMI) needs a paid certificate, about $650-$1,400 a year: not bought.

## Rules the owner has set
- **Free for now.** Plans are free (`FREE_LAUNCH`); only add-ons that cost him money are paid (today: sponsored zone). No prices inside the phone app.
- **We do not check or verify anyone or anything**: no background-check badge, no certificate review, no verified ticks (owner, 2026-10-26: "I don't want to be liable").
  The old code stays behind `VERIFICATION_LIVE` (off). Escort documents are optional uploads labelled "uploaded by the escort, not checked", paid-plan only (open while free).
  Never write "verified", "background checked" or "vetted" in site copy. Anything not live goes on `/coming-later` and `docs/NOT_LIVE_YET.md`.
- **Transparency**: say plainly what the site does and does not do.
- **AI helper**: cheapest model only (Claude Haiku family, with an automatic fallback), never says which model: it answers "I'm the OEH assistant".
- **Keys**: never paste a key into chat, a file or a commit. The owner puts them in Vercel or Claude swaps them there on request. The helper key and the admin password were shown in chat once; the owner chose not to rotate them for now (2026-10-26).
- **No outreach** (emails, DMs, posts to real people) without the owner's OK. Drafts live in `docs/outreach-drafts.md`.
- **Test data** is named `ZZTEST`; never let tests send emails to real accounts. The two e2e test accounts were deleted on 2026-10-26; make new ones if needed and delete them after.
- Do not change things the owner did not ask for: flag them instead.

## Working here
- Checks before every push: `npx tsc --noEmit` and `npm run test:hostile` (all must pass). New tables or columns must be listed in `tests/hostile-audit/schema-columns.ts`.
- Next.js route files export only HTTP handlers. Do the database changes as additive SQL (files in `docs/sql-*.sql`).
- The phone app is a wrapper around the live site (Capacitor, `com.oversizeescorthub.app`). Android is ready on our side, waiting on the owner (signing key, Play Console).
  iPhone is not started (needs a Mac and an Apple Developer account); see `docs/mobile-store/STORE_READINESS.md`.
- The owner's to-do list is `docs/OWNER_TODO.md`; things not live are in `docs/NOT_LIVE_YET.md`.
