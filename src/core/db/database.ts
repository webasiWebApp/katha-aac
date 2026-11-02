import type { SQLiteBindParams } from 'expo-sqlite';
import * as SQLite from 'expo-sqlite';

import type { Db } from '@/core/types/manifest';

export type { Db };

function bind(params: unknown[]): SQLiteBindParams {
  return params as SQLiteBindParams;
}

function wrap(raw: SQLite.SQLiteDatabase): Db {
  return {
    run(sql: string, params: unknown[] = []): void {
      raw.runSync(sql, bind(params));
    },
    get<T>(sql: string, params: unknown[] = []): T | undefined {
      return raw.getFirstSync<T>(sql, bind(params)) ?? undefined;
    },
    all<T>(sql: string, params: unknown[] = []): T[] {
      return raw.getAllSync<T>(sql, bind(params));
    },
    tx<T>(fn: (db: Db) => T): T {
      let result: T;
      raw.withTransactionSync(() => {
        result = fn(wrap(raw));
      });
      return result!;
    },
  };
}

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
