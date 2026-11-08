import type { Db } from '@/core/types/manifest';
import { savePermission } from '@/features/access/index';
import { appendEvent, commitMessage, recordAudioAttempt, type EventType } from '@/features/event-log/index';
import { addProgress, createGoal } from '@/features/goals/index';
import { setBreakdown, setFunction, setIntent, setOpportunities, setPrompting } from '@/features/observations/index';
import { endSession, startSession } from '@/features/sessions/index';

export const L1 = 'L1';
export const OFFSET = 330;

/** '2026-10-19 08:00:05' (local, +330) -> ISO UTC. */
export function local(ts: string): string {
  const [d, t] = ts.split(' ') as [string, string];
  const ms = new Date(`${d}T${t.length === 5 ? `${t}:00` : t}Z`).getTime() - OFFSET * 60_000;
  return new Date(ms).toISOString();
}

export const PERIOD_A = { start: '2026-10-19', end: '2026-10-26' };
export const PERIOD_B = { start: '2026-10-19', end: '2026-10-22' };

interface Ev {
  at: string;
  type: EventType;
  symbolId?: string;
  draftId?: string;
  messageId?: string;
  source?: 'grid' | 'core' | 'quick' | 'template';
  pageId?: string;
  payload?: Record<string, unknown>;
}

let seq = 0;

export function loadReferenceDataset(db: Db): Record<string, string> {
  seq = 0;
  const ids: Record<string, string> = {};
  db.run(
    `INSERT OR IGNORE INTO learners (id, display_name, participant_code, is_fictional, created_at, updated_at)
     VALUES (?, 'Demo Learner', 'P-07', 1, ?, ?)`,
    [L1, local('2026-10-01 00:00'), local('2026-10-01 00:00')],
  );

  const sel = (day: string, t: string, symbolId: string, draftId: string | null, source: 'grid' | 'core' | 'quick', page = 'home'): Ev => ({
    at: local(`${day} ${t}`),
    type: 'symbol_selected',
    symbolId,
    draftId: draftId ?? undefined,
    source,
    pageId: page,
    payload: { positionIndex: 0, quickUndoEligibleUntil: 0 },
  });

  const session = (
    name: string,
    start: string,
    setting: 'home' | 'school' | 'therapy' | 'unknown',
    activeMin: number,
    events: Ev[],
    messages: { id: string; draftId: string | null; at: string; kind: 'built' | 'stored_phrase'; symbolIds: string[]; text: string; audio?: 'clip' | 'voice' | 'failed' }[],
    endReason: 'adult_exit' = 'adult_exit',
  ): string => {
    const startIso = local(start);
    const sid = startSession(db, { learnerId: L1, setting, role: 'parent', at: startIso, offsetMin: OFFSET });
    ids[name] = sid;
    for (const e of events) {
      appendEvent(db, {
        id: `${name}-e${++seq}`,
        sessionId: sid,
        learnerId: L1,
        type: e.type,
        at: e.at,
        offsetMin: OFFSET,
        symbolId: e.symbolId,
        draftId: e.draftId,
        messageId: e.messageId,
        source: e.source,
        pageId: e.pageId,
        payload: e.payload,
      });
    }
    for (const m of messages) {
      commitMessage(db, {
        messageId: m.id,
        draftId: m.draftId,
        sessionId: sid,
        learnerId: L1,
        kind: m.kind,
        symbolIds: m.symbolIds,
        text: m.text,
        vocabularyVersionId: 'v1',
        at: local(m.at),
        offsetMin: OFFSET,
      });
      if (m.audio) {
        recordAudioAttempt(db, { sessionId: sid, messageId: m.id, kind: 'message_first', outcome: m.audio, requestedAt: local(m.at) });
      }
    }
    const endAt = new Date(new Date(startIso).getTime() + activeMin * 60_000).toISOString();
    endSession(db, sid, endReason, { endAt, activeMs: activeMin * 60_000 });
    return sid;
  };

  // S0 (previous period)
  session('S0', '2026-10-18 10:00:00', 'home', 3, [sel('2026-10-18', '10:00:04', 'sym_milk', 'd0', 'grid')], [
    { id: 'm0', draftId: 'd0', at: '2026-10-18 10:00:06', kind: 'built', symbolIds: ['sym_milk'], text: 'කිරි' },
  ]);

  // S1
  session('S1', '2026-10-19 08:00:00', 'home', 5, [
    sel('2026-10-19', '08:00:03', 'sym_me', 'd1', 'grid'),
    sel('2026-10-19', '08:00:05', 'sym_want', 'd1', 'core'),
    sel('2026-10-19', '08:00:07', 'sym_water', 'd1', 'grid'),
    { at: local('2026-10-19 08:00:15'), type: 'message_replayed', messageId: 'm1' },
  ], [
    { id: 'm1', draftId: 'd1', at: '2026-10-19 08:00:09', kind: 'built', symbolIds: ['sym_me', 'sym_want', 'sym_water'], text: 'මට ඕනේ වතුර', audio: 'clip' },
  ]);
  recordAudioAttempt(db, { sessionId: ids.S1 as string, messageId: 'm1', kind: 'message_replay', outcome: 'clip', requestedAt: local('2026-10-19 08:00:15') });

  // S2
  session('S2', '2026-10-20 12:30:00', 'school', 6, [
    sel('2026-10-20', '12:30:02', 'sym_help', 'd2', 'core'),
    sel('2026-10-20', '12:30:10', 'sym_milk', 'd3', 'grid'),
    { at: local('2026-10-20 12:30:11'), type: 'undo', symbolId: 'sym_milk', draftId: 'd3', pageId: 'home', payload: { quickUndo: true } },
    sel('2026-10-20', '12:30:13', 'sym_water', 'd3', 'grid'),
    sel('2026-10-20', '12:30:14', 'sym_water', 'd3', 'grid'),
    { at: local('2026-10-20 12:30:20'), type: 'clear', draftId: 'd3', pageId: 'home', payload: { symbolCount: 2 } },
    { at: local('2026-10-20 12:30:20'), type: 'draft_abandoned', draftId: 'd3', payload: { reason: 'clear', symbolCount: 2 } },
    { at: local('2026-10-20 12:30:20'), type: 'exploration_flagged', draftId: 'd3', payload: { symbolCount: 2 } },
  ], [
    { id: 'm2', draftId: 'd2', at: '2026-10-20 12:30:04', kind: 'built', symbolIds: ['sym_help'], text: 'උදව්', audio: 'voice' },
  ]);

  // S3
  session('S3', '2026-10-21 18:00:00', 'home', 2, [
    { at: local('2026-10-21 18:00:02'), type: 'page_opened', pageId: 'quick', payload: { via: 'quick_key' } },
    sel('2026-10-21', '18:00:05', 'phr_help', null, 'quick', 'quick'),
  ], [
    { id: 'm3', draftId: null, at: '2026-10-21 18:00:05', kind: 'stored_phrase', symbolIds: ['phr_help'], text: 'මට උදව් ඕනේ', audio: 'failed' },
  ]);

  // S4
  session('S4', '2026-10-22 09:00:00', 'therapy', 4, [
    sel('2026-10-22', '09:00:04', 'sym_me', 'd4', 'grid'),
    sel('2026-10-22', '09:00:06', 'sym_want', 'd4', 'core'),
    sel('2026-10-22', '09:00:08', 'sym_milk', 'd4', 'grid'),
  ], [
    { id: 'm4', draftId: 'd4', at: '2026-10-22 09:00:10', kind: 'built', symbolIds: ['sym_me', 'sym_want', 'sym_milk'], text: 'මට ඕනේ කිරි', audio: 'clip' },
  ]);

  // S5
  session('S5', '2026-10-23 16:00:00', 'unknown', 3, [sel('2026-10-23', '16:00:03', 'sym_more', 'd5', 'core')], [
    { id: 'm5', draftId: 'd5', at: '2026-10-23 16:00:05', kind: 'built', symbolIds: ['sym_more'], text: 'තව', audio: 'voice' },
  ]);

  // S6 (ends with an open draft d6 -> abandoned + exploration_flagged by endSession)
  session('S6', '2026-10-25 21:30:00', 'home', 1, [sel('2026-10-25', '21:30:04', 'sym_water', 'd6', 'grid')], []);

  // S7 (next period)
  session('S7', '2026-10-26 00:10:00', 'home', 1, [sel('2026-10-26', '00:10:03', 'sym_water', 'd7', 'grid')], [
    { id: 'm7', draftId: 'd7', at: '2026-10-26 00:10:05', kind: 'built', symbolIds: ['sym_water'], text: 'වතුර' },
  ]);

  // Observations (all by role parent)
  setIntent(db, 'parent', 'm1', 'meant');
  setIntent(db, 'parent', 'm2', 'meant');
  setIntent(db, 'parent', 'm3', 'unsure');
  setIntent(db, 'parent', 'm4', 'not_meant');
  setFunction(db, 'parent', 'm1', 'requesting');
  setFunction(db, 'parent', 'm2', 'requesting');
  setFunction(db, 'parent', 'm4', 'refusing');
  setPrompting(db, 'parent', 'm1', 'independent');
  setPrompting(db, 'parent', 'm2', 'independent');
  setPrompting(db, 'parent', 'm4', 'verbal');
  setBreakdown(db, 'parent', 'm1', false);
  setBreakdown(db, 'parent', 'm4', true);
  setOpportunities(db, 'parent', ids.S1 as string, 2, 1);
  setOpportunities(db, 'parent', ids.S2 as string, 2, 2);
  setOpportunities(db, 'parent', ids.S4 as string, 1, 0);

  const g = createGoal(db, { learnerId: L1, title: 'Ask for help with උදව්', role: 'slp', targetCount: 2, targetPeriod: 'week', visibleTo: ['parent', 'slp', 'educator'] });
  addProgress(db, { goalId: g, periodStart: '2026-10-19', periodEnd: '2026-10-26', achievedCount: 1, role: 'slp' });
  ids.G1 = g;
  void savePermission;
  return ids;
}

/** Expected values from section 7.3 for Period A. */
export const expectedA = {
  sessions: 6,
  daysWithSessions: 6,
  daysInPeriod: 7,
  messages_sent: 5,
  built: 4,
  stored: 1,
  selections: 13,
  words_used: 6,
  top_words: [
    ['sym_me', 2],
    ['sym_want', 2],
    ['sym_water', 1],
    ['sym_help', 1],
    ['sym_milk', 1],
    ['sym_more', 1],
  ] as [string, number][],
  new_words: ['sym_me', 'sym_want', 'sym_water', 'sym_help', 'sym_more'],
  confirmed_meant: { value: 50, numerator: 2, denominator: 4, notRecorded: 1 },
  independent_starts: { value: 60, numerator: 3, denominator: 5 },
  prompted_vs_independent: { independent: 3, prompted: 2 },
  prompt_dependency: { value: 33, numerator: 1, denominator: 3 },
  functions: { requesting: 2, refusing: 1, commenting: 0, greeting: 0, notRecorded: 2 },
  combinations: { sequences: ['sym_me+sym_want+sym_water', 'sym_me+sym_want+sym_milk'], averageSymbols: 2.0, built: 4, stored: 1 },
  needed_repair: { value: 50, numerator: 1, denominator: 2 },
  vocabulary_retention: { value: 100, numerator: 1, denominator: 1 },
  response_latency: { value: 2.5, samples: 2 },
  time_of_day: { morning: 2, afternoon: 2, evening: 1, night: 0 },
  corrections: { value: 8, numerator: 1, denominator: 13 },
  repeated_taps: { value: 8, numerator: 1, denominator: 13 },
  abandoned: { value: 33, numerator: 2, denominator: 6 },
  session_length: 3.5,
  pages_per_session: 1.2,
  class_messages: 1,
  class_help_requests: 1,
  goal: { target: 2, achieved: 1 },
};
