import type { FeatureManifest } from '@/core/types/manifest';
import { migrations } from './data/migrations';
import { handleIntentAnswered } from './data/observationRepo';

export const manifest: FeatureManifest = {
  id: 'observations',
  migrations,
  eventHandlers: [{ event: 'intent_answered', handle: handleIntentAnswered }],
};
