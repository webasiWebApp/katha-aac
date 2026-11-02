# Katha AAC: production build task list

Version 1.0 · written 2 Nov 2026 · for execution by Claude Code

This file is the single source of truth for building the Katha AAC mobile app. Every design and engineering decision has already been made below. Your job is to execute the tasks in order, exactly as written.

---

## 0. Instructions for the executing model (read fully before any task)

1. **Do not redesign, re-plan or improve the architecture.** Follow this file literally. If a task names a file, a function, a column or a value, use exactly that name and value.
2. **Work strictly in task order** (T-001, T-002, ...). Do not start a task until all its "Depends on" tasks are done.
3. **One task at a time.** For each task: do the steps, run the acceptance checks, then tick the task in `docs/TASKS_STATUS.md` with the date and a one-line note.
4. **Acceptance checks are mandatory.** If a check fails, fix it before moving on. Never tick a task whose checks you did not run.
5. **Blockers.** If something in this file cannot be done (a library cannot do what is stated, a Figma node is missing, a device test is impossible here), add an entry to `docs/BLOCKERS.md` with: task ID, what you tried, the exact error, and two options. Then **stop and ask the human**. Do not invent a workaround that changes behaviour.
6. **STOP markers.** When you reach a line `STOP: human review`, stop, summarise what was built since the last stop, list anything unverified, and wait.
7. **Never claim something works unless you ran it.** If a check needs a physical tablet and you have none, mark it `NOT RUN (needs device)` in the status file.
8. **Do not commit to git unless the human asks.** Do not add libraries not listed in section 2. Do not add analytics, crash reporting or network calls of any kind.
9. **Design source.** Figma file key `BSdU6Kx1eleNNAgaHENd23` (Katha AAC UI v2). If Figma MCP tools are available, use `get_screenshot` to compare and `get_design_context` only after loading the Figma design-to-code workflow. If they are not available, use the specs in sections 5 and 9 of this file, which are complete enough to build from.
10. **Data.** During development, use only the fictional learner "Demo Learner", participant code `P-07`. Never enter a real child's data.
11. **Language in the UI.** Never write UI text that claims improvement, plateau, therapy effectiveness or a diagnosis. Use only the strings given in this file for report wording.
12. **Human tasks** (prefixed `H-`) are listed in section 12. They are done by people, not by you. Where a task depends on one, use the placeholder named in the task and continue.

---

## 1. Product summary

Katha AAC is an Android tablet app for autistic children who communicate in Sinhala. It has two parts:

- **Child view (AAC):** a fixed board of picture symbols. The child taps symbols to build a short Sinhala sentence and the tablet speaks it. Core keys stay in the same place on every page.
- **Facilitator area (adults only):** behind a hidden gesture and a role PIN. It records what the child communicated and generates **one report adapted for four readers**: Parent or Caregiver, Speech-Language Pathologist (SLP), Educator and school staff, Occupational Therapist (OT). The facts are the same; a role changes which measures appear, their order and their wording.

Everything runs offline on one device. There is no server, no account and no network use.

**Removed and never to be built:** context awareness, personalization, prediction, suggestion strips, automatic routines, study modes or experimental conditions, live monitoring on a second device, AI-generated text, cloud sync.

---

## 1A. Decisions already taken

These close every open question from the planning. Do not revisit them. Each has an ID so the human can change one later.

| ID | Decision |
| --- | --- |
| D-01 | Data lives on one Android tablet (Option A). Reports leave the device only as PDF files after consent. No file-transfer or cloud sync in this build. |
| D-02 | Platform: Android tablets, 10 inch class, landscape. The app also runs on phones in portrait for the adult area, but the child view requires a tablet (min shortest side 600 dp); on a phone, Child mode shows a "Use a tablet for child mode" message. |
| D-03 | Roles: `parent`, `slp`, `educator`, `ot`. The `parent` role is the guardian and the only role that can change consent, permissions, PINs of other roles, and delete data. |
| D-04 | Each role has a 4-digit PIN, stored as a salted hash in secure storage. 5 wrong attempts lock sign-in for 60 seconds. A wrong PIN never shows the reason. |
| D-05 | Child board grid sizes: 3x4 (default), 4x5, 5x6, set per learner by an adult. Cells are sized to fill the grid area; minimum cell 72x72 dp. |
| D-06 | Vocabulary is content, not code: one versioned JSON file with pages, symbols, templates and stored phrases. No in-app editor. Adding words means shipping a new vocabulary version. |
| D-07 | Messages are ordered symbol sequences. Templates are optional helpers: tapping a template trigger symbol (the want symbol) shows the template "මට ___ ඕනේ" with one open slot. Free sequences are also allowed. |
| D-08 | Speaking a message: (1) if a recorded clip exists for the exact symbol sequence, play it; (2) else if a Sinhala text-to-speech voice is installed, speak the text; (3) else show the "unsupported" state. Single words follow the same order using word clips. |
| D-09 | Replay button sits between Undo and Speak. Message row order (right-handed): MessageBar (fills), Clear 96, Undo 96, Replay 96, Speak 136. Left-handed mirrors the row and the core key row. |
| D-10 | The spoken message stays in the message bar until the next symbol tap, which starts a new draft. |
| D-11 | Adult observations are entered **after** the session, never during it, except the low-salience "Meant this?" chip shown for 6 seconds after each spoken message. A "Review session" screen lists the session's messages for tagging (function, prompting level, breakdown) and asks for the session's observed opportunities and independent starts. |
| D-12 | Prompting levels: `independent`, `gesture`, `verbal`, `model`, `physical`. "Prompted" means any level except `independent`. |
| D-13 | Session setting is chosen by an adult when starting child mode: `home`, `school`, `therapy`, `unknown` (default `unknown`). "In class" means setting `school`. Never inferred from time. |
| D-14 | Role report content follows the Figma v2 screens: the OT report shows selection time; the Parent report does not show breakdowns. (This differs from the Final Report and is flagged for review in H-07.) |
| D-15 | Rates, comparisons with the previous period and planning ideas need at least 5 sessions in the selected period. Counts and lists show from the first session. |
| D-16 | The database is encrypted at rest with SQLCipher. The key is random, generated on first launch and kept in secure storage. |
| D-17 | Child mode: screen kept awake, system bars hidden (immersive), Android back button blocked, leaving only via the adult gate. The app shows adults how to turn on Android screen pinning; it does not force kiosk mode. |
| D-18 | Adult UI language is English. Child labels and spoken text are Sinhala from the vocabulary file. All strings live in `src/core/i18n/en.ts` so Sinhala adult UI can be added later. |
| D-19 | Errors are logged locally to an `error_log` table (no learner content) and can be exported by the `parent` role from Settings > About. No remote logging. |
| D-20 | Data retention: keep all records until deleted. The `parent` role can delete everything, or delete records older than 6, 12 or 24 months. |

---

## 2. Tech stack (fixed)

Use `npx expo install <pkg>` for every Expo-compatible package so versions match the SDK. Do not pin versions by hand.

| Purpose | Package |
| --- | --- |
| App framework | Expo (latest stable SDK), React Native, TypeScript strict, development build (not Expo Go) |
| Navigation | `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context` |
| Gestures and animation | `react-native-gesture-handler`, `react-native-reanimated` |
| State | `zustand` |
| Database | `expo-sqlite` with SQLCipher enabled through its config plugin |
| IDs, hashing | `expo-crypto` |
| Secure storage | `expo-secure-store` |
| Audio playback | `expo-audio` |
| Text-to-speech | `expo-speech` |
| Fonts | `expo-font`, `@expo-google-fonts/noto-sans`, `@expo-google-fonts/noto-sans-sinhala` |
| SVG | `react-native-svg`, `react-native-svg-transformer` (dev) |
| PDF and sharing | `expo-print`, `expo-sharing`, `expo-file-system` |
| Device behaviour | `expo-keep-awake`, `expo-navigation-bar`, `expo-status-bar`, `expo-screen-orientation`, `expo-localization` |
| Unit tests | `jest-expo`, `jest`, `@testing-library/react-native` |
| End-to-end tests | Maestro (CLI, YAML flows in `e2e/`) |
| Lint and format | `eslint`, `eslint-config-expo`, `eslint-plugin-boundaries`, `prettier`, `eslint-config-prettier` |
| Builds | EAS Build (`eas.json`), with local `npx expo run:android` as fallback |
| CI | GitHub Actions |

If `@expo-google-fonts/noto-sans-sinhala` does not exist, download Noto Sans Sinhala (Regular, Medium, SemiBold) from Google Fonts into `assets/fonts/` and load with `expo-font`. Record which you used.

---

## 3. Repository structure (create exactly this)

```text
katha-aac/
  app.json
  eas.json
  babel.config.js
  metro.config.js
  tsconfig.json
  jest.config.js
  .eslintrc.js
  .prettierrc
  .github/workflows/ci.yml
  CLAUDE.md
  README.md
  docs/
    TASKS_STATUS.md
    BLOCKERS.md
    ARCHITECTURE.md
    DEFINITIONS.md
    ROLE_MATRIX.md
    PRIVACY.md
    RELEASE.md
    DEVICE_CHECKLIST.md
    review/
  assets/
    fonts/
    icons/            45 UI icon SVGs, 24x24
    pictograms/       pictogram SVGs, 96x96
    audio/si/words/   word clips, <symbolId>.m4a
    audio/si/messages/ message clips, <sequenceKey>.m4a
    vocabulary/       vocabulary-v1.json, audio-manifest-v1.json
    app/              icon.png, adaptive-icon.png, splash.png (placeholders)
  e2e/                Maestro flows
  src/
    app/
      App.tsx
      navigation/RootNavigator.tsx
      navigation/AdultTabs.tsx
      navigation/routes.ts
      providers/AppProviders.tsx
      registry/featureRegistry.ts
      dev/ComponentGallery.tsx      (dev builds only)
    core/
      db/        database.ts, migrate.ts, key.ts, tx.ts
      events/    bus.ts, schemas.ts
      theme/     tokens.ts, ThemeProvider.tsx, useTheme.ts, typography.ts, fonts.ts
      i18n/      en.ts, t.ts
      ui/        Icon.tsx, Button.tsx, Chip.tsx, OfflineBadge.tsx, Toggle.tsx, SegmentedControl.tsx,
                 AppBar.tsx, BottomNav.tsx, ListRow.tsx, TextField.tsx, Dialog.tsx, Toast.tsx,
                 EmptyState.tsx, ConsentBanner.tsx, ProgressBar.tsx, Card.tsx, StatusBarSpacer.tsx,
                 charts/BarChart.tsx, charts/LineChart.tsx, index.ts
      log/       errorLog.ts, ErrorBoundary.tsx
      time/      time.ts
      types/     common.ts
    features/
      vocabulary/
      audio/
      board/
      composer/
      sessions/
      event-log/
      access/
      observations/
      goals/
      analytics/
      reports/          parent/ slp/ educator/ ot/ history/ shared/
      report-builder/
      share/
      settings/
      onboarding/
```

Every feature folder contains:

```text
index.ts              public API (the only file other features may import)
feature.manifest.ts   { id, routes, migrations, eventHandlers, reportSections? }
domain/               pure TypeScript logic, no React, no SQL
data/                 SQL repositories and migrations (migrations/NNN_name.ts)
ui/                   React components and screens
tests/                Jest tests
```

---

## 4. Conventions

- **TypeScript:** `strict: true`, no `any` (use `unknown` and narrow). Path alias `@/` maps to `src/`.
- **Imports:** a feature imports only `@/core/...` and `@/features/<other>/index`. Enforced by `eslint-plugin-boundaries` (task T-004).
- **IDs:** `Crypto.randomUUID()` from `expo-crypto`, stored as TEXT.
- **Time:** store `at` as ISO 8601 UTC string (`new Date().toISOString()`) and `offset_min` as the device offset in minutes (`-new Date().getTimezoneOffset()`). All period logic uses local time = UTC + offset_min.
- **Periods:** `{ start: string (local date YYYY-MM-DD), end: string (local date, exclusive) }`. A record belongs to the period when its local date-time is `>= start 00:00` and `< end 00:00`.
- **Booleans in SQLite:** INTEGER 0 or 1.
- **JSON in SQLite:** TEXT columns ending in `_json`.
- **Errors:** never swallow errors. Catch at the feature boundary, call `logError(area, code, error)` from `@/core/log/errorLog`, and show the matching i18n message. Never log learner content (no symbol labels, no message text).
- **Strings:** all adult UI text comes from `src/core/i18n/en.ts` via `t('key')`. Child labels come from the vocabulary file.
- **Styling:** only theme tokens via `useTheme()`. No hex colours in components. No hard-coded font sizes outside `typography.ts`.
- **Components:** presentational components take props and callbacks; no data access inside `ui/` components except screens.
- **Tests:** every domain function has a unit test. Every screen has a render test. Coverage target: 90% lines for `features/*/domain` and `features/analytics`.
- **Naming:** components PascalCase, hooks `useX`, files match the main export, SQL tables snake_case, event types snake_case.

---

## 5. Design system specification

### 5.1 Colour tokens (copy into `src/core/theme/tokens.ts`)

Three modes: `light` (used by all screens), `dark`, `highContrast` (built now, enabled later). Values are `#RRGGBB` or `#RRGGBB@alpha`. Convert `@alpha` to `rgba()`.

```ts
export const colorTokens = {
  'child/bg':            ['#FAF7F2', '#15191E', '#FFFFFF'],
  'child/surface':       ['#FFFFFF', '#222831', '#FFFFFF'],
  'child/ink':           ['#1F2933', '#F3F4F6', '#000000'],
  'child/ink-muted':     ['#52606D', '#AAB4BE', '#1F1F1F'],
  'child/cell-border':   ['#D9D4CC', '#3B4450', '#000000'],
  'child/selected':      ['#2563EB', '#60A5FA', '#0033CC'],
  'child/band':          ['#F2EEE7', '#1B2026', '#FFFFFF'],
  'child/placeholder':   ['#F1EDE6', '#1E242B', '#F2F2F2'],
  'child/message-bg':    ['#FFFFFF', '#222831', '#FFFFFF'],
  'class/people':        ['#F2C94C', '#F2C94C', '#B88A00'],
  'class/action':        ['#6FCF97', '#6FCF97', '#1F8A4C'],
  'class/describing':    ['#56CCF2', '#56CCF2', '#0E7FB0'],
  'class/thing':         ['#F2994A', '#F2994A', '#C25E00'],
  'class/core':          ['#BB6BD9', '#BB6BD9', '#8A2FB0'],
  'fac/bg':              ['#F5F6F8', '#111418', '#FFFFFF'],
  'fac/surface':         ['#FFFFFF', '#1C2128', '#FFFFFF'],
  'fac/ink':             ['#1F2933', '#F3F4F6', '#000000'],
  'fac/ink-muted':       ['#52606D', '#AAB4BE', '#1F1F1F'],
  'fac/border':          ['#E1E4E8', '#2F3640', '#000000'],
  'fac/primary':         ['#2563EB', '#60A5FA', '#0033CC'],
  'fac/primary-soft':    ['#EEF3FE', '#1E2A44', '#FFFFFF'],
  'fac/on-primary':      ['#FFFFFF', '#0B1220', '#FFFFFF'],
  'fac/success':         ['#15803D', '#4ADE80', '#0B5A2A'],
  'fac/warning':         ['#B45309', '#FBBF24', '#7A3700'],
  'fac/danger':          ['#B91C1C', '#F87171', '#7F1010'],
  'fac/success-soft':    ['#EEF8F1', '#12301E', '#FFFFFF'],
  'fac/warning-soft':    ['#FEF5EC', '#3A2A10', '#FFFFFF'],
  'fac/danger-soft':     ['#FBEAEA', '#3A1414', '#FFFFFF'],
  'fac/muted':           ['#EEF0F3', '#242A32', '#F2F2F2'],
  'chart/series-1':      ['#475569', '#94A3B8', '#1F2937'],
  'chart/series-2':      ['#B45309', '#FBBF24', '#7A3700'],
  'chart/series-3':      ['#7C3AED', '#A78BFA', '#4C1D95'],
  'adult/chip-bg':       ['#E5E7EB', '#2F3640', '#FFFFFF'],
  'adult/chip-ink':      ['#4B5563', '#C3CAD2', '#000000'],
  'note/bg':             ['#FFF8DB', '#3A3418', '#FFFFFF'],
  'note/border':         ['#E6C84F', '#B59A2E', '#000000'],
  'child/selected-soft': ['#2563EB@0.10', '#60A5FA@0.18', '#0033CC@0.12'],
  'child/ink-faint':     ['#52606D@0.45', '#AAB4BE@0.45', '#1F1F1F@0.60'],
  'class/folder':        ['#52606D@0.50', '#AAB4BE@0.50', '#1F1F1F@0.70'],
  'adult/dot':           ['#4B5563@0.60', '#C3CAD2@0.60', '#000000@0.80'],
  'chart/heat-1':        ['#E3ECFD', '#1B2740', '#E3ECFD'],
  'chart/heat-2':        ['#BFD3FA', '#233A66', '#BFD3FA'],
  'chart/heat-3':        ['#8FB1F5', '#2D5196', '#7FA3F2'],
  'chart/heat-4':        ['#5B8DEE', '#3D6CC4', '#3366E0'],
  'chart/heat-5':        ['#2557D6', '#6F9BF1', '#0033CC'],
  'chart/baseline':      ['#52606D@0.10', '#AAB4BE@0.14', '#000000@0.08'],
} as const; // [light, dark, highContrast], 46 tokens
```

Rule: the child view never uses `fac/danger`, `fac/danger-soft` or any red.

### 5.2 Size tokens

```ts
export const space = { 4: 4, 8: 8, 12: 12, 16: 16, 24: 24, 32: 32, 48: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const size = { childMargin: 24, cellMin: 72, cellStarterMin: 120, targetAdult: 48, cellGap: 16 } as const;
```

### 5.3 Typography (`src/core/theme/typography.ts`)

`sinhala` font family = Noto Sans Sinhala (production). `latin` = Noto Sans. Line height is font size times the percentage.

| Style | Family | Weight | Size | Line height |
| --- | --- | --- | --- | --- |
| Child/Message | sinhala | SemiBold | 32 | 150% |
| Child/Label L | sinhala | SemiBold | 28 | 150% |
| Child/Label M | sinhala | SemiBold | 24 | 150% |
| Child/Label S | sinhala | SemiBold | 22 | 150% |
| Child/Chip | sinhala | Medium | 20 | 150% |
| Fac/Display | latin | Bold | 40 | 120% |
| Fac/Title | latin | SemiBold | 22 | 130% |
| Fac/Heading | latin | SemiBold | 18 | 135% |
| Fac/Body | latin | Regular | 16 | 150% |
| Fac/Body Strong | latin | SemiBold | 16 | 150% |
| Fac/Sinhala Body | sinhala | Regular | 16 | 150% |
| Fac/Sinhala Strong | sinhala | SemiBold | 16 | 150% |
| Fac/Caption | latin | Regular | 13 | 140% |
| Fac/Caption Strong | latin | SemiBold | 13 | 140% |
| Fac/Overline | latin | SemiBold | 12 | 140% |
| Fac/Stat | latin | Bold | 28 | 120% |

**Mixed text rule:** any adult text that may contain Sinhala (words, sentences, goal titles) must be rendered with `<MixedText>` (task T-019), which splits the string into Sinhala runs (Unicode U+0D80 to U+0DFF and U+200D) and Latin runs and applies the Sinhala family to Sinhala runs at the same size and weight. Set `maxFontSizeMultiplier={1.3}` on all Text.

### 5.4 Effects

- `Fac/Card`: Android `elevation: 1`, iOS shadow `#0F1729` opacity 0.06, offset (0,1), radius 3.
- `Child/Pressed glow`: Android cannot draw coloured glows. Implement as a 4 dp outer ring view with colour `child/selected-soft` around a 4 dp `child/selected` border.

### 5.5 Child tablet geometry (1280x800 dp reference, landscape)

- Safe margin 24 on all sides. Vertical gaps between zones 12.
- Message row height 96. Core key row height 88.
- Grid area height = screen height − 48 (margins) − 96 − 88 − 24 (two gaps). On 800 dp this is 544.
- Grid gap 16 for 3x4, 12 for 4x5 and 5x6.
- Cell width = (grid width − gaps) / columns. Cell height = (grid area height − gaps) / rows. On 1280x800: 3x4 cells 296x170, 4x5 cells 236x127, 5x6 cells 195x99.
- If any cell would be smaller than 72x72 dp, use the next smaller grid size and log `board/grid_too_small`.
- Label placement: L and M sizes put the label under the pictogram; S size (5x6) puts the label to the right of the pictogram.

### 5.6 Component specifications

Figma node IDs are on page 02 Components. All colours are tokens. All text uses the named style.

| Component | Spec |
| --- | --- |
| Button (4:88) | Variants Primary (fill fac/primary, text fac/on-primary), Secondary (fill fac/surface, 1 dp border fac/border, text fac/primary), Ghost (no fill, text fac/primary), Danger (fill fac/danger, text fac/on-primary). Sizes L (height 56, padding 16 vertical 24 horizontal), M (height 48, padding 12/16). Radius md. Text Fac/Body Strong. Props: `label, variant, size, onPress, disabled, fullWidth, accessibilityLabel`. Disabled: opacity 0.5. |
| Chip (4:99) | Tones Neutral (fac/muted, fac/ink-muted), Primary (fac/primary-soft, fac/primary), Success (fac/success-soft, fac/success), Warning (fac/warning-soft, fac/warning), Danger (fac/danger-soft, fac/danger). Pill radius xl, padding 4/12, Fac/Caption Strong. |
| OfflineBadge (4:100) | Success chip with `offline` icon 16, gap 8, label "Works offline". |
| RoleBadge (4:125) | Parent: icon `users`, fac/primary-soft, fac/primary, "Parent / Caregiver". SLP: icon `speaker`, fac/muted, chart/series-3, "Speech-Language Pathologist". Educator: icon `book`, fac/success-soft, fac/success, "Educator / School staff". OT: icon `hand`, fac/warning-soft, fac/warning, "Occupational Therapist". Pill, padding 4/12, gap 8, icon 16, Fac/Caption Strong. |
| Toggle (4:138) | 52x32 track radius xl. On: track fac/primary, 24 dp knob fac/surface at x 24. Off: track fac/muted with 1 dp fac/border, knob at x 4. Locked: track fac/muted, knob fac/border, `lock` icon 14 centred, not pressable. Touch target 48x48. |
| SegmentedControl (4:160) | 48 high, fill fac/muted, radius md, padding 4. Equal segments 40 high, radius sm. Selected: fac/surface fill, 1 dp fac/border, text fac/primary. Others: text fac/ink-muted. Fac/Caption Strong. Props: `options: string[], selectedIndex, onChange`. |
| AppBar (5:27) | Height 64, fill fac/surface, bottom border 1 fac/border, padding 8/16, gap 12. Root: title Fac/Title + trailing icon. Back: `arrow-left` + title + `more` icon. |
| BottomNav (5:178) | Height 72, fill fac/surface, top border. Items: Home (`home`), Child (`child`), Vocabulary (`book`), Reports (`chart`), Settings (`gear`). Active: fac/primary, Fac/Caption Strong. Inactive: fac/ink-muted, Fac/Caption. Icon 24, gap 4. |
| ListRow (5:211) | Min height 68, card style, padding 12/16, gap 12. Leading icon 24 fac/ink-muted. Title Fac/Body Strong and subtitle Fac/Caption fac/ink-muted, both wrap. Trailing: `chevron-right` (Navigation), Toggle (Toggle), value text + chevron (Value). |
| TextField (5:227) | Label Fac/Caption Strong fac/ink-muted, gap 4, field 48 high, radius md, padding 12/16. Default 1 dp fac/border; Focus 2 dp fac/primary; Locked fill fac/muted, `lock` icon 18. |
| StatTile (5:252) | 156x108 card, padding 12/16: label Fac/Caption fac/ink-muted, value Fac/Stat, trend row (icon 14 + Fac/Caption), all trend parts fac/ink-muted (never green or red). |
| MetricCard (5:268) | Card, padding 12, gap 4. States: Count (label, value Fac/Stat, note), Rate (label, value as "62%", note "18 of 29 opportunities"), Locked (label, `lock` icon 18 + "Shown after 5 sessions (3 so far)"). Notes wrap. In a row, cards share the row height. |
| LimitationBanner (5:269) | Fill note/bg, 1 dp note/border, radius md, padding 12, gap 8, `info` icon 18, Fac/Caption: "This report describes recorded app activity, not all communication. Usage statistics alone do not show language development." |
| PeriodPicker (5:274) | 48 high, fac/surface, 1 dp fac/border, radius md, padding 12/16, `calendar` 20, label Fac/Body, `chevron-down` 20. Opens a sheet with: Today, Last 7 days, Last 30 days, Custom (two date fields). |
| SectionHeader (5:291) | Report: Fac/Heading + Fac/Caption subtitle. Builder: Fac/Heading + Toggle at right. |
| Dialog (5:292) | 312 wide, card, radius lg, padding 24, gap 12. Title Fac/Heading, body Fac/Body fac/ink-muted, actions right-aligned: Ghost M + Primary M. Scrim fac/ink at 45% opacity. |
| Toast (5:300) | 328x52, fill fac/ink, radius md, padding 12/16, `check` icon 20 and Fac/Body in fac/surface. 3 seconds. |
| EmptyState (5:304) | Fill fac/surface, radius md, padding 24, centred: 56 dp disc fac/primary-soft with icon 28 fac/primary, title Fac/Heading, body Fac/Body fac/ink-muted. |
| ConsentBanner (5:313) | Fill fac/primary-soft, radius md, padding 12, `shield` 24 fac/primary, title Fac/Body Strong, body Fac/Caption fac/ink-muted. |
| ProgressBar (5:320) | 8 high, track fac/muted radius sm, fill fac/primary width = ratio. |
| Card (5:323) | Fill fac/surface, 1 dp fac/border, radius md, Fac/Card effect, padding 16, gap 8. |
| BarChart (7:377) | Props `labels, values`. Height 180. Plot top 24, plot height 112, baseline 1 dp fac/border. Bar width min(28, slot × 0.5), top radius 4, fill fac/primary. Value above bar Fac/Caption Strong; label below Fac/Caption fac/ink-muted. Draw with `react-native-svg`. |
| LineChart (7:378) | Props `labels, values, yTicks`. Height 180. Three grid lines fac/border with tick labels. Series chart/series-1, 2 dp, 8 dp points. Last value labelled Fac/Caption Strong. |
| BarRow (12:1295) | Props `label, value, max, valueLabel`. Height 28, gap 12. Label 96 wide Fac/Caption. Track flex, 10 high, fac/muted, radius sm; fill fac/primary width = value / max of track. Value right-aligned Fac/Caption Strong. |
| WordChip (7:404) | Fac/surface, 1 dp fac/border, pill, padding 4/12, gap 8: word in Fac/Sinhala Strong, count Fac/Caption Strong fac/ink-muted. |
| MessageHistoryRow (7:407) | Padding 12/0, bottom border fac/border. Top row: sentence Fac/Sinhala Strong (fills), answer chip at right: Meant = Success "Meant", Not meant = Warning "Not meant", Unsure = Neutral "Unsure", none = Neutral "Not answered". Meta line Fac/Caption fac/ink-muted: "Tue 20 Oct · 07:12 · 3 symbols · built". |
| IntentConfirmChip (13:341) | Fill adult/chip-bg, pill, padding 8/12, gap 8: "Meant this?" Fac/Caption adult/chip-ink + three 28 dp round fac/surface buttons with `check`, `x`, `question` icons 16 in adult/chip-ink. Each button touch target 48. |
| ClassTint (6:172) | 6 dp bar at the top of a cell. Colours: people, action, describing, thing, core (`class/*`), folder (`class/folder`). |
| SymbolCell (6:266) | Fill child/surface, 1 dp child/cell-border, radius md, ClassTint on top. Pictogram 56 (L) or 40 (M, S). Label Child/Label L, M or S. States: Default; Pressed (4 dp child/selected border + glow ring, 120 ms); Hidden (fill child/placeholder, dashed 1 dp border, not pressable); Disabled (opacity 0.45). Width and height come from the grid layout. |
| ChildButton (6:309) | Speak 136x96: fill child/selected-soft, 2 dp child/selected border, pictogram `speak` 40 + "කියන්න" Child/Chip. Undo, Clear, Replay 96x96: fill child/surface, 1 dp child/cell-border, pictogram 48. Pressed: 4 dp child/selected border + glow. Disabled: fill child/placeholder, opacity 0.5. Replay uses the `replay` pictogram (placeholder: icon `play` drawn at 48 in child/ink until H-05 delivers art). |
| CoreKey (6:346) | Height 88, width shares the row equally, gap 12. Core: fill child/surface, ClassTint core. Nav: fill child/band, ClassTint folder. Pictogram 40 + label Child/Chip. |
| CoreKeyRow (6:529) | Right-handed order: home, quick, help, more, stop, yes, no, break. Left-handed: reversed. |
| MessageChip (6:540) | Pictogram 40 + word Child/Chip, padding 4/8, radius sm. Speaking state: fill child/selected-soft, 2 dp child/selected border. |
| MessageBar (6:605) | Height 96, radius md, fill child/message-bg, 1 dp child/cell-border (Speaking: 4 dp child/selected). Padding 8/16, gap 16. Chips on the left; sentence at the right in Child/Message. Template state: shows the template text with an empty slot box (96x84, dashed child/cell-border) where the missing word goes. |

### 5.7 Assets

- Icons: 45 SVGs from Figma frame `2:9` (one component per icon, named `icon/<name>`). Names: home, child, book, chart, gear, offline, lock, check, x, question, mic, play, plus, search, filter, chevron-right, chevron-down, arrow-left, bell, flag, download, upload, calendar, clock, edit, trash, info, speaker, undo, users, shield, share, grid, note, globe, storage, more, trend-up, trend-down, trend-flat, target, file, wave, battery, hand. Stroke 2, round caps and joins, colour applied at runtime.
- Pictograms: 22 SVGs from Figma frame `3:2`, named `pict/<name>`: me (3:13), want (3:17), eat (3:25), drink (3:29), go (3:32), play (3:36), finished (3:40), more (3:45), stop (3:52), help (3:58), yes (3:62), no (3:66), water (3:70), milk (3:75), rice (3:80), school (3:87), home (3:92), quick (3:95), break (3:99), speak (3:103), undo (3:107), clear (3:112). Keep their original colours. These are placeholders until H-04.
- Missing pictogram fallback: if a vocabulary symbol has no pictogram file, render a 96x96 rounded square in child/placeholder with the Sinhala label centred in Child/Chip, and log `vocabulary/missing_pictogram` once per symbol.

---

## 6. Data model

### 6.1 SQL schema (SQLite, SQLCipher-encrypted)

Each table belongs to the feature named in the comment and is created by that feature's migration. Run all statements with `PRAGMA foreign_keys = ON`.

```sql
-- core/db
CREATE TABLE schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE error_log (id TEXT PRIMARY KEY, at TEXT NOT NULL, area TEXT NOT NULL, code TEXT NOT NULL, message TEXT NOT NULL, app_version TEXT NOT NULL);

-- access
CREATE TABLE learners (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  participant_code TEXT NOT NULL,
  is_fictional INTEGER NOT NULL DEFAULT 1,
  hand TEXT NOT NULL DEFAULT 'right' CHECK (hand IN ('right','left')),
  grid_size TEXT NOT NULL DEFAULT '3x4' CHECK (grid_size IN ('3x4','4x5','5x6')),
  idle_return_seconds INTEGER NOT NULL DEFAULT 30,
  reduced_motion INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE consent (
  learner_id TEXT PRIMARY KEY REFERENCES learners(id),
  guardian_consent_at TEXT,
  research_logging INTEGER NOT NULL DEFAULT 0,
  withdrawn_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE role_permissions (
  role TEXT PRIMARY KEY CHECK (role IN ('parent','slp','educator','ot')),
  can_open_report INTEGER NOT NULL,
  can_see_history INTEGER NOT NULL,
  can_export INTEGER NOT NULL,
  can_enter_observations INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
-- defaults inserted by migration:
-- parent 1,1,1,1 · slp 1,1,1,1 · educator 1,0,0,1 · ot 1,0,0,1

-- vocabulary
CREATE TABLE vocabulary_versions (
  id TEXT PRIMARY KEY,            -- e.g. 'v1'
  label TEXT NOT NULL,
  content_json TEXT NOT NULL,     -- the full vocabulary file
  installed_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0
);

-- sessions
CREATE TABLE app_sessions (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  vocabulary_version_id TEXT NOT NULL REFERENCES vocabulary_versions(id),
  setting TEXT NOT NULL DEFAULT 'unknown' CHECK (setting IN ('home','school','therapy','unknown')),
  started_at TEXT NOT NULL,
  offset_min INTEGER NOT NULL,
  ended_at TEXT,
  end_reason TEXT CHECK (end_reason IN ('adult_exit','background_timeout','app_restart')),
  active_ms INTEGER NOT NULL DEFAULT 0,
  started_by_role TEXT NOT NULL
);
CREATE INDEX idx_sessions_learner_start ON app_sessions(learner_id, started_at);

-- event-log
CREATE TABLE communication_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES app_sessions(id),
  learner_id TEXT NOT NULL REFERENCES learners(id),
  type TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  at TEXT NOT NULL,
  offset_min INTEGER NOT NULL,
  symbol_id TEXT,
  draft_id TEXT,
  message_id TEXT,
  source TEXT CHECK (source IN ('grid','core','quick','template') OR source IS NULL),
  page_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_events_session_at ON communication_events(session_id, at);
CREATE INDEX idx_events_learner_at ON communication_events(learner_id, at);

CREATE TABLE communication_attempts (       -- one row per submitted message
  id TEXT PRIMARY KEY,                      -- message_id
  session_id TEXT NOT NULL REFERENCES app_sessions(id),
  learner_id TEXT NOT NULL REFERENCES learners(id),
  draft_id TEXT UNIQUE,                     -- NULL for stored phrases
  submitted_at TEXT NOT NULL,
  offset_min INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('built','stored_phrase')),
  symbol_ids_json TEXT NOT NULL,            -- ordered array
  text_snapshot TEXT NOT NULL,
  symbol_count INTEGER NOT NULL,
  template_id TEXT,
  vocabulary_version_id TEXT NOT NULL
);
CREATE INDEX idx_attempts_learner_at ON communication_attempts(learner_id, submitted_at);

CREATE TABLE audio_attempts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES app_sessions(id),
  message_id TEXT,                          -- NULL for single words
  symbol_id TEXT,                           -- set for single words
  kind TEXT NOT NULL CHECK (kind IN ('word','message_first','message_replay')),
  requested_at TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('clip','voice','failed','unsupported')),
  error_code TEXT
);

-- observations
CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  session_id TEXT NOT NULL REFERENCES app_sessions(id),
  message_id TEXT REFERENCES communication_attempts(id),   -- NULL for session-level kinds
  kind TEXT NOT NULL CHECK (kind IN ('intent','function','prompting','breakdown','opportunities','setup_note')),
  value TEXT NOT NULL,
  count_a INTEGER,                          -- opportunities: observed opportunities
  count_b INTEGER,                          -- opportunities: started independently
  entered_by_role TEXT NOT NULL,
  entered_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (message_id, kind),
  UNIQUE (session_id, kind, message_id)
);
-- allowed values:
-- intent: meant | not_meant | unsure
-- function: requesting | refusing | commenting | greeting
-- prompting: independent | gesture | verbal | model | physical
-- breakdown: yes | no
-- opportunities: value 'session', count_a >= count_b >= 0
-- setup_note: free text, max 280 characters

-- goals
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  title TEXT NOT NULL,
  set_by_role TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  target_period TEXT NOT NULL CHECK (target_period IN ('week','month','term')),
  visible_to_roles_json TEXT NOT NULL,      -- e.g. ["parent","slp"]
  created_at TEXT NOT NULL,
  archived_at TEXT
);
CREATE TABLE goal_progress (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  achieved_count INTEGER NOT NULL,
  note TEXT,
  entered_by_role TEXT NOT NULL,
  entered_at TEXT NOT NULL
);

-- share
CREATE TABLE report_exports (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  destination TEXT NOT NULL CHECK (destination IN ('save','share','print')),
  consent_at TEXT NOT NULL,
  exported_at TEXT NOT NULL
);
```

Secure storage keys (never in SQLite): `db.key` (64 hex characters), `pin.parent`, `pin.slp`, `pin.educator`, `pin.ot` (JSON `{ salt, hash, iterations }`), `pin.lock` (JSON `{ failedCount, lockedUntil }`).

### 6.2 Core domain types (`src/core/types/common.ts`)

```ts
export type Role = 'parent' | 'slp' | 'educator' | 'ot';
export type Setting = 'home' | 'school' | 'therapy' | 'unknown';
export type GridSize = '3x4' | '4x5' | '5x6';
export type WordCategory = 'people' | 'action' | 'describing' | 'thing' | 'core' | 'folder';
export type LocalDate = string;            // 'YYYY-MM-DD'
export interface Period { start: LocalDate; end: LocalDate } // end exclusive
export type IntentAnswer = 'meant' | 'not_meant' | 'unsure';
export type FunctionTag = 'requesting' | 'refusing' | 'commenting' | 'greeting';
export type PromptLevel = 'independent' | 'gesture' | 'verbal' | 'model' | 'physical';
export type AudioOutcome = 'clip' | 'voice' | 'failed' | 'unsupported';
```

### 6.3 Events (schema version 1, `src/core/events/schemas.ts`)

Every event row has the common columns of `communication_events`. Type-specific fields:

| type | symbol_id | draft_id | message_id | source | page_id | payload_json |
| --- | --- | --- | --- | --- | --- | --- |
| `session_started` | | | | | | `{ setting }` |
| `session_ended` | | | | | | `{ endReason, activeMs }` |
| `page_opened` | | | | | page | `{ via: 'start'|'folder'|'home_key'|'quick_key'|'idle_return'|'break_end' }` |
| `symbol_selected` | symbol | draft | | grid/core/quick/template | page | `{ positionIndex, quickUndoEligibleUntil }` |
| `undo` | removed symbol | draft | | | page | `{ quickUndo: boolean }` (true if within 2000 ms of that symbol's selection) |
| `clear` | | draft | | | page | `{ symbolCount }` |
| `draft_abandoned` | | draft | | | | `{ reason: 'clear'|'session_end', symbolCount }` |
| `template_opened` | trigger symbol | draft | | | | `{ templateId }` |
| `template_rejected` | rejected symbol | draft | | | | `{ templateId, expected: WordCategory[] }` |
| `message_submitted` | | draft (NULL for stored phrase) | message | | | `{ kind }` |
| `message_replayed` | | | message | | | `{}` |
| `break_started` | | | | | | `{}` |
| `break_ended` | | | | | | `{ durationMs }` |
| `idle_return` | | | | | from page | `{ idleMs }` |
| `exploration_flagged` | | draft | | | | `{ symbolCount }` (emitted with `draft_abandoned` when the draft never reached Speak) |
| `gate_attempt` | | | | | | `{ result: 'success'|'fail'|'locked', role }` (never the PIN) |

Rules:
- Writing `message_submitted` and its `communication_attempts` row happens in one transaction.
- Every insert uses the event ID as primary key; inserting the same ID twice is ignored (`INSERT OR IGNORE`).
- A new draft ID is created at the first `symbol_selected` after: session start, a submit, a clear, or a replay followed by a tap.

### 6.4 Vocabulary file format (`assets/vocabulary/vocabulary-v1.json`)

```json
{
  "id": "v1",
  "label": "Starter vocabulary v1 (draft, verify with SLP)",
  "language": "si",
  "symbols": [
    { "id": "sym_me", "label": "මට", "gloss": "I, me", "category": "people", "isCore": false, "pictogram": "me", "kind": "word" }
  ],
  "storedPhrases": [
    { "id": "phr_help", "label": "මට උදව් ඕනේ", "gloss": "I need help", "pictogram": "help" }
  ],
  "pages": [
    { "id": "home", "title": "Home", "cells": ["sym_me", "sym_want", "..."] },
    { "id": "quick", "title": "Quick needs", "cells": ["phr_help", "..."] },
    { "id": "food", "title": "Food", "cells": ["..."] }
  ],
  "folders": [ { "symbolId": "sym_folder_food", "opensPage": "food" } ],
  "coreKeys": { "home": "nav_home", "quick": "nav_quick", "help": "sym_help", "more": "sym_more", "stop": "sym_stop", "yes": "sym_yes", "no": "sym_no", "break": "nav_break" },
  "templates": [
    { "id": "tpl_want", "trigger": "sym_want", "pattern": ["sym_me", "{slot}", "sym_want"], "slotCategories": ["thing", "action"], "display": "මට ___ ඕනේ" }
  ]
}
```

Rules: `cells` lists symbol or phrase IDs in grid order; `null` means a hidden reserved cell. A page may have more cells than the grid holds; extra cells are ignored and logged `vocabulary/page_overflow`. Navigation keys (`nav_home`, `nav_quick`, `nav_break`) are symbols with `"kind": "nav"` and are never added to a message.

### 6.5 Seed vocabulary v1 (task T-040 writes this file exactly)

Symbols (`id`, label, gloss, category, isCore, pictogram):

| id | label | gloss | category | core | pictogram |
| --- | --- | --- | --- | --- | --- |
| sym_me | මට | I, me | people | no | me |
| sym_want | ඕනේ | want | action | yes | want |
| sym_eat | කන්න | eat | action | no | eat |
| sym_drink | බොන්න | drink | action | no | drink |
| sym_go | යන්න | go | action | no | go |
| sym_play | සෙල්ලම් | play | action | no | play |
| sym_water | වතුර | water | thing | no | water |
| sym_milk | කිරි | milk | thing | no | milk |
| sym_rice | බත් | rice | thing | no | rice |
| sym_school | ඉස්කෝලේ | school | thing | no | school |
| sym_finished | ඉවරයි | finished | describing | no | finished |
| sym_help | උදව් | help | core | yes | help |
| sym_more | තව | more | core | yes | more |
| sym_stop | නවත්තන්න | stop | core | yes | stop |
| sym_yes | ඔව් | yes | core | yes | yes |
| sym_no | නෑ | no | core | yes | no |
| nav_home | ගෙදර | home page | folder | no | home |
| nav_quick | ඉක්මන් | quick needs | folder | no | quick |
| nav_break | විවේකය | break | folder | no | break |

Stored phrases: `phr_help` "මට උදව් ඕනේ" (help), `phr_stop` "නවත්තන්න" (stop), `phr_break` "මට විවේකයක් ඕනේ" (break), `phr_finished` "ඉවරයි" (finished).

Pages: `home` cells in order: sym_me, sym_want, sym_eat, sym_drink, sym_go, sym_play, sym_water, sym_milk, sym_rice, sym_school, sym_finished, null. `quick` cells: phr_help, phr_stop, phr_break, phr_finished, then `null` for the rest.

Templates: `tpl_want` as in 6.4.

Every label is a draft; the file `label` field says "verify with SLP". H-02 replaces this file with the reviewed vocabulary.

### 6.6 Audio manifest (`assets/vocabulary/audio-manifest-v1.json`)

```json
{
  "vocabularyVersion": "v1",
  "words": { "sym_me": "audio/si/words/sym_me.m4a" },
  "messages": { "sym_me+sym_water+sym_want": "audio/si/messages/sym_me+sym_water+sym_want.m4a" },
  "phrases": { "phr_help": "audio/si/messages/phr_help.m4a" }
}
```

`sequenceKey` = symbol IDs joined with `+` in message order. Until H-03 delivers recordings, the manifest has empty objects and the app uses the voice or the unsupported state (D-08).

---

## 7. Measures (analytics)

All measures are pure TypeScript functions over an `AnalyticsInput` loaded once per request:

```ts
export interface AnalyticsInput {
  period: Period;
  previousPeriod: Period;           // same length, immediately before
  sessions: SessionRow[];           // sessions starting in period
  previousSessions: SessionRow[];
  events: EventRow[];               // events of those sessions
  attempts: AttemptRow[];           // messages submitted in period
  previousAttempts: AttemptRow[];
  observations: ObservationRow[];   // for sessions in period
  goals: GoalWithProgress[];
  vocabulary: VocabularyContent;    // active version per session (map by version id)
  firstUseBySymbol: Record<string, string>; // earliest meaningful use ever, ISO
}

export interface MeasureResult {
  id: MeasureId;
  value: number | null;             // null when locked or not recorded
  numerator?: number;
  denominator?: number;
  notRecorded?: number;             // items with no adult entry
  locked: boolean;
  sessionsSoFar: number;
  detail?: unknown;                 // lists, series, top items
}
```

### 7.1 Shared rules

- A session is **in the period** when its local start date-time is inside the period. All its events, messages and observations belong to that period.
- **Rate lock:** a measure with `minSessions: 5` returns `locked: true, value: null` when fewer than 5 sessions are in the period.
- **Meaningful use:** a symbol has a meaningful use in a message when the child selected it (`symbol_selected` with source `grid` or `core`) in the submitted draft and it is still in the final message (not undone). Template words inserted by the app are not selections. A stored phrase counts as one use of that phrase, not of words.
- **Rounding:** percentages = `Math.round(numerator / denominator * 100)`. Medians of an even count are the mean of the two middle values, shown to one decimal.
- **Ties** in "most used" lists: higher count first, then earlier first meaningful use in the period.

### 7.2 Measure registry (`features/analytics/domain/registry.ts`)

| ID | Definition | Source | Min data |
| --- | --- | --- | --- |
| `sessions` | Count of sessions in period. Detail: days with at least one session, days in period | auto | none |
| `messages_sent` | Count of `communication_attempts` in period. Detail: built count, stored-phrase count, change vs previous period (only if both periods have 5+ sessions) | auto | none |
| `selections` | Count of `symbol_selected` events in period, all sources | auto | none |
| `words_used` | Distinct word symbols (kind `word`) with a meaningful use | auto | none |
| `top_words` | Words with meaningful use, counts, sorted by the tie rule, top 6 | auto | none |
| `new_words` | Words whose first meaningful use ever falls inside the period | auto | none |
| `confirmed_meant` | Messages with intent `meant` ÷ messages with any intent answer. `notRecorded` = messages without an answer | adult | 5 sessions |
| `independent_starts` | Sum of `count_b` ÷ sum of `count_a` over opportunities observations in period | adult | 5 sessions |
| `prompted_vs_independent` | From opportunities: independent = Σcount_b, prompted = Σ(count_a − count_b) | adult | 5 sessions |
| `prompt_dependency` | Messages with prompting ≠ `independent` ÷ messages with any prompting entry | adult | 5 sessions |
| `functions` | Count per function tag; `notRecorded` = messages without a function tag | adult | 5 sessions |
| `combinations` | Built messages with 2+ symbols grouped by exact sequence, top 3 by count; detail also: average symbols per built message (one decimal), built count, stored-phrase count | auto | none |
| `needed_repair` | Built messages with breakdown `yes` ÷ built messages with any breakdown entry | adult | 5 sessions |
| `vocabulary_retention` | Words with meaningful use in the previous period that also have one in this period ÷ words with meaningful use in the previous period | auto | previous period has 1+ word |
| `response_latency` | Anchors: `session_started`, `page_opened`, `message_submitted`, `clear`. A sample is a `symbol_selected` that is the first selection after its latest preceding anchor in the same session; its value is the seconds between that anchor and the selection. Each selection counts at most once. Keep only samples whose symbol is core (`isCore`). Value: median. Detail: sample count | auto | 1 sample |
| `latency_within_session` | Same samples as `response_latency` but for any symbol, split into samples whose selection is within the first 180 s after session start and samples within the last 180 s before session end. Value: two medians | auto | 1 sample each |
| `time_of_day` | Messages by local submit time: morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–20:59, night 21:00–04:59 | auto | none |
| `corrections` | `undo` events ÷ `symbol_selected` events | auto | 5 sessions |
| `repeated_taps` | `symbol_selected` events where the previous selection in the same draft was the same symbol within 2000 ms ÷ all `symbol_selected` | auto | 5 sessions |
| `abandoned` | Drafts with a `draft_abandoned` event ÷ drafts started (distinct draft IDs) | auto | 5 sessions |
| `session_length` | Mean of `active_ms` per session, in minutes (one decimal) | auto | none |
| `pages_per_session` | Mean count of `page_opened` events per session (one decimal) | auto | none |
| `class_messages` | `messages_sent` restricted to sessions with setting `school` | auto/adult | none |
| `class_words` | `top_words` restricted to school sessions | auto/adult | none |
| `class_help_requests` | Meaningful uses of `sym_help` plus uses of `phr_help` in school sessions | auto/adult | none |
| `class_independent_starts` | `independent_starts` restricted to school sessions | adult | 5 school sessions in period |
| `class_prompted_vs_independent` | `prompted_vs_independent` restricted to school sessions | adult | 5 school sessions in period |
| `class_messages_weekly` | Messages in school sessions per week for the 6 weeks ending at period end | auto/adult | none |
| `goals` | Active goals visible to the role, with the latest progress entry inside the period | adult | when a goal exists |
| `setup_notes` | Setup notes entered in the period, newest first | adult | when entered |
| `planning_idea` | One template sentence chosen by the rules in 8.3 | template | 5 sessions |

### 7.3 Reference dataset and expected values (fixture task T-115, tests task T-126)

Learner `L1`, offset +330 min (Sri Lanka). Period A = 2026-10-19 to 2026-10-26 (exclusive). Previous period = 2026-10-12 to 2026-10-19.
Core symbols: sym_want, sym_help, sym_more. Local times below.

| Session | Local start | Setting | Active | Events (local time, in order) |
| --- | --- | --- | --- | --- |
| S0 | 2026-10-18 10:00 | home | 3 min | page home 10:00:00 · select sym_milk 10:00:04 (d0) · submit m0 [milk] 10:00:06 |
| S1 | 2026-10-19 08:00 | home | 5 min | page home 08:00:00 · select sym_me 08:00:03 (d1) · select sym_want 08:00:05 · select sym_water 08:00:07 · submit m1 [me,want,water] 08:00:09 (audio clip) · replay m1 08:00:15 |
| S2 | 2026-10-20 12:30 | school | 6 min | page home 12:30:00 · select sym_help 12:30:02 (d2) · submit m2 [help] 12:30:04 (voice) · select sym_milk 12:30:10 (d3) · undo 12:30:11 (quick) · select sym_water 12:30:13 · select sym_water 12:30:14 · clear 12:30:20 → draft_abandoned d3 |
| S3 | 2026-10-21 18:00 | home | 2 min | page home 18:00:00 · page quick 18:00:02 · select phr_help (source quick) 18:00:05 · submit m3 stored phrase 18:00:05 (audio failed) |
| S4 | 2026-10-22 09:00 | therapy | 4 min | page home 09:00:00 · select sym_me 09:00:04 (d4) · select sym_want 09:00:06 · select sym_milk 09:00:08 · submit m4 [me,want,milk] 09:00:10 (clip) |
| S5 | 2026-10-23 16:00 | unknown | 3 min | page home 16:00:00 · select sym_more 16:00:03 (d5) · submit m5 [more] 16:00:05 (voice) |
| S6 | 2026-10-25 21:30 | home | 1 min | page home 21:30:00 · select sym_water 21:30:04 (d6) · session ends 21:31:00 → draft_abandoned d6 + exploration_flagged d6 |
| S7 | 2026-10-26 00:10 | home | 1 min | page home 00:10:00 · select sym_water 00:10:03 (d7) · submit m7 [water] 00:10:05 |

Observations (all by role parent): intent m1 meant, m2 meant, m3 unsure, m4 not_meant (m5 none). Function m1 requesting, m2 requesting, m4 refusing. Prompting m1 independent, m2 independent, m4 verbal. Breakdown m1 no, m4 yes. Opportunities S1 (2 observed, 1 independent), S2 (2, 2), S4 (1, 0). Goal G1 "Ask for help with උදව්", target 2 per week, visible to parent, slp, educator; progress entry 2026-10-19..2026-10-26 achieved 1.

Expected for Period A (S1 to S6):

| Measure | Expected |
| --- | --- |
| sessions | 6; days with sessions 6 of 7 |
| messages_sent | 5 (built 4, stored 1); no comparison (previous period has 1 session) |
| selections | 13 |
| words_used | 6 (me, want, water, help, milk, more) |
| top_words | me 2, want 2, water 1, help 1, milk 1, more 1 (in this order) |
| new_words | 5 (me, want, water, help, more); milk is not new |
| confirmed_meant | 50% (2 of 4), notRecorded 1 |
| independent_starts | 60% (3 of 5) |
| prompted_vs_independent | independent 3, prompted 2 |
| prompt_dependency | 33% (1 of 3) |
| functions | requesting 2, refusing 1, commenting 0, greeting 0; notRecorded 2 |
| combinations | [me,want,water] 1, [me,want,milk] 1; average 2.0 symbols; built 4, stored 1 |
| needed_repair | 50% (1 of 2) |
| vocabulary_retention | 100% (1 of 1: milk) |
| response_latency | 2.5 s median, 2 samples (help 2.0 s, more 3.0 s) |
| time_of_day | morning 2, afternoon 2, evening 1, night 0 |
| corrections | 8% (1 of 13) |
| repeated_taps | 8% (1 of 13) |
| abandoned | 33% (2 of 6 drafts: d3, d6) |
| session_length | 3.5 min |
| pages_per_session | 1.2 (S3 opened 2 pages, others 1: 7 ÷ 6 = 1.17, shown 1.2) |
| class_messages | 1 (m2) |
| class_help_requests | 1 |
| class_independent_starts | locked, sessionsSoFar 1 (1 school session) |
| goals | G1: 1 of 2 this week |

Second check, Period B = 2026-10-19 to 2026-10-22 (S1 to S3, 3 sessions): `confirmed_meant`, `independent_starts`, `corrections` and every other 5-session measure return `locked: true, sessionsSoFar: 3`; `messages_sent` = 3.

---

## 8. Reports

### 8.1 Report definition type (`features/reports/shared/types.ts`)

```ts
export type SectionKind =
  | 'glance'          // 2x2 MetricCards
  | 'wordChips'       // WordChip list + optional "New this week" line
  | 'barRows'         // BarRow list
  | 'barChart'        // BarChart in a chart card
  | 'lineChart'       // LineChart in a chart card
  | 'combinations'    // list of sequence cards
  | 'metricPair'      // two MetricCards in a row
  | 'latencyCard'     // value + caution text
  | 'planningIdea'
  | 'goals'
  | 'notes';

export interface ReportSection {
  id: string;
  kind: SectionKind;
  titleKey: string;            // i18n key
  subtitleKey?: string;
  measures: MeasureId[];
  required?: boolean;          // cannot be switched off in the builder
}

export interface ReportDefinition {
  role: Role;
  titleKey: string;            // e.g. 'report.parent.title'
  subtitleKey: string;         // shown under "At a glance"
  glance: [MeasureId, MeasureId, MeasureId, MeasureId];
  sections: ReportSection[];
}
```

Every report also renders, in this order and not switchable: header card (RoleBadge, learner name and code, period, sessions and days, "Sample data" chip when the learner is fictional), LimitationBanner, glance, sections, then buttons "Share or export" (if permitted) and "View message history" (if permitted).

### 8.2 The four definitions

**Parent (`features/reports/parent/definition.ts`)**, title "Parent report", subtitle "Everyday communication at home, in plain language."
- Glance: messages_sent, words_used, independent_starts, confirmed_meant (label "Confirmed as meant").
- Sections: `words` wordChips [top_words, new_words] "Words used most" / "Counts of words in messages the child spoke." · `functions` barRows [functions] "What the messages were for" / "Tagged for {tagged} of {total} messages. {notRecorded} were not recorded." · `timeOfDay` barChart [time_of_day] "Messages by time of day" · `idea` planningIdea [planning_idea] · `goals` goals [goals].

**SLP (`slp/definition.ts`)**, title "SLP report", subtitle "Detail for assessment and intervention planning."
- Glance: independent_starts, prompt_dependency, words_used (label "Vocabulary items"), needed_repair.
- Sections: `functions` barRows [functions] "Communication functions" · `combinations` combinations [combinations] "Symbol combinations" / "{built} built messages, average {avg} symbols. {stored} were stored phrases." · `vocabChange` metricPair [new_words, vocabulary_retention] "Vocabulary introduction and retention" · `latency` latencyCard [response_latency] "Response latency" · `timeOfDay` barChart [time_of_day] "Messages by time of day" · `goals` goals [goals].

**Educator (`educator/definition.ts`)**, title "School report", subtitle "Participation in class activities only."
- Glance: class_messages, class_help_requests, class_independent_starts, class_words (count of distinct, label "Words used in class").
- Sections: `classWords` wordChips [class_words] "Words used in class" · `independence` barRows [class_prompted_vs_independent] "Independent and prompted" · `weekly` lineChart [class_messages_weekly] "Class messages over 6 weeks" · `idea` planningIdea [planning_idea] · `goals` goals [goals].

**OT (`ot/definition.ts`)**, title "OT report", subtitle "How the child accesses and uses the device."
- Glance: session_length (label "Average session"), corrections, repeated_taps, abandoned.
- Sections: `access` metricPair [latency_within_session] "Access within a session" / caution "Changes in speed can reflect fatigue, position or setup. This report does not explain why." · `interaction` barRows [corrections, repeated_taps, abandoned] "Interaction pattern" · `pages` latencyCard-style card [pages_per_session] "Screens visited per session" · `setup` notes [setup_notes] "Setup notes (entered by an adult)" · `goals` goals [goals].

The response latency caution, shown everywhere latency appears: "Time from the board appearing to a chosen core symbol. Motor, visual and setup factors affect this. It is not a measure of language ability."

### 8.3 Planning idea templates (deterministic, drafts pending H-07)

Shown only when the role's definition includes `planning_idea` and the period has 5+ sessions. Pick the first rule whose condition is true; if none, hide the section.

| ID | Role | Condition | Text |
| --- | --- | --- | --- |
| PI-P1 | parent | One time-of-day bucket has at least 40% of messages and at least 2 thing-category words were used | "Most messages were in the {bucket}. You could offer a choice during {bucket} activities, such as {thing1} or {thing2}." |
| PI-P2 | parent | Any period | "The words used most were {word1} and {word2}. You could model them during everyday routines." |
| PI-E1 | educator | class_help_requests ≥ 1 | "{helpWord} was used for {n} help requests in class. Consider preparing symbols for the next class activity." |
| PI-E2 | educator | class_messages ≥ 1 | "{n} messages were recorded in class. Consider planning one more chance to choose during each lesson." |

Every planning idea card ends with: "A suggestion for adults. Nothing in the app changes by itself."

### 8.4 Wording rules (enforced by test T-137)

- Change wording uses only: "{n} more than the previous {days} days", "{n} fewer than the previous {days} days", "the same as the previous {days} days".
- A test scans every string in `en.ts` and every report definition and fails if it finds: improve, improved, improvement, progress (except in "Goals and progress"), plateau, decline, regress, therapy working, diagnos, delay, deficit, normal, abnormal, better, worse.

---

## 9. Screens and behaviour

### 9.1 Navigation map (`src/app/navigation/routes.ts`)

```text
RootStack (native stack, headerShown false)
  Boot              loads fonts, opens DB, runs migrations, decides next route
  Onboarding        OB-1 Welcome → OB-2 Guardian PIN → OB-3 Learner → OB-4 Consent → OB-5 Device check
  AdultSignIn       FB-01 (modal)
  Adult             AdultTabs (requires signed-in role)
    HomeTab         AH-1 Adult home → StartSession (SS-1), ReviewSession (RS-1)
    ChildTab        FB-03 Learner profile → Goals (GL-1, GL-2)
    VocabularyTab   FB-06 Vocabulary
    ReportsTab      DB-01/DB-03 Dashboard → Builder (DB-02/DB-04) → Report (R-01..R-04) → History (DB-06) → Share (DB-05)
    SettingsTab     FB-05 Settings → Child view, Voice and audio, Roles and permissions (FB-04),
                    Privacy and consent (FB-02), Data and retention, About
  ChildMode         CB board (full screen) with Break overlay
```

Boot rules: (1) if onboarding is not complete, go to Onboarding; (2) if a session is still open (app was killed), end it with `end_reason = 'app_restart'` using the last event time; (3) go to AdultSignIn.

Layout rules: on tablets (shortest side 600 dp or more) lock landscape; on phones lock portrait. Adult screens on tablets use a centred column 600 dp wide, except the Dashboard (DB-03) and Builder (DB-04), which use their tablet layouts. A signed-in adult is signed out after 5 minutes without touch in the adult area.

### 9.2 Screen list

Designed in Figma v2 (build to match):

| ID | Screen | Figma node | Notes |
| --- | --- | --- | --- |
| DB-01 | Dashboard (phone) | 8:341 | Learner card, PeriodPicker, "Reports by role" list, glance (messages_sent, words_used, sessions, independent_starts), Messages chart, LimitationBanner, "Build a report" |
| DB-03 | Dashboard (tablet) | 12:514 | Same content, tablet layout with navigation rail |
| DB-02 | Report builder (phone) | 8:504 | Role cards, period, section toggles, "Preview report", "Save as default for this reader" |
| DB-04 | Report builder (tablet) | 12:666 | Options column 360 wide + live preview |
| DB-05 | Share and consent | 12:828 | Summary, ConsentBanner, destination rows, consent dialog |
| DB-06 | Message history | 12:907 | SegmentedControl All / Built / Stored phrases, rows newest first |
| R-01 | Parent report | 9:341 | From definition 8.2 |
| R-02 | SLP report | 9:487 | From definition 8.2 |
| R-03 | Educator report | 9:632 | From definition 8.2 |
| R-04 | OT report | 9:770 | From definition 8.2 |
| CB | Child board states | 13:354, 13:554, 13:776, 13:998 | Home grid, sentence built, speaking, after speaking with adult check |
| FB-01 | Adult sign-in | 14:1052 | Role list + 4 PIN dots + numeric keypad |
| FB-02 | Privacy and consent | 14:1112 | |
| FB-03 | Learner profile | 14:1172 | |
| FB-04 | Roles and permissions | 14:1240 | Parent only can edit |
| FB-05 | Settings | 14:1350 | |
| FB-06 | Vocabulary | 14:1492 | Read-only |

Not designed (build from existing components, same spacing and styles; the human reviews them at the STOP after P8):

| ID | Screen | Content |
| --- | --- | --- |
| OB-1 | Welcome | Title "Katha AAC", body "A communication board for your child, with reports for the adults who support them. Everything stays on this tablet.", OfflineBadge, Primary L "Get started" |
| OB-2 | Guardian PIN | "Create the guardian PIN", body "The guardian manages consent, roles and data.", 4 PIN dots + keypad, confirm step |
| OB-3 | Learner | TextField display name (default "Demo Learner"), TextField participant code (default "P-07"), Chip Warning "Fictional profile for demonstration" while `is_fictional = 1`, grid size, hand |
| OB-4 | Consent | ConsentBanner, guardian consent toggle (required to continue), research logging toggle (optional, default off), Primary L "Continue" |
| OB-5 | Device check | Voice status ("Sinhala voice found" or "No Sinhala voice; recorded clips only"), "Play test sentence" button, screen pinning guide (3 numbered steps), Primary L "Finish" |
| AH-1 | Adult home | Primary L "Start child mode", Card "Sessions to review" (count, ListRows for each unreviewed session, newest first), StatTile row (messages last 7 days, sessions last 7 days), ListRow "Screen pinning help" |
| SS-1 | Start child mode | Learner name, Fac/Heading "Where is this session?", SegmentedControl Home / School / Therapy / Not sure (stored as unknown), body "Child mode hides other apps. To come back, hold two fingers in the top-left corner for 3 seconds.", Primary L "Start" |
| RS-1 | Review session | Header (date, setting, duration), list of the session's messages (MessageHistoryRow); tapping a row opens TagSheet; Card "Communication opportunities" with two number steppers ("Opportunities you noticed", "Started without a prompt", second ≤ first) and "Not recorded" ghost button; setup note TextField (shown only to `ot` and `parent`); Primary L "Save review" |
| TagSheet | Bottom sheet | Sentence, Intent chips (Meant / Not meant / Unsure), Function chips (Requesting / Refusing / Commenting / Greeting), Prompting chips (Independent / Gesture / Verbal / Model / Physical), Breakdown chips (Yes / No), "Clear all", "Done". Every group optional; a group with no choice stays not recorded |
| GL-1 | Goals | List of goals (Card: title in MixedText, target, latest progress ProgressBar), Primary M "Add goal" |
| GL-2 | Goal edit | Title TextField, target number stepper, period SegmentedControl Week / Month / Term, visible-to toggles per role, "Add progress" (achieved count + note for a chosen period) |
| ST-1 | Child view settings | Grid size 3x4 / 4x5 / 5x6, hand Right / Left, idle return 15 s / 30 s / 60 s / Off, reduced motion toggle, adult check chip toggle |
| ST-2 | Voice and audio | Voice status, test sentence, number of recorded clips installed |
| ST-3 | Data and retention | "Delete records older than" 6 / 12 / 24 months (Danger M, PIN confirm), "Delete all records" (Danger M, PIN confirm), "Reset demonstration data" (only when learner is fictional) |
| ST-4 | About | App version, schema version, vocabulary version, "Export error log" (parent only), open-source licences list |

### 9.3 Child board behaviour (CB)

Layout (section 5.5): message row on top (MessageBar, Clear, Undo, Replay, Speak; mirrored for left hand), grid in the middle, CoreKeyRow at the bottom. Background child/bg.

| Action | Behaviour |
| --- | --- |
| Tap a word cell | Pressed feedback 120 ms. If the draft is empty and the symbol is a template trigger, open the template (draft shows template words and an empty slot; emit `template_opened`). Else if a template slot is open: if the symbol's category is allowed, fill the slot; if not, emit `template_rejected` and do nothing visible. Else append to the draft. Emit `symbol_selected` (source `grid`) and speak the word (audio kind `word`). |
| Tap a folder cell | Open the folder page, emit `page_opened` (via `folder`). Not added to the message. |
| Tap a hidden cell | Nothing. |
| Core key help, more, stop, yes, no | Same as a word cell with source `core`. |
| Core key home | Show page `home`, emit `page_opened` (via `home_key`). |
| Core key quick | Show page `quick`, emit `page_opened` (via `quick_key`). |
| Core key break | Show the Break overlay, emit `break_started`, speak the break word. |
| Tap a stored phrase (quick page) | Emit `symbol_selected` (source `quick`), then submit immediately as a `stored_phrase` message and speak it. |
| Speak | Enabled when the draft has at least one symbol and no slot is empty. Commit the message in one transaction, then speak (audio kind `message_first`). Disabled while committing. |
| Replay | Enabled when the bar shows a submitted message. Speak it again (audio kind `message_replay`), emit `message_replayed`. Never creates a message. |
| Undo | Enabled when the draft has child-selected symbols. Removes the last child-selected symbol (template words are not removable; undoing the slot word empties the slot). Emit `undo` with `quickUndo` true if within 2000 ms of that selection. |
| Clear | Long press 800 ms with a progress ring on the button border. Clears the draft, emits `clear`, and `draft_abandoned` + `exploration_flagged` if the draft had symbols. A short press does nothing. |
| Next tap after a submitted message | Starts a new draft; the bar shows the new draft. |
| Speaking | Bar in Speaking state; grid opacity 0.7 but still tappable; message chips highlight one by one, evenly spaced across the audio duration (instant swap when reduced motion is on). |
| After speaking | If the adult check chip is on, show IntentConfirmChip for 6 s over the last hidden cell of the current page. Tapping an answer emits the bus event `intent_answered { messageId, answer }` and hides the chip. If the page has no hidden cell, do not show the chip. |
| Audio failed or unsupported | Child sees the sentence in the bar with no sound and no warning. Show a 10 dp dot in adult/dot at the bar's top-right corner for 10 s. Record the audio outcome. |
| Idle | No touch for the idle return time on any page except home: return to home with a 1 s fade (instant with reduced motion), emit `idle_return`. The draft is kept. |
| Break overlay | Fill child/band, pictogram break 160 dp, label "විවේකය" in Child/Message. After 3 s show a 136x96 key with the home pictogram and "ගෙදර"; tapping it closes the overlay, emits `break_ended` and `page_opened` (via `break_end`). |
| Leaving child mode | Only through the adult gate: two fingers held for 3 s inside the top-left 120x120 dp area (Pan gesture with `minPointers(2)`, cancel if the fingers move more than 20 dp). Opens AdultSignIn. Signing in ends the session (`adult_exit`) and opens RS-1. Cancelling or a wrong PIN returns to the board with no message. |
| Android back button | Ignored in child mode. |
| App in background | If the app stays in the background more than 120 s, end the session with `background_timeout`. Active time counts only while the board is in the foreground. |
| On a phone | ChildMode shows EmptyState "Child mode needs a tablet" with a Ghost button back. |

Child strings (Sinhala, from the vocabulary file, drafts): Speak button "කියන්න", template display "මට ___ ඕනේ".

### 9.4 Adult string list

Put every adult string in `src/core/i18n/en.ts`, grouped by screen (`dashboard.*`, `builder.*`, `report.*`, `history.*`, `share.*`, `signin.*`, `onboarding.*`, `home.*`, `session.*`, `review.*`, `goals.*`, `settings.*`, `errors.*`). Use the exact texts shown in the Figma frames and in sections 8 and 9. Error messages:

| Key | Text |
| --- | --- |
| errors.generic | "Something went wrong. Your records are safe. Please try again." |
| errors.db_open | "The app could not open its records. Restart the app. If this keeps happening, contact support." |
| errors.export_failed | "The report could not be exported. Nothing was sent." |
| errors.audio_unavailable | "No Sinhala voice is installed. Only recorded clips will play." |

---

## 10. Task list

Format: each task has **Depends on**, **Files**, **Do**, **Accept**. Run `npm run check` (type check + lint + tests, defined in T-005) at the end of every task unless the task says otherwise.

### P0. Project setup

#### T-001 Create the project
- Depends on: none
- Files: project root
- Do:
    1. If the folder already contains app code, stop and report (instruction 5).
    2. `npx create-expo-app@latest katha-aac --template blank-typescript`.
    3. In `app.json` set: `name` "Katha AAC", `slug` "katha-aac", `version` "1.0.0", `orientation` "default", `userInterfaceStyle` "light", `android.package` "com.katha.aac" (placeholder, listed in RELEASE.md), `android.versionCode` 1, `android.allowBackup` false, `android.permissions` [] (no permissions), `ios` omitted.
    4. Add `expo-dev-client`. Remove the template's example content from `App.tsx` and make it render `src/app/App.tsx`.
- Accept: `npx expo prebuild --platform android --clean` succeeds; `npx expo run:android` opens a blank app on an emulator or tablet.

#### T-002 Install dependencies
- Depends on: T-001
- Do: install every package in section 2 with `npx expo install` (runtime) and `npm i -D` (dev: `@testing-library/react-native`, `jest-expo`, `eslint-plugin-boundaries`, `prettier`, `eslint-config-prettier`, `react-native-svg-transformer`, `better-sqlite3`, `@types/better-sqlite3`). Add the `expo-sqlite` config plugin entry with SQLCipher enabled in `app.json` plugins (option name per the installed version's documentation; record it in docs/ARCHITECTURE.md).
- Accept: `npm ls` has no missing peer dependency errors; prebuild still succeeds.

#### T-003 TypeScript, Babel, Metro
- Depends on: T-002
- Files: `tsconfig.json`, `babel.config.js`, `metro.config.js`, `src/types/svg.d.ts`
- Do: `strict: true`, `noUncheckedIndexedAccess: true`, path `@/*` → `src/*`. Babel: `babel-preset-expo`, `module-resolver` alias `@` → `./src`, `react-native-reanimated/plugin` last. Metro: SVG transformer (svg as component). Declare `*.svg` module type.
- Accept: `npx tsc --noEmit` passes; importing an SVG from `assets/icons` renders in a test component.

#### T-004 Lint, format, module boundaries
- Depends on: T-003
- Files: `.eslintrc.js`, `.prettierrc`
- Do: extend `expo` and `prettier`. Configure `eslint-plugin-boundaries` element types `app` (`src/app/**`), `core` (`src/core/**`), `feature` (`src/features/*/**`, capture the feature name). Rules: `core` may import only `core`; `feature` may import `core`, files inside its own feature, and other features only via `src/features/*/index.ts`; `app` may import anything's `index.ts` and `core`. Add rule `no-restricted-syntax` banning string literals matching `/#[0-9a-fA-F]{6}/` in `src/features/**` and `src/core/ui/**`.
- Accept: a temporary file in `features/board` that imports `features/audio/domain/x` fails lint; delete it afterwards.

#### T-005 Test setup and scripts
- Depends on: T-003
- Files: `jest.config.js`, `package.json` scripts
- Do: preset `jest-expo`, moduleNameMapper for `@/`, SVG mock, `expo-sqlite` replaced in Jest by `src/core/db/__mocks__/sqliteMemory.ts`: an adapter over an in-memory `better-sqlite3` database that implements the same `Db` interface used by T-012 (`run`, `get<T>`, `all<T>`, `tx`). Production code never imports `better-sqlite3`. Scripts: `typecheck`, `lint`, `test`, `check` (= typecheck && lint && test), `e2e` (= maestro test e2e).
- Accept: `npm run check` passes with one sample test.

#### T-006 Folders, manifests and docs
- Depends on: T-004
- Files: everything in section 3; `src/app/registry/featureRegistry.ts`
- Do:
    1. Create all folders and files of section 3. Feature `index.ts` files start empty except `export {};`.
    2. Define in `src/core/types/manifest.ts`:
       ```ts
       export interface Migration { id: string; up: (db: Db) => Promise<void> }  // id like '010_access_learners'
       export interface FeatureManifest {
         id: string;
         migrations?: Migration[];
         eventHandlers?: Array<{ event: string; handle: (payload: unknown) => Promise<void> }>;
         reportDefinitions?: ReportDefinition[];
       }
       ```
    3. Each feature exports `manifest` from `feature.manifest.ts`; `featureRegistry.ts` imports all manifests in a fixed array.
    4. Write `docs/TASKS_STATUS.md` with one unchecked line per task in this file. Write empty `docs/BLOCKERS.md`.
    5. Write `CLAUDE.md` containing sections 0, 1A and 4 of this file verbatim.
    6. Write `docs/DEFINITIONS.md` with sections 7.1 and 7.2, and `docs/ROLE_MATRIX.md` with sections 8.2 and 8.3.
- Accept: `npm run check` passes; every feature folder has the five required entries.

#### T-007 Continuous integration
- Depends on: T-005
- Files: `.github/workflows/ci.yml`
- Do: on push and pull request: checkout, setup Node LTS, `npm ci`, `npm run check`.
- Accept: the workflow file passes `npx yaml-lint` or equivalent syntax check; document in README.

#### T-008 EAS build profiles
- Depends on: T-002
- Files: `eas.json`, `docs/RELEASE.md`
- Do: profiles `development` (developmentClient, APK), `preview` (APK, internal), `production` (AAB, autoIncrement versionCode). Document build commands and the local fallback `npx expo run:android --variant release`.
- Accept: `npx eas-cli build:configure` style validation passes, or the JSON matches EAS schema (record which).

#### T-009 Device spikes
- Depends on: T-002
- Files: `docs/spikes.md`, temporary `src/app/dev/Spikes.tsx` (delete after)
- Do on the real tablet:
    1. Voice: list voices with `Speech.getAvailableVoicesAsync()`; record any whose language starts with `si`. Speak "මට වතුර ඕනේ" with `language: 'si-LK'`. Record whether it is audible and understandable.
    2. Clip: play a short placeholder m4a with `expo-audio`. Record start delay.
    3. SQLCipher: create an encrypted DB with a key, write a row, restart, read it; copy the DB file with `adb` and confirm it cannot be opened without the key.
    4. PDF: `Print.printToFileAsync` with HTML containing Sinhala text using an embedded Noto Sans Sinhala `@font-face` (base64); open the PDF; record missing glyphs.
- Accept: `docs/spikes.md` lists device model, Android version and the result of each spike. Any failure becomes a BLOCKER entry.

`STOP: human review` (spike results decide whether D-08 voice fallback and D-16 encryption hold).

### P1. Core platform

#### T-010 Theme
- Depends on: T-006
- Files: `src/core/theme/tokens.ts`, `typography.ts`, `fonts.ts`, `ThemeProvider.tsx`, `useTheme.ts`
- Do: tokens from 5.1 and 5.2; `parseColor('#RRGGBB@a')` → `rgba()`; `ThemeProvider` with mode `light` (prop allows `dark`, `highContrast`); `useTheme()` returns `{ color(name), space, radius, size, text(styleName) }` where `text()` returns a React Native TextStyle (family, weight via family file, size, lineHeight). `fonts.ts` loads Noto Sans Regular, SemiBold, Bold and Noto Sans Sinhala Regular, Medium, SemiBold with `useFonts`.
- Accept: unit test checks 46 colour tokens × 3 modes, every value valid; text('Child/Message') lineHeight = 48.

#### T-011 Strings
- Depends on: T-006
- Files: `src/core/i18n/en.ts`, `t.ts`
- Do: `t(key, params?)` with `{name}` interpolation; missing key throws in development and returns the key in production. Add the error strings from 9.4 now; later tasks add their own keys.
- Accept: tests for interpolation and missing keys.

#### T-012 Database
- Depends on: T-006
- Files: `src/core/db/key.ts`, `database.ts`, `migrate.ts`, `tx.ts`
- Do:
    1. `getOrCreateDbKey()`: read `db.key` from SecureStore; if missing, create 32 random bytes with `Crypto.getRandomBytesAsync(32)`, hex-encode, store, return.
    2. `openDatabase()`: open `katha.db` with the key (SQLCipher), run `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL`.
    3. `runMigrations(db, manifests)`: create `schema_migrations`, `settings`, `error_log` if missing; collect migrations from all manifests; sort by `id`; run each not yet applied inside a transaction; insert its id.
    4. `withTransaction(db, fn)`: BEGIN / COMMIT / ROLLBACK on error.
    5. Export a typed `Db` interface (`run`, `get<T>`, `all<T>`, `tx`) so features never touch the driver directly.
- Accept: tests: migrations run once, run again is a no-op, a failing migration rolls back and is not recorded.

#### T-013 Event bus
- Depends on: T-006
- Files: `src/core/events/bus.ts`, `schemas.ts`
- Do: typed in-memory pub/sub `on(type, handler)`, `emit(type, payload)` (handlers awaited in order, errors logged not thrown). `schemas.ts`: TypeScript types for every event in 6.3 plus bus-only events `intent_answered { messageId, answer }`, `session_ended { sessionId }`.
- Accept: tests for ordering and error isolation.

#### T-014 Error logging
- Depends on: T-012
- Files: `src/core/log/errorLog.ts`, `ErrorBoundary.tsx`
- Do: `logError(area, code, error)` inserts into `error_log` with message truncated to 300 characters and app version; never include learner content. `ErrorBoundary` shows `errors.generic` with a "Try again" button. Install `ErrorUtils.setGlobalHandler` to log fatal errors.
- Accept: test that an error inside a child component renders the fallback and writes one row.

#### T-015 Time utilities
- Depends on: T-006
- Files: `src/core/time/time.ts`
- Do: `nowRecord()` → `{ at, offsetMin }`; `toLocal(at, offsetMin)` → Date parts; `localDate(at, offsetMin)` → 'YYYY-MM-DD'; `inPeriod(at, offsetMin, period)`; `previousPeriod(period)`; `periodDays(period)`; `presetPeriod('today'|'7d'|'30d', today)`; `timeOfDayBucket(at, offsetMin)` per 7.2; `formatShortDate`, `formatTime`.
- Accept: tests including midnight boundaries, end-exclusive, offset +330.

#### T-016 Feature registry wiring
- Depends on: T-012, T-013
- Files: `src/app/registry/featureRegistry.ts`, `src/app/providers/AppProviders.tsx`
- Do: at boot, pass all manifests to `runMigrations`, then register every `eventHandlers` entry on the bus. Provide `db` through a React context `DbProvider` exposed from `@/core/db`.
- Accept: test that a fake manifest's migration and handler both run.

#### T-017 Navigation shell and boot
- Depends on: T-010, T-016
- Files: `src/app/App.tsx`, `navigation/*`
- Do: build the navigation map in 9.1 with placeholder screens. Boot screen: load fonts, open DB, run migrations, apply boot rules, lock orientation per device size (`expo-screen-orientation`). Wrap the app in `ErrorBoundary`, `ThemeProvider`, `GestureHandlerRootView`, `SafeAreaProvider`. On DB open failure show `errors.db_open`.
- Accept: app launches to the Onboarding placeholder on a fresh install; tests render each placeholder route.

#### T-018 Icon and Pictogram
- Depends on: T-003, T-043
- Files: `src/core/ui/Icon.tsx`, `src/features/vocabulary/ui/Pictogram.tsx`
- Do: `Icon({ name: IconName, size?: number, color: ColorToken })` with a typed union of the 45 names, applying stroke colour. `Pictogram({ name, size })` renders the SVG; if missing, renders the fallback in 5.7 and logs once.
- Accept: render tests for all 45 icons and the fallback.

#### T-019 MixedText
- Depends on: T-010
- Files: `src/core/ui/MixedText.tsx`
- Do: `MixedText({ text, style, color })` splits on Sinhala runs (U+0D80–U+0DFF, U+200D) and renders nested `<Text>` spans with the Sinhala family at the same size and weight.
- Accept: test that "Goal: ask for help with උදව්" yields two spans with the right families.

### P2. Design system components

For every component: build to section 5.6, props typed, `accessibilityRole` and `accessibilityLabel` set, minimum touch target honoured with `hitSlop` if the visual is smaller. Export from the module listed.

#### T-020 Button (`core/ui`)
- Depends on: T-010
- Accept: render tests for 4 variants × 2 sizes × disabled; height 56 and 48.

#### T-021 Chip, OfflineBadge (`core/ui`), RoleBadge (`features/access/ui`)
- Depends on: T-018
- Accept: render tests for 5 tones and 4 roles with exact labels.

#### T-022 Toggle, SegmentedControl (`core/ui`)
- Depends on: T-010
- Do: SegmentedControl accepts 2 to 4 options.
- Accept: tests: Locked toggle does not call `onChange`; segmented control calls `onChange(index)`.

#### T-023 AppBar, BottomNav (`core/ui`)
- Depends on: T-018
- Accept: BottomNav renders 5 items with active styling.

#### T-024 ListRow, TextField, Card (`core/ui`)
- Depends on: T-018, T-022
- Accept: ListRow subtitle wraps (no truncation) in a 328-wide test container.

#### T-025 Dialog, Toast, EmptyState, ConsentBanner, ProgressBar, NumericKeypad (`core/ui`)
- Depends on: T-020
- Do: NumericKeypad: 3x4 keys (1–9, empty, 0, backspace), each 72x56 dp, Fac/Title digits.
- Accept: render tests; Dialog traps focus for accessibility.

#### T-026 BarChart, LineChart (`core/ui/charts`)
- Depends on: T-010
- Do: data-driven with `react-native-svg`; width from layout (`onLayout`), never fixed 328.
- Accept: snapshot tests with the week sample (9,12,8,14,11,16,13) and line sample (52,58,61,71,71,83).

#### T-027 Report parts (`features/reports/shared/ui`)
- Depends on: T-020 to T-026
- Do: MetricCard, StatTile, LimitationBanner, PeriodPicker (+ PeriodSheet), SectionHeader, BarRow, WordChip, MessageHistoryRow. MetricCard takes a `MeasureResult` and a label and renders Count, Rate or Locked by itself.
- Accept: MetricCard with `locked: true, sessionsSoFar: 3` renders "Shown after 5 sessions (3 so far)".

#### T-028 Child parts (`features/board/ui`, `features/composer/ui`)
- Depends on: T-018
- Do: ClassTint, SymbolCell (size from props), CoreKey, CoreKeyRow (hand prop) in board; ChildButton (kinds speak, undo, clear, replay; clear has `onLongPressComplete` with 800 ms ring), MessageChip, MessageBar (states empty, draft, template, speaking; shows template slot) in composer.
- Accept: tests: SymbolCell Hidden is not pressable; ChildButton clear does not fire on a short press.

#### T-029 IntentConfirmChip (`features/observations/ui`)
- Depends on: T-018
- Accept: three buttons with labels "Meant", "Not meant", "Unsure" for accessibility.

#### T-030 Component gallery
- Depends on: T-020 to T-029
- Files: `src/app/dev/ComponentGallery.tsx`
- Do: dev-only route listing every component in every state. Not included in production builds (`__DEV__` guard).
- Accept: opens on the device in a development build.

#### T-031 Design comparison
- Depends on: T-030
- Do: compare each component with its Figma node (screenshot via Figma tools, or by the specs). Write `docs/design-diff.md`: component, difference, reason.
- Accept: file exists; differences have reasons.

`STOP: human review` (component gallery on the device).

### P3. Vocabulary

#### T-040 Vocabulary content files
- Depends on: T-006
- Files: `assets/vocabulary/vocabulary-v1.json`, `assets/vocabulary/audio-manifest-v1.json`
- Do: write the seed exactly as section 6.5, in the format of 6.4. Audio manifest with empty `words`, `messages`, `phrases`.
- Accept: JSON parses; IDs unique.

#### T-041 Vocabulary types and validator
- Depends on: T-040
- Files: `features/vocabulary/domain/types.ts`, `validate.ts`
- Do: types for the file. `validateVocabulary(content)` returns `{ errors: string[], warnings: string[] }`. Errors: duplicate IDs; a page cell, folder, core key or template referencing an unknown ID; a template slot category that no symbol has. Warnings: a page whose last cell is not `null` (adult check chip cannot show there); a missing pictogram file.
- Accept: tests for each rule; the seed file has zero errors.

#### T-042 Vocabulary repository
- Depends on: T-041, T-012
- Files: `features/vocabulary/data/*`, `index.ts`
- Do: migration `020_vocabulary_versions`. On boot, if the bundled version ID is not installed, insert it and mark it active (previous versions stay for old reports). API: `getActiveVocabulary()`, `getVocabularyById(id)`, `getSymbol(id)`, `getPage(id)`, `isCore(id)`, `categoryOf(id)`.
- Accept: tests for install-once and version switch.

#### T-043 Export icons and pictograms
- Depends on: T-006
- Files: `assets/icons/*.svg`, `assets/pictograms/*.svg`
- Do: export the 45 icons (Figma frame 2:9) and 22 pictograms (frame 3:2, IDs in 5.7) as SVG with the Figma tools. Name files `<name>.svg`. Replace icon stroke colours with `currentColor`.
- Accept: 45 + 22 files; each opens in a browser. If Figma tools are unavailable, BLOCKER.

#### T-044 Grid layout calculator
- Depends on: T-010
- Files: `features/board/domain/gridLayout.ts`
- Do: `computeGrid({ width, height, gridSize })` → `{ cols, rows, gap, cellW, cellH, labelPlacement, effectiveGridSize }` per 5.5, falling back to a smaller grid if a cell is under 72.
- Accept: tests: 1280x800 gives 296x170, 236x127, 195x99 (rounded down to whole dp); a 600x400 screen with 5x6 falls back.

### P4. Event log and sessions (data)

#### T-050 Event-log migrations
- Depends on: T-012
- Do: migration `040_event_log` creating `communication_events`, `communication_attempts`, `audio_attempts` and indexes exactly as 6.1.
- Accept: migration test.

#### T-051 Event-log write API
- Depends on: T-050, T-015
- Files: `features/event-log/data/eventRepo.ts`, `index.ts`
- Do: `appendEvent(e: NewEvent)` (INSERT OR IGNORE, schema_version 1), `commitMessage({ messageId, draftId, sessionId, learnerId, kind, symbolIds, text, templateId, vocabularyVersionId })` which inserts the attempt row and the `message_submitted` event in one transaction, `recordAudioAttempt(a)`. All write functions also `emit` the event on the bus.
- Accept: tests: duplicate ID ignored; failure inside commit leaves no rows.

#### T-052 Event-log read API
- Depends on: T-051
- Do: `loadPeriodData(learnerId, period)` returns sessions, events, attempts, audio attempts for sessions starting in the period; `listMessages(learnerId, period, filter)` for history (newest first, with intent answer joined from observations through a function passed in to avoid a circular import: history calls observations API itself); `firstMeaningfulUseBySymbol(learnerId)`.
- Accept: tests with small inline fixtures; the full reference dataset is checked again in T-120.

#### T-053 Sessions data
- Depends on: T-050
- Files: `features/sessions/data/*`, `domain/*`, `index.ts`
- Do: migration `030_sessions`. API: `startSession({ learnerId, setting, role })` (writes row + `session_started` + `page_opened` home), `endSession(sessionId, reason)` (sets `ended_at`, `active_ms`, emits `session_ended`; if a draft is open, emits `draft_abandoned` with reason `session_end` and `exploration_flagged`), `getOpenSession()`, `listSessions(learnerId, period)`, `listUnreviewedSessions(learnerId)` (sessions ended without a review flag in settings key `review.done.<sessionId>`). Active-time tracker: counts foreground milliseconds via `AppState`; flushes to the row every 15 s; background over 120 s ends the session.
- Accept: tests for active time with background gaps and the 120 s rule (fake timers).

#### T-054 Persistence tests
- Depends on: T-051, T-053
- Do: simulate app restart (close and reopen DB) and assert all rows survive; boot rule ends an open session with `app_restart`.
- Accept: tests pass.

### P5. Audio

#### T-060 Audio service
- Depends on: T-042, T-051
- Files: `features/audio/domain/*`, `data/*`, `index.ts`
- Do: `initAudio()` detects a Sinhala voice (`language` starting with `si`) and caches the result. `speakWord(symbolId, ctx)`, `speakMessage({ messageId, symbolIds, text }, ctx, kind)`, `speakPhrase(phraseId, ctx)`. Order per D-08: clip from manifest → `Speech.speak(text, { language: 'si-LK', voice })` → unsupported. Await completion; on error return `failed`. Always call `recordAudioAttempt`. Return `{ outcome, durationMs }`.
- Accept: tests with mocks for each branch.

#### T-061 Audio asset index
- Depends on: T-040
- Files: `scripts/gen-audio-index.ts`, generated `assets/audio/index.ts`
- Do: React Native cannot `require` dynamic paths. The script reads the manifest and writes a TS map `{ [key]: require('...') }`. Add `npm run gen:audio` and run it in `prebuild`.
- Accept: with an empty manifest the generated file exports empty maps and compiles.

#### T-062 Highlight timing
- Depends on: T-006
- Files: `features/composer/domain/highlight.ts`
- Do: `highlightSchedule(chipCount, durationMs)` → array of start offsets, evenly spaced; with reduced motion return all zeros.
- Accept: unit tests.

### P6. Child board (AAC)

#### T-070 Composer state machine
- Depends on: T-042
- Files: `features/composer/domain/composer.ts`
- Do: pure reducer `composerReducer(state, action)` with state `{ draftId, items: Array<{ symbolId, origin: 'child'|'template', selectedAt }>, templateId, slotIndex, submitted?: { messageId, symbolIds, text }, mode: 'idle'|'draft'|'committing'|'speaking'|'showingSubmitted' }` and actions `tapWord`, `tapStoredPhrase`, `undo`, `clear`, `speakRequested`, `commitSucceeded`, `commitFailed`, `speakFinished`, `replayRequested`, `replayFinished`. Implement every rule of 9.3 that concerns the draft. The reducer returns the next state plus a list of side effects to perform (events to append, audio to play).
- Accept: table-driven tests covering: template open, slot fill, slot rejection, undo of template slot word, undo quick flag, clear with and without items, submit, replay not creating messages, next tap after submit starts a new draft, speak disabled while committing.

#### T-071 Composer effects runner
- Depends on: T-070, T-051, T-060
- Do: a hook `useComposer(session)` that dispatches actions and performs side effects in order: append events, commit message, play audio, record outcomes. Emit `exploration_flagged` with `draft_abandoned`.
- Accept: integration test with fake repositories: building "මට + වතුර + ඕනේ" and Speak writes 3 `symbol_selected`, 1 attempt, 1 `message_submitted`, 1 audio attempt.

#### T-072 Board screen layout
- Depends on: T-044, T-028, T-071
- Files: `features/board/ui/BoardScreen.tsx`
- Do: implement the layout in 9.3 using `computeGrid` and the learner's grid size and hand. Pages render from the vocabulary; cells beyond the grid are ignored; `null` cells render Hidden.
- Accept: render tests for 3 grid sizes and both hands; snapshot of CB-01 matches structure.

#### T-073 Cell, folder, core key and quick phrase actions
- Depends on: T-072
- Do: wire every row of the action table in 9.3 except gate and break.
- Accept: RNTL tests for each row.

#### T-074 Message row buttons
- Depends on: T-072
- Do: Speak, Replay, Undo, Clear enabled states and behaviour per 9.3.
- Accept: tests for enabled states in each composer mode.

#### T-075 Speaking visuals
- Depends on: T-062, T-074
- Do: MessageBar speaking state, grid opacity 0.7, chip highlight schedule, reduced-motion handling.
- Accept: test that reduced motion uses no animation.

#### T-076 Adult check chip
- Depends on: T-029, T-074
- Do: per 9.3; emits bus event `intent_answered`; respects the setting `childView.adultCheck` (default on).
- Accept: test: chip appears for 6 s over the last hidden cell; not shown when the page has none.

#### T-077 Navigation inside child mode, idle return, break
- Depends on: T-073
- Do: page stack (home, folder, quick), idle timer per learner setting, Break overlay per 9.3.
- Accept: fake-timer tests for idle return and the 3 s break key.

#### T-078 Child mode lock and adult gate
- Depends on: T-072
- Do: `expo-keep-awake` while mounted; hide navigation bar (immersive) and status bar; `BackHandler` returns true; two-finger 3 s gate per 9.3 opening AdultSignIn as a modal over the board; on cancel return to the board.
- Accept: test the gate gesture logic as a pure function (`gateStateMachine`); manual device check listed in DEVICE_CHECKLIST.

#### T-079 Audio outcome indicator
- Depends on: T-071
- Do: adult dot per 9.3 for `failed` and `unsupported`.
- Accept: test that the dot shows for 10 s and nothing else changes.

#### T-080 Phone guard
- Depends on: T-072
- Accept: on a width under 600 dp shortest side, ChildMode renders the EmptyState.

#### T-081 Child board end-to-end flow
- Depends on: T-073 to T-080
- Files: `e2e/child-board.yaml`
- Do: Maestro flow: start a session (via test hook), tap me, water, want, Speak, Replay, Undo after a new tap, long-press Clear, open quick, tap a phrase, break and back.
- Accept: flow passes on emulator; DB checked in a follow-up test hook shows the expected counts.

`STOP: human review` (child board on the real tablet: Sinhala rendering, touch, audio).

### P7. Access, roles and consent

#### T-090 Access migrations
- Depends on: T-012
- Do: migration `010_access` creating `learners`, `consent`, `role_permissions` with the default rows from 6.1.
- Accept: migration test; four permission rows exist.

#### T-091 PIN service
- Depends on: T-090
- Files: `features/access/domain/pin.ts`, `data/pinStore.ts`
- Do: `setPin(role, pin)`: reject anything that is not exactly 4 digits; salt = 16 random bytes hex; hash = SHA-256 applied 1000 times to `salt + pin` (then to the previous hex digest) with `Crypto.digestStringAsync`; store `{ salt, hash, iterations: 1000 }` in SecureStore `pin.<role>`. `verifyPin(role, pin)`: returns `'ok' | 'fail' | 'locked'`; after 5 consecutive failures for any role set `pin.lock.lockedUntil` = now + 60 s; success resets the counter. `hasPin(role)`.
- Accept: tests with a mocked SecureStore and digest; lockout after 5 failures; no PIN or hash ever written to SQLite or logs.

#### T-092 Auth store
- Depends on: T-091
- Files: `features/access/domain/authStore.ts`
- Do: zustand store `{ role: Role | null, signedInAt }` with `signIn(role, pin)`, `signOut()`, and an inactivity timer (5 minutes without touch in the adult area → `signOut()`), reset by a root `onTouchStart` handler. Emit `gate_attempt` only from the child gate path (T-078), never the PIN.
- Accept: tests for sign-in, wrong PIN, lockout and inactivity.

#### T-093 Permissions API
- Depends on: T-090, T-092
- Files: `features/access/domain/permissions.ts`, `index.ts`
- Do: `canView(role, resource)` where resource is `report:<role>`, `history`, `export`, `observations:enter`, or `admin`. Rules: `admin` only for `parent`; `report:x` requires `can_open_report` and (role = x or role = parent); `history`, `export`, `observations:enter` from the table. Also `requireRole(resource)` hook that renders a "Not available for your role" EmptyState when false.
- Accept: a full truth-table test (4 roles × all resources with default permissions).

#### T-094 Adult sign-in (FB-01)
- Depends on: T-093, T-025, T-021
- Do: role list (RoleBadge cards, only roles with a PIN set), 4 PIN dots, NumericKeypad. On 4 digits verify: ok → close modal and continue; fail → clear dots silently; locked → disable keypad for the remaining time with no reason text. Body text: "Adults only."
- Accept: render and behaviour tests.

#### T-095 Onboarding (OB-1 to OB-5)
- Depends on: T-094, T-060, T-042
- Do: build the screens in 9.2. OB-2 sets the `parent` PIN (enter twice). OB-3 creates the learner (fictional by default). OB-4 writes `consent` (guardian consent required to continue). OB-5 runs `initAudio()` and shows the result, plays a test sentence, and shows the screen pinning guide (Android Settings > Security > App pinning; open app; Overview; tap the app icon; Pin). Store `onboarding.complete = true` in settings.
- Accept: Maestro flow `e2e/onboarding.yaml` passes.

#### T-096 Privacy and consent (FB-02)
- Depends on: T-093
- Do: as Figma FB-02. Research logging toggle (parent only). "Withdraw from research" sets `withdrawn_at` and logging off. "Delete all records" (parent only, PIN confirm): deletes all rows from every learner-data table (sessions, events, attempts, audio attempts, observations, goals, goal progress, report exports), keeps learner, consent, permissions and vocabulary. Show Toast "All records deleted".
- Accept: tests for permission checks and that deletion leaves zero rows in the data tables.

#### T-097 Learner profile (FB-03)
- Depends on: T-093
- Do: display name, participant code (locked), hand, grid size, idle return, voice row (opens ST-2). "Goals" ListRow opens GL-1. Fictional-profile chip when `is_fictional = 1`.
- Accept: render and save tests.

#### T-098 Roles and permissions (FB-04)
- Depends on: T-093, T-091
- Do: as Figma FB-04 with one card per role and three toggles plus "Enter observations". Editable only by `parent`; others see it read-only. Parent can set or change any role's PIN from here ("Set PIN" ListRow per role). Show Chip Success "Guardian consent recorded {date}" when consent exists.
- Accept: tests: non-parent cannot change toggles.

### P8. Sessions UI and adult home

#### T-100 Start child mode (SS-1)
- Depends on: T-053, T-022
- Do: as 9.2. On Start: `startSession`, navigate to ChildMode, set the root to prevent back navigation.
- Accept: test that the session row has the chosen setting.

#### T-101 Adult home (AH-1)
- Depends on: T-100, T-027
- Do: as 9.2. "Sessions to review" uses `listUnreviewedSessions`.
- Accept: render tests with and without sessions.

#### T-102 Ending a session
- Depends on: T-078, T-094
- Do: after a successful gate sign-in from ChildMode: `endSession(id, 'adult_exit')`, then navigate to RS-1 for that session if the role may enter observations, else to AH-1.
- Accept: integration test.

`STOP: human review` (undesigned screens OB, AH-1, SS-1 on device; H-05).

### P9. Observations and goals

#### T-110 Observations and goals migrations and API
- Depends on: T-050
- Files: `features/observations/data/*`, `features/goals/data/*`
- Do: migrations `050_observations` and `060_goals` exactly as 6.1. Observations API: `setIntent(messageId, answer|null)`, `setFunction`, `setPrompting`, `setBreakdown` (upsert by `(message_id, kind)`; `null` deletes the row = not recorded), `setOpportunities(sessionId, observed|null, independent|null)` (validates `independent ≤ observed`), `setSetupNote(sessionId, text|null)`, `getForMessages(ids)`, `getForSessions(ids)`. Every write checks `canView(role, 'observations:enter')` and stores `entered_by_role`. Goals API: `createGoal`, `updateGoal`, `archiveGoal`, `addProgress`, `listGoals(learnerId, role)` (only goals whose `visible_to_roles_json` includes the role).
- Accept: tests for validation, permission refusal, upsert and delete.

#### T-111 Intent answers from the child board
- Depends on: T-110, T-076
- Do: in the observations manifest register a handler for bus event `intent_answered` that calls `setIntent(messageId, answer)` with `entered_by_role = 'unknown_adult'` (the chip is tapped by whichever adult is present; `entered_by_role` is a plain TEXT column, so this value is allowed). This write skips the permission check because no adult is signed in.
- Accept: test that a bus event creates one observation row.

#### T-112 TagSheet
- Depends on: T-110, T-021
- Do: bottom sheet per 9.2; each group is a single-select chip row that can be cleared.
- Accept: tests: choosing and clearing writes and deletes rows.

#### T-113 Review session (RS-1)
- Depends on: T-112
- Do: per 9.2. "Save review" stores settings key `review.done.<sessionId> = true` and shows Toast "Review saved".
- Accept: test that the session no longer appears in "Sessions to review".

#### T-114 Goals (GL-1, GL-2)
- Depends on: T-110, T-019
- Do: per 9.2. Goal titles use MixedText.
- Accept: create, edit, archive and progress tests.

#### T-115 Reference dataset fixture
- Depends on: T-051, T-053, T-110
- Files: `features/analytics/tests/fixtures/referenceDataset.ts`
- Do: write exactly the sessions, events, messages, audio attempts, observations and goal in section 7.3 (local times converted with offset +330), on top of the seed vocabulary. Export the expected values from 7.3 as a typed object.
- Accept: loading it creates 8 sessions, 7 messages (m0 to m5 and m7), 1 replay event.

### P10. Analytics engine

#### T-120 Input loader
- Depends on: T-052, T-110, T-115
- Files: `features/analytics/data/loadInput.ts`
- Do: build `AnalyticsInput` (section 7) for a learner and period with at most 6 SQL queries.
- Accept: test with the reference dataset: counts of sessions, events, attempts match 7.3.

#### T-121 Count measures
- Depends on: T-120
- Do: `sessions`, `messages_sent`, `selections`, `words_used`, `top_words`, `new_words`, `combinations`, `time_of_day`, `session_length`, `pages_per_session` as pure functions in `domain/measures/`.
- Accept: each equals 7.3.

#### T-122 Adult-entry measures
- Depends on: T-120
- Do: `confirmed_meant`, `independent_starts`, `prompted_vs_independent`, `prompt_dependency`, `functions`, `needed_repair`.
- Accept: each equals 7.3, including `notRecorded`.

#### T-123 Interaction and timing measures
- Depends on: T-120
- Do: `response_latency`, `latency_within_session`, `corrections`, `repeated_taps`, `abandoned`, `vocabulary_retention`.
- Accept: each equals 7.3 (latency 2.5 s from samples 2.0 and 3.0).

#### T-124 Class measures, goals, notes
- Depends on: T-121, T-122
- Do: `class_messages`, `class_words`, `class_help_requests`, `class_independent_starts`, `class_prompted_vs_independent`, `class_messages_weekly`, `goals`, `setup_notes`.
- Accept: each equals 7.3.

#### T-125 Registry and getMeasures
- Depends on: T-121 to T-124
- Files: `features/analytics/domain/registry.ts`, `index.ts`
- Do: registry entries with `id, compute, minSessions, source`. `getMeasures({ learnerId, period, role, ids })` loads input once, computes the requested IDs, applies locks (rate lock, class lock), and refuses IDs the role's report definition does not contain unless role is `parent` (throw `MeasureNotAllowed`).
- Accept: tests for locks and refusal.

#### T-126 Reference dataset tests
- Depends on: T-125
- Do: one test file asserting every row of the Period A table and every statement of the Period B check in 7.3.
- Accept: all pass.

#### T-127 Invariant tests
- Depends on: T-125
- Do: generated random sessions (seeded) asserting: replays, undos, clears and single-word taps never change `messages_sent`; percentages are within 0–100; numerator ≤ denominator.
- Accept: 200 seeded runs pass.

#### T-128 Performance
- Depends on: T-125
- Do: generate 365 days × 3 sessions × 40 events; `getMeasures` for a 30-day period for all measures completes in under 300 ms on the tablet (measure in a dev screen) and under 1 s in Jest.
- Accept: timings recorded in `docs/DEVICE_CHECKLIST.md`.

### P11. Dashboard, builder, reports, history

#### T-130 Report definitions
- Depends on: T-125
- Files: `features/reports/{parent,slp,educator,ot}/definition.ts`, each feature folder's manifest
- Do: write the four definitions exactly as 8.2, registered through `reportDefinitions` in the `reports` manifest via an index per role folder. Add a `history` folder for DB-06.
- Accept: test that each definition only references registered measures.

#### T-131 Section renderers
- Depends on: T-027, T-026, T-130
- Files: `features/reports/shared/sections/*`
- Do: one component per `SectionKind`, each taking the section definition and its `MeasureResult`s. Locked results render MetricCard Locked or, for lists and charts, a Fac/Caption line "Shown after 5 sessions ({n} so far)". Not-recorded counts appear in the subtitle template.
- Accept: render tests per kind with locked and unlocked data.

#### T-132 Report screen (R-01 to R-04)
- Depends on: T-131, T-093
- Do: header, LimitationBanner, glance, sections, buttons (8.1). Uses `requireRole('report:<role>')`. If the period has 0 sessions, show EmptyState "Not enough data yet" / "Counts and word lists appear after the first session. Rates and trends appear after 5 sessions."
- Accept: snapshot tests for four roles with the reference dataset.

#### T-133 Dashboard (DB-01, DB-03)
- Depends on: T-132
- Do: per 9.2. Messages chart: periods up to 7 days by day, up to 31 days by week, longer by month. "Reports by role" lists the roles the signed-in role may open.
- Accept: render tests phone and tablet.

#### T-134 Report builder (DB-02, DB-04)
- Depends on: T-132
- Do: role (limited by permissions), period, section toggles from the definition. Header, notice and glance cannot be switched off. "Save as default for this reader" writes `report.defaults.<role>` = enabled section IDs. Tablet shows live preview using T-132 with the selection.
- Accept: tests: saved defaults reload; disabled sections are absent from the report.

#### T-135 Message history (DB-06)
- Depends on: T-052, T-112
- Do: per 9.2; tapping a row opens TagSheet if the role may enter observations.
- Accept: filter tests.

#### T-136 Planning ideas
- Depends on: T-125
- Files: `features/reports/shared/planningIdeas.ts`
- Do: rules and texts of 8.3, deterministic.
- Accept: tests for each rule's condition and the fallback to hidden.

#### T-137 Wording guard
- Depends on: T-130, T-136
- Do: the test in 8.4 over `en.ts`, report definitions and planning texts.
- Accept: passes; adding the word "improved" to a test string makes it fail.

#### T-138 Role isolation
- Depends on: T-132
- Do: a test that builds the app registry without the `ot` folder and asserts the other three reports render identical snapshots.
- Accept: passes.

#### T-139 Reports end-to-end
- Depends on: T-133 to T-138
- Files: `e2e/reports.yaml`
- Do: load demo data (T-172 hook available in dev), sign in as each role, open its report, check the visible headings.
- Accept: passes on emulator.

`STOP: human review` (four reports on the tablet; H-07 starts).

### P12. Share and PDF export

#### T-140 Report HTML builder
- Depends on: T-132
- Files: `features/share/domain/reportHtml.ts`
- Do: pure function `buildReportHtml(definition, results, meta)` → HTML string, A4 portrait, 16 mm margins. Contents: header (role, learner name and code, period, sessions, generated date), notice, glance as a 2x2 table, each section as HTML (bars as `div` widths, charts as inline SVG), "Definitions used" appendix listing each measure's definition text from the registry, footer "Generated by Katha AAC on {date}." plus "Sample data" when fictional. No external URLs.
- Accept: tests: notice, definitions and every enabled section heading present; no `http` in output.

#### T-141 Fonts in PDF
- Depends on: T-140
- Do: embed Noto Sans and Noto Sans Sinhala as base64 `@font-face` (read from assets with `expo-asset` + `expo-file-system`, cached).
- Accept: device check: Sinhala renders in the PDF (DEVICE_CHECKLIST).

#### T-142 Share flow (DB-05)
- Depends on: T-140, T-025
- Do: destinations: Save on this device (Storage Access Framework folder picker via `FileSystem.StorageAccessFramework`), Share with another app (`Sharing.shareAsync`), Print (`Print.printAsync`). Every export shows the consent Dialog ("Share this report?" / "The {role} report for {code} will leave this device. You will be asked for consent each time." / Cancel / Share). Temporary files deleted after sharing.
- Accept: tests for the dialog on every path.

#### T-143 Export log and permissions
- Depends on: T-142, T-093
- Do: insert `report_exports` row after a successful export (no content). Only roles with `export` permission see the button; a role may export only reports it may open.
- Accept: tests.

### P13. Settings

#### T-150 Settings list (FB-05)
- Depends on: T-093
- Do: rows: Child view (ST-1), Voice and audio (ST-2), Language (static "English, Sinhala"), Learner profile, Roles and permissions, Privacy and consent, Data and retention (ST-3), About (ST-4); reduced motion toggle row; "Reset demonstration data" Danger M only when the learner is fictional.
- Accept: render test.

#### T-151 Child view settings (ST-1)
- Depends on: T-150
- Accept: values persist and the board reflects them.

#### T-152 Voice and audio (ST-2)
- Depends on: T-060
- Accept: status text matches `initAudio()` result.

#### T-153 Data and retention (ST-3)
- Depends on: T-096
- Do: delete records whose session started before now − 6/12/24 months (PIN confirm, parent only).
- Accept: tests on fixture data.

#### T-154 About (ST-4)
- Depends on: T-014
- Do: versions, licences (generate with `npx license-checker --json` into `assets/licences.json` at build), "Export error log" (parent only) as a text file through the share sheet.
- Accept: render test.

#### T-155 Vocabulary (FB-06)
- Depends on: T-042
- Do: read-only list with pictogram, label (MixedText), gloss "(draft label)", category chip, and the note banner.
- Accept: lists all symbols of the active version.

### P14. Hardening

#### T-160 Accessibility
- Depends on: P11
- Do: every pressable has a label and role; adult text `maxFontSizeMultiplier` 1.3; child view ignores font scaling; a test computes contrast ratios of all text/background token pairs used and fails below 4.5:1 for Light.
- Accept: contrast test passes; TalkBack walkthrough of sign-in and a report in DEVICE_CHECKLIST.

#### T-161 Performance
- Do: tap-to-pressed-feedback under 100 ms and tap-to-word-audio start under 300 ms on the tablet (measure with timestamps in a dev build); memoise grid cells; avoid re-rendering the grid on composer changes.
- Accept: numbers recorded in DEVICE_CHECKLIST.

#### T-162 Security and privacy review
- Do: confirm and record: DB file unreadable without key; no PIN or learner content in logs; `allowBackup` false; no network permission in the merged Android manifest; no third-party SDKs that collect data; secure storage used for keys and PINs only.
- Accept: `docs/PRIVACY.md` "Technical safeguards" section filled with evidence.

#### T-163 Error states
- Do: every screen that loads data shows a loading state and an error state with `errors.generic` and "Try again".
- Accept: tests force a repository error per screen.

#### T-164 Robustness
- Do: kill the app during speaking, during commit, during export; restart; confirm no duplicate or partial rows and the boot rules run.
- Accept: results in DEVICE_CHECKLIST.

#### T-165 Upgrade test
- Do: install build N (schema at current), add data, install build N+1 with a dummy migration `999_test` (removed afterwards), confirm data intact.
- Accept: result recorded.

### P15. Quality assurance

#### T-170 Full end-to-end flows
- Files: `e2e/*.yaml`
- Do: onboarding, start session, child board, end session, review, four reports, builder, history, share (to the share sheet), settings changes, delete all.
- Accept: all pass on an emulator with a tablet profile.

#### T-171 Device checklist
- Files: `docs/DEVICE_CHECKLIST.md`
- Do: write and run checks: Sinhala rendering on every screen, audio clip and voice, gate gesture, back button blocked, immersive mode, screen pinning guide, idle return, break, touch sizes, reduced motion, PDF Sinhala, performance numbers, restart robustness, TalkBack.
- Accept: every line has Pass, Fail or NOT RUN with a note.

#### T-172 Demonstration data
- Do: `loadDemoData()` (fictional learner only) writing 9 sessions over 7 days and 83 messages with observations so all four reports show unlocked content; available from Settings "Reset demonstration data" and as a dev test hook. Clearly labelled sample.
- Accept: dashboard shows 9 sessions, 83 messages.

#### T-173 Review packs
- Files: `docs/review/slp.md`, `ot.md`, `teacher.md` plus exported sample PDFs
- Do: each pack: the role's sample PDF, the definitions it uses, its planning idea texts, and questions: "Which measures are useful?", "Is anything misleading?", "Is the wording acceptable?", "What is missing?".
- Accept: three packs exist.

#### T-174 Issue list
- Files: `docs/ISSUES.md`
- Do: every failed check, design difference and blocker, ranked Critical / High / Medium / Low.
- Accept: file exists.

### P16. Release and handover

#### T-180 App identity
- Do: placeholder icon, adaptive icon and splash in `assets/app` using `fac/primary` background and the text "K" (to be replaced by H-05); version 1.0.0 (code 1). About shows app, schema and vocabulary versions.
- Accept: release build shows them.

#### T-181 Release build
- Do: production AAB with EAS (or local signed release if EAS is not available; document keystore handling in RELEASE.md without committing any key).
- Accept: AAB produced; installs from a preview APK on the tablet.

#### T-182 Store and privacy documents
- Files: `docs/PRIVACY.md`, `docs/RELEASE.md`
- Do: privacy policy draft (data stays on device, what is recorded, who can see it, deletion, contact placeholder), Play Data safety answers (no data collected or shared off device), internal testing upload steps for the human.
- Accept: documents complete with placeholders marked `TODO(human)`.

#### T-183 Documentation
- Files: `README.md`, `docs/ARCHITECTURE.md`
- Do: README: setup, run, test, build, demo data. ARCHITECTURE: module map (section 3), data flow (child board → event log → SQLite → analytics → report definition → screen or PDF), how to add a role report, how to ship a new vocabulary version.
- Accept: a new developer can run the app following README only.

#### T-184 Final acceptance
- Do: run `npm run check`, all Maestro flows, and the device checklist; update TASKS_STATUS; summarise open issues and blockers.
- Accept: summary delivered.

`STOP: human review` (release candidate).

---

## 11. Global definition of done

- Every task ticked in `docs/TASKS_STATUS.md` with its checks run, or marked NOT RUN with a reason.
- `npm run check` passes; coverage ≥ 90% lines in `features/*/domain` and `features/analytics`.
- All Maestro flows pass on an emulator; DEVICE_CHECKLIST complete on the real tablet.
- Every number in every report matches `docs/DEFINITIONS.md`, proven by T-126.
- No network use, no learner content in logs, database encrypted, backups disabled.
- No UI text fails the wording guard.
- Removing a role report folder leaves the other reports unchanged (T-138).

---

## 12. Human tasks (not for the executing model)

| ID | Owner | Task | Needed before |
| --- | --- | --- | --- |
| H-01 | Project lead and supervisor | Confirm decisions D-01 to D-20, the definitions in 7.2 and the 5-session rule | P10 |
| H-02 | Speech-language pathologist | Review vocabulary, labels, templates, stored phrases, the want-word spelling (ඕනේ or ඕනෑ); deliver vocabulary v2 JSON | Release |
| H-03 | Project team | Record word and sentence clips for the reviewed vocabulary; deliver files named per 6.6 | Release |
| H-04 | Designer | Final pictogram art for all symbols with licence and attribution | Release |
| H-05 | Designer | Replay pictogram; designs for OB, AH-1, SS-1, RS-1, TagSheet, GL, ST screens; app icon and splash | P8 STOP |
| H-06 | Supervisor | Ethics approval and guardian consent wording before any real child's data | Any real use |
| H-07 | SLP, OT, teacher | Review the review packs (T-173), the planning idea texts, and D-14 (latency for OT, breakdowns for parent) | Release |
| H-08 | Project lead | Google Play Console account, signing key custody, privacy policy contact details | T-181 |
| H-09 | Project lead | Provide a 10-inch Android test tablet with Android 12 or later | T-009 |