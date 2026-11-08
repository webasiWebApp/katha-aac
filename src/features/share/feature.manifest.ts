import type { FeatureManifest } from '@/core/types/manifest';
import { migrations } from './data/migrations';

export const manifest: FeatureManifest = { id: 'share', migrations };
