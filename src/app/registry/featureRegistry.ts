import type { Db, FeatureManifest } from '@/core/types/manifest';
import { on } from '@/core/events/bus';
import { runMigrations } from '@/core/db/migrate';
import { manifest as accessManifest } from '@/features/access/feature.manifest';
import { manifest as analyticsManifest } from '@/features/analytics/feature.manifest';
import { manifest as audioManifest } from '@/features/audio/feature.manifest';
import { manifest as boardManifest } from '@/features/board/feature.manifest';
import { manifest as composerManifest } from '@/features/composer/feature.manifest';
import { manifest as eventLogManifest } from '@/features/event-log/feature.manifest';
import { manifest as goalsManifest } from '@/features/goals/feature.manifest';
import { manifest as observationsManifest } from '@/features/observations/feature.manifest';
import { manifest as reportsManifest } from '@/features/reports/feature.manifest';
import { manifest as settingsManifest } from '@/features/settings/feature.manifest';
import { manifest as vocabularyManifest } from '@/features/vocabulary/feature.manifest';

export const featureRegistry: FeatureManifest[] = [
  accessManifest,
  analyticsManifest,
  audioManifest,
  boardManifest,
  composerManifest,
  eventLogManifest,
  goalsManifest,
  observationsManifest,
  reportsManifest,
  settingsManifest,
  vocabularyManifest,
];

/**
 * Boot sequence: run migrations for all manifests, then register all event handlers.
 * Called once at app startup, after the DB is open.
 */
export async function bootFeatures(db: Db): Promise<void> {
  await runMigrations(db, featureRegistry);
  for (const manifest of featureRegistry) {
    for (const { event, handle } of manifest.eventHandlers ?? []) {
      on(event as Parameters<typeof on>[0], handle as Parameters<typeof on>[1]);
    }
  }
}
