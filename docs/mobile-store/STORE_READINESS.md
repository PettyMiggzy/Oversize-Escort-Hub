# Mobile store readiness (A1 assessment)

Assessed for Apple App Store + Google Play submission. **Do not submit until blockers below are cleared.**
No store upload is performed by this workstream.

Package / bundle ID: `com.oversizeescorthub.app`  
App name: Oversize Escort Hub  
Stack: Capacitor 8 → live site (`capacitor.config.ts` `server.url`)

---

## P0 — Blockers (cannot ship)

| Item | Status | Notes |
| --- | --- | --- |
| **iOS project** | Missing | No `ios/` directory. Owner must run `npx cap add ios` on a Mac with Xcode, then set the same bundle ID. |
| **Release keystore** | Owner's call: kept in repo | The owner chose to keep the signing keystore in the repo so the GitHub "Android release" workflow can sign without secrets. Enable Play App Signing and keep a private backup of `android/oeh-release.keystore`. To move to secrets later, switch `android/app/build.gradle` to the `OEH_KEYSTORE_*` env variables and add them as repository secrets. |
| **Phone screenshots** | Missing | Listing kit lists 4–5 required shots; none checked in under `docs/mobile-store/assets/`. |
| **Demo / App Review accounts** | Owner | Needed in `STORE_LISTING.md` brackets for reviewers. |
| **Apple 4.2 (web wrapper)** | Risk | App loads the website in a WebView. Mitigations already documented: no IAP (signup/checkout blocked in native via `lib/native.ts`), account deletion URL, review notes. Native push / camera upload still recommended before iOS submit. |

## P1 — Should fix before submit

| Item | Status | Notes |
| --- | --- | --- |
| **Native push (FCM / APNs)** | Missing | No `google-services.json`; web-push does not work inside Capacitor. Documented in listing kit. |
| **Android `POST_NOTIFICATIONS`** | Not declared | Add when native push lands (Android 13+). Currently only `INTERNET` in `AndroidManifest.xml`. |
| **Camera / photo library usage strings (iOS)** | N/A until iOS | Need `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` when cert upload uses the camera. |
| **Privacy Manifest (iOS)** | N/A until iOS | Add `PrivacyInfo.xcprivacy` when the Xcode project exists. |
| **versionCode / versionName** | Present, defaults low | `versionCode`/`versionName` injectable via gradle properties (defaults `1` / `1.0`). Bump every Play upload. |
| **package.json version** | `0.1.0` | Align with store `versionName` when cutting a release. |

## P2 — Already in good shape

| Item | Status |
| --- | --- |
| Android package / applicationId | `com.oversizeescorthub.app` |
| Launcher icons (mdpi→xxxhdpi + adaptive) | Present under `android/app/src/main/res/mipmap-*` |
| Splash drawables | Present (port + land densities) |
| Store listing copy + data safety answers | `docs/mobile-store/STORE_LISTING.md` |
| Play icon 512, feature graphic, App Store 1024 icon | `docs/mobile-store/assets/` |
| Privacy / Terms / delete-account URLs | Live web routes; linked in listing kit |
| In-app IAP avoidance | `lib/native.ts` + signin/pricing blocks |
| Offline fallback page | `mobile-fallback/index.html` |
| targetSdk 36 / minSdk 24 | `android/variables.gradle` |

## Owner checklist (not done by agents)

1. Back up keystore + set `OEH_KEYSTORE_PASSWORD`, `OEH_KEY_PASSWORD` (and optional path/alias) in CI secrets.
2. Enable Google Play App Signing.
3. Create iOS project on Mac; archive with matching bundle ID.
4. Capture phone screenshots; fill demo accounts in listing kit.
5. Optional: Firebase + APNs for native push before iOS review.

## SEO (verified — largely already done)

See chat / PR notes: meta, Open Graph, Twitter, JSON-LD, `app/robots.ts`, `app/sitemap.ts`, `public/og-image.png` were already implemented. Only a **broken sitewide homepage canonical** in `app/layout.tsx` was corrected so secondary pages are not forced to canonicalize to `/`.
