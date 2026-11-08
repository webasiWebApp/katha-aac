import { randomUUID } from 'expo-crypto';

import type { FunctionTag, IntentAnswer, PromptLevel, Role } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import { canView, loadPermissions } from '@/features/access/index';

export type Actor = Role | 'unknown_adult';
export type ObsKind = 'intent' | 'function' | 'prompting' | 'breakdown' | 'opportunities' | 'setup_note';

export interface ObservationRow {
  id: string;
  learner_id: string;
  session_id: string;
  message_id: string | null;
  kind: ObsKind;
  value: string;
  count_a: number | null;
  count_b: number | null;
  entered_by_role: string;
  entered_at: string;
  updated_at: string;
}

export class ObservationError extends Error {
  constructor(public code: 'not_allowed' | 'invalid' | 'not_found') {
    super(code);
  }
}

const FUNCTIONS: FunctionTag[] = ['requesting', 'refusing', 'commenting', 'greeting'];
const PROMPTS: PromptLevel[] = ['independent', 'gesture', 'verbal', 'model', 'physical'];
const INTENTS: IntentAnswer[] = ['meant', 'not_meant', 'unsure'];

function assertAllowed(db: Db, actor: Actor): void {
  if (actor === 'unknown_adult') return; // child-board chip: no adult is signed in (T-111)
  if (!canView(actor, 'observations:enter', loadPermissions(db))) throw new ObservationError('not_allowed');
}

function messageContext(db: Db, messageId: string): { session_id: string; learner_id: string } {
  const row = db.get<{ session_id: string; learner_id: string }>(
    'SELECT session_id, learner_id FROM communication_attempts WHERE id = ?',
    [messageId],
  );
  if (!row) throw new ObservationError('not_found');
  return row;
}

function setMessageKind(db: Db, actor: Actor, messageId: string, kind: ObsKind, value: string | null): void {
  assertAllowed(db, actor);
  const ctx = messageContext(db, messageId);
  const now = new Date().toISOString();
  if (value === null) {
    db.run('DELETE FROM observations WHERE message_id = ? AND kind = ?', [messageId, kind]);
    return;
  }
  const existing = db.get<{ id: string }>('SELECT id FROM observations WHERE message_id = ? AND kind = ?', [messageId, kind]);
  if (existing) {
    db.run('UPDATE observations SET value = ?, entered_by_role = ?, updated_at = ? WHERE id = ?', [value, actor, now, existing.id]);
  } else {
    db.run(
      `INSERT INTO observations (id, learner_id, session_id, message_id, kind, value, entered_by_role, entered_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), ctx.learner_id, ctx.session_id, messageId, kind, value, actor, now, now],
    );
  }
}

function check<T extends string>(v: T | null, allowed: readonly T[]): void {
  if (v !== null && !allowed.includes(v)) throw new ObservationError('invalid');
}

export function setIntent(db: Db, actor: Actor, messageId: string, answer: IntentAnswer | null): void {
  check(answer, INTENTS);
  setMessageKind(db, actor, messageId, 'intent', answer);
}
export function setFunction(db: Db, actor: Actor, messageId: string, tag: FunctionTag | null): void {
  check(tag, FUNCTIONS);
  setMessageKind(db, actor, messageId, 'function', tag);
}
export function setPrompting(db: Db, actor: Actor, messageId: string, level: PromptLevel | null): void {
  check(level, PROMPTS);
  setMessageKind(db, actor, messageId, 'prompting', level);
}
export function setBreakdown(db: Db, actor: Actor, messageId: string, yes: boolean | null): void {
  setMessageKind(db, actor, messageId, 'breakdown', yes === null ? null : yes ? 'yes' : 'no');
}

function sessionLearner(db: Db, sessionId: string): string {
  const row = db.get<{ learner_id: string }>('SELECT learner_id FROM app_sessions WHERE id = ?', [sessionId]);
  if (!row) throw new ObservationError('not_found');
  return row.learner_id;
}

function upsertSessionLevel(
  db: Db,
  actor: Actor,
  sessionId: string,
  kind: 'opportunities' | 'setup_note',
  value: string | null,
  a: number | null,
  b: number | null,
): void {
  assertAllowed(db, actor);
  const learnerId = sessionLearner(db, sessionId);
  const now = new Date().toISOString();
  const existing = db.get<{ id: string }>(
    'SELECT id FROM observations WHERE session_id = ? AND kind = ? AND message_id IS NULL',
    [sessionId, kind],
  );
  if (value === null) {
    if (existing) db.run('DELETE FROM observations WHERE id = ?', [existing.id]);
    return;
  }
  if (existing) {
    db.run(
      'UPDATE observations SET value = ?, count_a = ?, count_b = ?, entered_by_role = ?, updated_at = ? WHERE id = ?',
      [value, a, b, actor, now, existing.id],
    );
  } else {
    db.run(
      `INSERT INTO observations (id, learner_id, session_id, message_id, kind, value, count_a, count_b, entered_by_role, entered_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), learnerId, sessionId, kind, value, a, b, actor, now, now],
    );
  }
}

/** observed/independent null = not recorded (deletes). Requires 0 <= independent <= observed. */
export function setOpportunities(
  db: Db,
  actor: Actor,
  sessionId: string,
  observed: number | null,
  independent: number | null,
): void {
  if (observed === null || independent === null) {
    upsertSessionLevel(db, actor, sessionId, 'opportunities', null, null, null);
    return;
  }
  if (!Number.isInteger(observed) || !Number.isInteger(independent) || independent < 0 || independent > observed) {
    throw new ObservationError('invalid');
  }
  upsertSessionLevel(db, actor, sessionId, 'opportunities', 'session', observed, independent);
}

export function setSetupNote(db: Db, actor: Actor, sessionId: string, text: string | null): void {
  const t = text?.trim() ?? '';
  if (t.length > 280) throw new ObservationError('invalid');
  upsertSessionLevel(db, actor, sessionId, 'setup_note', t === '' ? null : t, null, null);
}

function inMarks(ids: string[]): string {
  return ids.map(() => '?').join(',');
}

export function getForMessages(db: Db, ids: string[]): ObservationRow[] {
  if (ids.length === 0) return [];
  const out: ObservationRow[] = [];
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    out.push(...db.all<ObservationRow>(`SELECT * FROM observations WHERE message_id IN (${inMarks(chunk)})`, chunk));
  }
  return out;
}

export function getForSessions(db: Db, ids: string[]): ObservationRow[] {
  if (ids.length === 0) return [];
  const out: ObservationRow[] = [];
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    out.push(...db.all<ObservationRow>(`SELECT * FROM observations WHERE session_id IN (${inMarks(chunk)})`, chunk));
  }
  return out;
}

/** Map message id -> intent answer, for the history list. */
export function intentMap(db: Db, messageIds: string[]): Record<string, IntentAnswer | undefined> {
  const map: Record<string, IntentAnswer | undefined> = {};
  for (const o of getForMessages(db, messageIds)) {
    if (o.kind === 'intent') map[o.message_id as string] = o.value as IntentAnswer;
  }
  return map;
}

let boundDb: Db | null = null;
export function initObservations(db: Db): void {
  boundDb = db;
}

/** Bus handler for intent_answered (T-111). Skips the permission check by design. */
export async function handleIntentAnswered(payload: unknown): Promise<void> {
  if (!boundDb) return;
  const p = payload as { messageId: string; answer: IntentAnswer };
  setIntent(boundDb, 'unknown_adult', p.messageId, p.answer);
}
