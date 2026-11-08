# Katha AAC — Architecture

## Module map

```
katha-aac/
  src/
    app/         Entry, navigation shell, root providers, feature registry
    core/        Shared platform code (db, events, theme, i18n, ui, log, time, types)
    features/    Product features, each isolated behind index.ts
```

Each feature folder contains:
- `index.ts` — public API (the only file other features may import)
- `feature.manifest.ts` — id, routes, migrations, eventHandlers, reportSections
- `domain/` — pure TypeScript logic, no React, no SQL
- `data/` — SQL repositories and migrations
- `ui/` — React components and screens
- `tests/` — Jest tests

## Data flow

```
Child board (UI taps)
  → composer state machine (domain/composer.ts)
  → side-effect runner (useComposer hook)
  → event-log write API (appendEvent, commitMessage)
  → SQLite (encrypted with SQLCipher)
  → analytics engine (loadInput → getMeasures)
  → report definition (role definition + section renderers)
  → report screen or PDF (expo-print)
```

## Import rules (enforced by eslint-plugin-boundaries)

- `core` → `core` only
- `feature` → `core`, own files, other feature's `index.ts` only
- `app` → any `index.ts`, any `core`

## Dependencies

See section 2 of tasklist.md.

## SQLite / SQLCipher

- Database file: `katha.db`
- Key: 32 random bytes, hex-encoded, stored in SecureStore as `db.key`
- WAL mode, foreign keys ON
- Migrations tracked in `schema_migrations` table

## Implementation notes (as built)

- **Boot** (`src/app/boot.ts`): open the encrypted DB, run every feature's migrations in id order
  (`010_access`, `020_vocabulary_versions`, `030_sessions`, `040_event_log`, `050_observations`,
  `060_goals`, `070_share`), install the bundled vocabulary version, bind the observations DB handle,
  register per-role measure allow-lists, register event handlers, then end any orphaned session
  (`app_restart`, at the last event time).
- **Child board**: `BoardScreen` (board) renders the page and keys; `useComposer` (composer) runs the
  pure `composerReducer` and performs its effects (events, commit, audio) in order. The reducer never
  touches the DB; it returns the next state and a list of effects.
- **Audio** (D-08): recorded clip for the exact sequence, then a Sinhala system voice, then the
  unsupported state. Every attempt is recorded in `audio_attempts`. The platform adapter is injected so
  the order is unit tested; the device adapter (expo-audio, expo-speech) is `NOT RUN (needs device)`.
- **Analytics**: `loadInput` builds one `AnalyticsInput`; measures are pure functions over it; the
  registry applies the 5-session lock. Non-parent roles may read only the measures in their own report
  definition (`registerRoleMeasures`, filled by `registerReportMeasures()` at boot); anything else
  throws `MeasureNotAllowed`.
- **Reports**: `ReportView` renders a definition from measure results; `buildReportHtml` renders the
  same definition as A4 HTML for PDF (no external URLs; fonts embedded as base64 by the device layer).
- **Security**: PINs live only in SecureStore (salted SHA-256 x1000), the DB key too; the DB is
  SQLCipher-encrypted; `app.json` blocks INTERNET, RECORD_AUDIO and SYSTEM_ALERT_WINDOW.

## Adding a role report

1. Create `src/features/reports/<role>/definition.ts` exporting a `ReportDefinition` (see `ot/definition.ts`).
2. Add `src/features/reports/<role>/feature.manifest.ts` with `reportDefinitions: [definition]` and an `index.ts`.
3. Add the manifest to `roleReportManifests` in `src/features/reports/feature.manifest.ts`.
4. Add the role to `Role` in `src/core/types/common.ts`, to the `role_permissions` defaults (migration `010_access`) and to `src/features/access/domain/permissions.ts`.
5. Add any new measures in `features/analytics/domain/measures/` and register them in `features/analytics/domain/registry.ts` with a definition sentence (it appears in the PDF appendix).
6. Add the i18n strings (`report.<role>.*`) to `src/core/i18n/en.ts`; the wording guard test checks them.

Removing a role folder removes only that report (test `role isolation`).

## Shipping a new vocabulary version

1. Copy `assets/vocabulary/vocabulary-v1.json` to `vocabulary-v2.json` and change `id` to `"v2"`, `label`, symbols, pages, templates.
2. Run the vocabulary validator (`validateVocabulary`) in a test; it must have zero errors.
3. Point `src/features/vocabulary/data/bundled.ts` at the new file and add `audio-manifest-v2.json` with recordings named `<symbolId>.m4a` and `<sequenceKey>.m4a` (see section 6.6 of `tasklist.md`).
4. Run `npm run gen:audio`.
5. On the next start the app installs `v2` and makes it active. Old versions stay installed so old sessions and reports keep their labels.
