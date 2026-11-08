import type { FeatureManifest } from '@/core/types/manifest';
import { migrations } from './data/goalRepo';

export const manifest: FeatureManifest = { id: 'goals', migrations };
