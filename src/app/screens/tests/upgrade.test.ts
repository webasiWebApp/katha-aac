import { makeTestDb, TEST_LEARNER } from '@/app/testing/testDb';
import { featureRegistry } from '@/app/registry/featureRegistry';
import { runMigrations } from '@/core/db/migrate';
import type { FeatureManifest } from '@/core/types/manifest';
import { appendEvent, commitMessage } from '@/features/event-log/index';
import { closeOrphanSession, startSession } from '@/features/sessions/index';

describe('upgrade test (T-165) and robustness (T-164)', () => {
  it('a later build with a new migration keeps all existing data', async () => {
    const db = await makeTestDb();
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    commitMessage(db, { messageId: 'm1', draftId: 'd1', sessionId: sid, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_me'], text: 't', vocabularyVersionId: 'v1' });
    const before = db.all('SELECT * FROM communication_attempts');

    const next: FeatureManifest = {
      id: 'upgrade-test',
      migrations: [{ id: '999_test', up: async (d) => d.run('CREATE TABLE upgrade_probe (id TEXT PRIMARY KEY)') }],
    };
    await runMigrations(db, [...featureRegistry, next]);

    expect(db.all('SELECT * FROM communication_attempts')).toEqual(before);
    expect(db.all('SELECT * FROM upgrade_probe')).toEqual([]);
    expect(db.all("SELECT id FROM schema_migrations WHERE id = '999_test'")).toHaveLength(1);
    // Running the same build again is a no-op.
    await runMigrations(db, [...featureRegistry, next]);
    expect(db.all("SELECT id FROM schema_migrations WHERE id = '999_test'")).toHaveLength(1);
  });

  it('a failing migration rolls back and is retried on the next start', async () => {
    const db = await makeTestDb();
    const bad: FeatureManifest = {
      id: 'bad',
      migrations: [
        {
          id: '998_bad',
          up: async (d) => {
            d.run('CREATE TABLE half_done (id TEXT)');
            throw new Error('boom');
          },
        },
      ],
    };
    await expect(runMigrations(db, [...featureRegistry, bad])).rejects.toThrow('boom');
    expect(db.all("SELECT id FROM schema_migrations WHERE id = '998_bad'")).toHaveLength(0);
    expect(db.all("SELECT name FROM sqlite_master WHERE name = 'half_done'")).toHaveLength(0);
  });

  it('killed during a draft or during speaking: restart leaves no duplicate or partial rows', async () => {
    const db = await makeTestDb();
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    appendEvent(db, { sessionId: sid, learnerId: TEST_LEARNER, type: 'symbol_selected', symbolId: 'sym_me', draftId: 'dA', source: 'grid', pageId: 'home' });
    commitMessage(db, { messageId: 'm1', draftId: 'dB', sessionId: sid, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_water'], text: 't', vocabularyVersionId: 'v1' });
    // "kill" here, then boot again twice
    expect(closeOrphanSession(db)).toBe(sid);
    expect(closeOrphanSession(db)).toBeNull();
    const count = (type: string) => db.all('SELECT * FROM communication_events WHERE type = ?', [type]).length;
    expect(count('session_ended')).toBe(1);
    expect(count('draft_abandoned')).toBe(1); // dA only; dB was submitted
    expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(1);
    const row = db.get<{ end_reason: string }>('SELECT end_reason FROM app_sessions WHERE id = ?', [sid]);
    expect(row?.end_reason).toBe('app_restart');
  });
});
