import * as SQLite from 'expo-sqlite';

import type { Db } from '@/core/types/manifest';

import { wrap } from './wrap';

export type { Db };

/**
 * Opens the encrypted SQLite database.
 * The key is applied via PRAGMA cipher_key before any other SQL.
 * Caller must await getOrCreateDbKey() and pass the result here.
 */
export function openDatabase(name: string, key: string): Db {
  const raw = SQLite.openDatabaseSync(name);
  // SQLCipher: set the encryption key before any other operation.
  raw.execSync(`PRAGMA key = '${key}'`);
  raw.execSync('PRAGMA foreign_keys = ON');
  raw.execSync('PRAGMA journal_mode = WAL');
  return wrap(raw);
}

/** Native: nothing to prepare (the web build warms up its database worker here). */
export async function prepareDatabase(_name: string): Promise<void> {}
