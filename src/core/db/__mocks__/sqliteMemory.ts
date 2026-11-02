/**
 * In-memory SQLite adapter for Jest, backed by better-sqlite3.
 * Implements the same Db interface as the production expo-sqlite wrapper (T-012).
 * Production code never imports better-sqlite3 directly.
 */
import Database from 'better-sqlite3';

export interface Db {
  run(sql: string, params?: unknown[]): void;
  get<T>(sql: string, params?: unknown[]): T | undefined;
  all<T>(sql: string, params?: unknown[]): T[];
  tx<T>(fn: (db: Db) => T): T;
}

function makeDb(raw: Database.Database): Db {
  return {
    run(sql, params = []) {
      raw.prepare(sql).run(...(params as Parameters<Database.Statement['run']>));
    },
    get<T>(sql: string, params: unknown[] = []): T | undefined {
      return raw.prepare(sql).get(...(params as Parameters<Database.Statement['get']>)) as
        | T
        | undefined;
    },
    all<T>(sql: string, params: unknown[] = []): T[] {
      return raw.prepare(sql).all(...(params as Parameters<Database.Statement['all']>)) as T[];
    },
    tx<T>(fn: (db: Db) => T): T {
      return raw.transaction(() => fn(makeDb(raw)))();
    },
  };
}

let _db: Db | null = null;

export function openDatabase(_name: string, _key?: string): Db {
  if (!_db) {
    const raw = new Database(':memory:');
    raw.pragma('foreign_keys = ON');
    raw.pragma('journal_mode = WAL');
    _db = makeDb(raw);
  }
  return _db;
}

export function resetDatabase(): void {
  _db = null;
}

export default { openDatabase, resetDatabase };
