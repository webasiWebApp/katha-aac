import { randomUUID } from 'expo-crypto';

import { deleteSetting, getSetting, setSetting } from '@/core/db/settings';
import type { Setting } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import { appendEvent } from '@/features/event-log/index';
import type { SessionRow } from '@/features/event-log/index';
import { getActiveVocabularyId } from '@/features/vocabulary/index';

export type EndReason = 'adult_exit' | 'background_timeout' | 'app_restart';

export function startSession(
  db: Db,
  args: { learnerId: string; setting: Setting; role: string; at?: string; offsetMin?: number },
): string {
  const id = randomUUID();
  const at = args.at ?? new Date().toISOString();
  const offsetMin = args.offsetMin ?? -new Date().getTimezoneOffset();
  const vocabId = getActiveVocabularyId(db);
  db.run(
    `INSERT INTO app_sessions
     (id, learner_id, vocabulary_version_id, setting, started_at, offset_min, active_ms, started_by_role)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, args.learnerId, vocabId, args.setting, at, offsetMin, args.role],
  );
  appendEvent(db, {
    sessionId: id,
    learnerId: args.learnerId,
    type: 'session_started',
    at,
    offsetMin,
    payload: { setting: args.setting },
  });
  appendEvent(db, {
    sessionId: id,
    learnerId: args.learnerId,
    type: 'page_opened',
    at,
    offsetMin,
    pageId: 'home',
    payload: { via: 'start' },
  });
  return id;
}

interface DraftRow {
  draft_id: string;
  n: number;
}

/** Drafts that have symbol selections but no submit or abandon event. */
export function findOpenDrafts(db: Db, sessionId: string): DraftRow[] {
  return db.all<DraftRow>(
    `SELECT draft_id, COUNT(*) AS n FROM communication_events
     WHERE session_id = ? AND type = 'symbol_selected' AND draft_id IS NOT NULL
       AND draft_id NOT IN (
         SELECT draft_id FROM communication_events
         WHERE session_id = ? AND type IN ('message_submitted','draft_abandoned') AND draft_id IS NOT NULL)
     GROUP BY draft_id`,
    [sessionId, sessionId],
  );
}

export function getSession(db: Db, sessionId: string): SessionRow | undefined {
  return db.get<SessionRow>('SELECT * FROM app_sessions WHERE id = ?', [sessionId]);
}

/**
 * Ends a session. `endAt` defaults to now; for `app_restart` pass the last event time.
 * Open drafts get `draft_abandoned` (reason session_end) and `exploration_flagged`.
 */
export function endSession(
  db: Db,
  sessionId: string,
  reason: EndReason,
  opts: { endAt?: string; activeMs?: number } = {},
): void {
  const s = getSession(db, sessionId);
  if (!s || s.ended_at) return;
  const endAt = opts.endAt ?? new Date().toISOString();
  const activeMs = opts.activeMs ?? s.active_ms;
  for (const d of findOpenDrafts(db, sessionId)) {
    appendEvent(db, {
      sessionId,
      learnerId: s.learner_id,
      type: 'draft_abandoned',
      at: endAt,
      offsetMin: s.offset_min,
      draftId: d.draft_id,
      payload: { reason: 'session_end', symbolCount: d.n },
    });
    appendEvent(db, {
      sessionId,
      learnerId: s.learner_id,
      type: 'exploration_flagged',
      at: endAt,
      offsetMin: s.offset_min,
      draftId: d.draft_id,
      payload: { symbolCount: d.n },
    });
  }
  db.run('UPDATE app_sessions SET ended_at = ?, end_reason = ?, active_ms = ? WHERE id = ?', [
    endAt,
    reason,
    activeMs,
    sessionId,
  ]);
  appendEvent(db, {
    sessionId,
    learnerId: s.learner_id,
    type: 'session_ended',
    at: endAt,
    offsetMin: s.offset_min,
    payload: { endReason: reason, activeMs },
  });
}

export function getOpenSession(db: Db): SessionRow | undefined {
  return db.get<SessionRow>(
    'SELECT * FROM app_sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
  );
}

export function flushActiveMs(db: Db, sessionId: string, activeMs: number): void {
  db.run('UPDATE app_sessions SET active_ms = ? WHERE id = ? AND ended_at IS NULL', [
    activeMs,
    sessionId,
  ]);
}

/** Boot rule 2: closes a session left open by a killed app, using the last event time. */
export function closeOrphanSession(db: Db): string | null {
  const open = getOpenSession(db);
  if (!open) return null;
  const last = db.get<{ at: string | null }>(
    'SELECT MAX(at) AS at FROM communication_events WHERE session_id = ?',
    [open.id],
  );
  endSession(db, open.id, 'app_restart', { endAt: last?.at ?? open.started_at });
  return open.id;
}

export function listSessions(
  db: Db,
  learnerId: string,
  period: { start: string; end: string },
): SessionRow[] {
  return db.all<SessionRow>(
    `SELECT * FROM app_sessions
     WHERE learner_id = ?
       AND date(started_at, printf('%+d minutes', offset_min)) >= ?
       AND date(started_at, printf('%+d minutes', offset_min)) < ?
     ORDER BY started_at DESC`,
    [learnerId, period.start, period.end],
  );
}

export function markReviewed(db: Db, sessionId: string): void {
  setSetting(db, `review.done.${sessionId}`, true);
}
export function clearReviewed(db: Db, sessionId: string): void {
  deleteSetting(db, `review.done.${sessionId}`);
}
export function isReviewed(db: Db, sessionId: string): boolean {
  return getSetting<boolean>(db, `review.done.${sessionId}`, false);
}

/** Sessions that ended and have no review flag, newest first. */
export function listUnreviewedSessions(db: Db, learnerId: string): SessionRow[] {
  return db
    .all<SessionRow>(
      `SELECT * FROM app_sessions WHERE learner_id = ? AND ended_at IS NOT NULL
       ORDER BY started_at DESC`,
      [learnerId],
    )
    .filter((s) => !isReviewed(db, s.id));
}
