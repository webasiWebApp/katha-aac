/**
 * Shared report types. Full analytics engine types come from P10 (T-120+).
 * These minimal interfaces let the P2 UI components compile and be tested.
 */

// ── Report definitions (section 8.1) ──────────────────────────────────────────

import type { Role } from '@/core/types/common';

export type MeasureId = string;

export interface MeasureResult {
  id: MeasureId;
  /** null when locked or not recorded. */
  value: number | null;
  numerator?: number;
  denominator?: number;
  notRecorded?: number;
  locked: boolean;
  /** How many sessions are in the selected period so far (for the lock message). */
  sessionsSoFar: number;
  detail?: unknown;
}

export type IntentAnswer = 'meant' | 'not_meant' | 'unsure' | null;

export interface MessageHistoryEntry {
  id: string;
  sentence: string;
  symbolCount: number;
  /** Local date-time ISO string used for display. */
  at: string;
  offsetMin: number;
  /** Whether the message was independent or required prompting. */
  source: 'independent' | 'prompted' | 'not_recorded';
  answer: IntentAnswer;
}

export type SectionKind =
  | 'glance'
  | 'wordChips'
  | 'barRows'
  | 'barChart'
  | 'lineChart'
  | 'combinations'
  | 'metricPair'
  | 'latencyCard'
  | 'planningIdea'
  | 'goals'
  | 'notes';

export interface ReportSection {
  id: string;
  kind: SectionKind;
  titleKey: string;
  subtitleKey?: string;
  measures: MeasureId[];
  required?: boolean;
}

export interface ReportDefinition {
  role: Role;
  titleKey: string;
  subtitleKey: string;
  glance: [MeasureId, MeasureId, MeasureId, MeasureId];
  /** Optional i18n label overrides for glance cards. */
  glanceLabelKeys?: Partial<Record<MeasureId, string>>;
  sections: ReportSection[];
}
