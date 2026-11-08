/**
 * TypeScript types for every bus event — section 6.3 of the tasklist.
 * Bus-only events (not written to communication_events) are marked with a comment.
 */

// ── Shared domain types used in event payloads ───────────────────────────────

/** Symbol word categories — section 6.4. */
export type WordCategory = 'people' | 'action' | 'describing' | 'thing' | 'core';

/** Session setting — decision D-13. */
export type SessionSetting = 'home' | 'school' | 'therapy' | 'unknown';

// ── Section 6.3 database events ─────────────────────────────────────────────

export type EventSessionStarted = {
  type: 'session_started';
  setting: SessionSetting;
};

export type EventSessionEnded = {
  type: 'session_ended';
  endReason: 'manual' | 'timeout';
  activeMs: number;
};

export type PageOpenedVia =
  | 'start'
  | 'folder'
  | 'home_key'
  | 'quick_key'
  | 'idle_return'
  | 'break_end';

export type EventPageOpened = {
  type: 'page_opened';
  pageId: string;
  via: PageOpenedVia;
};

export type SymbolSource = 'grid' | 'core' | 'quick' | 'template';

export type EventSymbolSelected = {
  type: 'symbol_selected';
  symbolId: string;
  draftId: string;
  source: SymbolSource;
  pageId: string;
  positionIndex: number;
  quickUndoEligibleUntil: number;
};

export type EventUndo = {
  type: 'undo';
  symbolId: string;
  draftId: string;
  pageId: string;
  quickUndo: boolean;
};

export type EventClear = {
  type: 'clear';
  draftId: string;
  pageId: string;
  symbolCount: number;
};

export type EventDraftAbandoned = {
  type: 'draft_abandoned';
  draftId: string;
  reason: 'clear' | 'session_end';
  symbolCount: number;
};

export type EventTemplateOpened = {
  type: 'template_opened';
  symbolId: string;
  draftId: string;
  templateId: string;
};

export type EventTemplateRejected = {
  type: 'template_rejected';
  symbolId: string;
  draftId: string;
  templateId: string;
  expected: WordCategory[];
};

export type MessageKind = 'built' | 'stored_phrase';

export type EventMessageSubmitted = {
  type: 'message_submitted';
  draftId: string | null;
  messageId: string;
  kind: MessageKind;
};

export type EventMessageReplayed = {
  type: 'message_replayed';
  messageId: string;
};

export type EventBreakStarted = {
  type: 'break_started';
};

export type EventBreakEnded = {
  type: 'break_ended';
  durationMs: number;
};

export type EventIdleReturn = {
  type: 'idle_return';
  fromPageId: string;
  idleMs: number;
};

export type EventExplorationFlagged = {
  type: 'exploration_flagged';
  draftId: string;
  symbolCount: number;
};

export type EventGateAttempt = {
  type: 'gate_attempt';
  result: 'success' | 'fail' | 'locked';
  role: string;
};

// ── Bus-only events (not written to communication_events) ────────────────────

/** Emitted when an adult answers the post-message IntentConfirmChip. */
export type EventIntentAnswered = {
  type: 'intent_answered';
  messageId: string;
  answer: boolean;
};

/**
 * Bus-only session end notification.
 * Used by features that need to react to session close without reading the DB.
 */
export type EventSessionEndedBus = {
  type: 'session_ended_bus';
  sessionId: string;
};

// ── Union ────────────────────────────────────────────────────────────────────

export type AppEvent =
  | EventSessionStarted
  | EventSessionEnded
  | EventPageOpened
  | EventSymbolSelected
  | EventUndo
  | EventClear
  | EventDraftAbandoned
  | EventTemplateOpened
  | EventTemplateRejected
  | EventMessageSubmitted
  | EventMessageReplayed
  | EventBreakStarted
  | EventBreakEnded
  | EventIdleReturn
  | EventExplorationFlagged
  | EventGateAttempt
  | EventIntentAnswered
  | EventSessionEndedBus;

export type AppEventType = AppEvent['type'];

export type EventPayload<T extends AppEventType> = Extract<AppEvent, { type: T }>;
