/**
 * Shared report types. Full analytics engine types come from P10 (T-120+).
 * These minimal interfaces let the P2 UI components compile and be tested.
 */

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
  source: 'independent' | 'prompted';
  answer: IntentAnswer;
}
