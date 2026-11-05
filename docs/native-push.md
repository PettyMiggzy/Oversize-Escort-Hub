# Phone push notifications (iPhone and Android)

State on 2026-11-05: the server side is built and tested but does nothing until the keys below are set. Nothing is sent, and the apps do not ask for permission yet.

## What is built
- `device_tokens` table (applied in production): each phone's token, one row per phone.
- `POST /api/push/device` and `DELETE`: the app saves or removes its phone token (signed-in people only).
- `lib/native-push.ts`: sends to Apple (iPhone) and Google (Android). Used by every alert that already sends a browser push, so new-load, urgent, regulars and bid alerts reach phones with no other change.
- `components/NativePushRegister.tsx`: inside the apps, after `NEXT_PUBLIC_NATIVE_PUSH=on`, asks permission and registers the phone.
- `@capacitor/push-notifications` is installed. The next release build of each app includes it.

## What the owner must do
### iPhone (Apple)
1. developer.apple.com, Certificates, Identifiers and Profiles, Keys: create a key with "Apple Push Notifications service (APNs)". Download the `.p8` file once. Note the Key ID.
2. Identifiers: open the app id `pevo.oversizeescorthub.app` and turn on Push Notifications.
3. Vercel settings (never in chat): `APNS_KEY_ID`, `APNS_TEAM_ID` (H2V9CCFXLT), `APNS_KEY_P8` (the whole file text; line breaks may be written as \n), `APNS_BUNDLE_ID` (pevo.oversizeescorthub.app).
### Android (Google)
1. firebase.google.com: create a project, add an Android app with the id `pevo.oversizeescorthub.app`, download `google-services.json`.
2. Project settings, Service accounts, Generate new private key. Put the whole JSON in Vercel as `FCM_SERVICE_ACCOUNT_JSON` (never in chat or the repo).
### Then
3. Tell Jarvis: the native files are added (iOS push entitlement and background mode, Android `google-services.json` and the Google services plugin), the apps are rebuilt by the release workflows, and each store gets the update.
4. After the new builds are out, set `NEXT_PUBLIC_NATIVE_PUSH=on` in Vercel and redeploy. Phones ask for permission when a signed-in person opens the app.

## What stays off until then
- No permission prompt appears in the apps.
- Old app versions ignore all of this.
- Web push in browsers is unchanged.

## Not tested live
The sending code is tested with fake transports. Apple and Google have not been called, because the keys do not exist yet.
