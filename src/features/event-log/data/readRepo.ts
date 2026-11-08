import type { IntentAnswer, Period } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import { computeMeaningfulUses } from '../domain/meaningful';
import type { AttemptRow, AudioAttemptRow, EventRow, SessionRow } from '../domain/types';

export interface PeriodData {
  sessions: SessionRow[];
  events: EventRow[];
  attempts: AttemptRow[];
  audioAttempts: AudioAttemptRow[];
}

const LOCAL_START = "date(started_at, printf('%+d minutes', offset_min))";

function inClause(ids: string[]): string {
  return ids.map(() => '?').join(',');
}

export function listSessionsInPeriod(db: Db, learnerId: string, period: Period): SessionRow[] {
  return db.all<SessionRow>(
    `SELECT * FROM app_sessions
     WHERE learner_id = ? AND ${LOCAL_START} >= ? AND ${LOCAL_START} < ?
     ORDER BY started_at`,
    [learnerId, period.start, period.end],
  );
}

/** Events, attempts and audio attempts for the given sessions (chunked IN lists). */
export function loadDataForSessions(db: Db, sessions: SessionRow[]): PeriodData {
  const out: PeriodData = { sessions, events: [], attempts: [], audioAttempts: [] };
  for (let i = 0; i < sessions.length; i += 300) {
    const ids = sessions.slice(i, i + 300).map((s) => s.id);
    const marks = inClause(ids);
    out.events.push(
      ...db.all<EventRow>(
        `SELECT * FROM communication_events WHERE session_id IN (${marks}) ORDER BY at, rowid`,
        ids,
      ),
    );
    out.attempts.push(
      ...db.all<AttemptRow>(
        `SELECT * FROM communication_attempts WHERE session_id IN (${marks}) ORDER BY submitted_at`,
        ids,
      ),
    );
    out.audioAttempts.push(
      ...db.all<AudioAttemptRow>(
        `SELECT * FROM audio_attempts WHERE session_id IN (${marks}) ORDER BY requested_at`,
        ids,
      ),
    );
  }
  return out;
}

/** Sessions starting in the period with their events, attempts and audio attempts. */
export function loadPeriodData(db: Db, learnerId: string, period: Period): PeriodData {
  return loadDataForSessions(db, listSessionsInPeriod(db, learnerId, period));
}

export type MessageFilter = 'all' | 'built' | 'stored_phrase';

export interface MessageListItem {
  id: string;
  sessionId: string;
  text: string;
  symbolCount: number;
  kind: 'built' | 'stored_phrase';
  at: string;
  offsetMin: number;
  intent: IntentAnswer | null;
}

/**
 * History list, newest first. `intentFor` is supplied by the caller (the observations API)
 * so that this feature does not import observations.
 */
export function listMessages(
  db: Db,
  learnerId: string,
  period: Period,
  filter: MessageFilter,
  intentFor?: (messageIds: string[]) => Record<string, IntentAnswer | undefined>,
): MessageListItem[] {
  const kindSql = filter === 'all' ? '' : 'AND a.kind = ?';
  const params: unknown[] = [learnerId, period.start, period.end];
  if (filter !== 'all') params.push(filter);
  const rows = db.all<AttemptRow>(
    `SELECT a.* FROM communication_attempts a
     JOIN app_sessions s ON s.id = a.session_id
     WHERE a.learner_id = ?
       AND date(s.started_at, printf('%+d minutes', s.offset_min)) >= ?
       AND date(s.started_at, printf('%+d minutes', s.offset_min)) < ?
       ${kindSql}
     ORDER BY a.submitted_at DESC`,
    params,
  );
  const intents = intentFor ? intentFor(rows.map((r) => r.id)) : {};
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    text: r.text_snapshot,
    symbolCount: r.symbol_count,
    kind: r.kind,
    at: r.submitted_at,
    offsetMin: r.offset_min,
    intent: intents[r.id] ?? null,
  }));
}

/** All messages of one session, oldest first. */
export function listSessionMessages(db: Db, sessionId: string): MessageListItem[] {
  return db
    .all<AttemptRow>('SELECT * FROM communication_attempts WHERE session_id = ? ORDER BY submitted_at', [sessionId])
    .map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      text: r.text_snapshot,
      symbolCount: r.symbol_count,
      kind: r.kind,
      at: r.submitted_at,
      offsetMin: r.offset_min,
      intent: null,
    }));
}

/** Earliest meaningful use ever, ISO string per symbol. */
export function firstMeaningfulUseBySymbol(db: Db, learnerId: string): Record<string, string> {
  const attempts = db.all<AttemptRow>(
    `SELECT * FROM communication_attempts WHERE learner_id = ? AND kind = 'built'`,
    [learnerId],
  );
  if (attempts.length === 0) return {};
  const drafts = attempts.map((a) => a.draft_id).filter((d): d is string => d !== null);
  const events: EventRow[] = [];
  for (let i = 0; i < drafts.length; i += 400) {
    const chunk = drafts.slice(i, i + 400);
    events.push(
      ...db.all<EventRow>(
        `SELECT * FROM communication_events
         WHERE draft_id IN (${inClause(chunk)}) AND type IN ('symbol_selected','undo')`,
        chunk,
      ),
    );
  }
  const first: Record<string, string> = {};
  for (const u of computeMeaningfulUses(attempts, events)) {
    const prev = first[u.symbolId];
    if (!prev || u.at < prev) first[u.symbolId] = u.at;
  }
  return first;
}
