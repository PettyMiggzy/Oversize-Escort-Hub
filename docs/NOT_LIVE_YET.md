# Parked: ideas that are NOT live

## REMOVED 2026-10-26 (owner: "get rid of that verification shit", no liability)
Switched off in one place: `lib/verification.ts` (`VERIFICATION_LIVE`, default off; `NEXT_PUBLIC_VERIFICATION_LIVE=true` plus a redeploy brings the old code back, but only do that after a lawyer has read the wording).
- BGC badge ($9.99) and P/EVO cert review ($14.99/$9.99) add-ons: no longer sold (checkout answers 410), cards removed from /pricing, pages /bgc /bgc-badge /bgc-checkout /verify /verification redirect to /coming-later. Nobody had bought either (checked: 0 paid).
- "Verified" badges (BGC, P/EVO, vehicle, admin, FMCSA ticks on loads) no longer shown anywhere; the DOT "Mark as FMCSA Verified" card is hidden; admin cannot hand out badges.
- Marketing and legal copy that said "verified" (site title and descriptions, About, Terms, Privacy, Features, How it works, Pricing, Join, Checkout, home page) now says we do not check or verify anyone.
- Existing flags in the database were left as they are (two accounts: the owner's test escort has bgc/pevo, one carrier has fmcsa). Nothing reads or shows them while `VERIFICATION_LIVE` is off.
- NOT touched: the veteran discount (DD-214 document review, shown as Coming Soon), the "Official Evergreen Safety Council Member / partner" wording, public images that may say "verified" (og-image, verified.png). Decide on those.
 (so they do not take space while we make the free stuff work)

Rule from the owner (2026-10-26): focus on the free parts, make sure every one works, build nothing from this list until he says.

## Paid profile for escorts (P/EVO): STARTED 2026-10-26 (free while we launch)
Built: /my-documents (upload certificate, insurance, vehicle; choose what shows), public profile shows reviewed documents the escort switched on, 5-minute links only. Uploading and showing documents is a paid-plan feature (open to all while FREE_LAUNCH is on; lapsed plan hides the documents). Still to do: vehicle photo gallery, expiry reminder emails, gating behind Pro when charging starts.

(Original idea:)
- Public profile page with: photo of the P/EVO certification (reviewed), proof of insurance (reviewed, with an "insured" badge), vehicle photos and equipment list, certifications by state with expiry dates (reminder email before one lapses), service area map, reviews.
- Needs first: the document review flow already used for BGC/cert review, storage rules so documents are never public unless the escort chooses, and a lawyer's read on what we say about "verified insurance" (we verify that a document was shown, not that a policy is in force).
- Price: undecided (add-on or part of Pro). Free profiles stay as they are.

## Other parked
- Mini-sites for escorts and companies with templates (docs/OWNER_TODO.md, "Parked idea").
- Paid or featured job posts; posting jobs behind Pro (the switch exists: JOB_POSTING_FREE in lib/jobs-access.ts).
- Text-message alerts (waiting on Twilio; SMS_ENABLED is false).
- Rental car and roadside/towing perks for drivers (needs real numbers before asking anyone).
- Per-state rule pages beyond the beginner's guide (only with sources checked line by line).
