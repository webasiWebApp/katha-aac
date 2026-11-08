import type { WordCategory } from '@/core/types/common';

export const SLOT = '{slot}';
export const QUICK_UNDO_MS = 2000;

export type ComposerMode = 'idle' | 'draft' | 'committing' | 'speaking' | 'showingSubmitted';

export interface DraftItem {
  symbolId: string; // SLOT while a template slot is empty
  origin: 'child' | 'template';
  selectedAt: number;
}

export interface Submitted {
  messageId: string;
  symbolIds: string[];
  text: string;
  kind: 'built' | 'stored_phrase';
}

export interface ComposerState {
  draftId: string | null;
  items: DraftItem[];
  templateId: string | null;
  /** Index in items of the template slot (filled or empty), or null. */
  slotPos: number | null;
  slotCategories: WordCategory[];
  submitted?: Submitted;
  mode: ComposerMode;
  /** Last pending commit while mode is 'committing'. */
  pending?: Submitted & { draftId: string | null; templateId: string | null };
}

export const initialComposerState: ComposerState = {
  draftId: null,
  items: [],
  templateId: null,
  slotPos: null,
  slotCategories: [],
  mode: 'idle',
};

export interface TemplateInfo {
  id: string;
  /** Template pattern with '{slot}' for the open slot. */
  pattern: string[];
  slotCategories: WordCategory[];
}

export type ComposerAction =
  | {
      type: 'tapWord';
      symbolId: string;
      source: 'grid' | 'core';
      pageId: string;
      positionIndex: number;
      category: WordCategory;
      /** Template whose trigger is this symbol, if any. */
      template: TemplateInfo | null;
      now: number;
      newDraftId: string;
    }
  | {
      type: 'tapStoredPhrase';
      phraseId: string;
      text: string;
      pageId: string;
      positionIndex: number;
      now: number;
      messageId: string;
    }
  | { type: 'undo'; now: number; pageId: string }
  | { type: 'clear'; pageId: string }
  | { type: 'speakRequested'; messageId: string; text: string }
  | { type: 'commitSucceeded' }
  | { type: 'commitFailed' }
  | { type: 'speakFinished' }
  | { type: 'replayRequested' }
  | { type: 'replayFinished' };

export type EventEffect = {
  kind: 'event';
  event: {
    type:
      | 'symbol_selected'
      | 'undo'
      | 'clear'
      | 'draft_abandoned'
      | 'template_opened'
      | 'template_rejected'
      | 'message_replayed'
      | 'exploration_flagged';
    symbolId?: string | null;
    draftId?: string | null;
    messageId?: string | null;
    source?: 'grid' | 'core' | 'quick' | 'template' | null;
    pageId?: string | null;
    payload?: Record<string, unknown>;
  };
};

export type Effect =
  | EventEffect
  | { kind: 'speakWord'; symbolId: string }
  | {
      kind: 'commit';
      messageId: string;
      draftId: string | null;
      messageKind: 'built' | 'stored_phrase';
      symbolIds: string[];
      text: string;
      templateId: string | null;
    }
  | {
      kind: 'speakMessage';
      messageId: string;
      symbolIds: string[];
      text: string;
      audioKind: 'message_first' | 'message_replay';
    };

export interface ComposerResult {
  state: ComposerState;
  effects: Effect[];
}

const noop = (state: ComposerState): ComposerResult => ({ state, effects: [] });

export function draftSymbolIds(state: ComposerState): string[] {
  return state.items.map((i) => i.symbolId);
}

export function hasEmptySlot(state: ComposerState): boolean {
  return state.items.some((i) => i.symbolId === SLOT);
}

export function childItemCount(state: ComposerState): number {
  return state.items.filter((i) => i.origin === 'child').length;
}

/** Button enabled states (section 9.3). */
export function buttonStates(state: ComposerState): {
  speak: boolean;
  replay: boolean;
  undo: boolean;
  clear: boolean;
} {
  return {
    speak: state.mode === 'draft' && state.items.length > 0 && !hasEmptySlot(state),
    replay: state.mode === 'showingSubmitted' && !!state.submitted,
    undo: state.mode === 'draft' && childItemCount(state) > 0,
    clear: state.mode === 'draft' || state.mode === 'showingSubmitted',
  };
}

function startFresh(state: ComposerState): ComposerState {
  // Used when a tap arrives while a submitted message is shown or being spoken.
  return { ...initialComposerState, mode: state.mode === 'committing' ? state.mode : 'idle' };
}

function selectedEvent(
  a: { symbolId: string; pageId: string; positionIndex: number; now: number },
  draftId: string | null,
  source: 'grid' | 'core' | 'quick',
): Effect {
  return {
    kind: 'event',
    event: {
      type: 'symbol_selected',
      symbolId: a.symbolId,
      draftId,
      source,
      pageId: a.pageId,
      payload: { positionIndex: a.positionIndex, quickUndoEligibleUntil: a.now + QUICK_UNDO_MS },
    },
  };
}

export function composerReducer(prev: ComposerState, action: ComposerAction): ComposerResult {
  switch (action.type) {
    case 'tapWord': {
      if (prev.mode === 'committing') return noop(prev);
      const base: ComposerState =
        prev.mode === 'showingSubmitted' || prev.mode === 'speaking' ? startFresh(prev) : prev;
      const draftId = base.draftId ?? action.newDraftId;
      const effects: Effect[] = [];
      let items = base.items;
      let templateId = base.templateId;
      let slotPos = base.slotPos;
      let slotCategories = base.slotCategories;

      if (base.items.length === 0 && action.template) {
        // Open the template: template words plus an empty slot; the trigger tap is a selection.
        const t = action.template;
        items = t.pattern.map((p) => ({
          symbolId: p,
          origin: 'template' as const,
          selectedAt: action.now,
        }));
        templateId = t.id;
        slotPos = t.pattern.indexOf(SLOT);
        slotCategories = t.slotCategories;
        effects.push({
          kind: 'event',
          event: { type: 'template_opened', symbolId: action.symbolId, draftId, payload: { templateId: t.id } },
        });
        effects.push(selectedEvent(action, draftId, action.source));
        effects.push({ kind: 'speakWord', symbolId: action.symbolId });
        return {
          state: { ...base, draftId, items, templateId, slotPos, slotCategories, mode: 'draft', submitted: undefined },
          effects,
        };
      }

      const slotOpen = slotPos !== null && items[slotPos]?.symbolId === SLOT;
      if (slotOpen && slotPos !== null) {
        if (!slotCategories.includes(action.category)) {
          return {
            state: base,
            effects: [
              {
                kind: 'event',
                event: {
                  type: 'template_rejected',
                  symbolId: action.symbolId,
                  draftId,
                  payload: { templateId, expected: slotCategories },
                },
              },
            ],
          };
        }
        items = items.map((it, i) =>
          i === slotPos ? { symbolId: action.symbolId, origin: 'child', selectedAt: action.now } : it,
        );
      } else {
        items = [...items, { symbolId: action.symbolId, origin: 'child', selectedAt: action.now }];
      }
      effects.push(selectedEvent(action, draftId, action.source));
      effects.push({ kind: 'speakWord', symbolId: action.symbolId });
      return {
        state: { ...base, draftId, items, templateId, slotPos, slotCategories, mode: 'draft', submitted: undefined },
        effects,
      };
    }

    case 'tapStoredPhrase': {
      if (prev.mode === 'committing') return noop(prev);
      const submitted: Submitted = {
        messageId: action.messageId,
        symbolIds: [action.phraseId],
        text: action.text,
        kind: 'stored_phrase',
      };
      return {
        state: {
          ...initialComposerState,
          mode: 'committing',
          pending: { ...submitted, draftId: null, templateId: null },
        },
        effects: [
          selectedEvent(
            { symbolId: action.phraseId, pageId: action.pageId, positionIndex: action.positionIndex, now: action.now },
            null,
            'quick',
          ),
          {
            kind: 'commit',
            messageId: action.messageId,
            draftId: null,
            messageKind: 'stored_phrase',
            symbolIds: submitted.symbolIds,
            text: action.text,
            templateId: null,
          },
        ],
      };
    }

    case 'undo': {
      if (prev.mode !== 'draft') return noop(prev);
      let idx = -1;
      for (let i = prev.items.length - 1; i >= 0; i--) {
        if (prev.items[i]?.origin === 'child') {
          idx = i;
          break;
        }
      }
      if (idx < 0) return noop(prev);
      const removed = prev.items[idx]!;
      const isSlot = prev.slotPos === idx;
      const items = isSlot
        ? prev.items.map((it, i) =>
            i === idx ? { symbolId: SLOT, origin: 'template' as const, selectedAt: it.selectedAt } : it,
          )
        : prev.items.filter((_, i) => i !== idx);
      // Removing an item before the slot would shift slotPos; slot-less removal only happens after it.
      const slotPos = !isSlot && prev.slotPos !== null && idx < prev.slotPos ? prev.slotPos - 1 : prev.slotPos;
      const quickUndo = action.now - removed.selectedAt <= QUICK_UNDO_MS;
      return {
        state: { ...prev, items, slotPos },
        effects: [
          {
            kind: 'event',
            event: {
              type: 'undo',
              symbolId: removed.symbolId,
              draftId: prev.draftId,
              pageId: action.pageId,
              payload: { quickUndo },
            },
          },
        ],
      };
    }

    case 'clear': {
      if (prev.mode === 'showingSubmitted' || prev.mode === 'speaking') {
        return { state: { ...initialComposerState }, effects: [] };
      }
      if (prev.mode !== 'draft' || !prev.draftId) return noop(prev);
      const count = prev.items.length;
      const effects: Effect[] = [
        { kind: 'event', event: { type: 'clear', draftId: prev.draftId, pageId: action.pageId, payload: { symbolCount: count } } },
      ];
      if (count > 0) {
        effects.push({
          kind: 'event',
          event: { type: 'draft_abandoned', draftId: prev.draftId, payload: { reason: 'clear', symbolCount: count } },
        });
        effects.push({
          kind: 'event',
          event: { type: 'exploration_flagged', draftId: prev.draftId, payload: { symbolCount: count } },
        });
      }
      return { state: { ...initialComposerState }, effects };
    }

    case 'speakRequested': {
      const states = buttonStates(prev);
      if (!states.speak) return noop(prev);
      const symbolIds = draftSymbolIds(prev);
      const submitted: Submitted = {
        messageId: action.messageId,
        symbolIds,
        text: action.text,
        kind: 'built',
      };
      return {
        state: { ...prev, mode: 'committing', pending: { ...submitted, draftId: prev.draftId, templateId: prev.templateId } },
        effects: [
          {
            kind: 'commit',
            messageId: action.messageId,
            draftId: prev.draftId,
            messageKind: 'built',
            symbolIds,
            text: action.text,
            templateId: prev.templateId,
          },
        ],
      };
    }

    case 'commitSucceeded': {
      if (prev.mode !== 'committing' || !prev.pending) return noop(prev);
      const { draftId: _d, templateId: _t, ...submitted } = prev.pending;
      void _d;
      void _t;
      return {
        state: { ...initialComposerState, mode: 'speaking', submitted },
        effects: [
          {
            kind: 'speakMessage',
            messageId: submitted.messageId,
            symbolIds: submitted.symbolIds,
            text: submitted.text,
            audioKind: 'message_first',
          },
        ],
      };
    }

    case 'commitFailed': {
      if (prev.mode !== 'committing') return noop(prev);
      return {
        state: { ...prev, mode: prev.pending?.kind === 'stored_phrase' ? 'idle' : 'draft', pending: undefined },
        effects: [],
      };
    }

    case 'speakFinished':
    case 'replayFinished': {
      if (prev.mode !== 'speaking') return noop(prev);
      return { state: { ...prev, mode: 'showingSubmitted' }, effects: [] };
    }

    case 'replayRequested': {
      if (!buttonStates(prev).replay || !prev.submitted) return noop(prev);
      return {
        state: { ...prev, mode: 'speaking' },
        effects: [
          { kind: 'event', event: { type: 'message_replayed', messageId: prev.submitted.messageId } },
          {
            kind: 'speakMessage',
            messageId: prev.submitted.messageId,
            symbolIds: prev.submitted.symbolIds,
            text: prev.submitted.text,
            audioKind: 'message_replay',
          },
        ],
      };
    }
  }
}
