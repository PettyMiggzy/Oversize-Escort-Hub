# Oversize Escort Hub: running to-do list

Last updated 2026-10-26 (evening). The owner says "I'm home" and we go down the "When you are home" list together. Claude keeps this file current.

## Rules the owner set
- **Everything is free except add-ons.** Free to post a load, free to bid, free to accept, free to post a job. The only add-on sold today is sponsored zones. We do NOT check or verify anyone (BGC badge and cert review were removed 2026-10-26; owner: no liability). Charge for more only after the site is busy.

## When you are home (owner does these, Claude walks you through)
1. **Email DNS: DONE 2026-10-26.** SPF (`v=spf1 include:spf.protection.outlook.com -all`), DKIM (Microsoft 365, Valid and Enabled) and one DMARC record (`p=none`, reports to the owner's Precision Pilot Services mailbox) are live and checked. In about two weeks, if reports are clean, raise DMARC to `p=quarantine`. The same SPF fix is still to do on `precisionpilotservices.com` (it still lists only GoDaddy).
2. **Profile picture for outgoing email**: make a Google account using a real domain mailbox (for example support@oversize-escort-hub.com), upload `oeh-profile-picture-1024.png` (Claude sent it), then tell Claude the address so the site's sender switches to it (Vercel setting `EMAIL_FROM`, no deploy). Send a screenshot of the next email. Logo in Gmail for sure needs BIMI plus a paid certificate: decide later, do not buy yet.
3. **Cursor**: tell it "pull main, the task is docs/cursor/CURSOR_TASK_D_growth.md, branch cursor/growth-pages". Claude reviews before anything goes live.
4. **Google Play**: after Oct 27, 8:19 PM Eastern upload `oeh-1.0.0-code1.aab` (Desktop). Closed test first. Organization account, so the 12-tester rule should not apply: confirm in Console. Answers: contains ads No, in-app purchases No (add-ons are bought on the website, never in the app).
5. **Back up** `C:\Users\samah\oeh-upload.keystore` and its password (USB stick + password manager). The old `oeh-release.keystore` password is lost; the upload key was reset. (Apple and Google developer accounts: the owner already has both, 2026-10-26.)
6. **Texting**: the toll-free number may not reach Canada. Options: check Twilio's Canada rules and test one text to a Canadian phone, or go back to TextRequest. Twilio verification is still pending. Before texting is ever turned on: run `docs/sms-consent-before-texting.sql`, collect phone numbers (optional field exists at sign-up), set SMS_ENABLED=true.
7. **Security housekeeping**: revoke the GitHub token that was pasted in chat; change the Play reviewer password (123456789) after the stores approve; turn on leaked-password protection in Supabase (Auth settings). Test accounts were deleted 2026-10-26. The owner chose not to rotate the helper key and the admin password for now.
   - Google Business Profile (Precision Pilot Services LLC): category change pending Google review (up to 7 days); then in the Business Profile app rename two services to "Pilot car jobs" and "Find a pilot car driver by state". Search Console: request indexing of precisionpilotservices.com. Lock down precisionpilotservice@gmail.com (password, 2-step).
8. **Decisions**: the cert review is gone. Open: is the "Official Evergreen Safety Council Member / partner" wording true? (Evergreen has no API; they verify only through a web form.) Keep, reword or remove.
9. **Outreach**: message 30 to 50 carriers and brokers you know. Claude drafts the message and a one-page "why post here". Run the first 10 jobs by hand.

## Claude does next (no action needed from you)
- Found 2026-10-26: all 25 escorts have no states set, so state pages are empty and alerts go to everyone. A prompt now shows on the escort dashboard; also plan a one-time email nudge to escorts and consider making states part of sign-up.
- **Jobs board (owner's idea 2026-10-26): fleets and escort companies hiring 1099 subcontractors or drivers.** Poster picks: bring-your-own vehicle and gear, company provides vehicle, or company provides gear only; pay as percent of load, flat per week, day rate or per mile; certs required; states; start date. Escorts apply from their profile, contact details are released only when the poster accepts (same privacy rule as loads). Also an "open to work" flag on escort profiles so fleets can search. Google "JobPosting" markup for free search traffic. Free to post while launching, paid or featured listings later. Phase 1: post, browse, apply, accept. Phase 2: search escorts open to work. Phase 3: paid featured jobs. DECIDED 2026-10-26: free to post, bid and apply for now; posting needs Pro later (switch: JOB_POSTING_FREE in lib/jobs-access.ts). Backend built and tested (tables job_posts and job_applications are LIVE in the database; the older `jobs` table is the escorts' work log, unrelated); Cursor task E builds the pages. Was: Needs owner decisions: free to post for now? allow W-2 as well as 1099 labels? (default: both, poster chooses, Terms say OEH is not the employer).
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

## Ideas from the owner, 2026-10-26 (after the Jobs board pages)
- **Make sure sign-up and every board work end to end** (first priority): escort and carrier sign-up, post a load, bid, accept, deadhead minimizer. Claude runs a full test with +alias test accounts in a state with no escorts (so no real person is emailed) and reports what breaks.
- **Perks for drivers (partnerships):** rental car discount (Enterprise / Hertz / Avis corporate or affiliate programs), roadside and towing (AAA business, or a towing network). Needs the owner to be the one asking; Claude drafts the pitch once there are real numbers (members, loads). Do not promise a perk on the site until one is signed.
- **AI helper:** a chat on the site that answers common questions from our own help pages and routes the rest to the owner as a ticket (cheap model such as Haiku or Groq; it only answers from our text, never invents rules, and never gives out contact details). Later: a read-only MCP server (search loads, escorts by state) to list in AI directories. Not before the boards have real traffic.

## Test accounts made by Claude (both DELETED 2026-10-26; make new ones if needed and delete after)
- bahmed3170+e2eesc@gmail.com (escort) and bahmed3170+e2ecar@gmail.com (carrier). Both are the owner's own inbox; delete them in the admin panel or Supabase before launch outreach. The test load and bid were already removed.
- Live end-to-end check 2026-10-26: sign-up (escort and carrier), email confirm, sign-in, bid, accept, contact release (both sides; anonymous refused 401), phone-width check of the main boards: all work. Not tested live on purpose: posting a load through the form (it would email about 25 real escorts who have no states set).

## Parked idea (owner, 2026-10-26): paid mini-sites for escorts and companies
Own address (name.oversize-escort-hub.com, or a path first), 3 or 4 templates, quote/book button that feeds OEH. Paid add-on (costs little, so price on value). Leaning: about $9 a month or $79 a year, annual pushed, first few free to seed. Before building: ask 10 escorts if they would pay; reserve names, moderate (a subdomain of our domain can be abused for scams); a path like /c/name shares our search ranking better than a subdomain. Build after the boards have steady traffic.

## Site helper (built 2026-10-26, switched OFF until the key is added)
Model: Claude Haiku 5.5 (the cheapest current one, about a twentieth of a cent per question). To turn it on: Anthropic Console > create an API key (name it "oeh-helper", and set a monthly spend limit there, for example $20) > Vercel > project > Settings > Environment Variables > add ANTHROPIC_API_KEY (Production) > redeploy. Never paste the key in chat. Limits in code: 15 questions an hour and 60 a day per person, 1,500 a day for the whole site. What people ask is logged in the helper_usage table (first 300 characters). Facts it answers from: lib/helper-knowledge.ts (update when prices or rules change).

Helper model safety net: first choice is claude-haiku-5-5 (Anthropic lists it as not retiring before Oct 7, 2027). If that model is ever retired, the helper switches by itself to claude-haiku-4-5 (about 10x the price, so at most about $5 a day even at the site-wide cap) and emails support@ once an hour while it happens. Never a bigger model. To change the first choice without code: set HELPER_MODEL in Vercel to another Haiku name (anything not named claude-haiku-* is ignored). Check Anthropic's model deprecations page every few months.

## Guide page and AI server (built 2026-10-26)
- Beginner guide: /pilot-car-guide (sources: FHWA training manual and study guide, FHWA state permit contacts, Evergreen Safety Council state pages; most are from 2016 and the page says so). Content file: lib/guide-content.ts. Re-check the sources every few months and update GUIDE_CHECKED.
- AI server (MCP): /api/mcp, read-only (guide, fact sheet, escorts by state, open loads; no contact details, no company names). Listing it in directories needs about 10 minutes from you: docs/mcp-registry/README.md.
- robots.txt no longer blocks ChatGPT, Claude, CCBot or other AI crawlers (it did before). Add /llms.txt (done) so assistants find the guide.

## Jobs board is LIVE (2026-10-26)
Pages: /jobs (public), /jobs/<id> (Google JobPosting markup), /post-job, dashboard My jobs and My applications. Free to post and apply for now (JOB_POSTING_FREE in lib/jobs-access.ts). The escorts' old mileage log page moved from /jobs to /job-log. Live end-to-end test with the two test accounts: post through the form, public board and job page, apply, accept, both sides see contact details, close: all worked. The test job was closed.

## Helper is LIVE (2026-10-26)
Key set in Vercel (ANTHROPIC_API_KEY plus ANTHROPIC_WORKSPACE_ID, Production). Tested on the live site: price answer matches the pricing page, "what AI are you" answers only "I'm the OEH assistant", a request to print its instructions is refused, a request for an escort's phone number is refused. TODO: the key was shown in a screenshot and in chat: delete it in the Anthropic Console and make a fresh one inside the OEH workspace, then swap it in Vercel (Claude can do the swap; never paste it in chat).
