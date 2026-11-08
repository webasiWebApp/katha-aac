import { randomUUID } from 'expo-crypto';

import type { GridSize, Role } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';

export interface Learner {
  id: string;
  display_name: string;
  participant_code: string;
  is_fictional: number;
  hand: 'right' | 'left';
  grid_size: GridSize;
  idle_return_seconds: number;
  reduced_motion: number;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  learner_id: string;
  guardian_consent_at: string | null;
  research_logging: number;
  withdrawn_at: string | null;
  updated_at: string;
}

export function createLearner(
  db: Db,
  a: { displayName: string; participantCode: string; isFictional?: boolean; gridSize?: GridSize; hand?: 'right' | 'left' },
): string {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO learners (id, display_name, participant_code, is_fictional, hand, grid_size, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, a.displayName, a.participantCode, a.isFictional === false ? 0 : 1, a.hand ?? 'right', a.gridSize ?? '3x4', now, now],
  );
  return id;
}

export function getLearner(db: Db): Learner | undefined {
  return db.get<Learner>('SELECT * FROM learners ORDER BY created_at LIMIT 1');
}

export function updateLearner(
  db: Db,
  id: string,
  patch: Partial<Pick<Learner, 'display_name' | 'hand' | 'grid_size' | 'idle_return_seconds' | 'reduced_motion'>>,
): void {
  const cur = db.get<Learner>('SELECT * FROM learners WHERE id = ?', [id]);
  if (!cur) throw new Error('learner not found');
  const n = { ...cur, ...patch };
  db.run(
    `UPDATE learners SET display_name = ?, hand = ?, grid_size = ?, idle_return_seconds = ?,
       reduced_motion = ?, updated_at = ? WHERE id = ?`,
    [n.display_name, n.hand, n.grid_size, n.idle_return_seconds, n.reduced_motion, new Date().toISOString(), id],
  );
}

export function getConsent(db: Db, learnerId: string): Consent | undefined {
  return db.get<Consent>('SELECT * FROM consent WHERE learner_id = ?', [learnerId]);
}

export function saveConsent(
  db: Db,
  learnerId: string,
  patch: { guardianConsent?: boolean; researchLogging?: boolean },
  actor: Role | null,
): void {
  if (actor !== 'parent' && actor !== null) throw new Error('not_allowed');
  const now = new Date().toISOString();
  const cur = getConsent(db, learnerId);
  const consentAt =
    patch.guardianConsent === undefined
      ? (cur?.guardian_consent_at ?? null)
      : patch.guardianConsent
        ? (cur?.guardian_consent_at ?? now)
        : null;
  const research = patch.researchLogging === undefined ? (cur?.research_logging ?? 0) : patch.researchLogging ? 1 : 0;
  db.run(
    `INSERT OR REPLACE INTO consent (learner_id, guardian_consent_at, research_logging, withdrawn_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [learnerId, consentAt, research, cur?.withdrawn_at ?? null, now],
  );
}

export function withdrawFromResearch(db: Db, learnerId: string, actor: Role | null): void {
  if (actor !== 'parent') throw new Error('not_allowed');
  const now = new Date().toISOString();
  db.run('UPDATE consent SET withdrawn_at = ?, research_logging = 0, updated_at = ? WHERE learner_id = ?', [
    now,
    now,
    learnerId,
  ]);
}

const DATA_TABLES_ORDER = [
  'goal_progress',
  'goals',
  'observations',
  'audio_attempts',
  'communication_attempts',
  'communication_events',
  'app_sessions',
  'report_exports',
];

function tableExists(db: Db, name: string): boolean {
  return !!db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [name]);
}

/** Deletes every learner-data row; keeps learner, consent, permissions and vocabulary. Parent only. */
export function deleteAllRecords(db: Db, actor: Role | null): void {
  if (actor !== 'parent') throw new Error('not_allowed');
  db.tx((t) => {
    for (const table of DATA_TABLES_ORDER) {
      if (tableExists(t, table)) t.run(`DELETE FROM ${table}`);
    }
    t.run("DELETE FROM settings WHERE key LIKE 'review.done.%'");
  });
}

/** Deletes sessions that started before the cutoff and everything hanging off them. Parent only. */
export function deleteRecordsOlderThan(db: Db, actor: Role | null, months: 6 | 12 | 24, now = new Date()): number {
  if (actor !== 'parent') throw new Error('not_allowed');
  const cutoff = new Date(now.getTime());
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  const iso = cutoff.toISOString();
  const ids = db.all<{ id: string }>('SELECT id FROM app_sessions WHERE started_at < ?', [iso]).map((r) => r.id);
  db.tx((t) => {
    for (const id of ids) {
      t.run('DELETE FROM observations WHERE session_id = ?', [id]);
      t.run('DELETE FROM audio_attempts WHERE session_id = ?', [id]);
      t.run('DELETE FROM communication_attempts WHERE session_id = ?', [id]);
      t.run('DELETE FROM communication_events WHERE session_id = ?', [id]);
      t.run('DELETE FROM app_sessions WHERE id = ?', [id]);
      t.run('DELETE FROM settings WHERE key = ?', [`review.done.${id}`]);
    }
  });
  return ids.length;
}
