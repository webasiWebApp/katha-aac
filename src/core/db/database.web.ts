import * as SQLite from 'expo-sqlite';

import type { Db } from '@/core/types/manifest';

import { wrap } from './wrap';

export type { Db };

/**
 * WEB PREVIEW ONLY. Opens the database in the browser (expo-sqlite on WebAssembly).
 * There is no SQLCipher on web, so the key is ignored and the data is NOT encrypted.
 * The Android build uses database.ts (encrypted, D-16). Use only the fictional demo learner.
 */
export function openDatabase(name: string, _key: string): Db {
  const raw = SQLite.openDatabaseSync(name);
  raw.execSync('PRAGMA foreign_keys = ON');
  return wrap(raw);
}

/**
 * WEB PREVIEW ONLY. expo-sqlite runs in a Web Worker; its synchronous calls time out if the
 * worker and the WebAssembly module are still loading. Opening the file once asynchronously
 * loads both before the app's first synchronous call.
 */
export async function prepareDatabase(name: string): Promise<void> {
  const db = await SQLite.openDatabaseAsync(name);
  await db.getFirstAsync('SELECT 1');
  await db.closeAsync();
}
