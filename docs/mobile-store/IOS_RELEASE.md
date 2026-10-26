# iPhone app: build and submit (written 2026-10-26)

The iOS project is in `ios/` (Capacitor, same live-site wrapper as Android, bundle id `com.oversizeescorthub.app`).
The "iOS release" workflow (`.github/workflows/ios-release.yml`) builds it on a GitHub Mac and uploads it to App Store Connect. No Mac needed.

## What the owner does, in order

1. **App Store Connect** (appstoreconnect.apple.com, the LLC's organization account): My Apps > + > New App. Platform iOS, name
   "Oversize Escort Hub", language English (US), bundle id `com.oversizeescorthub.app` (register it under Certificates, Identifiers & Profiles > Identifiers if it is not in the list), SKU `oeh-ios-1`.
2. **API key**: Users and Access > Integrations > App Store Connect API > Team Keys > +. Name "GitHub", access **Admin** (needed so the build can create its own signing certificate).
   Download the `.p8` once. Note the **Key ID** and the **Issuer ID** at the top of the page.
3. **GitHub secrets** (repo Settings > Secrets and variables > Actions): `ASC_KEY_ID`, `ASC_ISSUER_ID`, `APPLE_TEAM_ID` (Membership details page, 10 characters),
   and `ASC_KEY_P8_BASE64` (the `.p8` file, base64-encoded: on Windows PowerShell `[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXX.p8"))`). Never paste any of these in chat.
4. Tell Claude "secrets are set". Claude runs the workflow; the build appears in App Store Connect in about 15 minutes.
5. In App Store Connect, fill the listing from the section below, add screenshots, pick the build, enter the reviewer login, and press Submit for Review.

## Listing text (App Store Connect)

- Name: Oversize Escort Hub. Subtitle (30): `Pilot car jobs & loads`
- Category: Business. Age rating: 4+ (answer the questionnaire honestly; no user-generated content moderation promise beyond the Conduct page).
- Keywords (100): `pilot car,escort,oversize load,P/EVO,flagger,wide load,carrier,trucking,heavy haul,load board`
- Support URL: https://www.oversize-escort-hub.com/contact. Privacy policy URL: https://www.oversize-escort-hub.com/privacy. Marketing URL: https://www.oversize-escort-hub.com
- Description (matches the site rules: nothing is checked or verified, free for now):

  Oversize Escort Hub is a load board that connects oversize-load carriers with pilot car (escort) drivers. Everything is free while we launch.

  FOR PILOT CAR DRIVERS: browse flat-rate, open-bid and 5-minute bid boards; get alerts for loads in the states you cover; place bids or claim loads; use the weather and route tools; keep a job log and send invoices.
  FOR CARRIERS AND BROKERS: post a load in minutes and receive bids from pilot car drivers; accept the bid you want.
  FOR FLEETS: manage several drivers in one account.

  No commissions and no job fees. We do not check or verify anyone's licences, certificates or background: profiles show what drivers tell us. Accounts are created on our website.
- Note: the Android listing text in `STORE_LISTING.md` still says "verified", "background check" and "certified". Do not reuse it for Apple; it breaks the owner's no-verification rule.

## App Privacy answers (nutrition label)

Data linked to the user, not used for tracking, no ads: contact info (name, email, phone), user content (photos and documents the user uploads, messages), identifiers (user id),
coarse/precise location only when the user opens the weather tool (not stored), usage data (basic site analytics, if enabled). No third-party advertising, no data sold.
Account deletion: in the app at `/delete-account`, also linked from the footer and the privacy policy.

## Review notes for Apple

Reviewer demo accounts (one pilot car driver, one carrier; strong passwords, changed after approval) go in "App Review Information". Say: "The app shows our website's load board. New accounts are
created on the website; the app signs in with an existing account. There are no purchases in the app."

## Risks

- **Guideline 4.2 (minimum functionality)**: Apple often rejects apps that only show a website. This build has no native features yet (no push, no share, no camera upload).
  If it is rejected, the answer is native push (needs an Apple push key) and phone-camera upload, then resubmit.
- Sign-up is hidden inside the app (account made on the website). Apple allows this when the app sells nothing; if the reviewer objects, we turn on in-app sign-up (it is free).
- The Terms/Privacy pages must stay reachable without signing in (they are).
- Screenshots are required: 6.9-inch iPhone (1320x2868 or 1290x2796) at least. They can be made from the live site in a browser at that size.
