import type { ObservationRow } from '@/features/observations/index';
import { pct } from '../helpers';
import type { AnalyticsInput, MeasureResult } from '../types';

const base = (input: AnalyticsInput) => ({ locked: false, sessionsSoFar: input.sessions.length });

function ofKind(input: AnalyticsInput, kind: ObservationRow['kind']): ObservationRow[] {
  return input.observations.filter((o) => o.kind === kind && o.message_id !== null);
}

function rate(id: MeasureResultId, input: AnalyticsInput, n: number, d: number, extra: Partial<MeasureResult> = {}): MeasureResult {
  return { id, value: d === 0 ? null : pct(n, d), numerator: n, denominator: d, ...base(input), ...extra };
}
type MeasureResultId = MeasureResult['id'];

export function confirmedMeant(input: AnalyticsInput): MeasureResult {
  const answers = ofKind(input, 'intent');
  const meant = answers.filter((o) => o.value === 'meant').length;
  return rate('confirmed_meant', input, meant, answers.length, {
    notRecorded: input.attempts.length - answers.length,
  });
}

function opportunities(input: AnalyticsInput): { a: number; b: number } {
  const rows = input.observations.filter((o) => o.kind === 'opportunities');
  return {
    a: rows.reduce((t, o) => t + (o.count_a ?? 0), 0),
    b: rows.reduce((t, o) => t + (o.count_b ?? 0), 0),
  };
}

export function independentStarts(input: AnalyticsInput, id: MeasureResultId = 'independent_starts'): MeasureResult {
  const { a, b } = opportunities(input);
  return rate(id, input, b, a);
}

export function promptedVsIndependent(
  input: AnalyticsInput,
  id: MeasureResultId = 'prompted_vs_independent',
): MeasureResult {
  const { a, b } = opportunities(input);
  return {
    id,
    value: a === 0 ? null : pct(b, a),
    numerator: b,
    denominator: a,
    ...base(input),
    detail: { independent: b, prompted: a - b },
  };
}

export function promptDependency(input: AnalyticsInput): MeasureResult {
  const rows = ofKind(input, 'prompting');
  const prompted = rows.filter((o) => o.value !== 'independent').length;
  return rate('prompt_dependency', input, prompted, rows.length, {
    notRecorded: input.attempts.length - rows.length,
  });
}

export function functions(input: AnalyticsInput): MeasureResult {
  const counts = { requesting: 0, refusing: 0, commenting: 0, greeting: 0 };
  const rows = ofKind(input, 'function');
  for (const o of rows) {
    if (o.value in counts) counts[o.value as keyof typeof counts] += 1;
  }
  return {
    id: 'functions',
    value: rows.length,
    ...base(input),
    notRecorded: input.attempts.length - rows.length,
    detail: { ...counts, tagged: rows.length, total: input.attempts.length },
  };
}

export function neededRepair(input: AnalyticsInput): MeasureResult {
  const builtIds = new Set(input.attempts.filter((a) => a.kind === 'built').map((a) => a.id));
  const rows = ofKind(input, 'breakdown').filter((o) => builtIds.has(o.message_id as string));
  const yes = rows.filter((o) => o.value === 'yes').length;
  return rate('needed_repair', input, yes, rows.length, { notRecorded: builtIds.size - rows.length });
}
