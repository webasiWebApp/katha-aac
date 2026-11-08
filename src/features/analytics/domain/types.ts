import type { Period, Role } from '@/core/types/common';
import type {
  AttemptRow,
  EventRow,
  SessionRow,
} from '@/features/event-log/index';
import type { GoalWithProgress } from '@/features/goals/index';
import type { ObservationRow } from '@/features/observations/index';
import type { VocabularyContent } from '@/features/vocabulary/index';

export type MeasureId =
  | 'sessions'
  | 'messages_sent'
  | 'selections'
  | 'words_used'
  | 'top_words'
  | 'new_words'
  | 'confirmed_meant'
  | 'independent_starts'
  | 'prompted_vs_independent'
  | 'prompt_dependency'
  | 'functions'
  | 'combinations'
  | 'needed_repair'
  | 'vocabulary_retention'
  | 'response_latency'
  | 'latency_within_session'
  | 'time_of_day'
  | 'corrections'
  | 'repeated_taps'
  | 'abandoned'
  | 'session_length'
  | 'pages_per_session'
  | 'class_messages'
  | 'class_words'
  | 'class_help_requests'
  | 'class_independent_starts'
  | 'class_prompted_vs_independent'
  | 'class_messages_weekly'
  | 'goals'
  | 'setup_notes'
  | 'planning_idea';

export interface AnalyticsInput {
  role: Role;
  period: Period;
  previousPeriod: Period;
  sessions: SessionRow[];
  previousSessions: SessionRow[];
  events: EventRow[];
  previousEvents: EventRow[];
  attempts: AttemptRow[];
  previousAttempts: AttemptRow[];
  observations: ObservationRow[];
  goals: GoalWithProgress[];
  /** All vocabulary versions used, keyed by version id. */
  vocabulary: Record<string, VocabularyContent>;
  firstUseBySymbol: Record<string, string>;
  /** Offset used to place `firstUseBySymbol` instants into local dates. */
  offsetMin: number;
}

export interface MeasureResult {
  id: MeasureId;
  value: number | null;
  numerator?: number;
  denominator?: number;
  notRecorded?: number;
  locked: boolean;
  sessionsSoFar: number;
  detail?: unknown;
}

export type MeasureSource = 'auto' | 'adult' | 'auto/adult' | 'template';

export interface MeasureDef {
  id: MeasureId;
  compute: (input: AnalyticsInput) => MeasureResult;
  minSessions: number;
  source: MeasureSource;
  /** Count only school sessions toward the lock. */
  classLock?: boolean;
  definition: string;
}

export class MeasureNotAllowed extends Error {
  constructor(
    public role: Role,
    public id: string,
  ) {
    super(`measure_not_allowed:${role}:${id}`);
  }
}
