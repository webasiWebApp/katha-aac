import type { Db } from '@/core/types/manifest';

/** Reads a JSON value from the settings table. */
export function getSetting<T>(db: Db, key: string, fallback: T): T {
  let row: { value: string } | undefined;
  try {
    row = db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  } catch {
    return fallback; // a settings read failure falls back to the default; never blocks a screen
  }
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function setSetting(db: Db, key: string, value: unknown): void {
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
}

export function deleteSetting(db: Db, key: string): void {
  db.run('DELETE FROM settings WHERE key = ?', [key]);
}
