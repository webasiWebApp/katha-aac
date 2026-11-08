import type { SQLiteBindParams, SQLiteDatabase } from 'expo-sqlite';

import type { Db } from '@/core/types/manifest';

function bind(params: unknown[]): SQLiteBindParams {
  return params as SQLiteBindParams;
}

/** Adapts an expo-sqlite database to the app's synchronous Db interface. */
export function wrap(raw: SQLiteDatabase): Db {
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
