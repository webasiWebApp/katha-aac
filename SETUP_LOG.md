# Katha AAC — Phase 1, Step 0: Setup Log

Date: 2026-10-31. Scope: environment + file structure only. **No feature code was written.**
Project root: `D:\Drive D\jpura ICT document\research\katha-aac`

## 1. Environment check

| Tool           | Status      | Detail                                                                      |
| -------------- | ----------- | --------------------------------------------------------------------------- |
| Node           | OK          | v24.12.0                                                                    |
| npm            | OK          | 11.6.2 (pnpm 11.21.0 also present; npm was used)                            |
| Git            | OK          | 2.52.0                                                                      |
| JDK            | **PROBLEM** | JDK 26.0.1 only. React Native/Gradle needs **JDK 17**. `JAVA_HOME` not set. |
| Android SDK    | **MISSING** | No `ANDROID_HOME` / `ANDROID_SDK_ROOT`, no `%LOCALAPPDATA%\Android\Sdk`.    |
| adb / emulator | **MISSING** | Not on PATH.                                                                |

Nothing system-level was installed (you asked me to ask first). To fix:

1. Install **JDK 17** (e.g. Temurin 17) and set `JAVA_HOME` to it.
2. Install **Android Studio** (includes SDK, platform-tools, emulator). Create an AVD (Pixel, recent API level).
3. Set `ANDROID_HOME` to the SDK folder; add `platform-tools` and `emulator` to PATH.
4. Then: `npx expo run:android` (first run builds the native dev client).

## 2. Project creation

- `npx create-expo-app@latest katha-aac --template blank-typescript --no-install` → **Expo SDK 58** (expo ~58.0.22, RN 0.88.1, React 19.3.0, TypeScript ~6.0.3).
- Development-build setup: `expo-dev-client` installed + added to `app.json` plugins (not Expo Go).
- `App.tsx` and `index.ts` are exactly as generated (`git diff` empty).
- Application ID set in `app.json`: `android.package = "com.katha.aac"` (**placeholder**).

### Installed packages (versions resolved by `expo install` / npm)

Runtime: `@react-navigation/native` 7.5.1, `@react-navigation/native-stack` 7.21.0, `react-native-screens` 4.30.1, `react-native-safe-area-context` 5.10.1, `expo-sqlite` 58.0.15, `expo-speech` 58.0.3, `expo-dev-client` 58.0.18.
Dev: `jest` 30.5.2, `jest-expo` 58.0.13, `@types/jest` 30.0.0, `@testing-library/react-native` 14.1.0, `react-test-renderer` 19.3.0, `eslint` 9.39.5, `eslint-config-expo` 58.0.4, `eslint-plugin-boundaries` 7.4.0, `prettier` 3.9.10.

Notes:

- `react-test-renderer` had to be pinned to `19.3.0`: the unpinned install resolved 19.3.1, which needs `react@^19.3.1` and conflicted with the SDK's `react@19.3.0` (ERESOLVE).
- Not in your list, but needed: `eslint-config-expo` (Expo's ESLint preset). The TypeScript import resolver used by the boundaries rule (`eslint-import-resolver-typescript`) comes in **transitively** through it; I did not add it directly. If you drop `eslint-config-expo`, add it explicitly.
- `npm ls` shows `@emnapi/wasi-threads` and `tslib` as "extraneous" (left over from install resolution); harmless, I did not touch them.

## 3. Configuration (config only)

| File                              | What                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsconfig.json`                   | extends `expo/tsconfig.base`, `strict: true`, alias `@/*` → `./src/*` (no `baseUrl`; TS 6 deprecates it), `include` for ts/tsx + Expo types |
| `eslint.config.js`                | flat config: Expo preset + `eslint-plugin-boundaries` rule below                                                                            |
| `.prettierrc` / `.prettierignore` | single quotes, trailing commas, width 100                                                                                                   |
| `jest.config.js`                  | `jest-expo` preset, `@/` mapper, tests matched at `src/**/tests/**/*.test.{ts,tsx}`                                                         |
| `package.json` scripts            | `lint`, `typecheck`, `test` (`jest --passWithNoTests`), `format`, `format:check`                                                            |
| `.gitignore`                      | template's version + Gradle/APK/AAB/keystore/coverage/IDE entries                                                                           |

### The boundary rule (`boundaries/dependencies`, default `disallow`)

- **feature** → `core`, its **own** files, or **another feature's `index.ts`** only.
- **app** → `core` and any feature's `index.ts`.
- **core** → only core (cannot import features/app).
- Consequence: `reports/parent|therapist|teacher|history` are internal to the `reports` feature; other features reach them only through `reports/index.ts`.
- Same-feature imports are not checked by the plugin by default; an explicit allow-policy is included anyway.

## 4. Folders and empty files

Created exactly per spec: `src/app/{navigation,providers,registry}`, `src/core/{db,events,i18n,theme,ui,types}`, 15 feature folders + `reports` (with `parent/ therapist/ teacher/ history/`), each with `index.ts`, `feature.manifest.ts`, `README.md` (0 bytes) and `domain/ data/ ui/ tests/` (`.gitkeep`). Also `assets/{pictograms,audio,fonts}`, `docs/{plan,figma}`, `e2e/` (`.gitkeep`), and empty `CLAUDE.md`, `docs/README.md`, `docs/figma/frame-map.md`, `docs/plan/decisions.md`.
Check run: 40 `.ts` files under `src/`, 0 non-empty source/doc files. **No `export {};` was needed** (see §6).

## 5. Git

`git init` was **already done by the Expo template**, which also made a commit (`54f401f Initial commit`, 15 files — template files only). I did not commit anything; all my changes are uncommitted. If you wanted no commit at all, this one came from `create-expo-app`.

## 6. Verification (all actually run)

| Check                            | Result                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit`                   | exit 0 — empty `.ts` files caused no errors                                                                                           |
| `eslint .`                       | exit 0, no warnings (after removing BOMs my PowerShell wrote into configs)                                                            |
| `prettier --check .`             | all files pass                                                                                                                        |
| `jest --passWithNoTests`         | "No tests found", exit 0 (no tests exist yet; this is not a passing test run)                                                         |
| Boundary rule                    | Proved with temporary files (since deleted): `board` → `audio/domain/…` **errored**; `board` → `@/features/audio` (index) was allowed |
| `expo-doctor`                    | 20/20 checks passed                                                                                                                   |
| `expo export --platform android` | JS bundle built (616 modules)                                                                                                         |

## 7. Not done / could not verify

- **The app was NOT launched on an Android emulator or device** — no Android SDK/emulator/JDK 17 here. "Template screen opens" is unverified; only the JS bundle compiling is verified.
- No native build (`expo run:android`) was attempted.
- No tests were written (out of scope).

## 8. Placeholders to change

- `app.json` → `expo.android.package`: `com.katha.aac`. Note: no iOS bundle identifier is set (Android first).
- `app.json` `name`/`slug`: `katha-aac`.
- Template leftovers I did not author or change: `LICENSE`, `AGENTS.md`, `.claude/settings.json`, default icons in `assets/`. Note `AGENTS.md` says to use Expo Router, which conflicts with your React Navigation + `src/app/` layout; the root `CLAUDE.md` is empty per your spec, so you may want to reconcile them.
