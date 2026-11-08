import { openDatabase, resetDatabase } from '../../../core/db/__mocks__/sqliteMemory';
import { resetBus, emit, on } from '../../../core/events/bus';
import type { Db, FeatureManifest } from '@/core/types/manifest';

// Import bootFeatures as a function we can call with a fake manifest list.
// We test it in isolation — not with the real featureRegistry array.
import { runMigrations } from '../../../core/db/migrate';

async function bootFake(db: Db, manifests: FeatureManifest[]): Promise<void> {
  await runMigrations(db, manifests);
  for (const manifest of manifests) {
    for (const { event, handle } of manifest.eventHandlers ?? []) {
      on(event as Parameters<typeof on>[0], handle as Parameters<typeof on>[1]);
    }
  }
}

let db: Db;

beforeEach(async () => {
  resetDatabase();
  resetBus();
  db = openDatabase(':memory:');
});

test('fake manifest migration runs and is recorded', async () => {
  const manifest: FeatureManifest = {
    id: 'fake-feature',
    migrations: [
      {
        id: 'fake-001',
        up: async (d) => {
          d.run('CREATE TABLE IF NOT EXISTS fake_table (x INTEGER)');
        },
      },
    ],
  };

  await bootFake(db, [manifest]);

  const applied = db.all<{ id: string }>('SELECT id FROM schema_migrations');
  expect(applied.map((r) => r.id)).toContain('fake-001');

  const tables = db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table'",
  );
  expect(tables.map((t) => t.name)).toContain('fake_table');
});

test('fake manifest event handler fires when event is emitted', async () => {
  const received: unknown[] = [];

  const manifest: FeatureManifest = {
    id: 'fake-feature-2',
    eventHandlers: [
      {
        event: 'break_started',
        handle: async (payload) => {
          received.push(payload);
        },
      },
    ],
  };

  await bootFake(db, [manifest]);
  await emit({ type: 'break_started' });

  expect(received).toHaveLength(1);
});

test('both migration and handler run for the same manifest', async () => {
  let migrationRan = false;
  let handlerRan = false;

  const manifest: FeatureManifest = {
    id: 'fake-combined',
    migrations: [
      {
        id: 'combined-001',
        up: async () => {
          migrationRan = true;
        },
      },
    ],
    eventHandlers: [
      {
        event: 'break_ended',
        handle: async () => {
          handlerRan = true;
        },
      },
    ],
  };

  await bootFake(db, [manifest]);
  await emit({ type: 'break_ended', durationMs: 1000 });

  expect(migrationRan).toBe(true);
  expect(handlerRan).toBe(true);
});
