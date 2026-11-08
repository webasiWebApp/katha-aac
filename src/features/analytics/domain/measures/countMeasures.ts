import { localDate, periodDays, timeOfDayBucket } from '@/core/time';
import { round1, selectionEvents, symbolMap, wordUses } from '../helpers';
import type { AnalyticsInput, MeasureResult } from '../types';

const base = (input: AnalyticsInput) => ({ locked: false, sessionsSoFar: input.sessions.length });

export function sessions(input: AnalyticsInput): MeasureResult {
  const days = new Set(input.sessions.map((s) => localDate(s.started_at, s.offset_min)));
  return {
    id: 'sessions',
    value: input.sessions.length,
    ...base(input),
    detail: { daysWithSessions: days.size, daysInPeriod: periodDays(input.period) },
  };
}

export function messagesSent(input: AnalyticsInput): MeasureResult {
  const built = input.attempts.filter((a) => a.kind === 'built').length;
  const stored = input.attempts.length - built;
  const detail: { built: number; stored: number; change?: number; days?: number } = { built, stored };
  if (input.sessions.length >= 5 && input.previousSessions.length >= 5) {
    detail.change = input.attempts.length - input.previousAttempts.length;
    detail.days = periodDays(input.period);
  }
  return { id: 'messages_sent', value: input.attempts.length, ...base(input), detail };
}

export function selections(input: AnalyticsInput): MeasureResult {
  return { id: 'selections', value: selectionEvents(input.events).length, ...base(input) };
}

export interface TopWord {
  symbolId: string;
  label: string;
  gloss: string;
  category: string;
  count: number;
}

export function rankedWords(input: AnalyticsInput): TopWord[] {
  const map = symbolMap(input);
  const uses = wordUses(input.attempts, input.events, map);
  const msgSymbols = new Map(input.attempts.map((a) => [a.id, JSON.parse(a.symbol_ids_json) as string[]]));
  const agg = new Map<string, { count: number; first: string; pos: number }>();
  for (const u of uses) {
    const cur = agg.get(u.symbolId);
    const pos = (msgSymbols.get(u.messageId) ?? []).indexOf(u.symbolId);
    if (!cur) agg.set(u.symbolId, { count: 1, first: u.at, pos });
    else {
      cur.count += 1;
      if (u.at < cur.first || (u.at === cur.first && pos < cur.pos)) {
        cur.first = u.at;
        cur.pos = pos;
      }
    }
  }
  return [...agg.entries()]
    .sort(
      (a, b) =>
        b[1].count - a[1].count ||
        (a[1].first < b[1].first ? -1 : a[1].first > b[1].first ? 1 : 0) ||
        a[1].pos - b[1].pos ||
        a[0].localeCompare(b[0]),
    )
    .map(([symbolId, v]) => {
      const s = map.get(symbolId);
      return {
        symbolId,
        label: s?.label ?? symbolId,
        gloss: s?.gloss ?? '',
        category: s?.category ?? 'thing',
        count: v.count,
      };
    });
}

export function wordsUsed(input: AnalyticsInput): MeasureResult {
  const all = rankedWords(input);
  return { id: 'words_used', value: all.length, ...base(input), detail: all };
}

export function topWords(input: AnalyticsInput): MeasureResult {
  const all = rankedWords(input);
  return { id: 'top_words', value: all.length, ...base(input), detail: all.slice(0, 6) };
}

export function newWords(input: AnalyticsInput): MeasureResult {
  const used = rankedWords(input);
  const list = used.filter((w) => {
    const first = input.firstUseBySymbol[w.symbolId];
    if (!first) return false;
    const local = localDate(first, input.offsetMin);
    return local >= input.period.start && local < input.period.end;
  });
  return { id: 'new_words', value: list.length, ...base(input), detail: list };
}

export function combinations(input: AnalyticsInput): MeasureResult {
  const built = input.attempts.filter((a) => a.kind === 'built');
  const map = symbolMap(input);
  const groups = new Map<string, { ids: string[]; count: number }>();
  for (const a of built) {
    const ids = JSON.parse(a.symbol_ids_json) as string[];
    if (ids.length < 2) continue;
    const key = ids.join('+');
    const g = groups.get(key);
    if (g) g.count += 1;
    else groups.set(key, { ids, count: 1 });
  }
  const top = [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((g) => ({
      symbolIds: g.ids,
      labels: g.ids.map((id) => map.get(id)?.label ?? id),
      count: g.count,
    }));
  const totalSymbols = built.reduce((n, a) => n + a.symbol_count, 0);
  return {
    id: 'combinations',
    value: top.length,
    ...base(input),
    detail: {
      top,
      averageSymbols: built.length === 0 ? 0 : round1(totalSymbols / built.length),
      built: built.length,
      stored: input.attempts.length - built.length,
    },
  };
}

export function timeOfDay(input: AnalyticsInput): MeasureResult {
  const counts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const a of input.attempts) counts[timeOfDayBucket(a.submitted_at, a.offset_min)] += 1;
  return { id: 'time_of_day', value: input.attempts.length, ...base(input), detail: counts };
}

export function sessionLength(input: AnalyticsInput): MeasureResult {
  const n = input.sessions.length;
  const mean = n === 0 ? null : round1(input.sessions.reduce((t, s) => t + s.active_ms, 0) / n / 60000);
  return { id: 'session_length', value: mean, ...base(input) };
}

export function pagesPerSession(input: AnalyticsInput): MeasureResult {
  const n = input.sessions.length;
  const pages = input.events.filter((e) => e.type === 'page_opened').length;
  return { id: 'pages_per_session', value: n === 0 ? null : round1(pages / n), ...base(input) };
}
