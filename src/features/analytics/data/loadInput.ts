import { previousPeriod } from '@/core/time';
import type { Period, Role } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import {
  firstMeaningfulUseBySymbol,
  listSessionsInPeriod,
  loadDataForSessions,
} from '@/features/event-log/index';
import { listGoals } from '@/features/goals/index';
import { getForSessions } from '@/features/observations/index';
import { getVocabularyById, type VocabularyContent } from '@/features/vocabulary/index';
import type { AnalyticsInput } from '../domain/types';

/** Loads everything a measure needs for one learner/period/role. */
export function loadInput(db: Db, learnerId: string, period: Period, role: Role): AnalyticsInput {
  const prev = previousPeriod(period);
  const sessions = listSessionsInPeriod(db, learnerId, period);
  const previousSessions = listSessionsInPeriod(db, learnerId, prev);
  const cur = loadDataForSessions(db, sessions);
  const old = loadDataForSessions(db, previousSessions);
  const observations = getForSessions(
    db,
    sessions.map((s) => s.id),
  );
  const versions = new Set<string>();
  for (const s of [...sessions, ...previousSessions]) versions.add(s.vocabulary_version_id);
  const vocabulary: Record<string, VocabularyContent> = {};
  for (const id of versions) vocabulary[id] = getVocabularyById(db, id);
  return {
    role,
    period,
    previousPeriod: prev,
    sessions,
    previousSessions,
    events: cur.events,
    previousEvents: old.events,
    attempts: cur.attempts,
    previousAttempts: old.attempts,
    observations,
    goals: listGoals(db, learnerId, role),
    vocabulary,
    firstUseBySymbol: firstMeaningfulUseBySymbol(db, learnerId),
    offsetMin: sessions[0]?.offset_min ?? previousSessions[0]?.offset_min ?? -new Date().getTimezoneOffset(),
  };
}
