import type { FeatureManifest } from '@/core/types/manifest';
import { slpDefinition } from './definition';

export const manifest: FeatureManifest = { id: 'reports-slp', reportDefinitions: [slpDefinition] };
