# Katha AAC

A communication board (AAC) for one child on one Android tablet, with role-based reports for the adults who support them. Everything stays on the device; reports leave only as PDF files after consent. Sinhala child labels and speech; English adult UI.

Status: all tasks T-001 to T-184 built or documented. See `docs/TASKS_STATUS.md` (what ran and what is `NOT RUN (needs device)`), `docs/ISSUES.md` and `docs/BLOCKERS.md`.

## Setup

Requirements: Node LTS, JDK 17, Android Studio (SDK + emulator or a tablet), and optionally the Maestro CLI.

```bash
npm ci
npm run gen:audio        # regenerates assets/audio/index.ts (also runs before builds)
```

This is an Expo development build (not Expo Go) because of SQLCipher and other native modules:

```bash
npx expo prebuild --clean   # regenerates android/ from app.json (blocks INTERNET, RECORD_AUDIO, SYSTEM_ALERT_WINDOW)
npx expo run:android        # builds and installs the development build on a device or emulator
npx expo start --dev-client # JS server for the development build
```

First launch walks through onboarding: guardian PIN, fictional learner (`Demo Learner`, code `P-07`), consent, device check. Never enter a real child's data until H-06 (ethics approval) is done.

## Test

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint (includes module-boundary rules)
npm test              # Jest (about 3 minutes)
npm run check         # all three
npm run e2e           # Maestro flows in e2e/ (needs emulator or tablet; not run in CI)
```

Reference values for the analytics engine are tested in `src/features/analytics/tests/referenceDataset.test.ts` against section 7.3 of `tasklist.md`.

## Demonstration data

Settings > "Reset demonstration data" (guardian PIN, fictional learner only) replaces all records with 9 sessions over the last 7 days and 83 messages with observations, so the four reports show unlocked content. It is labelled "Sample data" in every report and PDF.

## Build

```bash
npx eas-cli build --platform android --profile preview      # APK for internal testing
npx eas-cli build --platform android --profile production   # AAB for Google Play
npx expo run:android --variant release                      # local fallback
```

Signing keys are never committed. See `docs/RELEASE.md`.

## Where things are

See `docs/ARCHITECTURE.md` for the module map, data flow, how to add a role report and how to ship a new vocabulary version. Definitions of every number in a report: `docs/DEFINITIONS.md`.
