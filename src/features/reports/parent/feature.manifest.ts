import type { FeatureManifest } from '@/core/types/manifest';
import { parentDefinition } from './definition';

export const manifest: FeatureManifest = { id: 'reports-parent', reportDefinitions: [parentDefinition] };
