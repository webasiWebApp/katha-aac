# Katha AAC — Release

## Build commands

```bash
# Development build (APK, on-device testing)
bunx eas-cli build --platform android --profile development

# Preview build (APK, internal testing)
bunx eas-cli build --platform android --profile preview

# Production build (AAB, Google Play)
bunx eas-cli build --platform android --profile production

# Local fallback (requires Android Studio / SDK)
npx expo run:android --variant release
```

## EAS profiles (eas.json)

- `development`: developmentClient, APK output
- `preview`: APK, internal distribution
- `production`: AAB, versionCode auto-incremented

## Android application ID

`com.katha.aac` (placeholder — TODO(human): confirm with project lead before first Play store submission)

## Signing

TODO(human): H-08 generates the real upload keystore and keeps it outside the repository (two copies, with the project lead). Do not commit any `.jks` or `.keystore` file (`.gitignore` already blocks `*.jks`).

Local release builds are signed by the config plugin `plugins/withReleaseSigning.js` (listed in `app.json`, so it survives `expo prebuild --clean`). It reads four values from `~/.gradle/gradle.properties` or the environment:

| Name | Value |
| --- | --- |
| `KATHA_UPLOAD_STORE_FILE` | absolute path to the upload keystore |
| `KATHA_UPLOAD_STORE_PASSWORD` | keystore password |
| `KATHA_UPLOAD_KEY_ALIAS` | key alias |
| `KATHA_UPLOAD_KEY_PASSWORD` | key password |

```bash
npx expo prebuild --platform android
cd android && ./gradlew bundleRelease     # AAB for Play: app/build/outputs/bundle/release/app-release.aab
./gradlew assembleRelease                 # APK for the tablet: app/build/outputs/apk/release/app-release.apk
```

If `KATHA_UPLOAD_STORE_FILE` is not set, the release falls back to the debug key and Gradle prints `Katha AAC: KATHA_UPLOAD_STORE_FILE is not set; release is signed with the DEBUG key. Do not upload this build.` EAS builds ignore this and use EAS-managed credentials.

On Windows, if AAPT2 fails with "Daemon startup failed", run `./gradlew --stop` and build again with `--max-workers=4`.

## Google Play Console

TODO(human): H-08 — Project lead sets up Play Console account.

## Keystore handling (T-181)

- EAS builds: let EAS manage the credentials (`npx eas-cli credentials`) or upload your own keystore; EAS stores it, nothing goes in git.
- Local signed release (fallback): generate a keystore outside the repository, for example `keytool -genkeypair -v -keystore ~/katha-upload.jks -alias katha -keyalg RSA -keysize 2048 -validity 10000`. Put the path and passwords in `~/.gradle/gradle.properties` (`KATHA_UPLOAD_STORE_FILE`, `KATHA_UPLOAD_STORE_PASSWORD`, `KATHA_UPLOAD_KEY_ALIAS`, `KATHA_UPLOAD_KEY_PASSWORD`) and reference them from the release signing config. Never commit `.jks`, `.keystore`, `credentials.json` or `gradle.properties` containing passwords.
- Keep two copies of the keystore with the project lead (H-08) and enable Play App Signing.

## Version and identity (T-180)

Version 1.0.0, versionCode 1 (`app.json`). The icon, adaptive icon and splash in `assets/` are placeholders; the designer replaces them (H-05). About (Settings) shows the app version, schema version (`v1`) and vocabulary version.

## Before building

1. `npx expo prebuild --clean` so `android/` is regenerated from `app.json` (this applies `blockedPermissions`).
2. `npm run check`.
3. Build: `npx eas-cli build --platform android --profile production` (AAB) or `--profile preview` (APK for the tablet).
4. Inspect the merged manifest of the release build: it must contain no INTERNET permission and `allowBackup="false"` (for example `./gradlew :app:processReleaseMainManifest` then open `app/build/intermediates/merged_manifest/release/.../AndroidManifest.xml`).

## Google Play data safety answers (draft, confirm with H-08 and H-06)

- Does your app collect or share any of the required user data types? **No.** All data stays on the device; nothing is sent to the developer or to third parties.
- Is all of the user data collected by your app encrypted in transit? Not applicable (no data in transit).
- Do you provide a way for users to request that their data is deleted? Yes, in the app (Settings > Data and retention, Privacy and consent > Delete all records, guardian PIN).
- Permissions declared: none beyond what Android adds for audio playback (see merged manifest).
- Privacy policy URL: TODO(human) host `docs/PRIVACY.md` (with contact details) at a public URL.
- Content rating, target audience (children): TODO(human) answer with the supervisor; the app is operated by adults.

## Internal testing upload (steps for the human)

1. In Play Console create the app "Katha AAC", package `com.katha.aac` (TODO(human): confirm the package name).
2. Testing > Internal testing > Create release, upload the AAB from EAS.
3. Add testers (email list), save, roll out, share the opt-in link.
4. Complete the Data safety, App content and Store listing sections before moving past internal testing.
5. Install on the tablet from the opt-in link, then run `docs/DEVICE_CHECKLIST.md`.

## Release checklist

- [ ] Version number bumped in `app.json`
- [ ] Vocabulary version updated if changed
- [ ] `npm run check` passes
- [ ] All Maestro flows pass on emulator
- [ ] Device checklist complete
- [ ] Privacy policy contact details filled in
- [ ] Play Data safety form completed
