# Mobile store readiness (updated 2026-10-25)

Package / bundle ID: `com.oversizeescorthub.app`. Stack: Capacitor 8 wrapping the live site (`capacitor.config.ts` `server.url`).

## Android (Google Play)

| Item | Status |
| --- | --- |
| Package id, launcher icons, splash | Done |
| Store copy, data-safety answers, review notes | Done, free-launch wording (`STORE_LISTING.md`) |
| Play icon 512, feature graphic 1024x500 | Done (`assets/`) |
| Phone screenshots | Taken 2026-10-25 (7 shots, 1080x1920); owner has the files |
| Privacy, terms, account deletion URLs | Live: `/privacy`, `/terms`, `/delete-account` |
| No in-app purchases; sign-up and checkout hidden in the app | Done (`lib/native.ts`) |
| Signing key | **Owner**: new key + 3 GitHub secrets (`SIGNING_KEY.md`). The old key was public: never use it |
| Play Console account, identity verification | **Owner** |
| Reviewer demo accounts | **Owner**: enter in the console; strong password, changed after approval |
| Build the bundle | Run the "Android release" workflow after the secrets exist |
| Closed test before production | Google has required a closed test (12 testers, 14 days) for new personal developer accounts: confirm the current rule in the Console |

Risks: Google can reject apps that are only a website in a wrapper (minimum functionality). Native push (needs Firebase and
`google-services.json`, then `POST_NOTIFICATIONS`) is the strongest mitigation and is not built yet.

## iPhone (App Store)

Not started. Needs a Mac with Xcode (`npx cap add ios`), the same bundle id, a privacy manifest, camera and photo-library
usage strings, and screenshots at 1290x2796 and 1284x2778. Apple guideline 4.2 (web wrapper) is a bigger risk than on Android.

## How to run the Play Console work

See [PLAY_CONSOLE_BRIEF.md](./PLAY_CONSOLE_BRIEF.md).
