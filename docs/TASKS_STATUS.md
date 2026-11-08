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
- [ ] T-009 Device spikes — STOP: human review — NOT RUN (needs device) 2026-11-08 device spikes (SQLCipher open, Sinhala TTS voice, expo-audio clip, immersive mode) were not executed; BLOCKER-001. Code assumes D-08 and D-16 hold

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
- [ ] T-031 Design comparison — STOP: human review — NOT RUN (needs device) 2026-11-08 gallery on the tablet and Figma comparison not done; BLOCKER-003

## P3. Vocabulary
- [x] T-040 Vocabulary content files — 2026-11-08 vocabulary-v1.json (19 symbols, 4 phrases, 2 pages, 1 template) and empty audio-manifest-v1.json; tested
- [x] T-041 Vocabulary types and validator — 2026-11-08 validateVocabulary: duplicate/unknown refs/slot category errors, last-cell and pictogram warnings; seed has 0 errors; 8 tests
- [x] T-042 Vocabulary repository — 2026-11-08 migration 020_vocabulary_versions, install-once + version switch, getActive/ById/Symbol/Page/isCore/categoryOf; tested
- [x] T-043 Export icons and pictograms — 2026-11-08 assets/pictograms already holds 45 SVGs (all 22 required IDs present) and icons are in core/ui/iconPaths.ts (55 icons); no Figma export run (assumption: existing assets accepted)
- [x] T-044 Grid layout calculator — 2026-11-08 computeGrid: 1280x800 gives 296x170, 236x127, 195x99; 600x400 5x6 falls back; 5 tests

## P4. Event log and sessions (data)
- [x] T-050 Event-log migrations — 2026-11-08 migration 040_event_log (3 tables, 3 indexes) exactly as 6.1; run in every DB test
- [x] T-051 Event-log write API — 2026-11-08 appendEvent (INSERT OR IGNORE), commitMessage (one transaction), recordAudioAttempt; duplicate and rollback tests
- [x] T-052 Event-log read API — 2026-11-08 loadPeriodData/loadDataForSessions, listMessages (intent join via passed function), firstMeaningfulUseBySymbol; tested
- [x] T-053 Sessions data — 2026-11-08 migration 030_sessions; startSession/endSession (abandons open drafts)/getOpenSession/listSessions/listUnreviewedSessions; active-time tracker with 120 s rule tested with injected clock
- [x] T-054 Persistence tests — 2026-11-08 persistence simulated by re-running migrations on the same in-memory DB (a real close/reopen needs a device); orphan session ends with app_restart at last event time

## P5. Audio
- [x] T-060 Audio service — 2026-11-08 audio service with injected platform: clip, then Sinhala voice, then unsupported; failed on throw; records every attempt; 7 tests. Device adapter (expo-audio/expo-speech) NOT RUN (needs device)
- [x] T-061 Audio asset index — 2026-11-08 scripts/gen-audio-index.js (JS instead of TS) generates assets/audio/index.ts; empty manifest compiles; npm run gen:audio and prebuild added
- [x] T-062 Highlight timing — 2026-11-08 highlightSchedule evenly spaced, zeros for reduced motion; tested

## P6. Child board (AAC)
- [x] T-070 Composer state machine — 2026-11-08 composerReducer with effects list; 16 table tests (template open/fill/reject, undo slot, quick undo, clear, submit, replay, new draft, committing disabled)
- [x] T-071 Composer effects runner — 2026-11-08 useComposer hook; board test: me + water + help then Speak writes 3 symbol_selected, 1 attempt, 1 message_submitted, 1 message audio attempt (plus 3 word attempts)
- [x] T-072 Board screen layout — 2026-11-08 BoardScreen with computeGrid; render tests for 3 grid sizes and both hands (structure assertions, no snapshot file)
- [x] T-073 Cell, folder, core key and quick phrase actions — 2026-11-08 tests for word, core key, folder open, template open/fill/reject, stored phrase, home/quick keys
- [x] T-074 Message row buttons — 2026-11-08 Speak/Replay/Undo/Clear enabled states (reducer table + board tests); Replay between Undo and Speak, mirrored for left hand
- [x] T-075 Speaking visuals — 2026-11-08 speaking opacity 0.7 and chip highlight schedule; reduced motion gives an all-zero schedule (tested); no motion library used
- [x] T-076 Adult check chip — 2026-11-08 chip after speaking, answer writes an intent observation through the bus, off when childView.adultCheck is false; the 'page with no hidden cell' case is not tested (seed pages all have one)
- [x] T-077 Navigation inside child mode, idle return, break — 2026-11-08 fake-timer tests for idle return and the 3 s break key; break/home events logged
- [x] T-078 Child mode lock and adult gate — 2026-11-08 gateStateMachine tested as a pure function, touch overlay tested with fake timers; keep-awake, immersive and back-button block are device checks (NOT RUN, see DEVICE_CHECKLIST)
- [x] T-079 Audio outcome indicator — 2026-11-08 adult dot appears when audio is unsupported/failed (10 s timer), no error text for the child; tested
- [x] T-080 Phone guard — 2026-11-08 phone guard EmptyState under 600 dp, tested
- [ ] T-081 Child board end-to-end flow — STOP: human review — NOT RUN (needs device) 2026-11-08 e2e/child-board.yaml written; Maestro and an emulator were not available; board flow is covered by 19 Jest tests

## P7. Access, roles and consent
- [x] T-090 Access migrations — 2026-11-08 migration 010_access with default permission rows; four rows verified
- [x] T-091 PIN service — 2026-11-08 PIN service (4 digits, salt 16 bytes, SHA-256 x1000, SecureStore keys pin.<role>, lock after 5 failures for 60 s); tests with injected store; nothing written to SQLite
- [x] T-092 Auth store — 2026-11-08 zustand auth store with 5-minute inactivity sign-out; fake-timer tests
- [x] T-093 Permissions API — 2026-11-08 canView truth table (4 roles x 8 resources) tested; savePermission parent only
- [x] T-094 Adult sign-in (FB-01) — 2026-11-08 SignIn (role cards, 4 dots, keypad); wrong PIN clears silently, locked disables keypad with no reason text; tested
- [ ] T-095 Onboarding (OB-1 to OB-5) — NOT RUN (needs device) 2026-11-08 OB-1 to OB-5 built and covered by a Jest flow test (PIN twice, learner, consent required, device check, completion); e2e/onboarding.yaml written but Maestro not run
- [x] T-096 Privacy and consent (FB-02) — 2026-11-08 FB-02: research logging, withdraw, delete all with PIN confirm (parent only); tests for permissions and zero data rows after deletion
- [x] T-097 Learner profile (FB-03) — 2026-11-08 FB-03: parent edits name/hand/grid/idle/reduced motion, others read-only; tested
- [x] T-098 Roles and permissions (FB-04) — 2026-11-08 FB-04: per-role toggles and Set PIN (parent only), consent chip; tested (non-parent sees read-only note)

## P8. Sessions UI and adult home
- [x] T-100 Start child mode (SS-1) — 2026-11-08 SS-1: Home/School/Therapy/Not sure stored as unknown; session row setting tested
- [x] T-101 Adult home (AH-1) — 2026-11-08 AH-1: start button, sessions to review (count + rows), 7-day tiles, pinning help; tested with and without sessions
- [x] T-102 Ending a session — STOP: human review — 2026-11-08 ChildBoardScreen: gate overlay, sign-in, endSession adult_exit, then review (or home if the role cannot enter observations); Jest test drives the 3 s two-finger gate, PIN 4321, session end and navigation; cancel returns to the board with the session open

## P9. Observations and goals
- [x] T-110 Observations and goals migrations and API — 2026-11-08 migrations 050_observations and 060_goals; observation and goal APIs with validation, permission check and upsert/delete; 13 tests
- [x] T-111 Intent answers from the child board — 2026-11-08 intent_answered handler registered in observations manifest (entered_by_role unknown_adult, no permission check); initObservations(db) must run at boot; test creates one row
- [x] T-112 TagSheet — 2026-11-08 TagSheet: single-select chip rows, tap again clears, Clear all; rows written and deleted (tested)
- [x] T-113 Review session (RS-1) — 2026-11-08 RS-1: messages, opportunity steppers, setup note (ot/parent only), Save review marks the session reviewed; tested
- [x] T-114 Goals (GL-1, GL-2) — 2026-11-08 GL-1/GL-2: list, create, edit, archive, entries; data tests plus screen tests
- [x] T-115 Reference dataset fixture — 2026-11-08 referenceDataset fixture: 8 sessions, 7 messages, 1 replay event, observations and goal G1

## P10. Analytics engine
- [x] T-120 Input loader — 2026-11-08 loadInput (sessions, events, attempts, observations, goals, vocabulary versions, first use) feeding AnalyticsInput
- [x] T-121 Count measures — 2026-11-08 count measures equal section 7.3
- [x] T-122 Adult-entry measures — 2026-11-08 adult-entry measures equal section 7.3 incl. notRecorded
- [x] T-123 Interaction and timing measures — 2026-11-08 timing measures equal section 7.3 (latency 2.5 s from 2.0 and 3.0)
- [x] T-124 Class measures, goals, notes — 2026-11-08 class measures, goals, setup_notes equal section 7.3
- [x] T-125 Registry and getMeasures — 2026-11-08 registry + getMeasures with rate lock, class lock and MeasureNotAllowed via registerRoleMeasures
- [x] T-126 Reference dataset tests — 2026-11-08 reference dataset test: every Period A row and the Period B lock check pass (23 tests)
- [x] T-127 Invariant tests — 2026-11-08 200 seeded runs: replays/undos/clears never change messages_sent; percentages 0-100; numerator <= denominator
- [x] T-128 Performance — 2026-11-08 Jest timing for 365 days x 3 sessions x 40 events, 30-day period, all measures: 25 ms (under 1 s). Tablet timing NOT RUN (needs device)

## P11. Dashboard, builder, reports, history
- [x] T-130 Report definitions — 2026-11-08 four definitions per 8.2 in parent/slp/educator/ot folders, aggregated by the reports manifest; only registered measures and existing i18n keys referenced
- [x] T-131 Section renderers — 2026-11-08 SectionView per kind with locked caption; tested via reports (unlocked 7 days, locked 'today')
- [x] T-132 Report screen (R-01 to R-04) — 2026-11-08 ReportView + ReportScreen for 4 roles with requireRole; behaviour tests (no snapshot files)
- [x] T-133 Dashboard (DB-01, DB-03) — 2026-11-08 Dashboard with period picker, messages chart and roles list; phone layout tested, tablet layout (>= 840 dp) not rendered in tests
- [x] T-134 Report builder (DB-02, DB-04) — 2026-11-08 Builder: role, period, section toggles, save default; defaults reload hides disabled sections (tested); preview is a live ReportView on tablets
- [x] T-135 Message history (DB-06) — 2026-11-08 DB-06 All/Built/Stored filter; tapping a row opens TagSheet when permitted; tested
- [x] T-136 Planning ideas — 2026-11-08 planningIdea rules PI-P1, PI-P2, PI-E1, PI-E2 and hidden fallback; change wording helper; tested
- [x] T-137 Wording guard — 2026-11-08 wording guard over en.ts and report definitions; fails when 'improved' is added (tested)
- [x] T-138 Role isolation — 2026-11-08 aggregateReports without the ot manifest leaves the other three definitions byte-identical
- [ ] T-139 Reports end-to-end — STOP: human review — NOT RUN (needs device) 2026-11-08 e2e/reports.yaml written; Maestro not run; the four reports are covered by Jest

## P12. Share and PDF export
- [x] T-140 Report HTML builder — 2026-11-08 buildReportHtml: A4, notice, 2x2 glance, all enabled sections, definitions appendix, footer, no http (tested for 4 roles)
- [ ] T-141 Fonts in PDF — NOT RUN (needs device) 2026-11-08 fonts embedded as base64 @font-face by deviceExport.loadFontCss; Sinhala in the PDF must be checked on the tablet
- [x] T-142 Share flow (DB-05) — 2026-11-08 Share screen: save/share/print each ask consent first; cancel exports nothing; native calls NOT RUN (needs device)
- [x] T-143 Export log and permissions — 2026-11-08 report_exports row after export (no content); only roles with export permission and report access can export; tested

## P13. Settings
- [x] T-150 Settings list (FB-05) — 2026-11-08 settings list with all rows; reset demo only for parent + fictional learner; render test
- [x] T-151 Child view settings (ST-1) — 2026-11-08 ST-1 persists grid/hand/idle/reduced motion/adult check; ChildBoardScreen passes them to the board
- [x] T-152 Voice and audio (ST-2) — 2026-11-08 ST-2 voice status, clip count, test sentence; status text tested
- [x] T-153 Data and retention (ST-3) — 2026-11-08 ST-3 delete older than 6/12/24 months and delete all (parent, PIN); retention tested on fixture data
- [x] T-154 About (ST-4) — 2026-11-08 ST-4 versions, export error log (parent only, share sheet text file); licences: scripts/gen-licences.js writes assets/licences.json (license-checker shape, 496 packages), About lists them on request; render + data tests
- [x] T-155 Vocabulary (FB-06) — 2026-11-08 FB-06 read-only list of the active vocabulary; tested

## P14. Hardening
- [x] T-160 Accessibility — 2026-11-08 contrast test: 17 text/background token pairs >= 4.5:1 in Light; TalkBack NOT RUN (needs device); a full audit of every pressable label is not automated
- [ ] T-161 Performance — NOT RUN (needs device) 2026-11-08 grid memoised (BoardGrid React.memo + stable cell callback; Jest proves 0 cell re-renders on composer taps); tap-to-feedback and tap-to-audio timings still need the tablet
- [x] T-162 Security and privacy review — 2026-11-08 PRIVACY.md safeguards filled with evidence; release APK inspected with aapt2: permissions only MODIFY_AUDIO_SETTINGS + WAKE_LOCK, allowBackup=false, no services, SQLCipher build flag on. 'DB unreadable without key' still a device check
- [x] T-163 Error states — 2026-11-08 LoadGate loading/error with Try again on every data screen; 12 screens tested with a failing database
- [ ] T-164 Robustness — NOT RUN (needs device) 2026-11-08 Jest covers commit atomicity, duplicate ids and orphan-session restart; real kill-the-app tests during speaking, commit and export were not run
- [ ] T-165 Upgrade test — NOT RUN (needs device) 2026-11-08 Jest upgrade test (dummy migration 999_test keeps data); install-over-install on a device not run

## P15. Quality assurance
- [ ] T-170 Full end-to-end flows — NOT RUN (needs device) 2026-11-08 e2e/onboarding.yaml, child-board.yaml, reports.yaml, full-flow.yaml written; none run (the two-finger gate step needs a gesture script)
- [x] T-171 Device checklist — 2026-11-08 DEVICE_CHECKLIST written; every line marked NOT RUN (needs device) with the Jest coverage noted
- [x] T-172 Demonstration data — 2026-11-08 loadDemoData: 9 sessions, 83 messages, observations, goal; dashboard shows 9 and 83; available from Settings (parent PIN)
- [x] T-173 Review packs — 2026-11-08 docs/review/slp.md, ot.md, teacher.md plus sample-<role>.html (print to PDF); real PDF export NOT RUN (needs device)
- [x] T-174 Issue list — 2026-11-08 docs/ISSUES.md ranked Critical/High/Medium/Low

## P16. Release and handover
- [x] T-180 App identity — 2026-11-08 placeholder 'K' on fac/primary icon, adaptive icon (fg/bg/monochrome) and splash in assets/app (scripts/gen-app-icons.py); version 1.0.0 (code 1) confirmed in the release APK badging; About shows app, schema and vocabulary versions
- [ ] T-181 Release build — NOT RUN (needs device) 2026-11-08 local signed release built: app-release.aab (95 MB) and app-release.apk (126 MB) via gradlew bundleRelease/assembleRelease after expo prebuild; signing from plugins/withReleaseSigning.js verified with a throwaway test key (apksigner/keytool show the same cert); installing on the tablet not run. Real upload key: H-08
- [x] T-182 Store and privacy documents — 2026-11-08 PRIVACY.md and RELEASE.md completed with Play data safety answers and testing steps; contact details and policy URL marked TODO(human)
- [x] T-183 Documentation — 2026-11-08 README (setup, run, test, build, demo data) and ARCHITECTURE (module map, data flow, add a role report, ship a vocabulary version)
- [ ] T-184 Final acceptance — STOP: human review — NOT RUN (needs device) 2026-11-08 tsc 0 errors, eslint 0 errors, Jest 42 suites / 631 tests pass (1 env-gated skipped); coverage 98.86% lines in features/*/domain and analytics; signed release AAB and APK build. Maestro flows and the device checklist need a tablet (BLOCKER-001). Open items: docs/ISSUES.md, docs/BLOCKERS.md
