# Android signing key

The repository is public, so the signing key is never stored in it. The release workflow reads it from GitHub repository secrets.

One-time setup (before the first Play Store upload):

1. Make a new key (needs Java; run anywhere, keep the file private and backed up):
   `keytool -genkeypair -v -keystore oeh-release.keystore -alias oeh -keyalg RSA -keysize 2048 -validity 10000`
2. Turn it into one line of text: PowerShell `[Convert]::ToBase64String([IO.File]::ReadAllBytes("oeh-release.keystore")) | Set-Clipboard`
3. In GitHub: repository Settings > Secrets and variables > Actions > New repository secret. Add:
   - `OEH_KEYSTORE_BASE64`: the text from step 2
   - `OEH_KEYSTORE_PASSWORD`: the keystore password you chose
   - `OEH_KEY_PASSWORD`: the key password you chose
   - `OEH_KEY_ALIAS`: `oeh` (optional, this is the default)
4. In Play Console, turn on Play App Signing for the app. Google then holds the real signing key, and this one is only the upload key (it can be reset if it is ever lost).
5. Run the "Android release" workflow.
