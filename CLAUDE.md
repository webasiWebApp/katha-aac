# Katha AAC — Instructions for the executing model

Source: tasklist.md sections 0, 1A, and 4 (verbatim).

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
