import { makeTestDb, TEST_LEARNER } from '@/app/testing/testDb';
import { emit, on, resetBus } from '@/core/events/bus';
import type { Db } from '@/core/types/manifest';
import { savePermission } from '@/features/access/index';
import { commitMessage } from '@/features/event-log/index';
import { addProgress, archiveGoal, createGoal, listGoals, updateGoal } from '@/features/goals/index';
import { startSession } from '@/features/sessions/index';
import { manifest } from '../feature.manifest';
import {
  getForMessages,
  getForSessions,
  initObservations,
  ObservationError,
  setBreakdown,
  setFunction,
  setIntent,
  setOpportunities,
  setPrompting,
  setSetupNote,
} from '../index';

let db: Db;
let sid: string;
beforeEach(async () => {
  resetBus();
  db = await makeTestDb();
  sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
  commitMessage(db, { messageId: 'm1', draftId: 'd1', sessionId: sid, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_me'], text: 't', vocabularyVersionId: 'v1' });
});

describe('observations', () => {
  it('upserts and deletes (null = not recorded)', () => {
    setIntent(db, 'parent', 'm1', 'meant');
    setIntent(db, 'slp', 'm1', 'unsure');
    expect(getForMessages(db, ['m1']).map((o) => [o.kind, o.value, o.entered_by_role])).toEqual([['intent', 'unsure', 'slp']]);
    setIntent(db, 'slp', 'm1', null);
    expect(getForMessages(db, ['m1'])).toHaveLength(0);
  });

  it('stores function, prompting, breakdown', () => {
    setFunction(db, 'parent', 'm1', 'requesting');
    setPrompting(db, 'parent', 'm1', 'verbal');
    setBreakdown(db, 'parent', 'm1', true);
    const m = Object.fromEntries(getForMessages(db, ['m1']).map((o) => [o.kind, o.value]));
    expect(m).toEqual({ function: 'requesting', prompting: 'verbal', breakdown: 'yes' });
    setBreakdown(db, 'parent', 'm1', false);
    expect(getForMessages(db, ['m1']).find((o) => o.kind === 'breakdown')?.value).toBe('no');
  });

  it('rejects invalid values', () => {
    expect(() => setFunction(db, 'parent', 'm1', 'dancing' as never)).toThrow(ObservationError);
  });

  it('validates opportunities (independent <= observed) and upserts per session', () => {
    expect(() => setOpportunities(db, 'parent', sid, 1, 2)).toThrow(ObservationError);
    expect(() => setOpportunities(db, 'parent', sid, 2, -1)).toThrow(ObservationError);
    setOpportunities(db, 'parent', sid, 2, 1);
    setOpportunities(db, 'parent', sid, 3, 3);
    const rows = getForSessions(db, [sid]).filter((o) => o.kind === 'opportunities');
    expect(rows).toHaveLength(1);
    expect([rows[0]?.count_a, rows[0]?.count_b]).toEqual([3, 3]);
    setOpportunities(db, 'parent', sid, null, null);
    expect(getForSessions(db, [sid]).filter((o) => o.kind === 'opportunities')).toHaveLength(0);
  });

  it('setup notes: max 280 chars, blank deletes', () => {
    setSetupNote(db, 'ot', sid, 'Tablet on stand');
    expect(getForSessions(db, [sid]).find((o) => o.kind === 'setup_note')?.value).toBe('Tablet on stand');
    expect(() => setSetupNote(db, 'ot', sid, 'x'.repeat(281))).toThrow(ObservationError);
    setSetupNote(db, 'ot', sid, '  ');
    expect(getForSessions(db, [sid]).filter((o) => o.kind === 'setup_note')).toHaveLength(0);
  });

  it('refuses a role without the observations permission', () => {
    savePermission(db, 'parent', 'ot', { canEnterObservations: false });
    expect(() => setIntent(db, 'ot', 'm1', 'meant')).toThrow(ObservationError);
  });

  it('bus intent_answered creates one observation, without a permission check', async () => {
    initObservations(db);
    for (const h of manifest.eventHandlers ?? []) on(h.event as 'intent_answered', h.handle as never);
    await emit({ type: 'intent_answered', messageId: 'm1', answer: 'meant' });
    const rows = getForMessages(db, ['m1']);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.entered_by_role).toBe('unknown_adult');
  });
});

describe('goals', () => {
  it('create, edit, progress, visibility, archive', () => {
    const id = createGoal(db, { learnerId: TEST_LEARNER, title: 'Ask for help with උදව්', role: 'slp', targetCount: 2, targetPeriod: 'week', visibleTo: ['parent', 'slp', 'educator'] });
    expect(listGoals(db, TEST_LEARNER, 'ot')).toHaveLength(0);
    expect(listGoals(db, TEST_LEARNER, 'educator')).toHaveLength(1);
    updateGoal(db, id, { targetCount: 3, visibleTo: ['slp'] });
    expect(listGoals(db, TEST_LEARNER, 'educator')).toHaveLength(0);
    expect(listGoals(db, TEST_LEARNER, 'parent')[0]?.target_count).toBe(3);
    addProgress(db, { goalId: id, periodStart: '2026-10-19', periodEnd: '2026-10-26', achievedCount: 1, role: 'slp', note: 'n' });
    expect(listGoals(db, TEST_LEARNER, 'slp')[0]?.progress).toHaveLength(1);
    archiveGoal(db, id);
    expect(listGoals(db, TEST_LEARNER, 'parent')).toHaveLength(0);
  });
  it('rejects blank titles', () => {
    expect(() => createGoal(db, { learnerId: TEST_LEARNER, title: ' ', role: 'slp', targetCount: 1, targetPeriod: 'week', visibleTo: [] })).toThrow();
  });
});
