import type { Db, FeatureManifest } from '@/core/types/manifest';

const BOOTSTRAP_STMTS = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     id TEXT PRIMARY KEY NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS settings (
     key   TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS error_log (
     id          TEXT PRIMARY KEY NOT NULL,
     at          TEXT NOT NULL,
     area        TEXT NOT NULL,
     code        TEXT NOT NULL,
     message     TEXT NOT NULL,
     app_version TEXT NOT NULL
   )`,
];

/** Runs all unapplied migrations from every feature manifest, in id order. */
export async function runMigrations(db: Db, manifests: FeatureManifest[]): Promise<void> {
  // Bootstrap core tables (idempotent).
  for (const stmt of BOOTSTRAP_STMTS) {
    db.run(stmt);
  }

  // Collect all migrations from all manifests.
  const all = manifests.flatMap((m) => m.migrations ?? []);
  all.sort((a, b) => a.id.localeCompare(b.id));

  // Find already-applied IDs.
  const applied = new Set(
    db.all<{ id: string }>('SELECT id FROM schema_migrations').map((r) => r.id),
  );

  for (const migration of all) {
    if (applied.has(migration.id)) continue;

    // Run inside an explicit transaction: rollback leaves the ID unrecorded.
    db.run('BEGIN');
    try {
      await migration.up(db);
      db.run('INSERT INTO schema_migrations (id) VALUES (?)', [migration.id]);
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  }
}
