import { makeTestDb } from '@/app/testing/testDb';
import type { Db } from '@/core/types/manifest';
import {
  clearRoleMeasures,
  getMeasures,
  MeasureNotAllowed,
  registerRoleMeasures,
  registry,
  type MeasureId,
} from '../index';
import { expectedA, L1, loadReferenceDataset, PERIOD_A, PERIOD_B } from './fixtures/referenceDataset';

let db: Db;
let ids: Record<string, string>;

beforeAll(async () => {
  db = await makeTestDb();
  ids = loadReferenceDataset(db);
});
afterEach(() => clearRoleMeasures());

const all = Object.keys(registry) as MeasureId[];
const A = () => getMeasures(db, { learnerId: L1, period: PERIOD_A, role: 'parent', ids: all });

describe('reference dataset loads (T-115)', () => {
  it('creates 8 sessions, 7 messages, 1 replay event', () => {
    expect(db.all('SELECT * FROM app_sessions')).toHaveLength(8);
    expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(7);
    expect(db.all("SELECT * FROM communication_events WHERE type = 'message_replayed'")).toHaveLength(1);
    expect(Object.keys(ids)).toContain('G1');
  });
});

describe('Period A expected values (T-126)', () => {
  it('sessions', () => {
    const r = A().sessions!;
    expect(r.value).toBe(expectedA.sessions);
    expect(r.detail).toEqual({ daysWithSessions: 6, daysInPeriod: 7 });
  });
  it('messages_sent has no comparison (previous period has 1 session)', () => {
    const r = A().messages_sent!;
    expect(r.value).toBe(5);
    expect(r.detail).toEqual({ built: 4, stored: 1 });
  });
  it('selections, words_used', () => {
    expect(A().selections!.value).toBe(13);
    expect(A().words_used!.value).toBe(6);
  });
  it('top_words in order', () => {
    const d = A().top_words!.detail as { symbolId: string; count: number }[];
    expect(d.map((w) => [w.symbolId, w.count])).toEqual(expectedA.top_words);
  });
  it('new_words excludes milk', () => {
    const d = A().new_words!.detail as { symbolId: string }[];
    expect(d.map((w) => w.symbolId).sort()).toEqual([...expectedA.new_words].sort());
    expect(A().new_words!.value).toBe(5);
  });
  it('confirmed_meant', () => {
    expect(A().confirmed_meant).toMatchObject({ ...expectedA.confirmed_meant, locked: false });
  });
  it('independent_starts and prompted_vs_independent', () => {
    expect(A().independent_starts).toMatchObject(expectedA.independent_starts);
    expect(A().prompted_vs_independent!.detail).toEqual(expectedA.prompted_vs_independent);
  });
  it('prompt_dependency', () => {
    expect(A().prompt_dependency).toMatchObject(expectedA.prompt_dependency);
  });
  it('functions', () => {
    const r = A().functions!;
    expect(r.detail).toMatchObject({ requesting: 2, refusing: 1, commenting: 0, greeting: 0 });
    expect(r.notRecorded).toBe(2);
  });
  it('combinations', () => {
    const d = A().combinations!.detail as { top: { symbolIds: string[]; count: number }[]; averageSymbols: number; built: number; stored: number };
    expect(d.top.map((t) => t.symbolIds.join('+')).sort()).toEqual([...expectedA.combinations.sequences].sort());
    expect(d.top.every((t) => t.count === 1)).toBe(true);
    expect([d.averageSymbols, d.built, d.stored]).toEqual([2.0, 4, 1]);
  });
  it('needed_repair', () => {
    expect(A().needed_repair).toMatchObject(expectedA.needed_repair);
  });
  it('vocabulary_retention', () => {
    expect(A().vocabulary_retention).toMatchObject(expectedA.vocabulary_retention);
  });
  it('response_latency is 2.5 s from samples 2.0 and 3.0', () => {
    expect(A().response_latency).toMatchObject({ value: 2.5, detail: { samples: 2 } });
  });
  it('time_of_day', () => {
    expect(A().time_of_day!.detail).toEqual(expectedA.time_of_day);
  });
  it('corrections, repeated_taps, abandoned', () => {
    expect(A().corrections).toMatchObject(expectedA.corrections);
    expect(A().repeated_taps).toMatchObject(expectedA.repeated_taps);
    expect(A().abandoned).toMatchObject(expectedA.abandoned);
  });
  it('session_length and pages_per_session', () => {
    expect(A().session_length!.value).toBe(3.5);
    expect(A().pages_per_session!.value).toBe(1.2);
  });
  it('class measures', () => {
    expect(A().class_messages!.value).toBe(1);
    expect(A().class_help_requests!.value).toBe(1);
    expect(A().class_independent_starts).toMatchObject({ locked: true, value: null, sessionsSoFar: 1 });
    expect(A().class_prompted_vs_independent!.locked).toBe(true);
    const weekly = (A().class_messages_weekly!.detail as { weeks: number[] }).weeks;
    expect(weekly).toHaveLength(6);
    expect(weekly[5]).toBe(1);
  });
  it('goals: G1 1 of 2 this week', () => {
    const d = A().goals!.detail as { target: number; achieved: number | null }[];
    expect(d).toHaveLength(1);
    expect([d[0]?.target, d[0]?.achieved]).toEqual([2, 1]);
  });
});

describe('Period B (3 sessions) locks every 5-session measure', () => {
  const B = () => getMeasures(db, { learnerId: L1, period: PERIOD_B, role: 'parent', ids: all });
  it('is locked with sessionsSoFar 3', () => {
    const r = B();
    for (const id of all) {
      if (registry[id].minSessions === 5 && !registry[id].classLock) {
        expect([id, r[id]?.locked, r[id]?.sessionsSoFar, r[id]?.value]).toEqual([id, true, 3, null]);
      }
    }
    expect(r.confirmed_meant).toMatchObject({ locked: true, sessionsSoFar: 3 });
    expect(r.corrections).toMatchObject({ locked: true, sessionsSoFar: 3 });
  });
  it('messages_sent is 3', () => {
    expect(B().messages_sent!.value).toBe(3);
  });
});

describe('role refusal', () => {
  it('non-parent cannot read a measure outside its report', () => {
    registerRoleMeasures('educator', ['class_messages']);
    expect(getMeasures(db, { learnerId: L1, period: PERIOD_A, role: 'educator', ids: ['class_messages'] }).class_messages!.value).toBe(1);
    expect(() => getMeasures(db, { learnerId: L1, period: PERIOD_A, role: 'educator', ids: ['functions'] })).toThrow(MeasureNotAllowed);
    expect(() => getMeasures(db, { learnerId: L1, period: PERIOD_A, role: 'ot', ids: ['sessions'] })).toThrow(MeasureNotAllowed);
  });
  it('goals are filtered by visibility', () => {
    registerRoleMeasures('ot', ['goals']);
    const r = getMeasures(db, { learnerId: L1, period: PERIOD_A, role: 'ot', ids: ['goals'] });
    expect(r.goals!.detail).toEqual([]);
  });
});
