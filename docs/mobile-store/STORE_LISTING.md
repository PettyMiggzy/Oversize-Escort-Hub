# Oversize Escort Hub: app store listing kit

Everything the Google Play Console and App Store Connect forms ask for, written from what the app really does.
Values in [BRACKETS] are things only the owner can supply.

## Identity

- App name: Oversize Escort Hub
- Android package and iPhone bundle ID: pevo.oversizeescorthub.app (same for both, owner's choice 2026-10-26)
- Category: Business (second choice: Maps & Navigation is NOT right, there is no navigation)
- Support email: support@oversize-escort-hub.com
- Website: https://www.oversize-escort-hub.com
- Privacy policy URL: https://www.oversize-escort-hub.com/privacy
- Terms URL: https://www.oversize-escort-hub.com/terms
- Account deletion URL (Google asks for this): https://www.oversize-escort-hub.com/delete-account
- Contact phone for the stores: [OWNER]

## Short description (Google Play, 80 characters)

Free load board for pilot car jobs and oversize loads.

## Subtitle (App Store, 30 characters)

Pilot car jobs & loads

## Full description

Oversize Escort Hub is a load board that connects oversize-load carriers with pilot car (escort) drivers. Everything is free while we launch.

FOR PILOT CAR DRIVERS
- Browse flat-rate, open-bid and 5-minute bid boards
- Get email and in-app alerts for new loads in the states you cover
- Place bids or claim loads and get matched with the carrier
- Build a profile with your states, vehicle and the documents you choose to show
- Use the Deadhead Minimizer to find return loads near your drop-off, plus the weather tools
- Track jobs, mileage and expenses, and send invoices

FOR CARRIERS AND BROKERS
- Post a load in minutes and receive bids from pilot car drivers
- Accept the bid you want; contact details are shared after a match

FOR FLEETS
- Manage several drivers in one account

No commissions and no job fees. We do not check or verify anyone's licences, certificates, insurance or background: profiles show what drivers tell us, so always confirm details yourself before you hire or accept a job. Accounts are created on our website.

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
| Files and docs (insurance, certificates the escort chooses to upload) | Yes (optional) | Only if the escort switches them on for their public profile | Profile; we do not review or verify them |
| Approximate/precise location | Only on the weather page, when the user taps it, and not stored | No | Weather |
| User-generated content (loads, bids, jobs, reviews) | Yes | With other users | App functionality |
| Purchase history | Yes (website add-ons such as sponsored zones; card details stay with Stripe) | Stripe | Purchases on the website |
| App activity / diagnostics | Yes (Vercel Analytics, page views) | Vercel | Analytics |
| Device or other IDs | Yes (push token) | No | Notifications |

Third-party services that process data: Supabase (database and login), Stripe (payments), Resend (email), Vercel (hosting and analytics).
Text messages (SMS) are NOT active yet; do not declare SMS data until they are switched on.

## Apple: App Privacy labels

Data linked to the user: Name, Email, Phone Number, Photos, Other User Content, Purchase History (plan), Identifiers
(user ID, push token), Usage Data (analytics). Data used to track the user across other companies' apps: None.

## Content rating

No violence, no sexual content, no gambling, no user-to-user chat, no user-visible location sharing.
Expected: Apple 4+, Google "Everyone".

## App Review notes (paste into App Store Connect "Notes" and Play "App access")

Oversize Escort Hub is a marketplace for pilot car escorts and oversize-load carriers. Everything is free while we launch.
Accounts are created on our website, so the app sells nothing inside the app (sign-up and checkout are hidden in the app).
Sign in with a demo account below. The owner supplies the credentials in the store console only: never write them in this repository.

Demo account (escort): [OWNER: enter in the console]
Demo account (carrier): [OWNER: enter in the console]

Users can delete their account at https://www.oversize-escort-hub.com/delete-account.

## Ready-made images (in docs/mobile-store/assets/)

- play-icon-512.png: Google Play app icon (512x512)
- play-feature-graphic-1024x500.png: Google Play feature graphic
- appstore-icon-1024.png: App Store icon (1024x1024, no transparency)
The app's own launcher icons and splash screens already use the same 3D logo.

## Screenshots

- Google Play phone (1080x1920, aspect 9:16; Play rejects anything taller than 2:1, so do NOT use the iPhone files): `assets/play-phone-1080x1920/` (home, beginner guide, post a load, how it works). Never use the find-escorts page (real names).
- App Store iPhone 6.9-inch: `assets/appstore-iphone-6.9/`. App Store iPad 13-inch: `assets/appstore-ipad-13/`.
- Google Play tablet screenshots are optional: skip.

## Still needed from the owner

- Android: signing secrets are set and the bundle is built (see CLAUDE.md "Android build WORKS"); create the Play app for `pevo.oversizeescorthub.app`, fill this listing, upload the bundle to a closed test.
- Reviewer demo accounts are in CLAUDE.md (emails only; the passwords were given to the owner in chat). Enter them in the store consoles; change them after approval.
- Native push needs a Firebase project and its google-services.json (the web push on the site does not work inside the app). Waiting.
- Apple and Google can both reject an app that is only a website in a wrapper (4.2 / minimum functionality). Native push and phone-camera document upload are the usual way through.

See also: [STORE_READINESS.md](./STORE_READINESS.md) and [IOS_RELEASE.md](./IOS_RELEASE.md).
