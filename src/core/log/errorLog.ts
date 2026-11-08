import { randomUUID } from 'expo-crypto';

import type { Db } from '@/core/types/manifest';

let _db: Db | null = null;
let _appVersion = '0.0.0';

/** Called once at app boot, before any logError calls. */
export function initErrorLog(db: Db, appVersion: string): void {
  _db = db;
  _appVersion = appVersion;
}

/**
 * Log a non-fatal error to the local error_log table.
 * Never include learner content: no symbol labels, no message text.
 */
export function logError(area: string, code: string, error: unknown): void {
  // Development builds only: also show the error in the console (never in release builds).
  if (__DEV__ && process.env.NODE_ENV !== 'test') {
    console.warn(`[katha] ${area}/${code}:`, error instanceof Error ? error.message : String(error));
  }
  if (!_db) return;

  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.slice(0, 300);

  try {
    _db.run(
      `INSERT OR IGNORE INTO error_log (id, at, area, code, message, app_version)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), new Date().toISOString(), area, code, message, _appVersion],
    );
  } catch {
    // Swallow: if we can't log the error, there's nothing safe to do.
  }
}
