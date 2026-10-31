# Cursor brief: microphone for the OEH phone apps (Wraith voice)

**Hold until Apple has approved the current iOS build (1.0, build 5).** A new build restarts review. Android can go first if the owner says so.

## Goal
`/wraith` (the voice assistant page) should work by voice inside the Capacitor apps (`pevo.oversizeescorthub.app`). Today the apps declare no microphone permission, and the iPhone web view does not support the browser's speech recognition, so only the typed box works there.

## What to do
1. Android: add `RECORD_AUDIO` to `android/app/src/main/AndroidManifest.xml`. Check that the web view asks for it at runtime and that the page's `webkitSpeechRecognition` works on a real device. If not, use the Capacitor speech-recognition plugin and bridge it (see 3).
2. iOS: add `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription` to `ios/App/App/Info.plist`, with plain reasons ("to let you talk to the Wraith assistant"). The iOS web view cannot run `webkitSpeechRecognition`, so use the Capacitor speech-recognition plugin.
3. Bridge: in `components/wraith/WraithClient.tsx`, when `isNativeApp()` is true and the plugin is available, use the plugin for listening and keep the existing browser path otherwise. Keep the typed box. Do not change anything else on that page.
4. Version: bump the Android versionCode (the workflow uses the run number) and the iOS build number as the existing workflows do. Do not undo anything in `docs/mobile-store/IOS_RELEASE.md`'s build notes.

## Rules
- No prices and no buy or upgrade buttons inside the app. Wraith Pro is sold on the website only (`!inApp && canSubscribe` in the client). Do not add in-app purchase.
- Update the store privacy answers in `docs/mobile-store/` (new data type: audio is turned into text on the device or by the platform's speech service; the text goes to our server). Tell the owner what to change in App Store Connect and Play Console; do not submit anything yourself.
- Branch `cursor/app-microphone`. Do not push to `main`, do not open a pull request, do not deploy. Run `npx tsc --noEmit` and `npm run test:hostile` before every push; both must pass. Never put a key or password in a file.
- Report: what changed, the exact commands you ran, what you could not test (a real iPhone and a real Android phone are needed), and what the owner must do.
