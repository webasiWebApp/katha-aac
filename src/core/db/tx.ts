import type { Db } from '@/core/types/manifest';

/** Wraps fn in a synchronous BEGIN / COMMIT / ROLLBACK transaction. */
export function withTransaction<T>(db: Db, fn: (db: Db) => T): T {
  return db.tx(fn);
}
