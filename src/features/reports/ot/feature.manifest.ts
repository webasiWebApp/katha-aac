import type { FeatureManifest } from '@/core/types/manifest';
import { otDefinition } from './definition';

export const manifest: FeatureManifest = { id: 'reports-ot', reportDefinitions: [otDefinition] };
