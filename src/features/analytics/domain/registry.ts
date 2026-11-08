import type { Role } from '@/core/types/common';
import { restrictToSetting } from './helpers';
import { confirmedMeant, functions, independentStarts, neededRepair, promptDependency, promptedVsIndependent } from './measures/adultMeasures';
import {
  classHelpRequests,
  classIndependentStarts,
  classMessages,
  classMessagesWeekly,
  classPromptedVsIndependent,
  classWords,
  goals,
  setupNotes,
} from './measures/classMeasures';
import {
  combinations,
  messagesSent,
  newWords,
  pagesPerSession,
  selections,
  sessionLength,
  sessions,
  timeOfDay,
  topWords,
  wordsUsed,
} from './measures/countMeasures';
import {
  abandoned,
  corrections,
  latencyWithinSession,
  repeatedTaps,
  responseLatency,
  vocabularyRetention,
} from './measures/timingMeasures';
import { MeasureNotAllowed, type AnalyticsInput, type MeasureDef, type MeasureId, type MeasureResult } from './types';

const def = (
  id: MeasureId,
  compute: MeasureDef['compute'],
  minSessions: number,
  source: MeasureDef['source'],
  definition: string,
  classLock = false,
): MeasureDef => ({ id, compute, minSessions, source, definition, classLock });

export const registry: Record<MeasureId, MeasureDef> = {
  sessions: def('sessions', sessions, 0, 'auto', 'Count of sessions in the period.'),
  messages_sent: def('messages_sent', messagesSent, 0, 'auto', 'Messages the child spoke: built messages and stored phrases.'),
  selections: def('selections', selections, 0, 'auto', 'Symbol taps, all sources.'),
  words_used: def('words_used', wordsUsed, 0, 'auto', 'Different words used in spoken messages.'),
  top_words: def('top_words', topWords, 0, 'auto', 'Words used most in spoken messages.'),
  new_words: def('new_words', newWords, 0, 'auto', 'Words used in a spoken message for the first time in this period.'),
  confirmed_meant: def('confirmed_meant', confirmedMeant, 5, 'adult', 'Messages an adult confirmed as meant, out of messages with an answer.'),
  independent_starts: def('independent_starts', independentStarts, 5, 'adult', 'Communication opportunities started without a prompt, as entered by adults.'),
  prompted_vs_independent: def('prompted_vs_independent', promptedVsIndependent, 5, 'adult', 'Opportunities started without a prompt compared with prompted ones.'),
  prompt_dependency: def('prompt_dependency', promptDependency, 5, 'adult', 'Messages with any prompt, out of messages with a prompting entry.'),
  functions: def('functions', functions, 5, 'adult', 'Messages tagged by adults as requesting, refusing, commenting or greeting.'),
  combinations: def('combinations', combinations, 0, 'auto', 'Built messages of two or more symbols, grouped by exact order.'),
  needed_repair: def('needed_repair', neededRepair, 5, 'adult', 'Built messages an adult marked as having a breakdown, out of those with an entry.'),
  vocabulary_retention: def('vocabulary_retention', vocabularyRetention, 0, 'auto', 'Words used in the previous period that were used again in this period.'),
  response_latency: def('response_latency', responseLatency, 0, 'auto', 'Median time from the board appearing to a chosen core symbol.'),
  latency_within_session: def('latency_within_session', latencyWithinSession, 0, 'auto', 'Median time to the first tap, in the first and last 3 minutes of a session.'),
  time_of_day: def('time_of_day', timeOfDay, 0, 'auto', 'Messages by local time: morning, afternoon, evening, night.'),
  corrections: def('corrections', corrections, 5, 'auto', 'Undo taps as a share of all symbol taps.'),
  repeated_taps: def('repeated_taps', repeatedTaps, 5, 'auto', 'Same symbol tapped again within 2 seconds, as a share of all taps.'),
  abandoned: def('abandoned', abandoned, 5, 'auto', 'Drafts that were cleared or left unspoken, out of drafts started.'),
  session_length: def('session_length', sessionLength, 0, 'auto', 'Average active time per session, in minutes.'),
  pages_per_session: def('pages_per_session', pagesPerSession, 0, 'auto', 'Average number of screens opened per session.'),
  class_messages: def('class_messages', classMessages, 0, 'auto/adult', 'Messages in sessions marked as school.'),
  class_words: def('class_words', classWords, 0, 'auto/adult', 'Words used in sessions marked as school.'),
  class_help_requests: def('class_help_requests', classHelpRequests, 0, 'auto/adult', 'Uses of the help word or phrase in sessions marked as school.'),
  class_independent_starts: def('class_independent_starts', classIndependentStarts, 5, 'adult', 'Independent starts in sessions marked as school.', true),
  class_prompted_vs_independent: def('class_prompted_vs_independent', classPromptedVsIndependent, 5, 'adult', 'Independent and prompted opportunities in school sessions.', true),
  class_messages_weekly: def('class_messages_weekly', classMessagesWeekly, 0, 'auto/adult', 'Messages in school sessions per week, for the 6 weeks ending at the period end.'),
  goals: def('goals', goals, 0, 'adult', 'Goals visible to this reader with the latest progress entered in the period.'),
  setup_notes: def('setup_notes', setupNotes, 0, 'adult', 'Setup notes entered by adults, newest first.'),
  planning_idea: def('planning_idea', () => ({ id: 'planning_idea', value: null, locked: false, sessionsSoFar: 0 }), 5, 'template', 'One suggestion sentence chosen by fixed rules.'),
};

/** Computes one measure and applies the 5-session rate lock (section 7.1). */
export function computeMeasure(input: AnalyticsInput, id: MeasureId): MeasureResult {
  const d = registry[id];
  const raw = d.compute(input);
  const sessionsSoFar = d.classLock ? restrictToSetting(input, 'school').sessions.length : input.sessions.length;
  if (d.minSessions > 0 && sessionsSoFar < d.minSessions) {
    return { id, value: null, locked: true, sessionsSoFar };
  }
  return { ...raw, sessionsSoFar: d.classLock ? sessionsSoFar : raw.sessionsSoFar };
}

const allowLists: Partial<Record<Role, ReadonlySet<string>>> = {};

/** Reports register the measure ids their definition contains (non-parent roles may read only these). */
export function registerRoleMeasures(role: Role, ids: readonly string[]): void {
  allowLists[role] = new Set(ids);
}
export function clearRoleMeasures(): void {
  for (const k of Object.keys(allowLists)) delete allowLists[k as Role];
}

export function assertMeasureAllowed(role: Role, id: string): void {
  if (role === 'parent') return;
  const list = allowLists[role];
  if (!list || !list.has(id)) throw new MeasureNotAllowed(role, id);
}

export function computeMeasures(input: AnalyticsInput, ids: MeasureId[]): Record<string, MeasureResult> {
  for (const id of ids) assertMeasureAllowed(input.role, id);
  const out: Record<string, MeasureResult> = {};
  for (const id of ids) out[id] = computeMeasure(input, id);
  return out;
}
