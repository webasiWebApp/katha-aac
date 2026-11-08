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

TODO(human): Generate keystore; store securely outside the repository. Do not commit any `.jks` or `.keystore` file.

## Google Play Console

TODO(human): H-08 — Project lead sets up Play Console account.

## Release checklist

- [ ] Version number bumped in `app.json`
- [ ] Vocabulary version updated if changed
- [ ] `npm run check` passes
- [ ] All Maestro flows pass on emulator
- [ ] Device checklist complete
- [ ] Privacy policy contact details filled in
- [ ] Play Data safety form completed
