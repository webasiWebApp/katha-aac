import { registerRoleMeasures } from '@/features/analytics/index';
import type { Role } from '@/core/types/common';
import { roleReportManifests } from './feature.manifest';
import type { ReportDefinition } from './shared/types';

/** Definitions of every role report folder present in the app (section 3). */
export function allReportDefinitions(): ReportDefinition[] {
  return roleReportManifests.flatMap((m) => (m.reportDefinitions ?? []) as ReportDefinition[]);
}

export function getReportDefinition(role: Role): ReportDefinition | undefined {
  return allReportDefinitions().find((d) => d.role === role);
}

/** Measure ids a definition needs (glance, sections, and `sessions` for the header card). */
export function measureIdsOf(def: ReportDefinition): string[] {
  const ids = new Set<string>(['sessions', ...def.glance, ...def.sections.flatMap((s) => s.measures)]);
  if (def.role === 'parent') ids.add('words_used');
  if (def.role === 'educator') ids.add('class_messages');
  return [...ids];
}

/**
 * Registers which measures each role may read (T-125). Parent reads everything; for the other roles
 * the analytics engine refuses any measure outside their report definition.
 */
export function registerReportMeasures(): void {
  for (const def of allReportDefinitions()) registerRoleMeasures(def.role, measureIdsOf(def));
}
