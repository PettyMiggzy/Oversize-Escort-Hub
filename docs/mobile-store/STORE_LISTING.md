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

Oversize Escort Hub is the load board for oversize-load carriers and certified pilot car (P/EVO) escorts. Everything is free while we launch.

FOR ESCORTS
- Browse flat-rate, open-bid and 5-minute bid boards for escort jobs
- Get email and in-app alerts for new loads in the states you cover
- Place bids or claim loads and get matched with the carrier
- Show your certifications, background check and vehicle verification on your profile
- Use the Deadhead Minimizer to find return loads near your drop-off, plus the weather tools
- Track jobs, mileage and expenses, and send invoices

FOR CARRIERS AND BROKERS
- Post a load in minutes and receive bids from escorts
- Review each escort's certifications, verification level and ratings
- Accept the bid you want; contact details are shared after a match

FOR FLEETS
- Manage several escorts in one account

TRUST
- Verification steps: P/EVO certificate, vehicle, background check and admin review
- Reviews after every job

No commissions and no job fees. Accounts are created on our website.

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

Seven phone screenshots (1080x1920) were taken from the live site on 2026-10-25: home, role cards, create account, how it works,
free pricing, post a load, dashboard. Retake after loads exist to add the bid board and a load's details.
App Store sizes (1290x2796 and 1284x2778) are needed only when the iPhone project exists.

## Still needed from the owner

- A new Android signing key and the GitHub secrets: see [SIGNING_KEY.md](./SIGNING_KEY.md). The old key was public and must never be used.
- Reviewer demo accounts (an escort and a carrier) entered in the store console, with a strong password changed after approval.
- App Store: an iPhone project built on a Mac with Xcode (npx cap add ios), and a Firebase/APNs key if native push is wanted.
- Native push needs a Firebase project and its google-services.json (the web push on the site does not work inside the app).
- Apple often rejects apps that are only a website in a wrapper (guideline 4.2); Google can too (minimum functionality).
  Native push and phone-camera document upload are the usual way through.

See also: [STORE_READINESS.md](./STORE_READINESS.md) for the prioritized A1 gap list.
