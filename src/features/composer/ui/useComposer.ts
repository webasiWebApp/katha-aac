import { randomUUID } from 'expo-crypto';
import { useCallback, useMemo, useRef, useState } from 'react';

import { logError } from '@/core/log';
import type { AudioOutcome } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import type { AudioService } from '@/features/audio/index';
import { appendEvent, commitMessage } from '@/features/event-log/index';
import type { VocabularyContent } from '@/features/vocabulary/index';
import {
  SLOT,
  buttonStates,
  composerReducer,
  initialComposerState,
  type ComposerAction,
  type ComposerState,
  type Effect,
  type TemplateInfo,
} from '../domain/composer';

export interface UseComposerArgs {
  db: Db;
  sessionId: string;
  learnerId: string;
  vocabulary: VocabularyContent;
  audio: AudioService;
  getPageId: () => string;
  onAudioOutcome?: (outcome: AudioOutcome) => void;
}

export function labelOfId(v: VocabularyContent, id: string): string {
  if (id === SLOT) return '___';
  return (
    v.symbols.find((s) => s.id === id)?.label ?? v.storedPhrases.find((p) => p.id === id)?.label ?? id
  );
}

/** Wires the pure composer reducer to the event log, the database and the audio service. */
export function useComposer(args: UseComposerArgs) {
  const { db, sessionId, learnerId, vocabulary, audio, getPageId, onAudioOutcome } = args;
  const [state, setState] = useState<ComposerState>(initialComposerState);
  const stateRef = useRef<ComposerState>(initialComposerState);

  const dispatchRef = useRef<(a: ComposerAction) => void>(() => undefined);

  const perform = useCallback(
    (effects: Effect[]) => {
      for (const e of effects) {
        switch (e.kind) {
          case 'event':
            try {
              appendEvent(db, {
                sessionId,
                learnerId,
                type: e.event.type,
                symbolId: e.event.symbolId,
                draftId: e.event.draftId,
                messageId: e.event.messageId,
                source: e.event.source,
                pageId: e.event.pageId ?? getPageId(),
                payload: e.event.payload,
              });
            } catch (err) {
              logError('composer', 'event_write_failed', err);
            }
            break;
          case 'speakWord': {
            const text = labelOfId(vocabulary, e.symbolId);
            void audio
              .speakWord(e.symbolId, text, { sessionId })
              .then((r) => onAudioOutcome?.(r.outcome))
              .catch((err: unknown) => logError('audio', 'speak_word_failed', err));
            break;
          }
          case 'commit':
            try {
              commitMessage(db, {
                messageId: e.messageId,
                draftId: e.draftId,
                sessionId,
                learnerId,
                kind: e.messageKind,
                symbolIds: e.symbolIds,
                text: e.text,
                templateId: e.templateId,
                vocabularyVersionId: vocabulary.id,
              });
              dispatchRef.current({ type: 'commitSucceeded' });
            } catch (err) {
              logError('composer', 'commit_failed', err);
              dispatchRef.current({ type: 'commitFailed' });
            }
            break;
          case 'speakMessage': {
            const first = e.symbolIds[0] ?? '';
            const isPhrase = e.symbolIds.length === 1 && first.startsWith('phr_');
            const done = () =>
              dispatchRef.current({
                type: e.audioKind === 'message_replay' ? 'replayFinished' : 'speakFinished',
              });
            const speak = isPhrase
              ? audio.speakPhrase({ messageId: e.messageId, phraseId: first, text: e.text }, { sessionId }, e.audioKind)
              : audio.speakMessage({ messageId: e.messageId, symbolIds: e.symbolIds, text: e.text }, { sessionId }, e.audioKind);
            void speak
              .then((r) => onAudioOutcome?.(r.outcome))
              .catch((err: unknown) => logError('audio', 'speak_message_failed', err))
              .finally(done);
            break;
          }
        }
      }
    },
    [db, sessionId, learnerId, vocabulary, audio, getPageId, onAudioOutcome],
  );

  const dispatch = useCallback(
    (action: ComposerAction) => {
      const r = composerReducer(stateRef.current, action);
      stateRef.current = r.state;
      setState(r.state);
      perform(r.effects);
    },
    [perform],
  );
  dispatchRef.current = dispatch;

  const templateFor = useCallback(
    (symbolId: string): TemplateInfo | null => {
      const t = vocabulary.templates.find((x) => x.trigger === symbolId);
      return t ? { id: t.id, pattern: t.pattern, slotCategories: t.slotCategories } : null;
    },
    [vocabulary],
  );

  const api = useMemo(
    () => ({
      tapWord(symbolId: string, source: 'grid' | 'core', positionIndex: number) {
        const sym = vocabulary.symbols.find((s) => s.id === symbolId);
        if (!sym) return;
        dispatch({
          type: 'tapWord',
          symbolId,
          source,
          pageId: getPageId(),
          positionIndex,
          category: sym.category,
          template: templateFor(symbolId),
          now: Date.now(),
          newDraftId: randomUUID(),
        });
      },
      tapPhrase(phraseId: string, positionIndex: number) {
        const phrase = vocabulary.storedPhrases.find((p) => p.id === phraseId);
        if (!phrase) return;
        dispatch({
          type: 'tapStoredPhrase',
          phraseId,
          text: phrase.label,
          pageId: getPageId(),
          positionIndex,
          now: Date.now(),
          messageId: randomUUID(),
        });
      },
      undo: () => dispatch({ type: 'undo', now: Date.now(), pageId: getPageId() }),
      clear: () => dispatch({ type: 'clear', pageId: getPageId() }),
      speak() {
        const text = stateRef.current.items.map((i) => labelOfId(vocabulary, i.symbolId)).join(' ');
        dispatch({ type: 'speakRequested', messageId: randomUUID(), text });
      },
      replay: () => dispatch({ type: 'replayRequested' }),
    }),
    [dispatch, vocabulary, getPageId, templateFor],
  );

  return { state, buttons: buttonStates(state), ...api };
}
