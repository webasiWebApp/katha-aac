import { makeTestDb, TEST_LEARNER } from '@/app/testing/testDb';
import { runMigrations } from '@/core/db/migrate';
import { featureRegistry } from '@/app/registry/featureRegistry';
import type { Db } from '@/core/types/manifest';
import {
  appendEvent,
  commitMessage,
  listMessages,
  loadPeriodData,
  recordAudioAttempt,
  firstMeaningfulUseBySymbol,
} from '@/features/event-log/index';
import {
  closeOrphanSession,
  createActiveTimeTracker,
  endSession,
  getOpenSession,
  listUnreviewedSessions,
  markReviewed,
  startSession,
} from '../index';

let db: Db;
beforeEach(async () => {
  db = await makeTestDb();
});

const T0 = '2026-10-19T02:30:00.000Z'; // 08:00 local at +330

describe('event-log write API', () => {
  it('ignores a duplicate event id', () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: T0, offsetMin: 330 });
    const e = { id: 'e1', sessionId: sid, learnerId: TEST_LEARNER, type: 'undo' as const };
    appendEvent(db, e);
    appendEvent(db, e);
    expect(db.all("SELECT * FROM communication_events WHERE id = 'e1'")).toHaveLength(1);
  });

  it('commit is atomic: failure leaves no rows', () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: T0, offsetMin: 330 });
    const base = {
      messageId: 'm1',
      draftId: 'd1',
      sessionId: sid,
      learnerId: TEST_LEARNER,
      kind: 'built' as const,
      symbolIds: ['sym_me'],
      text: 'x',
      vocabularyVersionId: 'v1',
    };
    commitMessage(db, base);
    // Same draft id again violates UNIQUE(draft_id) -> whole transaction rolls back.
    expect(() => commitMessage(db, { ...base, messageId: 'm2' })).toThrow();
    expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(1);
    expect(db.all("SELECT * FROM communication_events WHERE type='message_submitted'")).toHaveLength(1);
  });

  it('records audio attempts', () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    recordAudioAttempt(db, { sessionId: sid, messageId: 'm1', kind: 'message_first', outcome: 'clip' });
    expect(db.all('SELECT * FROM audio_attempts')).toHaveLength(1);
  });
});

describe('event-log read API', () => {
  it('selects sessions by local date and lists messages newest first with intent join', () => {
    const a = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: T0, offsetMin: 330 });
    // 2026-10-18T19:00Z = 2026-10-19 00:30 local -> inside Oct 19
    const b = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: '2026-10-18T19:00:00.000Z', offsetMin: 330 });
    // 2026-10-18T17:00Z = 2026-10-18 22:30 local -> outside
    startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: '2026-10-18T17:00:00.000Z', offsetMin: 330 });
    const period = { start: '2026-10-19', end: '2026-10-20' };
    const data = loadPeriodData(db, TEST_LEARNER, period);
    expect(data.sessions.map((s) => s.id).sort()).toEqual([a, b].sort());
    commitMessage(db, { messageId: 'm1', draftId: 'd1', sessionId: a, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_me'], text: 'one', vocabularyVersionId: 'v1', at: T0 });
    commitMessage(db, { messageId: 'm2', draftId: null, sessionId: a, learnerId: TEST_LEARNER, kind: 'stored_phrase', symbolIds: ['phr_help'], text: 'two', vocabularyVersionId: 'v1', at: '2026-10-19T03:00:00.000Z' });
    const all = listMessages(db, TEST_LEARNER, period, 'all', () => ({ m1: 'meant' }));
    expect(all.map((m) => m.id)).toEqual(['m2', 'm1']);
    expect(all[1]?.intent).toBe('meant');
    expect(listMessages(db, TEST_LEARNER, period, 'stored_phrase').map((m) => m.id)).toEqual(['m2']);
    expect(listMessages(db, TEST_LEARNER, period, 'built').map((m) => m.id)).toEqual(['m1']);
  });

  it('first meaningful use ignores undone symbols', () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: T0, offsetMin: 330 });
    const sel = (id: string, sym: string, src: 'grid' | 'template') =>
      appendEvent(db, { id, sessionId: sid, learnerId: TEST_LEARNER, type: 'symbol_selected', at: T0, symbolId: sym, draftId: 'd1', source: src });
    sel('s1', 'sym_milk', 'grid');
    appendEvent(db, { id: 'u1', sessionId: sid, learnerId: TEST_LEARNER, type: 'undo', at: T0, symbolId: 'sym_milk', draftId: 'd1' });
    sel('s2', 'sym_water', 'grid');
    sel('s3', 'sym_want', 'template');
    commitMessage(db, { messageId: 'm1', draftId: 'd1', sessionId: sid, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_water', 'sym_want'], text: 't', vocabularyVersionId: 'v1', at: T0 });
    expect(firstMeaningfulUseBySymbol(db, TEST_LEARNER)).toEqual({ sym_water: T0 });
  });
});

describe('sessions', () => {
  it('start writes row, session_started and page_opened', () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'school', role: 'parent' });
    const row = db.get<{ setting: string }>('SELECT setting FROM app_sessions WHERE id = ?', [sid]);
    expect(row?.setting).toBe('school');
    const types = db.all<{ type: string }>('SELECT type FROM communication_events WHERE session_id = ? ORDER BY rowid', [sid]).map((r) => r.type);
    expect(types).toEqual(['session_started', 'page_opened']);
    expect(getOpenSession(db)?.id).toBe(sid);
  });

  it('end abandons open drafts and flags exploration', () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: T0, offsetMin: 330 });
    appendEvent(db, { sessionId: sid, learnerId: TEST_LEARNER, type: 'symbol_selected', symbolId: 'sym_water', draftId: 'd6', source: 'grid' });
    endSession(db, sid, 'adult_exit', { activeMs: 60000 });
    const types = db.all<{ type: string }>("SELECT type FROM communication_events WHERE draft_id = 'd6'").map((r) => r.type);
    expect(types).toEqual(expect.arrayContaining(['draft_abandoned', 'exploration_flagged']));
    const row = db.get<{ end_reason: string; active_ms: number }>('SELECT end_reason, active_ms FROM app_sessions WHERE id = ?', [sid]);
    expect(row).toEqual({ end_reason: 'adult_exit', active_ms: 60000 });
    expect(getOpenSession(db)).toBeUndefined();
  });

  it('unreviewed list excludes reviewed sessions', () => {
    const a = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: T0, offsetMin: 330 });
    const b = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    endSession(db, a, 'adult_exit');
    endSession(db, b, 'adult_exit');
    markReviewed(db, a);
    expect(listUnreviewedSessions(db, TEST_LEARNER).map((s) => s.id)).toEqual([b]);
  });

  it('persists across a re-run of migrations and orphan sessions end with app_restart', async () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: T0, offsetMin: 330 });
    appendEvent(db, { sessionId: sid, learnerId: TEST_LEARNER, type: 'page_opened', at: '2026-10-19T02:31:00.000Z', pageId: 'quick', payload: { via: 'quick_key' } });
    await runMigrations(db, featureRegistry); // simulates a second boot: no-op
    expect(closeOrphanSession(db)).toBe(sid);
    const row = db.get<{ end_reason: string; ended_at: string }>('SELECT end_reason, ended_at FROM app_sessions WHERE id = ?', [sid]);
    expect(row?.end_reason).toBe('app_restart');
    expect(row?.ended_at).toBe('2026-10-19T02:31:00.000Z');
    expect(closeOrphanSession(db)).toBeNull();
  });
});

describe('active time tracker', () => {
  it('counts foreground time only', () => {
    const t = createActiveTimeTracker(0);
    t.background(10_000);
    expect(t.foreground(40_000)).toBe('ok');
    expect(t.total(50_000)).toBe(20_000);
  });
  it('times out after a background gap over 120 s', () => {
    const t = createActiveTimeTracker(0);
    t.background(5_000);
    expect(t.foreground(5_000 + 120_001)).toBe('timeout');
    expect(t.total(200_000)).toBe(5_000);
  });
  it('a gap of exactly 120 s is allowed', () => {
    const t = createActiveTimeTracker(0);
    t.background(1000);
    expect(t.foreground(121_000)).toBe('ok');
  });
});
