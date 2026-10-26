# Oversize Escort Hub: running to-do list

Last updated 2026-10-26. The owner says "I'm home" and we go down the "When you are home" list together. Claude keeps this file current.

## Rules the owner set
- **Everything is free except add-ons.** Free to post a load, free to bid, free to accept, free to post a job. Only things that cost the owner money are charged: BGC badge, P/EVO cert review, sponsored zones. Charge for more only after the site is busy.

## When you are home (owner does these, Claude walks you through)
1. **Email DNS fixes** (stops your own mail going to spam; do in this order)
   1. Microsoft 365 DKIM: security.microsoft.com > Email & collaboration > Policies & rules > Threat policies > Email authentication settings > DKIM. Create the keys, add the two CNAMEs it shows (selector1/selector2 `_domainkey`) at GoDaddy, wait, then switch signing On.
   2. SPF: replace the root TXT `v=spf1 include:secureserver.net -all` with `v=spf1 include:spf.protection.outlook.com include:secureserver.net ~all` (edit the existing record, never add a second).
   3. DMARC: delete the three `_dmarc` TXT records, add ONE: `v=DMARC1; p=none; rua=mailto:bahmed3170@gmail.com`. After about two weeks of clean reports, raise to `p=quarantine`.
   4. Tell Claude: it reads your DNS and confirms each record.
2. **Profile picture for outgoing email**: make a Google account using a real domain mailbox (for example support@oversize-escort-hub.com), upload `oeh-profile-picture-1024.png` (Claude sent it), then tell Claude the address so the site's sender switches to it (Vercel setting `EMAIL_FROM`, no deploy). Send a screenshot of the next email. Logo in Gmail for sure needs BIMI plus a paid certificate: decide later, do not buy yet.
3. **Cursor**: tell it "pull main, the task is docs/cursor/CURSOR_TASK_D_growth.md, branch cursor/growth-pages". Claude reviews before anything goes live.
4. **Google Play**: after Oct 27, 8:19 PM Eastern upload `oeh-1.0.0-code1.aab` (Desktop). Closed test first. Organization account, so the 12-tester rule should not apply: confirm in Console. Answers: contains ads No, in-app purchases No (add-ons are bought on the website, never in the app).
5. **Back up** `C:\Users\samah\oeh-upload.keystore` and its password (USB stick + password manager). The old `oeh-release.keystore` password is lost; the upload key was reset.
6. **Texting**: the toll-free number may not reach Canada. Options: check Twilio's Canada rules and test one text to a Canadian phone, or go back to TextRequest. Twilio verification is still pending. Before texting is ever turned on: run `docs/sms-consent-before-texting.sql`, collect phone numbers (optional field exists at sign-up), set SMS_ENABLED=true.
7. **Security housekeeping**: revoke the GitHub token that was pasted in chat; change the Play reviewer password (123456789) after the stores approve; turn on leaked-password protection in Supabase (Auth settings); delete leftover test accounts.
8. **Decisions**: P/EVO cert review is $14.99 for everyone while plans are free (Stripe also has a $9.99 Pro price). Keep? Evergreen: confirm the discount wording with them.
9. **Outreach**: message 30 to 50 carriers and brokers you know. Claude drafts the message and a one-page "why post here". Run the first 10 jobs by hand.

## Claude does next (no action needed from you)
- Found 2026-10-26: all 25 escorts have no states set, so state pages are empty and alerts go to everyone. A prompt now shows on the escort dashboard; also plan a one-time email nudge to escorts and consider making states part of sign-up.
- **Jobs board (owner's idea 2026-10-26): fleets and escort companies hiring 1099 subcontractors or drivers.** Poster picks: bring-your-own vehicle and gear, company provides vehicle, or company provides gear only; pay as percent of load, flat per week, day rate or per mile; certs required; states; start date. Escorts apply from their profile, contact details are released only when the poster accepts (same privacy rule as loads). Also an "open to work" flag on escort profiles so fleets can search. Google "JobPosting" markup for free search traffic. Free to post while launching, paid or featured listings later. Phase 1: post, browse, apply, accept. Phase 2: search escorts open to work. Phase 3: paid featured jobs. Needs owner decisions: free to post for now? allow W-2 as well as 1099 labels? (default: both, poster chooses, Terms say OEH is not the employer).
- Review Cursor's growth branch when it reports (state pages, share link + QR, admin funnel).
- Ignore `cursor/premium-pages-v2` (redundant: the pages already shipped).
- Admin "recent quick-posts" list with one-click remove (spam guard for account-free posting).
- Refund and cancellation wording for the paid add-ons in the Terms.
- Public share pages for loads with a preview image (for Facebook groups).
- Polish: signed-in home still has the old text logo and all-caps headings.
- Live test of the full account-free post (one real load) when you say it is OK to email escorts.

## Waiting on someone else
- Twilio toll-free verification (pending).
- Google Play: upload key becomes valid Oct 28, 12:19 AM UTC (Oct 27, 8:19 PM Eastern).

## Parked
- Native push notifications and iOS app (needs a Mac; Apple may reject a plain website wrapper, so native features like push help).
- BIMI logo with a certificate (paid).
- State-by-state escort requirements reference (needs official sources; review by you).
