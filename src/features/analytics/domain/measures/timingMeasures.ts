import { median, ms, pct, round1, selectionEvents, symbolMap, wordUses } from '../helpers';
import type { EventRow } from '@/features/event-log/index';
import type { AnalyticsInput, MeasureResult } from '../types';

const base = (input: AnalyticsInput) => ({ locked: false, sessionsSoFar: input.sessions.length });

const ANCHORS = new Set(['session_started', 'page_opened', 'message_submitted', 'clear']);

export interface LatencySample {
  symbolId: string | null;
  seconds: number;
  sessionId: string;
  atMs: number;
}

/**
 * A sample is a symbol_selected that is the first selection after its latest preceding
 * anchor in the same session. Each selection counts at most once.
 */
export function latencySamples(events: EventRow[]): LatencySample[] {
  const bySession = new Map<string, EventRow[]>();
  for (const e of events) {
    const list = bySession.get(e.session_id) ?? [];
    list.push(e);
    bySession.set(e.session_id, list);
  }
  const out: LatencySample[] = [];
  for (const [sessionId, list] of bySession) {
    let anchorMs: number | null = null;
    let consumed = true;
    for (const e of list) {
      if (ANCHORS.has(e.type)) {
        anchorMs = ms(e.at);
        consumed = false;
      } else if (e.type === 'symbol_selected' && anchorMs !== null && !consumed) {
        consumed = true;
        out.push({ symbolId: e.symbol_id, seconds: (ms(e.at) - anchorMs) / 1000, sessionId, atMs: ms(e.at) });
      }
    }
  }
  return out;
}

export function responseLatency(input: AnalyticsInput): MeasureResult {
  const map = symbolMap(input);
  const samples = latencySamples(input.events).filter((s) => s.symbolId && map.get(s.symbolId)?.isCore);
  const med = median(samples.map((s) => s.seconds));
  return {
    id: 'response_latency',
    value: med === null ? null : round1(med),
    ...base(input),
    detail: { samples: samples.length },
  };
}

export function latencyWithinSession(input: AnalyticsInput): MeasureResult {
  const samples = latencySamples(input.events);
  const sessionById = new Map(input.sessions.map((s) => [s.id, s]));
  const lastEvent = new Map<string, number>();
  for (const e of input.events) lastEvent.set(e.session_id, Math.max(lastEvent.get(e.session_id) ?? 0, ms(e.at)));
  const first: number[] = [];
  const last: number[] = [];
  for (const s of samples) {
    const sess = sessionById.get(s.sessionId);
    if (!sess) continue;
    const start = ms(sess.started_at);
    const end = sess.ended_at ? ms(sess.ended_at) : (lastEvent.get(s.sessionId) ?? start);
    if (s.atMs - start <= 180_000) first.push(s.seconds);
    if (end - s.atMs <= 180_000) last.push(s.seconds);
  }
  const m1 = median(first);
  const m2 = median(last);
  const enough = m1 !== null && m2 !== null;
  return {
    id: 'latency_within_session',
    value: enough ? round1(m1) : null,
    ...base(input),
    detail: {
      enough,
      first: m1 === null ? null : round1(m1),
      last: m2 === null ? null : round1(m2),
      firstSamples: first.length,
      lastSamples: last.length,
    },
  };
}

export function corrections(input: AnalyticsInput): MeasureResult {
  const sel = selectionEvents(input.events).length;
  const undo = input.events.filter((e) => e.type === 'undo').length;
  return {
    id: 'corrections',
    value: sel === 0 ? null : pct(undo, sel),
    numerator: undo,
    denominator: sel,
    ...base(input),
  };
}

export function repeatedTaps(input: AnalyticsInput): MeasureResult {
  const sel = selectionEvents(input.events);
  let repeats = 0;
  const lastInDraft = new Map<string, { symbol: string | null; at: number }>();
  for (const e of sel) {
    if (e.draft_id) {
      const prev = lastInDraft.get(e.draft_id);
      if (prev && prev.symbol === e.symbol_id && ms(e.at) - prev.at <= 2000) repeats += 1;
      lastInDraft.set(e.draft_id, { symbol: e.symbol_id, at: ms(e.at) });
    }
  }
  return {
    id: 'repeated_taps',
    value: sel.length === 0 ? null : pct(repeats, sel.length),
    numerator: repeats,
    denominator: sel.length,
    ...base(input),
  };
}

export function abandoned(input: AnalyticsInput): MeasureResult {
  const started = new Set(selectionEvents(input.events).map((e) => e.draft_id).filter((d): d is string => !!d));
  const gone = new Set(
    input.events.filter((e) => e.type === 'draft_abandoned' && e.draft_id && started.has(e.draft_id)).map((e) => e.draft_id as string),
  );
  return {
    id: 'abandoned',
    value: started.size === 0 ? null : pct(gone.size, started.size),
    numerator: gone.size,
    denominator: started.size,
    ...base(input),
  };
}

export function vocabularyRetention(input: AnalyticsInput): MeasureResult {
  const map = symbolMap(input);
  const prev = new Set(wordUses(input.previousAttempts, input.previousEvents, map).map((u) => u.symbolId));
  const cur = new Set(wordUses(input.attempts, input.events, map).map((u) => u.symbolId));
  const kept = [...prev].filter((id) => cur.has(id)).length;
  return {
    id: 'vocabulary_retention',
    value: prev.size === 0 ? null : pct(kept, prev.size),
    numerator: kept,
    denominator: prev.size,
    ...base(input),
  };
}
