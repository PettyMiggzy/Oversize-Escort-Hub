# Mobile store readiness (updated 2026-10-25)

Android package: `pevo.oversizeescorthub.app`. iPhone bundle ID: `pevo.oversizeescorthub.app`. Stack: Capacitor 8 wrapping the live site (`capacitor.config.ts` `server.url`).

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

iOS project added 2026-10-26 (`ios/`, Capacitor 8, Swift Package Manager, iOS 15+). Built by the "iOS release" GitHub workflow on a Mac runner and uploaded to
App Store Connect; steps, listing text and privacy answers are in [IOS_RELEASE.md](./IOS_RELEASE.md). Not yet built on a real Mac runner: the first workflow run is the first real test.
Waiting on the owner: App Store Connect app record, API key and four GitHub secrets, reviewer accounts, screenshots. Guideline 4.2 (web wrapper) is the main rejection risk.

## How to run the Play Console work

See [PLAY_CONSOLE_BRIEF.md](./PLAY_CONSOLE_BRIEF.md).
