import { addDays, inPeriod } from '@/core/time';
import { restrictToSetting, symbolMap, wordUses } from '../helpers';
import type { AnalyticsInput, MeasureResult } from '../types';
import { messagesSent , rankedWords } from './countMeasures';
import { independentStarts, promptedVsIndependent } from './adultMeasures';

function school(input: AnalyticsInput): AnalyticsInput {
  return restrictToSetting(input, 'school');
}

const lockBase = (input: AnalyticsInput) => ({ locked: false, sessionsSoFar: school(input).sessions.length });

export function classMessages(input: AnalyticsInput): MeasureResult {
  const r = messagesSent(school(input));
  return { ...r, id: 'class_messages', ...lockBase(input) };
}

export function classWords(input: AnalyticsInput): MeasureResult {
  const list = rankedWords(school(input));
  return { id: 'class_words', value: list.length, ...lockBase(input), detail: list.slice(0, 6) };
}

export function classHelpRequests(input: AnalyticsInput): MeasureResult {
  const s = school(input);
  const map = symbolMap(s);
  const wordHelp = wordUses(s.attempts, s.events, map).filter((u) => u.symbolId === 'sym_help').length;
  const phraseHelp = s.attempts.filter((a) => a.kind === 'stored_phrase' && a.symbol_ids_json === '["phr_help"]').length;
  return { id: 'class_help_requests', value: wordHelp + phraseHelp, ...lockBase(input) };
}

export function classIndependentStarts(input: AnalyticsInput): MeasureResult {
  const r = independentStarts(school(input), 'class_independent_starts');
  return { ...r, ...lockBase(input) };
}

export function classPromptedVsIndependent(input: AnalyticsInput): MeasureResult {
  const r = promptedVsIndependent(school(input), 'class_prompted_vs_independent');
  return { ...r, ...lockBase(input) };
}

export function classMessagesWeekly(input: AnalyticsInput): MeasureResult {
  const s = school(input);
  const weeks: number[] = [];
  const sessionOf = new Map(s.sessions.map((x) => [x.id, x]));
  for (let i = 5; i >= 0; i--) {
    const end = addDays(input.period.end, -7 * i);
    const period = { start: addDays(end, -7), end };
    weeks.push(
      s.attempts.filter((a) => {
        const sess = sessionOf.get(a.session_id);
        return sess ? inPeriod(sess.started_at, sess.offset_min, period) : false;
      }).length,
    );
  }
  return { id: 'class_messages_weekly', value: weeks.reduce((a, b) => a + b, 0), ...lockBase(input), detail: { weeks } };
}

export function goals(input: AnalyticsInput): MeasureResult {
  const items = input.goals.map((g) => {
    const inside = g.progress
      .filter((p) => p.period_start >= input.period.start && p.period_end <= input.period.end)
      .sort((a, b) => (a.entered_at < b.entered_at ? -1 : 1));
    const latest = inside[inside.length - 1];
    return {
      goalId: g.id,
      title: g.title,
      target: g.target_count,
      targetPeriod: g.target_period,
      achieved: latest ? latest.achieved_count : null,
      note: latest?.note ?? null,
    };
  });
  return {
    id: 'goals',
    value: items.length,
    locked: false,
    sessionsSoFar: input.sessions.length,
    detail: items,
  };
}

export function setupNotes(input: AnalyticsInput): MeasureResult {
  const sessionById = new Map(input.sessions.map((s) => [s.id, s]));
  const items = input.observations
    .filter((o) => o.kind === 'setup_note')
    .map((o) => ({ sessionId: o.session_id, text: o.value, at: sessionById.get(o.session_id)?.started_at ?? o.entered_at, enteredAt: o.entered_at }))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return { id: 'setup_notes', value: items.length, locked: false, sessionsSoFar: input.sessions.length, detail: items };
}
