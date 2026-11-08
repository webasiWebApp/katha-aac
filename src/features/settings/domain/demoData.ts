import { addDays } from '@/core/time';
import type { FunctionTag, IntentAnswer, PromptLevel, Setting } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import { deleteAllRecords, getLearner } from '@/features/access/index';
import { appendEvent, commitMessage } from '@/features/event-log/index';
import { addProgress, createGoal } from '@/features/goals/index';
import {
  setBreakdown,
  setFunction,
  setIntent,
  setOpportunities,
  setPrompting,
  setSetupNote,
} from '@/features/observations/index';
import { endSession, startSession } from '@/features/sessions/index';
import { getActiveVocabulary } from '@/features/vocabulary/index';

/** Tiny deterministic PRNG so demo data is the same every time. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SETTINGS: Setting[] = ['home', 'school', 'school', 'therapy', 'school', 'home', 'school', 'school', 'home'];
const PER_SESSION = [10, 9, 10, 9, 9, 9, 9, 9, 9]; // 83 messages
const FUNCTIONS: FunctionTag[] = ['requesting', 'refusing', 'commenting', 'greeting'];
const PROMPTS: PromptLevel[] = ['independent', 'independent', 'gesture', 'verbal', 'model', 'physical'];
const INTENTS: IntentAnswer[] = ['meant', 'meant', 'meant', 'not_meant', 'unsure'];

export const DEMO_SESSIONS = 9;
export const DEMO_MESSAGES = 83;

/**
 * Replaces all records of the FICTIONAL demo learner with 9 sessions over 7 days and 83 messages,
 * with observations, so every report shows unlocked content. Refuses for a non-fictional learner.
 */
export function loadDemoData(db: Db, today: string = new Date().toISOString().slice(0, 10)): void {
  const learner = getLearner(db);
  if (!learner || learner.is_fictional !== 1) throw new Error('demo_data_requires_fictional_learner');
  const vocab = getActiveVocabulary(db);
  const words = vocab.symbols.filter((s) => s.kind === 'word');
  const offsetMin = -new Date().getTimezoneOffset();
  const r = rng(42);

  deleteAllRecords(db, 'parent');

  const goalId = createGoal(db, {
    learnerId: learner.id,
    title: 'Ask for help with උදව්',
    role: 'slp',
    targetCount: 3,
    targetPeriod: 'week',
    visibleTo: ['parent', 'slp', 'educator'],
  });

  for (let s = 0; s < DEMO_SESSIONS; s++) {
    const dayOffset = 6 - Math.floor((s * 7) / DEMO_SESSIONS); // 6 .. 0 days ago
    const day = addDays(today, -dayOffset);
    const hour = dayOffset === 0 ? 5 : 8 + (s % 8);
    const startMs = Date.parse(`${day}T${String(hour).padStart(2, '0')}:00:00Z`) - offsetMin * 60_000;
    let t = startMs;
    const at = () => new Date((t += 4000)).toISOString();
    const sid = startSession(db, {
      learnerId: learner.id,
      setting: SETTINGS[s] as Setting,
      role: 'parent',
      at: new Date(startMs).toISOString(),
      offsetMin,
    });
    const messageIds: string[] = [];
    for (let m = 0; m < PER_SESSION[s]!; m++) {
      const id = `demo-${s}-${m}`;
      if (m % 10 === 9) {
        const phrase = vocab.storedPhrases[Math.floor(r() * vocab.storedPhrases.length)]!;
        appendEvent(db, { sessionId: sid, learnerId: learner.id, type: 'symbol_selected', at: at(), offsetMin, symbolId: phrase.id, source: 'quick', pageId: 'quick', payload: {} });
        commitMessage(db, { messageId: id, draftId: null, sessionId: sid, learnerId: learner.id, kind: 'stored_phrase', symbolIds: [phrase.id], text: phrase.label, vocabularyVersionId: vocab.id, at: at(), offsetMin });
      } else {
        const draftId = `demo-d-${s}-${m}`;
        const count = 1 + Math.floor(r() * 3);
        const picked: string[] = [];
        for (let k = 0; k < count; k++) {
          const w = words[Math.floor(r() * words.length)]!;
          picked.push(w.id);
          appendEvent(db, { sessionId: sid, learnerId: learner.id, type: 'symbol_selected', at: at(), offsetMin, symbolId: w.id, draftId, source: w.isCore ? 'core' : 'grid', pageId: 'home', payload: {} });
        }
        commitMessage(db, { messageId: id, draftId, sessionId: sid, learnerId: learner.id, kind: 'built', symbolIds: picked, text: picked.map((p) => vocab.symbols.find((x) => x.id === p)?.label ?? p).join(' '), vocabularyVersionId: vocab.id, at: at(), offsetMin });
      }
      messageIds.push(id);
      if (r() < 0.7) {
        setIntent(db, 'parent', id, INTENTS[Math.floor(r() * INTENTS.length)]!);
        setFunction(db, 'parent', id, FUNCTIONS[Math.floor(r() * FUNCTIONS.length)]!);
        setPrompting(db, 'parent', id, PROMPTS[Math.floor(r() * PROMPTS.length)]!);
        if (!id.endsWith('9')) setBreakdown(db, 'parent', id, r() < 0.2);
      }
    }
    const observed = 3 + Math.floor(r() * 4);
    setOpportunities(db, 'parent', sid, observed, Math.floor(r() * (observed + 1)));
    if (SETTINGS[s] === 'therapy') setSetupNote(db, 'ot', sid, 'Tablet on a stand at table height. Sample note.');
    endSession(db, sid, 'adult_exit', { endAt: new Date(t + 60_000).toISOString(), activeMs: (3 + (s % 4)) * 60_000 });
  }

  addProgress(db, {
    goalId,
    periodStart: addDays(today, -6),
    periodEnd: addDays(today, 1),
    achievedCount: 2,
    role: 'slp',
    note: 'Sample entry',
  });
}
