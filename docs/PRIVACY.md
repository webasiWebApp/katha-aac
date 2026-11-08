# Katha AAC — Privacy Policy

**TODO(human):** Replace placeholder contact details before any production use.

## What is recorded

The app records communication events (which symbols were tapped, when, in which order) and adult observations (intent tags, prompting levels, session notes) on the device. No real names are stored in the database; learners are identified only by a display name and a participant code chosen by the adult.

## Where data is stored

All data stays on the device. The database file is encrypted with SQLCipher (AES-256). The encryption key is randomly generated on first launch and stored in Android's secure keystore (SecureStore). No data is sent to any server, cloud service or analytics platform.

## Who can see the data

Data is accessible only through the Katha AAC app, behind a role PIN. The `parent` role can view all data and delete it at any time.

## Reports leaving the device

Reports can be exported as PDF files and shared with other apps or saved to a folder the adult chooses. Each export requires an explicit consent step within the app. Export events are logged locally (destination and timestamp only; no learner content).

## Deletion

The `parent` role can delete records older than 6, 12 or 24 months, or delete all records. Deletion is permanent.

## Research logging

Research logging is off by default. It can be enabled by the `parent` role only, with guardian consent recorded in the app. Research logging records the same communication events already stored; it does not add any additional data collection.

## Technical safeguards

Security review T-162, 2026-11-08. "Evidence" says how each point was checked; "device" means it still needs a check on a real build.

| Safeguard | Evidence | Status |
| --- | --- | --- |
| Database encrypted at rest (SQLCipher, D-16) | `app.json` plugin `["expo-sqlite", { "useSQLCipher": true }]`; `openDatabase` applies `PRAGMA key` before any SQL; key is random and kept in SecureStore (`db.key`) | Configured. "Unreadable without the key" is a device check (open `katha.db` with a plain SQLite viewer) |
| PINs stored only as salted hashes in secure storage | `features/access/domain/pin.ts`: SHA-256 x1000 over salt + PIN, stored in SecureStore `pin.<role>`; test asserts the PIN does not appear in the stored value; no PIN column exists in the schema | Verified by unit test |
| No PIN or learner content in logs | `logError` stores area, code and the first 300 characters of the error message only; callers pass errors, never symbol labels or message text; `gate_attempt` events store the result and role, never the PIN | Reviewed by code search (`logError(` call sites); no automated scan |
| Backups disabled | `app.json` `android.allowBackup: false`; generated manifest has `android:allowBackup="false"` | Verified in the generated manifest |
| No network permission | `app.json` `android.blockedPermissions` lists INTERNET, RECORD_AUDIO, SYSTEM_ALERT_WINDOW; the local generated manifest marks them `tools:node="remove"` | Config verified; the merged release manifest must be inspected after `expo prebuild --clean` (device/build) |
| No analytics or crash-reporting SDKs | `package.json` has no such dependency; no network calls exist in `src` (no `fetch`, `XMLHttpRequest`, WebSocket) | Verified by dependency list and code search |
| Secure storage used for keys and PINs only | `expo-secure-store` is used by `core/db/key.ts` and `features/access/data/pinStore.ts` only | Verified by code search |
| Reports leave the device only after consent | Share screen shows a consent dialog on every path; `report_exports` stores role, period, destination and times, never content; temporary PDF files are deleted after sharing | Verified by unit test (dialog on every path, cancel exports nothing); file deletion is a device check |

## Contact

TODO(human): Add project lead contact details here.
