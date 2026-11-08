import type { FeatureManifest } from '@/core/types/manifest';
import { manifest as educatorManifest } from './educator/feature.manifest';
import { manifest as otManifest } from './ot/feature.manifest';
import { manifest as parentManifest } from './parent/feature.manifest';
import { manifest as slpManifest } from './slp/feature.manifest';

/** Role report folders register their definitions here. Removing a folder removes only its report. */
export const roleReportManifests: FeatureManifest[] = [
  parentManifest,
  slpManifest,
  educatorManifest,
  otManifest,
];

export function aggregateReports(roleManifests: FeatureManifest[]): FeatureManifest {
  return {
    id: 'reports',
    reportDefinitions: roleManifests.flatMap((m) => m.reportDefinitions ?? []),
  };
}

export const manifest: FeatureManifest = aggregateReports(roleReportManifests);
