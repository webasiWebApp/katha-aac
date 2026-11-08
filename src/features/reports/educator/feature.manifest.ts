import type { FeatureManifest } from '@/core/types/manifest';
import { educatorDefinition } from './definition';

export const manifest: FeatureManifest = { id: 'reports-educator', reportDefinitions: [educatorDefinition] };
