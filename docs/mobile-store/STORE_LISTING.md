# Oversize Escort Hub: app store listing kit

Everything the Google Play Console and App Store Connect forms ask for, written from what the app really does.
Values in [BRACKETS] are things only the owner can supply.

## Identity

- App name: Oversize Escort Hub
- Android package: com.oversizeescorthub.app (the iPhone bundle ID should be the same)
- Category: Business (second choice: Maps & Navigation is NOT right, there is no navigation)
- Support email: support@oversize-escort-hub.com
- Website: https://www.oversize-escort-hub.com
- Privacy policy URL: https://www.oversize-escort-hub.com/privacy
- Terms URL: https://www.oversize-escort-hub.com/terms
- Account deletion URL (Google asks for this): https://www.oversize-escort-hub.com/delete-account
- Contact phone for the stores: [OWNER]

## Short description (Google Play, 80 characters)

Find pilot car jobs and verified escorts for oversize loads.

## Subtitle (App Store, 30 characters)

Pilot car jobs & escorts

## Full description

Oversize Escort Hub connects oversize-load carriers with certified pilot car (P/EVO) escorts.

FOR ESCORTS
- Browse flat-rate, open and 5-minute bid boards for escort jobs
- Pro members see new loads first and get instant alerts
- Set the states you run and get matched to loads
- Track jobs, mileage and expenses, and send invoices
- Show your certifications, background check and vehicle verification on your profile
- Use the weather and deadhead tools to plan the trip home

FOR CARRIERS
- Post a load in minutes and receive bids from verified escorts
- See each escort's certifications, verification level and reviews
- Accept the bid you want; contact details are shared only after a match

TRUST
- Four-step verification: P/EVO certificate, vehicle, background check, admin review
- Reviews after every job

No commissions and no job fees. Plans and payments are managed on our website.

## Keywords (App Store, 100 characters)

pilot car,escort,oversize load,P/EVO,flagger,wide load,carrier,trucking,heavy haul,load board

## Google Play: Data safety answers

Data is encrypted in transit: Yes. Users can request deletion: Yes (in-app link and the URL above).
Data is NOT sold. Data is NOT used for advertising.

| Data | Collected | Shared | Why |
| --- | --- | --- | --- |
| Name | Yes | With other users (profile) | App functionality, account |
| Email address | Yes | No | Account, support |
| Phone number | Yes (optional) | No | Account; contact after a match |
| Company name | Yes (optional) | With other users | Profile |
| Photos (profile picture) | Yes (optional) | With other users | Profile |
| Files and docs (certificates, ID, background check, DD-214) | Yes (optional) | No (admin review only) | Verification |
| Approximate/precise location | Only on the weather page, when the user taps it, and not stored | No | Weather |
| User-generated content (loads, bids, reviews) | Yes | With other users | App functionality |
| Purchase history | Yes (plan only; card details stay with Stripe) | Stripe | Subscriptions on the website |
| App activity / diagnostics | Yes (Vercel Analytics, page views) | Vercel | Analytics |
| Device or other IDs | Yes (a browser fingerprint to stop repeated free trials; push token) | No | Fraud prevention; notifications |

Third-party services that process data: Supabase (database and login), Stripe (payments), Resend (email), Vercel (hosting and analytics).
Text messages (SMS) are NOT active yet; do not declare SMS data until they are switched on.

## Apple: App Privacy labels

Data linked to the user: Name, Email, Phone Number, Photos, Other User Content, Purchase History (plan), Identifiers
(user ID, push token), Usage Data (analytics). Data used to track the user across other companies' apps: None.

## Content rating

No violence, no sexual content, no gambling, no user-to-user chat, no user-visible location sharing.
Expected: Apple 4+, Google "Everyone".

## App Review notes (paste into App Store Connect "Notes" and Play "App access")

Oversize Escort Hub is a marketplace for pilot car escorts and oversize-load carriers.
Accounts and subscriptions are created and paid for on our website, so the app does not sell digital goods inside
the app (sign-up and checkout are hidden in the app). Sign in with the demo account below.

Demo account (escort, Pro plan): [OWNER: email]  password: [OWNER: password]
Demo account (carrier): [OWNER: email]  password: [OWNER: password]

Users can delete their account in the app: menu > "Delete my account".

## Ready-made images (in docs/mobile-store/assets/)

- play-icon-512.png: Google Play app icon (512x512)
- play-feature-graphic-1024x500.png: Google Play feature graphic
- appstore-icon-1024.png: App Store icon (1024x1024, no transparency)
The app's own launcher icons and splash screens already use the same 3D logo.

## Screenshots needed

Phone portrait, at least 4 each (Play 1080x1920 or larger; App Store 6.7-inch 1290x2796 and 6.5-inch 1284x2778):
1. Bid board with loads
2. A load's details with the bid button
3. Escort dashboard (jobs, earnings)
4. Profile with verification badges
5. Post-a-load form (carrier)
The 512x512 icon and 1024x500 feature graphic for Play are ready (see above); phone screenshots still have to be taken from the app.

## Still needed from the owner

- Demo accounts for the reviewers (a Pro escort and a carrier) with a few sample loads on the boards.
- App Store: an iPhone project built on a Mac with Xcode (npx cap add ios), a Firebase/APNs key if native push is wanted.
- Native push notifications need a Firebase project and its google-services.json (the web push used on the site does not work inside the app).
- Apple often rejects apps that are only a website in a wrapper (guideline 4.2): the reviewer notes above, push alerts and the
  document/photo upload from the phone camera are the usual way through.
- Back up `android/oeh-release.keystore` privately (it is gitignored). Set `OEH_KEYSTORE_PASSWORD`, `OEH_KEY_PASSWORD`,
  and optional `OEH_KEYSTORE_PATH` / `OEH_KEY_ALIAS` in CI — never commit passwords. Turn on Play App Signing.

See also: [STORE_READINESS.md](./STORE_READINESS.md) for the prioritized A1 gap list.
