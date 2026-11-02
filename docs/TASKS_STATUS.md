# Katha AAC — Task Status

Format: `- [ ] T-NNN description — date note` when done.

## P0. Project setup
- [x] T-001 Create the project (app.json, expo setup) — 2026-11-02 Fixed name, orientation, versionCode, allowBackup, permissions, removed ios
- [x] T-002 Install dependencies — 2026-11-02 All packages from section 2 installed; fonts already in assets/fonts/ (no npm packages)
- [x] T-003 TypeScript, Babel, Metro — 2026-11-02 Created babel.config.js, metro.config.js, svg.d.ts; added noUncheckedIndexedAccess
- [x] T-004 Lint, format, module boundaries — 2026-11-02 Updated eslint.config.js: prettier, boundaries rules, hex-color guard scoped to features/ui
- [x] T-005 Test setup and scripts — 2026-11-02 Added check/e2e scripts; jest.config.js: SVG mock, expo-sqlite mock, transformIgnorePatterns
- [x] T-006 Folders, manifests and docs — 2026-11-02 Created all docs, FeatureManifest type, featureRegistry, populated feature manifests; CLAUDE.md written
- [x] T-007 Continuous integration — 2026-11-02 .github/workflows/ci.yml created (Node LTS, npm ci, npm run check)
- [x] T-008 EAS build profiles — 2026-11-02 eas.json created with development/preview/production profiles
- [ ] T-009 Device spikes — STOP: human review NOT RUN (needs device)

## P1. Core platform
- [x] T-010 Theme (tokens, typography, ThemeProvider) — 2026-11-02 tokens.ts (46 slash-key tokens×3 modes), fonts.ts (useAppFonts), ThemeProvider extended with color()/text()/space/radius/size; backward-compat colors kept; 49 unit tests pass
- [x] T-011 Strings (i18n en.ts, t()) — 2026-11-02 en.ts with error keys + placeholder groups; t() with {param} interpolation; throws in dev / returns key in prod; 7 tests pass
- [x] T-012 Database (key, open, migrations, Db interface) — 2026-11-02 key.ts (SecureStore + Crypto), database.ts (expo-sqlite wrapper), migrate.ts (bootstrap + ordered + transacted), tx.ts; 5 tests: runs-once, no-op, order, rollback+unrecorded
- [x] T-013 Event bus — 2026-11-02 schemas.ts (18 event types from 6.3 + bus-only intent_answered/session_ended_bus), bus.ts (on/emit/resetBus; handlers awaited in order; errors logged not thrown); 6 tests pass
- [x] T-014 Error logging + ErrorBoundary — 2026-11-02 logError (error_log insert, 300-char truncation, no learner content), ErrorBoundary class with functional fallback (useTheme, t()), installGlobalErrorHandler; expo-crypto mocked; 4 tests pass
- [x] T-015 Time utilities — 2026-11-02 nowRecord/toLocal/localDate/inPeriod/previousPeriod/periodDays/presetPeriod/timeOfDayBucket/formatShortDate/formatTime; 31 tests (midnight boundaries, end-exclusive, offset +330)
- [x] T-016 Feature registry wiring — 2026-11-02 DbProvider/useDb context, bootFeatures in featureRegistry.ts, AppProviders.tsx (Theme > ErrorBoundary > DbProvider); 3 tests (migration runs, handler fires, both together)
- [x] T-017 Navigation shell and boot — 2026-11-02 routes.ts (RootStackParams), RootNavigator (native stack, Boot→Onboarding/Adult/ChildMode), BootScreen (fonts+DB+migrations+boot rules), App.tsx (GestureHandler+SafeArea+Theme+ErrorBoundary+Navigation); 3 placeholder render tests pass

## P2. Design system components
- [x] T-018 Icon and Pictogram — 2026-11-02 Icon: 55 icons tested; Pictogram: 45 symbols + runtime fallback (5.7 placeholder square + logError once per symbol); fallback test added
- [x] T-019 MixedText — 2026-11-02 MixedText.tsx splits on U+0D80–U+0DFF/U+200D; maps Latin font weight to Sinhala family; maxFontSizeMultiplier=1.3; 5 tests pass
- [x] T-020 Button — 2026-11-02 4 variants × 2 sizes × disabled; height 56 and 48; pre-existing tests pass
- [x] T-021 Chip, OfflineBadge, RoleBadge — 2026-11-02 RoleBadge created (4 roles, exact labels, pill chip, icon 16); 4 role label tests pass; Chip/OfflineBadge pre-existing
- [x] T-022 Toggle, SegmentedControl — 2026-11-02 Locked toggle does not call onChange; SegmentedControl calls onChange(index); pre-existing tests pass
- [x] T-023 AppBar, BottomNav — 2026-11-02 AppBar root + back; BottomNav 5 items with active styling; pre-existing tests pass
- [x] T-024 ListRow, TextField, Card — 2026-11-02 Added subtitle-wraps test (numberOfLines ≠ 1); all pre-existing tests pass
- [x] T-025 Dialog, Toast, EmptyState, ConsentBanner, ProgressBar, NumericKeypad — 2026-11-02 NumericKeypad created (3×4, 72×56 dp, Fac/Title digits); 5 keypad tests + all pre-existing tests pass
- [x] T-026 BarChart, LineChart — 2026-11-02 Added spec sample tests: week (9,12,8,14,11,16,13) and line (52,58,61,71,71,83); all chart render tests pass
- [x] T-027 Report parts — 2026-11-02 MetricCard, LimitationBanner, PeriodPicker+Sheet, SectionHeader, BarRow, WordChip, MessageHistoryRow in features/reports/shared/ui/; MetricCard locked renders "Shown after 5 sessions (3 so far)"; 15 tests pass
- [x] T-028 Child parts — 2026-11-02 ClassTint, SymbolCell, CoreKey, CoreKeyRow, ChildButton, MessageBar, MessageChip, TemplateSlot; SymbolCell Hidden not pressable; ChildButton clear ignores short press; all tests pre-existing and pass
- [x] T-029 IntentConfirmChip — 2026-11-02 Three buttons "Meant", "Not meant", "Unsure" each 48×48; pre-existing tests pass
- [x] T-030 Component gallery — 2026-11-02 ComponentGallery.tsx created (re-exports DevGalleryNavigator); DevGallery has screens for child board, tokens, grid, message, facilitator, charts
- [ ] T-031 Design comparison — STOP: human review

## P3. Vocabulary
- [ ] T-040 Vocabulary content files
- [ ] T-041 Vocabulary types and validator
- [ ] T-042 Vocabulary repository
- [ ] T-043 Export icons and pictograms
- [ ] T-044 Grid layout calculator

## P4. Event log and sessions (data)
- [ ] T-050 Event-log migrations
- [ ] T-051 Event-log write API
- [ ] T-052 Event-log read API
- [ ] T-053 Sessions data
- [ ] T-054 Persistence tests

## P5. Audio
- [ ] T-060 Audio service
- [ ] T-061 Audio asset index
- [ ] T-062 Highlight timing

## P6. Child board (AAC)
- [ ] T-070 Composer state machine
- [ ] T-071 Composer effects runner
- [ ] T-072 Board screen layout
- [ ] T-073 Cell, folder, core key and quick phrase actions
- [ ] T-074 Message row buttons
- [ ] T-075 Speaking visuals
- [ ] T-076 Adult check chip
- [ ] T-077 Navigation inside child mode, idle return, break
- [ ] T-078 Child mode lock and adult gate
- [ ] T-079 Audio outcome indicator
- [ ] T-080 Phone guard
- [ ] T-081 Child board end-to-end flow — STOP: human review

## P7. Access, roles and consent
- [ ] T-090 Access migrations
- [ ] T-091 PIN service
- [ ] T-092 Auth store
- [ ] T-093 Permissions API
- [ ] T-094 Adult sign-in (FB-01)
- [ ] T-095 Onboarding (OB-1 to OB-5)
- [ ] T-096 Privacy and consent (FB-02)
- [ ] T-097 Learner profile (FB-03)
- [ ] T-098 Roles and permissions (FB-04)

## P8. Sessions UI and adult home
- [ ] T-100 Start child mode (SS-1)
- [ ] T-101 Adult home (AH-1)
- [ ] T-102 Ending a session — STOP: human review

## P9. Observations and goals
- [ ] T-110 Observations and goals migrations and API
- [ ] T-111 Intent answers from the child board
- [ ] T-112 TagSheet
- [ ] T-113 Review session (RS-1)
- [ ] T-114 Goals (GL-1, GL-2)
- [ ] T-115 Reference dataset fixture

## P10. Analytics engine
- [ ] T-120 Input loader
- [ ] T-121 Count measures
- [ ] T-122 Adult-entry measures
- [ ] T-123 Interaction and timing measures
- [ ] T-124 Class measures, goals, notes
- [ ] T-125 Registry and getMeasures
- [ ] T-126 Reference dataset tests
- [ ] T-127 Invariant tests
- [ ] T-128 Performance

## P11. Dashboard, builder, reports, history
- [ ] T-130 Report definitions
- [ ] T-131 Section renderers
- [ ] T-132 Report screen (R-01 to R-04)
- [ ] T-133 Dashboard (DB-01, DB-03)
- [ ] T-134 Report builder (DB-02, DB-04)
- [ ] T-135 Message history (DB-06)
- [ ] T-136 Planning ideas
- [ ] T-137 Wording guard
- [ ] T-138 Role isolation
- [ ] T-139 Reports end-to-end — STOP: human review

## P12. Share and PDF export
- [ ] T-140 Report HTML builder
- [ ] T-141 Fonts in PDF
- [ ] T-142 Share flow (DB-05)
- [ ] T-143 Export log and permissions

## P13. Settings
- [ ] T-150 Settings list (FB-05)
- [ ] T-151 Child view settings (ST-1)
- [ ] T-152 Voice and audio (ST-2)
- [ ] T-153 Data and retention (ST-3)
- [ ] T-154 About (ST-4)
- [ ] T-155 Vocabulary (FB-06)

## P14. Hardening
- [ ] T-160 Accessibility
- [ ] T-161 Performance
- [ ] T-162 Security and privacy review
- [ ] T-163 Error states
- [ ] T-164 Robustness
- [ ] T-165 Upgrade test

## P15. Quality assurance
- [ ] T-170 Full end-to-end flows
- [ ] T-171 Device checklist
- [ ] T-172 Demonstration data
- [ ] T-173 Review packs
- [ ] T-174 Issue list

## P16. Release and handover
- [ ] T-180 App identity
- [ ] T-181 Release build
- [ ] T-182 Store and privacy documents
- [ ] T-183 Documentation
- [ ] T-184 Final acceptance — STOP: human review
