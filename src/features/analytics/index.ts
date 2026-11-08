// Public API of the analytics feature. Other features import ONLY from here.
import type { Period, Role } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import { loadInput } from './data/loadInput';
import { computeMeasures } from './domain/registry';
import type { MeasureId, MeasureResult } from './domain/types';

export {
  registry,
  registerRoleMeasures,
  clearRoleMeasures,
  computeMeasure,
  computeMeasures,
} from './domain/registry';
export { loadInput } from './data/loadInput';
export {
  MeasureNotAllowed,
  type AnalyticsInput,
  type MeasureDef,
  type MeasureId,
  type MeasureResult,
} from './domain/types';
export type { TopWord } from './domain/measures/countMeasures';

/** Loads the input once, computes the requested measures, applies locks. Throws MeasureNotAllowed. */
export function getMeasures(
  db: Db,
  args: { learnerId: string; period: Period; role: Role; ids: MeasureId[] },
): Record<string, MeasureResult> {
  const input = loadInput(db, args.learnerId, args.period, args.role);
  return computeMeasures(input, args.ids);
}
