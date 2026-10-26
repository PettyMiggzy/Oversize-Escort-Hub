# Oversize Escort Hub: notes for whoever works on this repo

Read this first. Update it when the owner decides something new (short entry, same commit as the change).

## The business
- Operated by **Precision Pilot Services, LLC**, doing business as (DBA) **Oversize Escort Hub** (owner, 2026-10-26). Terms, Privacy, About and the footer say so.
  Owner: Brian Ahmed. (He also called it "Precision Pilot Escorts" once: the LLC name above is the one he confirmed.)
- `brian@precisionpilotservices.com` is the owner's own address, not a customer (test emails that land there are harmless).
- Mailboxes at the domain: `support@oversize-escort-hub.com` is the public contact (used across the site). `verification@oversize-escort-hub.com`
  also exists (owner, 2026-10-26) but verification is no longer offered. The veteran discount is parked "way later" (owner, 2026-10-26): the DD-214 routes
  answer 410 behind `VERIFICATION_LIVE`; never collect DD-214s (SSN, birth date, and we cannot verify them). `lib/email-utils.ts` still points at the mailbox.
- `precisionpilotservices.com` is the owner's (registered to Aug 2027; the old Netlify site is gone; USDOT number no longer active, never show it). It serves one page (`app/company`) through a host rule in `middleware.ts`. The phone number on that page, (317) 625-2831, is the owner's choice to show publicly (2026-10-26); no other number is public. The Google Business Profile is the listing for this LLC (home-based service area business, address hidden); the owner no longer does escort jobs himself, so never describe it as an escort service.
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

- **Email logo** (2026-10-26): every email through `sendEmail` gets the OEH wordmark on top (`public/email-logo.png`, `withLogo` in `lib/email.ts`). The inbox avatar (the letter "O" in Gmail) is a separate thing, still waiting on the owner's Google account.

## Working here
- Checks before every push: `npx tsc --noEmit` and `npm run test:hostile` (all must pass). New tables or columns must be listed in `tests/hostile-audit/schema-columns.ts`.
- Next.js route files export only HTTP handlers. Do the database changes as additive SQL (files in `docs/sql-*.sql`).
- The phone app is a wrapper around the live site (Capacitor, `com.oversizeescorthub.app`). Android is ready on our side, waiting on the owner (signing key, Play Console).
  iPhone is not started (needs a Mac and an Apple Developer account); see `docs/mobile-store/STORE_READINESS.md`.
- The owner's to-do list is `docs/OWNER_TODO.md`; things not live are in `docs/NOT_LIVE_YET.md`.

## Where things stand (2026-10-26, night) and what is next
Done today: verification removed from the whole site; Terms/Privacy/About/footer name the operator; DD-214 routes off; leftover BGC text removed; AI-directory (MCP) listing published
(registry shows `io.github.PettyMiggzy/oversize-escort-hub` active); test accounts deleted; email SPF, DKIM (Microsoft 365, Valid) and one DMARC (`p=none`) live and checked; share image and Play graphic
redrawn (no "verified", no "flat subscription"); company page live on precisionpilotservices.com (Vercel, same project) with the owner's public phone; Google Business Profile cleaned up (below).

**Google Business Profile** (listing "Precision Pilot Services LLC", service-area, address hidden, none on file; done through the owner's browser extension, which is slow and sometimes crashes):
service area United States + Canada (whole countries), website precisionpilotservices.com, new description (no word "escort", no web address), phone (317) 625-2831, old flyer photo deleted (it had the dead USDOT number).
Google rejected a rename to "Oversize Escort Hub" (the word "escort" trips its filters: avoid it in profile text and in ads; say "pilot car"). Never resubmit the name. Duplicate listing removed.
Pending: category change to "Business to business service" (up to 7 days). Then the owner renames two services in the Business Profile app ("Pilot car jobs", "Find a pilot car driver by state").
Owner to do: Search Console, request indexing of precisionpilotservices.com (old Google snippet still says "certified escort"); lock down precisionpilotservice@gmail.com. Google Ads: wait until the listing and site settle ($500 new-advertiser credit is offered: claim only when ready to run ads).

**Android:** old release keystore password lost (key is dead, never use it; the repo's public history has the old keystore). Upload key was reset: new key `C:\Users\samah\oeh-upload.keystore` on the owner's PC (password not in the repo). It becomes valid
**Oct 27, 8:19 PM Eastern**; then upload `oeh-1.0.0-code1.aab` (owner's Desktop) to a closed test (answers in `docs/mobile-store/PLAY_CONSOLE_BRIEF.md`). The GitHub "Android release" workflow failed on Oct 25 at the signing-key step (secrets not set): fix when a new build is needed.
**iPhone:** owner has an Apple developer account under Precision Pilot Services, LLC (organization). Owner chose to go straight to App Store review, no TestFlight stage (2026-10-26). iPhone bundle id is `pevo.oversizeescorthub.app` (owner choice; Android stays `com.oversizeescorthub.app`; cannot change after the App Store Connect app is created). The iOS app runs on iPhone and iPad (`TARGETED_DEVICE_FAMILY = "1,2"`, owner's choice 2026-10-26), so App Store Connect needs iPhone 6.9-inch AND iPad 13-inch screenshots (never use the find-escorts page in screenshots: real names). iOS project and "iOS release" workflow added (`ios/`, `.github/workflows/ios-release.yml`, steps in `docs/mobile-store/IOS_RELEASE.md`); waiting on the owner's App Store Connect app record, API key and 4 GitHub secrets (never in chat). Apple may reject a plain website wrapper (4.2): native push is the fix if so. Threads must stay on Sonnet 5.5 or lower (owner, 2026-10-26).
**Push notifications:** not built. Android native push goes through Firebase Cloud Messaging; the owner says his other sessions did not use Firebase (not verified, ask which service). Waiting until after the Android test. iPhone push uses Apple's service directly.

**Evergreen:** Terms §28, Privacy §29, home page, getting-started and coming-soon say OEH is an "official member/partner" of Evergreen Safety Council (membership INV14545, promo code OSEH2026 for 5% off courses to 2027-04-30).
Plan awaiting the owner's yes that the membership is real and current: change "partner/partnership" to "member", add "not endorsed by Evergreen Safety Council". Evergreen has no API (2026-10-26; they verify only through a web form; the owner says they planned to build one).

**Still open:** the Google account address for the email logo (domain mailbox, logo as profile picture; sender switch is the `EMAIL_FROM` Vercel setting); SPF on precisionpilotservices.com still lists only GoDaddy (set `v=spf1 include:spf.protection.outlook.com -all`);
DMARC to `p=quarantine` after ~2 weeks of clean reports; Twilio texting still off; escorts have no states set (prompt exists); outreach needs the owner's OK; the repo is public, so never put passwords, keys or the owner's home address in it
(`docs/OWNER_TODO.md` lists a Play reviewer password to change after review).

**How to work with the owner:** plain short words, he is often on his phone, "drive" means decide and do (ask only when it needs his money, accounts or a legal call), he forgets context so keep these notes current in the same commit as each change.
**Where things live:** Vercel team `monpad` (id `team_5gyTli5bGixqlpqUSQvFJeeG`), project `oversize-escort-hub` (`prj_cXPBVE0G223ZOw99zpU9njSXjk1h`); Supabase project `rcdezyugannbyqqtowrc`; Resend domain verified; GitHub `PettyMiggzy/Oversize-Escort-Hub`, deploys from `main`.
Domains on the Vercel project: oversize-escort-hub.com (+www) and precisionpilotservices.com (+www; its Microsoft 365 mail records must never be touched).
