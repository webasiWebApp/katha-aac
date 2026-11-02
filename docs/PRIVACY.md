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

TODO(human): Fill in after T-162 (security review) is complete.

- Database encryption: SQLCipher AES-256, key in secure storage
- Backup disabled: `android:allowBackup="false"` in manifest
- No network permission in the Android manifest
- No third-party analytics or crash-reporting SDKs

## Contact

TODO(human): Add project lead contact details here.
