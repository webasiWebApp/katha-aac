# Katha AAC — Issue list (T-174)

Ranked Critical / High / Medium / Low. Source: failed checks, design differences, assumptions, blockers.
Date: 2026-11-08. "NOT RUN" items are listed in `docs/DEVICE_CHECKLIST.md`.

## Critical

None known. Nothing was verified on a physical tablet, so the Critical risks below are unverified rather than known-failing.

| ID | Area | Issue |
| --- | --- | --- |
| C-1 | Device | The whole build has been tested only in Jest (JS) and by type check. No device or emulator run happened. Sinhala shaping, touch, audio playback, the system voice, immersive mode, the two-finger gate, SQLCipher on device and PDF export are all unverified (T-009, T-031, T-081, T-141, T-161 to T-165, T-171). |

## High

| ID | Area | Issue |
| --- | --- | --- |
| H-1 | Permissions | The generated `android/` folder (untracked) still contained INTERNET, RECORD_AUDIO and SYSTEM_ALERT_WINDOW. Fixed in `app.json` (`blockedPermissions`) and in the local manifest, but the merged release manifest must be checked after `expo prebuild --clean` and a release build (T-162). |
| H-2 | Native APIs | `expo-audio`, `expo-speech`, `expo-print`, `expo-sharing`, `expo-file-system/legacy` (SAF), `expo-keep-awake` and `expo-navigation-bar` calls are written to the documented APIs and type-checked only. |
| H-3 | Vocabulary | Seed vocabulary labels, the want-word spelling and the template are drafts (H-02). No recordings exist (H-03), so on a tablet without a Sinhala voice the child hears nothing (unsupported state, adult dot only). |
| H-4 | Design | Replay pictogram does not exist (H-05). The Replay key uses the `back` pictogram as a placeholder. |
| H-5 | Design | Screens OB-1..5, AH-1, SS-1, RS-1, TagSheet, GL-1/2, ST-1..4 are built from existing components without Figma designs (H-05). |

## Medium

| ID | Area | Issue |
| --- | --- | --- |
| M-1 | Spec | D-14: OT report shows time to first tap, Parent report omits breakdowns. This differs from the Final Report and needs H-07 review. |
| M-2 | Spec | The spec text "Add progress" (GL-2) conflicts with the wording guard (banned word "progress" except in "Goals and progress"). Built as "Add an entry". |
| M-3 | Dashboard | For non-parent roles the dashboard shows only the overview measures that role's report definition contains (for example an educator sees sessions only). The spec lists four measures for everyone. |
| M-4 | Reports | "Custom" in the period picker has no designed date picker. It is treated as the last 90 days. |
| M-5 | Planning ideas | PI-P1 uses the used words' categories from `words_used`; the report shows `{thing1}`, `{thing2}` as the two most used thing-category words. |
| M-6 | Code | `scripts/gen-audio-index.js` is JavaScript (spec said `.ts`; no ts runner is installed). |
| M-7 | Settings | `settings` table uses `(key, value)` from the earlier T-012 bootstrap, not `(key, value_json, updated_at)` as in 6.1. Behaviour is unchanged. |
| M-8 | Lint | React Compiler advisory rules (`react-hooks/refs`, `purity`, `set-state-in-effect`) are switched off for four files that keep "latest value" refs and timers (listed in `eslint.config.js`). |
| M-9 | Feature folders | Legacy folders from an earlier plan (`insights`, `live-monitor`, `recommendations`, `routines`, `study-mode`, `reports/teacher`, `reports/therapist`) remain in the tree, unused and not in the registry. They were left alone because deleting them was not requested. |
| M-10 | Licences | `assets/licences.json` (from `license-checker`) is not generated; About shows a note only. |

## Low

| ID | Area | Issue |
| --- | --- | --- |
| L-1 | Persistence test | T-054 restart is simulated by re-running migrations on the same in-memory DB, not by closing and reopening an encrypted file. |
| L-2 | Performance | T-128 measured only in Jest (25 ms for 30 days of 365 x 3 sessions x 40 events). Tablet timing not measured. |
| L-3 | Icons | T-043: existing assets accepted (45 pictograms present, icons are code paths); no new Figma export was run. |
| L-4 | Project | `gradle_build.log`, deleted `hs_err_pid*.log` and `replay_pid*.log` were already in the working tree before this work. |
