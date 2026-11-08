import { randomUUID } from 'expo-crypto';

import { emit } from '@/core/events/bus';
import type { AppEvent } from '@/core/events/schemas';
import type { AudioOutcome } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';

export const EVENT_SCHEMA_VERSION = 1;

export type EventType =
  | 'session_started'
  | 'session_ended'
  | 'page_opened'
  | 'symbol_selected'
  | 'undo'
  | 'clear'
  | 'draft_abandoned'
  | 'template_opened'
  | 'template_rejected'
  | 'message_submitted'
  | 'message_replayed'
  | 'break_started'
  | 'break_ended'
  | 'idle_return'
  | 'exploration_flagged'
  | 'gate_attempt';

export interface NewEvent {
  id?: string;
  sessionId: string;
  learnerId: string;
  type: EventType;
  at?: string;
  offsetMin?: number;
  symbolId?: string | null;
  draftId?: string | null;
  messageId?: string | null;
  source?: 'grid' | 'core' | 'quick' | 'template' | null;
  pageId?: string | null;
  payload?: Record<string, unknown>;
}

function localOffset(): number {
  return -new Date().getTimezoneOffset();
}

function insertEvent(db: Db, e: NewEvent): string {
  const id = e.id ?? randomUUID();
  db.run(
    `INSERT OR IGNORE INTO communication_events
     (id, session_id, learner_id, type, schema_version, at, offset_min,
      symbol_id, draft_id, message_id, source, page_id, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      e.sessionId,
      e.learnerId,
      e.type,
      EVENT_SCHEMA_VERSION,
      e.at ?? new Date().toISOString(),
      e.offsetMin ?? localOffset(),
      e.symbolId ?? null,
      e.draftId ?? null,
      e.messageId ?? null,
      e.source ?? null,
      e.pageId ?? null,
      JSON.stringify(e.payload ?? {}),
    ],
  );
  return id;
}

function publish(e: NewEvent): void {
  // Fire-and-forget: handler errors are contained by the bus.
  const body = { type: e.type, ...(e.payload ?? {}), sessionId: e.sessionId } as unknown as AppEvent;
  void emit(body as Parameters<typeof emit>[0]);
}

/** Inserts one event (INSERT OR IGNORE by id) and emits it on the bus. */
export function appendEvent(db: Db, e: NewEvent): string {
  const id = insertEvent(db, e);
  publish(e);
  return id;
}

export interface CommitMessageArgs {
  messageId: string;
  draftId: string | null;
  sessionId: string;
  learnerId: string;
  kind: 'built' | 'stored_phrase';
  symbolIds: string[];
  text: string;
  templateId?: string | null;
  vocabularyVersionId: string;
  at?: string;
  offsetMin?: number;
}

/** Inserts the attempt row and the message_submitted event in one transaction. */
export function commitMessage(db: Db, a: CommitMessageArgs): void {
  const at = a.at ?? new Date().toISOString();
  const offsetMin = a.offsetMin ?? localOffset();
  db.tx((t) => {
    t.run(
      `INSERT INTO communication_attempts
       (id, session_id, learner_id, draft_id, submitted_at, offset_min, kind,
        symbol_ids_json, text_snapshot, symbol_count, template_id, vocabulary_version_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.messageId,
        a.sessionId,
        a.learnerId,
        a.draftId,
        at,
        offsetMin,
        a.kind,
        JSON.stringify(a.symbolIds),
        a.text,
        a.symbolIds.length,
        a.templateId ?? null,
        a.vocabularyVersionId,
      ],
    );
    insertEvent(t, {
      sessionId: a.sessionId,
      learnerId: a.learnerId,
      type: 'message_submitted',
      at,
      offsetMin,
      draftId: a.draftId,
      messageId: a.messageId,
      payload: { kind: a.kind },
    });
  });
  publish({
    sessionId: a.sessionId,
    learnerId: a.learnerId,
    type: 'message_submitted',
    draftId: a.draftId,
    messageId: a.messageId,
    payload: { kind: a.kind, draftId: a.draftId, messageId: a.messageId },
  });
}

export interface AudioAttemptInput {
  id?: string;
  sessionId: string;
  messageId?: string | null;
  symbolId?: string | null;
  kind: 'word' | 'message_first' | 'message_replay';
  requestedAt?: string;
  outcome: AudioOutcome;
  errorCode?: string | null;
}

export function recordAudioAttempt(db: Db, a: AudioAttemptInput): void {
  db.run(
    `INSERT OR IGNORE INTO audio_attempts
     (id, session_id, message_id, symbol_id, kind, requested_at, outcome, error_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      a.id ?? randomUUID(),
      a.sessionId,
      a.messageId ?? null,
      a.symbolId ?? null,
      a.kind,
      a.requestedAt ?? new Date().toISOString(),
      a.outcome,
      a.errorCode ?? null,
    ],
  );
}
