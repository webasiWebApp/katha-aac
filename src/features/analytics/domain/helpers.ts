import { computeMeaningfulUses } from '@/features/event-log/index';
import type { AttemptRow, EventRow, MeaningfulUse } from '@/features/event-log/index';
import type { VocabSymbol } from '@/features/vocabulary/index';
import type { AnalyticsInput } from './types';

export const pct = (n: number, d: number): number => Math.round((n / d) * 100);

export const round1 = (x: number): number => Math.round(x * 10) / 10;

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

/** Latest vocabulary version wins when ids repeat. */
export function symbolMap(input: AnalyticsInput): Map<string, VocabSymbol> {
  const map = new Map<string, VocabSymbol>();
  for (const v of Object.values(input.vocabulary)) for (const s of v.symbols) map.set(s.id, s);
  return map;
}

export function wordUses(attempts: AttemptRow[], events: EventRow[], map: Map<string, VocabSymbol>): MeaningfulUse[] {
  return computeMeaningfulUses(attempts, events).filter((u) => map.get(u.symbolId)?.kind === 'word');
}

export function selectionEvents(events: EventRow[]): EventRow[] {
  return events.filter((e) => e.type === 'symbol_selected');
}

export const ms = (iso: string): number => new Date(iso).getTime();

/** Restrict an input to sessions with the given setting. */
export function restrictToSetting(input: AnalyticsInput, setting: string): AnalyticsInput {
  const ids = new Set(input.sessions.filter((s) => s.setting === setting).map((s) => s.id));
  const prev = new Set(input.previousSessions.filter((s) => s.setting === setting).map((s) => s.id));
  return {
    ...input,
    sessions: input.sessions.filter((s) => ids.has(s.id)),
    previousSessions: input.previousSessions.filter((s) => prev.has(s.id)),
    events: input.events.filter((e) => ids.has(e.session_id)),
    previousEvents: input.previousEvents.filter((e) => prev.has(e.session_id)),
    attempts: input.attempts.filter((a) => ids.has(a.session_id)),
    previousAttempts: input.previousAttempts.filter((a) => prev.has(a.session_id)),
    observations: input.observations.filter((o) => ids.has(o.session_id)),
  };
}
