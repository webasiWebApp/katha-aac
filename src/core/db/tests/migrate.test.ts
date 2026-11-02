/**
 * Tests for runMigrations (T-012).
 * Uses the in-memory better-sqlite3 mock via jest.config.js moduleNameMapper.
 */
import { openDatabase, resetDatabase } from '../../db/__mocks__/sqliteMemory';
import { runMigrations } from '../migrate';
import type { Db, FeatureManifest } from '@/core/types/manifest';

function makeManifest(id: string, up: (db: Db) => Promise<void>): FeatureManifest {
  return { id, migrations: [{ id, up }] };
}

let db: Db;

beforeEach(() => {
  resetDatabase();
  db = openDatabase(':memory:');
});

test('bootstrap tables are created', async () => {
  await runMigrations(db, []);
  const tables = db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  const names = tables.map((t) => t.name);
  expect(names).toContain('schema_migrations');
  expect(names).toContain('settings');
  expect(names).toContain('error_log');
});

test('migration runs once and is recorded', async () => {
  let ran = 0;
  const m = makeManifest('test-001', async (d) => {
    ran++;
    d.run('CREATE TABLE IF NOT EXISTS t001 (x INTEGER)');
  });

  await runMigrations(db, [m]);
  expect(ran).toBe(1);

  const applied = db.all<{ id: string }>('SELECT id FROM schema_migrations');
  expect(applied.map((r) => r.id)).toContain('test-001');
});

test('running migrations again is a no-op', async () => {
  let ran = 0;
  const m = makeManifest('test-002', async () => { ran++; });

  await runMigrations(db, [m]);
  await runMigrations(db, [m]);
  expect(ran).toBe(1);
});

test('migrations run in sorted id order', async () => {
  const order: string[] = [];
  const manifests: FeatureManifest[] = [
    makeManifest('zzz-last', async () => { order.push('last'); }),
    makeManifest('aaa-first', async () => { order.push('first'); }),
    makeManifest('mmm-mid', async () => { order.push('mid'); }),
  ];

  await runMigrations(db, manifests);
  expect(order).toEqual(['first', 'mid', 'last']);
});

test('a failing migration rolls back and is not recorded', async () => {
  const m = makeManifest('fail-001', async (d) => {
    d.run('CREATE TABLE IF NOT EXISTS fail_table (x INTEGER)');
    throw new Error('intentional failure');
  });

  await expect(runMigrations(db, [m])).rejects.toThrow('intentional failure');

  const applied = db.all<{ id: string }>('SELECT id FROM schema_migrations');
  expect(applied.map((r) => r.id)).not.toContain('fail-001');
});
