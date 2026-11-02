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

## Adding a role report

1. Create `src/features/reports/<role>/definition.ts` exporting a `ReportDefinition`
2. Register it in the `reports` feature manifest's `reportDefinitions` array
3. Add measure implementations in `features/analytics/domain/measures/`
4. Register measures in `features/analytics/domain/registry.ts`

## Shipping a new vocabulary version

1. Increment the `id` field in the new JSON (e.g. `"v2"`)
2. Place the file in `assets/vocabulary/`
3. Update `audio-manifest-v<n>.json` with any new recordings
4. On boot, the vocabulary repository detects the new version ID and installs it
5. Old versions are retained for historical report accuracy
