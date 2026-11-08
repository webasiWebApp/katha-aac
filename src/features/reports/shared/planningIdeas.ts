import { t } from '@/core/i18n/t';
import type { Role } from '@/core/types/common';
import type { MeasureResult } from './types';

export interface PlanningIdea {
  id: 'PI-P1' | 'PI-P2' | 'PI-E1' | 'PI-E2';
  text: string;
}

type Results = Record<string, MeasureResult | undefined>;

interface WordItem {
  label: string;
  category: string;
  count: number;
}

const BUCKETS = ['morning', 'afternoon', 'evening', 'night'] as const;

/**
 * Deterministic planning idea (section 8.3). Only for parent and educator reports,
 * only with 5+ sessions in the period; first matching rule wins, else null (section hidden).
 */
export function planningIdea(role: Role, results: Results, helpWord = 'උදව්'): PlanningIdea | null {
  const sessions = results.sessions?.value ?? 0;
  if (sessions < 5) return null;

  if (role === 'parent') {
    const tod = results.time_of_day?.detail as Record<(typeof BUCKETS)[number], number> | undefined;
    const total = results.time_of_day?.value ?? 0;
    const words = (results.words_used?.detail as WordItem[] | undefined) ?? [];
    if (tod && total > 0) {
      const top = [...BUCKETS].sort((a, b) => tod[b] - tod[a])[0] as (typeof BUCKETS)[number];
      const things = words.filter((w) => w.category === 'thing');
      if (tod[top] / total >= 0.4 && things.length >= 2) {
        return {
          id: 'PI-P1',
          text: t('idea.PI-P1', { bucket: t(`bucket.${top}`), thing1: things[0]!.label, thing2: things[1]!.label }),
        };
      }
    }
    if (words.length >= 2) {
      return { id: 'PI-P2', text: t('idea.PI-P2', { word1: words[0]!.label, word2: words[1]!.label }) };
    }
    return null;
  }

  if (role === 'educator') {
    const help = results.class_help_requests?.value ?? 0;
    const msgs = results.class_messages?.value ?? 0;
    if (help >= 1) return { id: 'PI-E1', text: t('idea.PI-E1', { helpWord, n: help }) };
    if (msgs >= 1) return { id: 'PI-E2', text: t('idea.PI-E2', { n: msgs }) };
  }
  return null;
}

/** Change wording (section 8.4). */
export function changeText(change: number, days: number): string {
  if (change > 0) return t('report.change_more', { n: change, days });
  if (change < 0) return t('report.change_fewer', { n: Math.abs(change), days });
  return t('report.change_same', { days });
}
