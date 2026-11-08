import { useState } from 'react';

import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { presetPeriod, type PeriodPreset } from '@/core/time';
import type { Period, Role } from '@/core/types/common';
import { getLearner } from '@/features/access/index';
import { getMeasures, type MeasureId } from '@/features/analytics/index';
import { defaultCustomRange, validateCustomRange, type CustomRange } from '../domain/customPeriod';
import { getReportDefinition, measureIdsOf } from '../registry';

export function todayLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export type PickerPreset = PeriodPreset | 'custom';

/**
 * Period for a picker choice. Custom uses the adult's From/To range; without a valid range it
 * falls back to the last 90 days.
 */
export function periodFor(preset: PickerPreset, today = todayLocal(), custom?: CustomRange): Period {
  if (preset !== 'custom') return presetPeriod(preset, today);
  const range = custom ?? defaultCustomRange(today);
  const checked = validateCustomRange(range, today);
  if (checked.ok) return checked.period;
  const fallback = validateCustomRange(defaultCustomRange(today), today);
  return fallback.ok ? fallback.period : presetPeriod('30d', today);
}

export function usePeriod(initial: PickerPreset = '7d') {
  const [preset, setPreset] = useState<PickerPreset>(initial);
  const [custom, setCustom] = useState<CustomRange>(() => defaultCustomRange(todayLocal()));
  const applyCustom = (range: CustomRange) => {
    setCustom(range);
    setPreset('custom');
  };
  return { preset, setPreset, custom, applyCustom, period: periodFor(preset, todayLocal(), custom) };
}

/** Loads the measures of one role report for the signed-in learner. */
export function useReport(role: Role, period: Period) {
  const db = useDb();
  const app = useAppContext();
  return useLoad(
    'reports',
    () => {
      const learner = getLearner(db);
      const definition = getReportDefinition(role);
      if (!learner || !definition) throw new Error('report_unavailable');
      const results = getMeasures(db, {
        learnerId: learner.id,
        period,
        role: app.role ?? role,
        ids: measureIdsOf(definition) as MeasureId[],
      });
      return {
        definition,
        results,
        learner: { id: learner.id, displayName: learner.display_name, code: learner.participant_code, fictional: learner.is_fictional === 1 },
      };
    },
    [db, role, app.role, period.start, period.end],
  );
}
